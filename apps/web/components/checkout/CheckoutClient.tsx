'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MailCheck,
  Sailboat,
  ShieldCheck,
} from 'lucide-react'
import { toBoatDetailViewModel, type SerializedBoatDTO } from '@getyourboat/shared'
import AuthModal from '@/components/auth/AuthModal'
import TripPickerModal, { tripIsComplete, type TripValue } from '@/components/listing/TripPickerModal'
import { buildRules } from '@/components/listing/listingRules'
import { fetchAvailability, submitBooking, type BlockedRange } from '@/lib/api'
import { checkoutHref, depositRatio, estimatePrice, parseCheckoutParams } from '@/lib/bookingPrice'
import { boatTypeLabel, cleanText, formatLongDate, formatMoney, listingModelLabel, toISODate } from '@/lib/boatFormat'
import { toRentalType } from '@/lib/pricing'
import { supabase } from '@/lib/supabase'

type PayMethod = 'card' | 'transfer'

const PAY_OPTIONS: { key: PayMethod; icon: typeof CreditCard; title: string; desc: string; how: string }[] = [
  { key: 'card', icon: CreditCard, title: 'Kredi veya banka kartı', desc: 'Onaydan sonra kartınla ödersin.', how: 'kartınla' },
  { key: 'transfer', icon: Building2, title: 'Havale / EFT', desc: 'Onaydan sonra banka havalesiyle ödersin.', how: 'havale veya EFT ile' },
]

interface Props {
  boat: SerializedBoatDTO
  search: Record<string, string | undefined>
}

export default function CheckoutClient({ boat, search }: Props) {
  const model = useMemo(() => toBoatDetailViewModel(boat), [boat])
  const initial = useMemo(() => parseCheckoutParams(search), [search])

  const prices = boat.pricing.filter(p => p.price > 0)
  const price = prices.find(p => p.listingModelKey === initial.model) ?? prices[0] ?? null
  const hourly = price?.listingModelKey === 'hourly'
  const capRaw = Number(boat.features.find(f => f.key === 'capacity')?.value ?? 8)
  const maxGuests = Number.isFinite(capRaw) && capRaw > 0 ? capRaw : 8

  const [trip, setTrip] = useState<TripValue>({
    range: { start: initial.start, end: hourly ? initial.start : initial.end },
    guests: Math.min(initial.guests, maxGuests),
    startTime: initial.startTime,
    endTime: initial.endTime,
  })
  const [pickerOpen, setPickerOpen] = useState(false)
  const [blocked, setBlocked] = useState<BlockedRange[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [pay, setPay] = useState<PayMethod>('card')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)

  const ready = tripIsComplete(trip, hourly)

  useEffect(() => {
    fetchAvailability(boat.id).then(setBlocked).catch(() => setBlocked([]))
    if (!tripIsComplete(trip, hourly)) setPickerOpen(true)
    // yalnızca ilk açılışta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boat.id])

  // Giriş yapmış müşterinin bilgilerini doldur; oturum değişirse güncelle.
  useEffect(() => {
    const fill = (u: { email?: string | null; user_metadata?: Record<string, unknown> } | null) => {
      setUserEmail(u?.email ?? null)
      if (!u) return
      const name = typeof u.user_metadata?.full_name === 'string' ? u.user_metadata.full_name : ''
      const phone = typeof u.user_metadata?.phone === 'string' ? u.user_metadata.phone : ''
      setForm(f => ({ ...f, name: f.name || name, email: f.email || (u.email ?? ''), phone: f.phone || phone }))
    }
    supabase.auth.getUser().then(({ data }) => fill(data.user))
    const { data } = supabase.auth.onAuthStateChange((_e, session) => fill(session?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  // Adres çubuğu seçimle senkron kalsın (geri dönüş / paylaşım için).
  useEffect(() => {
    if (!ready) return
    window.history.replaceState(
      null,
      '',
      checkoutHref(boat.id, {
        start: trip.range.start,
        end: trip.range.end,
        guests: trip.guests,
        model: price?.listingModelKey ?? null,
        startTime: hourly ? trip.startTime : null,
        endTime: hourly ? trip.endTime : null,
      }),
    )
  }, [trip, ready, boat.id, price?.listingModelKey, hourly])

  const estimate = estimatePrice(price, trip.range.start, trip.range.end, trip.startTime, trip.endTime)
  const ratio = depositRatio((boat.structuredRules as Record<string, unknown> | null)?.deposit_type_payment_before)
  const rules = useMemo(
    () => buildRules(boat.structuredRules as Record<string, unknown> | null, model.contactForFuelCost, model.fuelCostNote),
    [boat.structuredRules, model.contactForFuelCost, model.fuelCostNote],
  )
  const cover = model.gallery[0]?.url ?? null
  const type = boatTypeLabel(boat.boatType) ?? model.boatTypeLabel
  const loc = model.location
  const place = cleanText([loc?.marina, loc?.city].filter(Boolean).join(', ') || 'Türkiye')
  const listingUrl = `/listing/${boat.id}`

  const dateText = trip.range.start
    ? hourly
      ? `${formatLongDate(trip.range.start)}${trip.startTime && trip.endTime ? `, ${trip.startTime}–${trip.endTime}` : ''}`
      : trip.range.end
        ? `${formatLongDate(trip.range.start)} – ${formatLongDate(trip.range.end)}`
        : formatLongDate(trip.range.start)
    : 'Tarih seçilmedi'

  const validate = () => {
    const e: Record<string, string> = {}
    if (!ready) e.trip = 'Lütfen tarih seçin.'
    if (form.name.trim().length < 2) e.name = 'Ad soyad en az 2 karakter olmalı.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Geçerli bir e-posta adresi girin.'
    if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 10) e.phone = 'Geçerli bir telefon numarası girin.'
    if (!agree) e.agree = 'Devam etmek için koşulları kabul etmelisin.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    setSubmitError('')
    if (!validate()) {
      document.querySelector('.sh-ck-invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!trip.range.start || !trip.range.end) return
    setSubmitting(true)
    const payLine = `Ödeme tercihi: ${PAY_OPTIONS.find(o => o.key === pay)!.title}`
    try {
      await submitBooking({
        boatId: boat.id,
        guestName: form.name.trim(),
        guestEmail: form.email.trim(),
        guestPhone: form.phone.trim() || null,
        guestCount: trip.guests,
        rentalType: toRentalType(price?.listingModelKey ?? boat.pricing[0]?.listingModelKey),
        startDate: toISODate(trip.range.start),
        endDate: toISODate(trip.range.end),
        startTime: hourly ? trip.startTime : null,
        endTime: hourly ? trip.endTime : null,
        message: [form.message.trim(), payLine].filter(Boolean).join('\n\n'),
      })
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const raw = e instanceof Error ? e.message : ''
      setSubmitError(!raw || /fetch|network/i.test(raw) ? 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.' : raw)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: 'name' | 'email' | 'phone') => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }))
      if (errors[key]) setErrors(({ [key]: _omit, ...rest }) => rest)
    },
    'aria-invalid': !!errors[key],
  })

  /* ---------- özet kartı ---------- */
  const summary = (
    <aside className="sh-ck-sum" aria-label="Rezervasyon özeti">
      <div className="sh-ck-sum-boat">
        {cover && (
          <span className="sh-ck-sum-img">
            <Image src={cover} alt="" fill sizes="120px" />
          </span>
        )}
        <span>
          {type && <small>{type}</small>}
          <b>{model.title}</b>
          <em>{place}</em>
        </span>
      </div>

      {model.cancellationLabel && (
        <div className="sh-ck-sum-sec">
          <b>{model.cancellationLabel}</b>
          <p>Bu teknede kaptanın {model.cancellationLabel.toLocaleLowerCase('tr')} politikası geçerlidir.</p>
        </div>
      )}

      <div className="sh-ck-sum-sec sh-ck-sum-row">
        <span>
          <b>Tarih</b>
          <p>{dateText}</p>
        </span>
        {!done && (
          <button type="button" className="sh-ck-change" onClick={() => setPickerOpen(true)}>
            Değiştir
          </button>
        )}
      </div>

      <div className="sh-ck-sum-sec sh-ck-sum-row">
        <span>
          <b>Misafirler</b>
          <p>{trip.guests} misafir</p>
        </span>
        {!done && (
          <button type="button" className="sh-ck-change" onClick={() => setPickerOpen(true)}>
            Değiştir
          </button>
        )}
      </div>

      {price && (
        <div className="sh-ck-sum-sec">
          <b>Fiyat ayrıntıları</b>
          <dl className="sh-ck-lines">
            {estimate ? (
              <div>
                <dt>
                  {formatMoney(price.price, price.currency)} × {estimate.label}
                </dt>
                <dd>{formatMoney(estimate.total, price.currency)}</dd>
              </div>
            ) : (
              <div>
                <dt>{listingModelLabel(price.listingModelKey, price.listingModelLabel)}</dt>
                <dd>{formatMoney(price.price, price.currency)}</dd>
              </div>
            )}
            {estimate && ratio && ratio < 1 && (
              <div className="sh-ck-muted">
                <dt>Onaydan sonra ön ödeme (%{Math.round(ratio * 100)})</dt>
                <dd>{formatMoney(estimate.total * ratio, price.currency)}</dd>
              </div>
            )}
          </dl>
          <div className="sh-ck-total">
            <span>
              Tahmini toplam <small>{price.currency}</small>
            </span>
            <b>{estimate ? formatMoney(estimate.total, price.currency) : '—'}</b>
          </div>
          <div className="sh-ck-today">
            <span>Bugün ödenecek</span>
            <b>{formatMoney(0, price.currency)}</b>
          </div>
          <p className="sh-ck-fine">Kesin tutar kaptan onayında netleşir. Ekstralar ve yakıt ayrıca belirtilir.</p>
        </div>
      )}
    </aside>
  )

  /* ---------- başarı ekranı ---------- */
  if (done) {
    return (
      <div className="sh-ck">
        <div className="sh-container sh-ck-grid">
          <div className="sh-ck-main">
            <div className="sh-ck-done">
              <span className="sh-ck-done-ico">
                <Check size={32} strokeWidth={2.6} />
              </span>
              <h1>Rezervasyon talebin kaptana iletildi</h1>
              <p>
                Talebini aldık. Kaptan onayladığında <b>{form.email.trim()}</b> üzerinden seninle iletişime geçilecek. Bu aşamada senden ücret alınmadı.
              </p>
            </div>
            <ol className="sh-ck-steps">
              <li className="is-done">
                <span>
                  <Check size={16} strokeWidth={2.6} />
                </span>
                <div>
                  <b>Talep gönderildi</b>
                  <p>{dateText} · {trip.guests} misafir</p>
                </div>
              </li>
              <li>
                <span>
                  <BadgeCheck size={16} strokeWidth={2} />
                </span>
                <div>
                  <b>Kaptan onayı</b>
                  <p>Kaptanlar talepleri genellikle 2–4 saat içinde yanıtlar.</p>
                </div>
              </li>
              <li>
                <span>
                  <CreditCard size={16} strokeWidth={2} />
                </span>
                <div>
                  <b>Ödeme</b>
                  <p>Onaydan sonra {PAY_OPTIONS.find(o => o.key === pay)!.how} ödemeni tamamlarsın.</p>
                </div>
              </li>
              <li>
                <span>
                  <Sailboat size={16} strokeWidth={2} />
                </span>
                <div>
                  <b>Denize açıl</b>
                  <p>Giriş saatinde marinada kaptanınla buluş.</p>
                </div>
              </li>
            </ol>
            <div className="sh-ck-done-ctas">
              {userEmail ? (
                <Link href="/rezervasyonlarim" className="sh-btn sh-btn--navy">
                  Rezervasyonlarıma git
                </Link>
              ) : (
                <Link href="/tekne-kiralama" className="sh-btn sh-btn--navy">
                  Diğer teknelere göz at
                </Link>
              )}
              <Link href={listingUrl} className="sh-ls-btn sh-ck-outline">
                İlana dön
              </Link>
            </div>
          </div>
          <div className="sh-ck-side">{summary}</div>
        </div>
      </div>
    )
  }

  /* ---------- form ---------- */
  return (
    <div className="sh-ck">
      <div className="sh-container">
        <header className="sh-ck-head">
          <Link href={listingUrl} className="sh-icon-btn sh-ck-back" aria-label="İlana dön">
            <ArrowLeft size={20} />
          </Link>
          <h1>Onay ve ödeme</h1>
        </header>
      </div>

      <div className="sh-container sh-ck-grid">
        <div className="sh-ck-main">
          <div className="sh-ck-mobile-sum">{summary}</div>

          {/* 1 — yolculuk */}
          <section className={`sh-ck-sec${errors.trip ? ' sh-ck-invalid' : ''}`}>
            <h2>
              <span>1</span> Yolculuğun
            </h2>
            <div className="sh-ck-row">
              <span>
                <b>{hourly ? 'Tarih ve saat' : 'Tarihler'}</b>
                <p>{dateText}</p>
              </span>
              <button type="button" className="sh-ck-change" onClick={() => setPickerOpen(true)}>
                {ready ? 'Değiştir' : 'Tarih seç'}
              </button>
            </div>
            <div className="sh-ck-row">
              <span>
                <b>Misafirler</b>
                <p>{trip.guests} misafir</p>
              </span>
              <button type="button" className="sh-ck-change" onClick={() => setPickerOpen(true)}>
                Değiştir
              </button>
            </div>
            {errors.trip && <p className="sh-ck-err">{errors.trip}</p>}
          </section>

          {/* 2 — bilgiler */}
          <section className="sh-ck-sec">
            <h2>
              <span>2</span> İletişim bilgilerin
            </h2>
            {!userEmail && (
              <div className="sh-ck-login">
                <span>Hesabın varsa giriş yap; bilgilerin otomatik dolsun ve rezervasyonunu takip et.</span>
                <button type="button" className="sh-ck-change" onClick={() => setAuthOpen(true)}>
                  Giriş yap
                </button>
              </div>
            )}
            <div className="sh-form sh-ck-form">
              <label className={errors.name ? 'sh-ck-invalid' : undefined}>
                <span>Ad soyad *</span>
                <input {...field('name')} autoComplete="name" placeholder="Kimlikteki gibi" />
                {errors.name && <small className="sh-ck-err">{errors.name}</small>}
              </label>
              <div className="sh-ck-2col">
                <label className={errors.email ? 'sh-ck-invalid' : undefined}>
                  <span>E-posta *</span>
                  <input {...field('email')} type="email" autoComplete="email" placeholder="ornek@eposta.com" />
                  {errors.email && <small className="sh-ck-err">{errors.email}</small>}
                </label>
                <label className={errors.phone ? 'sh-ck-invalid' : undefined}>
                  <span>Telefon</span>
                  <input {...field('phone')} type="tel" autoComplete="tel" placeholder="+90 5xx xxx xx xx" />
                  {errors.phone ? <small className="sh-ck-err">{errors.phone}</small> : <small>Kaptan gerektiğinde ulaşabilsin.</small>}
                </label>
              </div>
              <label>
                <span>Kaptana mesajın</span>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Rota tercihin, kutlama, özel istekler…"
                  maxLength={900}
                />
              </label>
            </div>
          </section>

          {/* 3 — ödeme */}
          <section className="sh-ck-sec">
            <h2>
              <span>3</span> Ödeme
            </h2>
            <div className="sh-ck-paynote">
              <Lock size={18} strokeWidth={1.8} aria-hidden="true" />
              <p>
                <b>Şimdi ücret alınmaz.</b> Kaptan talebini onayladığında, seçtiğin yöntemle ödeme adımı için seninle iletişime geçilir.
              </p>
            </div>
            <div className="sh-ck-pay" role="radiogroup" aria-label="Ödeme tercihi">
              {PAY_OPTIONS.map(({ key, icon: Icon, title, desc }) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={pay === key}
                  className={`sh-ck-payopt${pay === key ? ' is-on' : ''}`}
                  onClick={() => setPay(key)}
                >
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                  <span>
                    <b>{title}</b>
                    <small>{desc}</small>
                  </span>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
            {estimate && price && (
              <dl className="sh-ck-plan">
                <div>
                  <dt>Bugün</dt>
                  <dd>{formatMoney(0, price.currency)}</dd>
                </div>
                {ratio && ratio < 1 ? (
                  <>
                    <div>
                      <dt>Kaptan onayından sonra (%{Math.round(ratio * 100)} ön ödeme)</dt>
                      <dd>{formatMoney(estimate.total * ratio, price.currency)}</dd>
                    </div>
                    <div>
                      <dt>Kalan tutar</dt>
                      <dd>{formatMoney(estimate.total * (1 - ratio), price.currency)}</dd>
                    </div>
                  </>
                ) : (
                  <div>
                    <dt>Kaptan onayından sonra</dt>
                    <dd>{formatMoney(estimate.total, price.currency)}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>

          {/* 4 — kurallar */}
          <section className={`sh-ck-sec${errors.agree ? ' sh-ck-invalid' : ''}`}>
            <h2>
              <span>4</span> Kurallar ve onay
            </h2>
            <ul className="sh-ck-rules">
              {model.cancellationLabel && (
                <li>
                  <CalendarCheck size={20} strokeWidth={1.6} aria-hidden="true" /> {model.cancellationLabel} politikası geçerlidir.
                </li>
              )}
              {rules.schedules[0]?.checkIn && (
                <li>
                  <Sailboat size={20} strokeWidth={1.6} aria-hidden="true" /> Giriş {rules.schedules[0].checkIn}, çıkış {rules.schedules[0].checkOut ?? '—'}.
                </li>
              )}
              {rules.house.map(h => (
                <li key={h.label}>
                  <ShieldCheck size={20} strokeWidth={1.6} aria-hidden="true" />
                  {h.label === 'Evcil hayvan' ? (h.allowed ? 'Evcil hayvan kabul ediliyor.' : 'Evcil hayvan kabul edilmiyor.') : `${h.label}${h.label.startsWith('Sigara') ? '' : h.allowed ? ' serbest' : ' izinli değil'}.`}
                </li>
              ))}
            </ul>
            <label className="sh-ck-agree">
              <input
                type="checkbox"
                checked={agree}
                onChange={e => {
                  setAgree(e.target.checked)
                  if (errors.agree) setErrors(({ agree: _omit, ...rest }) => rest)
                }}
              />
              <span>
                Rezervasyon şartlarını, iptal politikasını ve tekne kurallarını okudum, kabul ediyorum. <Link href="#">Gizlilik Politikası</Link>
              </span>
            </label>
            {errors.agree && <p className="sh-ck-err">{errors.agree}</p>}
          </section>

          {submitError && (
            <p className="sh-form-error" role="alert">
              {submitError}
            </p>
          )}

          <div className="sh-ck-submit">
            <button type="button" className="sh-btn sh-btn--navy" onClick={submit} disabled={submitting}>
              {submitting && <Loader2 size={18} className="sh-spin" aria-hidden="true" />}
              {submitting ? 'Gönderiliyor…' : 'Onayla ve talebi gönder'}
            </button>
            <p>
              <MailCheck size={15} strokeWidth={1.8} aria-hidden="true" /> Bu adımda kartından ücret çekilmez.
            </p>
          </div>
        </div>

        <div className="sh-ck-side">{summary}</div>
      </div>

      {/* mobil alt çubuk */}
      <div className="sh-ck-bar">
        <span>
          <b>{estimate && price ? formatMoney(estimate.total, price.currency) : 'Tarih seç'}</b>
          <small>{estimate ? `${estimate.label} · bugün ödeme yok` : 'Şimdi ücret alınmaz'}</small>
        </span>
        <button type="button" className="sh-btn sh-btn--navy" onClick={submit} disabled={submitting}>
          {submitting ? 'Gönderiliyor…' : 'Talebi gönder'}
        </button>
      </div>

      <TripPickerModal
        open={pickerOpen}
        title={hourly ? 'Gün ve saat seçin' : 'Tarih ve misafir seçin'}
        initial={trip}
        hourly={hourly}
        maxGuests={maxGuests}
        blocked={blocked}
        confirmLabel="Kaydet"
        onClose={() => setPickerOpen(false)}
        onConfirm={v => {
          setTrip(v)
          setPickerOpen(false)
          if (errors.trip) setErrors(({ trip: _omit, ...rest }) => rest)
        }}
      />

      {authOpen && <AuthModal initialMode="signin" onClose={() => setAuthOpen(false)} />}
    </div>
  )
}
