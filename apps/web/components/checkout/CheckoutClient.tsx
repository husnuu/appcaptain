'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarCheck,
  Check,
  CreditCard,
  Gift,
  Loader2,
  Lock,
  Sailboat,
  ShieldCheck,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toBoatDetailViewModel, type SerializedBoatDTO } from '@getyourboat/shared'
import AuthModal from '@/components/auth/AuthModal'
import HostAvatar from '@/components/listing/HostAvatar'
import TripPickerModal, { tripIsComplete, type TripValue } from '@/components/listing/TripPickerModal'
import { buildRules } from '@/components/listing/listingRules'
import { fetchAvailability, submitBooking, type BlockedRange } from '@/lib/api'
import { checkoutHref, depositRatio, estimatePrice, parseCheckoutParams } from '@/lib/bookingPrice'
import { boatTypeLabel, formatDayMonth, formatLongDate, formatMoney, listingModelLabel, toISODate } from '@/lib/boatFormat'
import { toRentalType } from '@/lib/pricing'
import { supabase } from '@/lib/supabase'

type PayMethod = 'card' | 'transfer'
type PayWhen = 'full' | 'split'

const PAY_OPTIONS: { key: PayMethod; icon: typeof CreditCard; title: string; desc: string; how: string }[] = [
  { key: 'card', icon: CreditCard, title: 'Kredi veya banka kartı', desc: 'Kaptan onayından sonra kartınla ödersin.', how: 'kartınla' },
  { key: 'transfer', icon: Building2, title: 'Havale / EFT', desc: 'Kaptan onayından sonra banka havalesiyle ödersin.', how: 'havale veya EFT ile' },
]

const STEP_TITLES = ['Ne zaman ödeyeceğini seç', 'Ödeme yöntemini seç', 'Kaptana bir mesaj yaz', 'Talebini gözden geçir']

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
  const [step, setStep] = useState(1)
  const [reached, setReached] = useState(1)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const closeBreakdown = useCallback(() => setBreakdownOpen(false), [])
  const [blocked, setBlocked] = useState<BlockedRange[]>([])
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [payWhen, setPayWhen] = useState<PayWhen>('full')
  const [pay, setPay] = useState<PayMethod>('card')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const closeAuth = useCallback(() => setAuthOpen(false), [])

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
  const canSplit = !!ratio && ratio < 1
  const rules = useMemo(
    () => buildRules(boat.structuredRules as Record<string, unknown> | null, model.contactForFuelCost, model.fuelCostNote),
    [boat.structuredRules, model.contactForFuelCost, model.fuelCostNote],
  )
  const cover = model.gallery[0]?.url ?? null
  const type = boatTypeLabel(boat.boatType) ?? model.boatTypeLabel
  const owner = boat.owner ?? null
  const hostName = owner?.name ?? 'Kaptan'
  const listingUrl = `/listing/${boat.id}`
  const money = (n: number) => (price ? formatMoney(n, price.currency) : '—')

  const dateText = trip.range.start
    ? hourly
      ? `${formatLongDate(trip.range.start)}${trip.startTime && trip.endTime ? `, ${trip.startTime}–${trip.endTime}` : ''}`
      : trip.range.end
        ? `${formatDayMonth(trip.range.start)} – ${formatDayMonth(trip.range.end)} ${trip.range.end.getFullYear()}`
        : formatLongDate(trip.range.start)
    : 'Tarih seçilmedi'

  const whenText =
    payWhen === 'split' && canSplit && estimate
      ? `Onaydan sonra ${money(estimate.total * ratio!)} · kalanı ${money(estimate.total * (1 - ratio!))}`
      : estimate
        ? `Onaydan sonra tamamı: ${money(estimate.total)}`
        : 'Onaydan sonra tamamı'

  /* ---------- doğrulama + adım geçişi ---------- */
  const clearError = (key: string) => setErrors(({ [key]: _omit, ...rest }) => rest)

  const validateStep = (n: number) => {
    const e: Record<string, string> = {}
    if (n === 1 && !ready) e.trip = 'Devam etmek için tarih seç.'
    if (n === 3) {
      if (form.name.trim().length < 2) e.name = 'Ad soyad en az 2 karakter olmalı.'
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Geçerli bir e-posta adresi gir.'
      if (form.phone.trim() && form.phone.replace(/\D/g, '').length < 10) e.phone = 'Geçerli bir telefon numarası gir.'
    }
    if (n === 4 && !agree) e.agree = 'Devam etmek için koşulları kabul etmelisin.'
    setErrors(e)
    if (e.trip) setPickerOpen(true)
    return Object.keys(e).length === 0
  }

  const goTo = (n: number) => {
    setStep(n)
    setReached(r => Math.max(r, n))
    requestAnimationFrame(() => {
      const el = document.getElementById(`co-step-${n}`)
      if (el && window.innerWidth > 860) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0 })
    })
  }

  const back = () => {
    setStep(s => Math.max(1, s - 1))
    window.scrollTo({ top: 0 })
  }

  const next = () => {
    if (!validateStep(step)) return
    // Önceden tamamlanan bir adım düzenlendiyse kalınan yere dön.
    if (step < 4) return goTo(reached > step + 1 ? reached : step + 1)
    // Göndermeden önce tarih ve iletişim adımlarını son kez doğrula.
    for (const n of [1, 3]) {
      if (!validateStep(n)) return goTo(n)
    }
    void submit()
  }

  const submit = async () => {
    setSubmitError('')
    if (!trip.range.start || !trip.range.end) return
    setSubmitting(true)
    const payLines = [
      `Ödeme zamanı: ${payWhen === 'split' && canSplit ? `Ön ödeme (%${Math.round(ratio! * 100)}) + kalan` : 'Tamamı onaydan sonra'}`,
      `Ödeme yöntemi: ${PAY_OPTIONS.find(o => o.key === pay)!.title}`,
    ]
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
        message: [form.message.trim(), payLines.join('\n')].filter(Boolean).join('\n\n'),
      })
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const raw = e instanceof Error ? e.message : ''
      setSubmitError(!raw || /fetch|network/i.test(raw) ? 'Bağlantı hatası oluştu. Lütfen tekrar dene.' : raw)
    } finally {
      setSubmitting(false)
    }
  }

  const field = (key: 'name' | 'email' | 'phone') => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }))
      if (errors[key]) clearError(key)
    },
    'aria-invalid': !!errors[key],
  })

  /* ---------- sağ sütun: özet ---------- */
  const listingRow = (
    <div className="sh-co-boat">
      {cover && (
        <span className="sh-co-boat-img">
          <Image src={cover} alt="" fill sizes="104px" />
        </span>
      )}
      <span>
        <b>{model.title}</b>
        <small>
          <Star size={13} strokeWidth={0} fill="currentColor" aria-hidden="true" /> Yeni ilan
          {type && <> · {type}</>}
        </small>
      </span>
    </div>
  )

  const summary = (
    <aside className="sh-co-sum" aria-label="Rezervasyon özeti">
      {listingRow}

      {model.cancellationLabel && (
        <div className="sh-co-sum-sec">
          <b>{model.cancellationLabel}</b>
          <p>Kaptanın iptal politikası geçerlidir.</p>
        </div>
      )}

      <div className="sh-co-sum-sec sh-co-sum-row">
        <span>
          <b>{hourly ? 'Tarih ve saat' : 'Tarihler'}</b>
          <p>{dateText}</p>
        </span>
        {!done && (
          <button type="button" className="sh-co-pill" onClick={() => setPickerOpen(true)}>
            {ready ? 'Değiştir' : 'Tarih seç'}
          </button>
        )}
      </div>

      <div className="sh-co-sum-sec sh-co-sum-row">
        <span>
          <b>Misafirler</b>
          <p>{trip.guests} misafir</p>
        </span>
        {!done && (
          <button type="button" className="sh-co-pill" onClick={() => setPickerOpen(true)}>
            Değiştir
          </button>
        )}
      </div>

      {price && (
        <div className="sh-co-sum-sec sh-co-sum-price">
          <b>Fiyat ayrıntıları</b>
          <dl>
            <div>
              <dt>{estimate ? `${formatMoney(price.price, price.currency)} × ${estimate.label}` : listingModelLabel(price.listingModelKey, price.listingModelLabel)}</dt>
              <dd>{estimate ? money(estimate.total) : money(price.price)}</dd>
            </div>
            <div className="sh-co-green">
              <dt>Bugün ödenecek</dt>
              <dd>{money(0)}</dd>
            </div>
          </dl>
          <div className="sh-co-total">
            <span>
              Toplam <u>{price.currency}</u>
            </span>
            <b>{estimate ? money(estimate.total) : '—'}</b>
          </div>
          <button type="button" className="sh-co-link" onClick={() => setBreakdownOpen(true)}>
            Fiyat dökümü
          </button>
        </div>
      )}
    </aside>
  )

  /* ---------- mobil özet (ilk adım) ---------- */
  const mobileSummary = (
    <div className="sh-co-msum">
      {listingRow}
      <div className="sh-co-sum-row">
        <span>
          <b>{hourly ? 'Tarih ve saat' : 'Tarihler'}</b>
          <p>{dateText}</p>
        </span>
        <button type="button" className="sh-co-pill" onClick={() => setPickerOpen(true)}>
          {ready ? 'Değiştir' : 'Tarih seç'}
        </button>
      </div>
      <p className="sh-co-msum-note">
        <Gift size={18} strokeWidth={1.8} aria-hidden="true" /> Onaylanan bu rezervasyonda %15’e varan cashback kazanırsın.
      </p>
      <div className="sh-co-sum-row">
        <span>
          <b>Misafirler</b>
          <p>{trip.guests} misafir</p>
        </span>
        <button type="button" className="sh-co-pill" onClick={() => setPickerOpen(true)}>
          Değiştir
        </button>
      </div>
      {price && (
        <div className="sh-co-sum-row">
          <span>
            <b>Toplam fiyat</b>
            <p>
              {estimate ? money(estimate.total) : '—'} <u>{price.currency}</u>
            </p>
          </span>
          <button type="button" className="sh-co-pill" onClick={() => setBreakdownOpen(true)}>
            Ayrıntılar
          </button>
        </div>
      )}
      {model.cancellationLabel && (
        <div className="sh-co-sum-row">
          <span>
            <b>{model.cancellationLabel}</b>
            <p>Kaptanın iptal politikası geçerlidir.</p>
          </span>
        </div>
      )}
    </div>
  )

  const breakdown = breakdownOpen && price && (
    <PriceBreakdown onClose={closeBreakdown}>
      <dl className="sh-co-bd">
        <div>
          <dt>{estimate ? `${formatMoney(price.price, price.currency)} × ${estimate.label}` : listingModelLabel(price.listingModelKey, price.listingModelLabel)}</dt>
          <dd>{estimate ? money(estimate.total) : money(price.price)}</dd>
        </div>
        {estimate && canSplit && (
          <>
            <div>
              <dt>Kaptan onayından sonra (%{Math.round(ratio! * 100)} ön ödeme)</dt>
              <dd>{money(estimate.total * ratio!)}</dd>
            </div>
            <div>
              <dt>Kalan tutar</dt>
              <dd>{money(estimate.total * (1 - ratio!))}</dd>
            </div>
          </>
        )}
        <div className="sh-co-green">
          <dt>Bugün ödenecek</dt>
          <dd>{money(0)}</dd>
        </div>
        <div className="sh-co-bd-total">
          <dt>
            Toplam <u>{price.currency}</u>
          </dt>
          <dd>{estimate ? money(estimate.total) : '—'}</dd>
        </div>
      </dl>
      <p className="sh-co-fine">Kesin tutar kaptan onayında netleşir. Ekstralar ve yakıt ayrıca belirtilir.</p>
    </PriceBreakdown>
  )

  /* ---------- başarı ekranı ---------- */
  if (done) {
    return (
      <div className="sh-co is-done">
        <div className="sh-container sh-co-grid">
          <div className="sh-co-main">
            <div className="sh-co-done">
              <span className="sh-co-done-ico">
                <Check size={30} strokeWidth={2.6} />
              </span>
              <h1>Talebin {hostName} kaptana iletildi</h1>
              <p>
                Kaptan onayladığında <b>{form.email.trim()}</b> üzerinden seninle iletişime geçilecek. Bu aşamada senden ücret alınmadı.
              </p>
            </div>
            <ol className="sh-co-timeline">
              <li className="is-done">
                <span>
                  <Check size={16} strokeWidth={2.6} />
                </span>
                <div>
                  <b>Talep gönderildi</b>
                  <p>
                    {dateText} · {trip.guests} misafir
                  </p>
                </div>
              </li>
              <li>
                <span>
                  <BadgeCheck size={16} strokeWidth={2} />
                </span>
                <div>
                  <b>Kaptan onayı</b>
                  <p>Kaptan talebini onayladığında sana e-postayla haber verilir.</p>
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
            <div className="sh-co-done-ctas">
              <Link href={userEmail ? '/rezervasyonlarim' : '/tekne-kiralama'} className="sh-btn sh-btn--navy">
                {userEmail ? 'Rezervasyonlarıma git' : 'Diğer teknelere göz at'}
              </Link>
              <Link href={listingUrl} className="sh-ld-outline">
                İlana dön
              </Link>
            </div>
          </div>
          <div className="sh-co-side">{summary}</div>
        </div>
      </div>
    )
  }

  /* ---------- adım içerikleri ---------- */
  // Kiralama tipine uyan giriş/çıkış saatleri (saatlikte saatleri misafir seçer).
  const schedule = hourly
    ? null
    : (rules.schedules.find(s => (s.title === 'Günlük kiralama') === (price?.listingModelKey === 'daily')) ?? rules.schedules[0] ?? null)
  const ruleItems: { key: string; icon: LucideIcon; text: string }[] = []
  if (model.cancellationLabel) ruleItems.push({ key: 'cancel', icon: CalendarCheck, text: `${model.cancellationLabel} politikası geçerlidir.` })
  if (schedule?.checkIn) ruleItems.push({ key: 'schedule', icon: Sailboat, text: `Giriş ${schedule.checkIn}, çıkış ${schedule.checkOut ?? '—'}.` })
  for (const h of rules.house) ruleItems.push({ key: h.label, icon: ShieldCheck, text: houseRuleText(h) })

  const stepBody: Record<number, ReactNode> = {
    1: (
      <>
        <div className="sh-co-options" role="radiogroup" aria-label="Ödeme zamanı">
          <Option checked={payWhen === 'full'} onSelect={() => setPayWhen('full')} title={estimate ? `Onaydan sonra ${money(estimate.total)} öde` : 'Onaydan sonra tamamını öde'}>
            Kaptan talebini onayladığında tutarın tamamını ödersin.
          </Option>
          {canSplit && (
            <Option checked={payWhen === 'split'} onSelect={() => setPayWhen('split')} title="Bir kısmını onaydan sonra, kalanını daha sonra öde">
              {estimate
                ? `Onaydan sonra ${money(estimate.total * ratio!)} (%${Math.round(ratio! * 100)}), kalan ${money(estimate.total * (1 - ratio!))} kaptanın belirttiği zamanda ödenir. Ek ücret alınmaz.`
                : `Onaydan sonra %${Math.round(ratio! * 100)} ön ödeme, kalanı daha sonra. Ek ücret alınmaz.`}
            </Option>
          )}
        </div>
        <p className="sh-co-reassure">
          <Lock size={16} strokeWidth={1.9} aria-hidden="true" /> Bugün hiçbir ödeme yapmazsın.
        </p>
        {errors.trip && <p className="sh-co-err">{errors.trip}</p>}
      </>
    ),
    2: (
      <>
        <div className="sh-co-options" role="radiogroup" aria-label="Ödeme yöntemi">
          {PAY_OPTIONS.map(({ key, icon: Icon, title, desc }) => (
            <Option key={key} checked={pay === key} onSelect={() => setPay(key)} title={title} icon={<Icon size={22} strokeWidth={1.6} aria-hidden="true" />}>
              {desc}
            </Option>
          ))}
        </div>
        <p className="sh-co-reassure">
          <ShieldCheck size={16} strokeWidth={1.9} aria-hidden="true" /> Kart bilgilerin bu adımda istenmez. Kaptan onayladığında ödeme adımı için seninle iletişime geçilir.
        </p>
      </>
    ),
    3: (
      <>
        <div className="sh-co-host">
          <HostAvatar name={hostName} src={owner?.avatarUrl ?? null} size={52} />
          <span>
            <b>{hostName}</b>
            <small>Kaptanın teknesi ve rotan hakkında bilmesi gerekenleri paylaş.</small>
          </span>
        </div>
        <label className="sh-co-field">
          <span className="sr-only">Kaptana mesajın</span>
          <textarea
            rows={4}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder={`Merhaba ${hostName}! Rota tercihim, kutlama ya da özel isteklerim…`}
            maxLength={900}
          />
        </label>

        <h3 className="sh-co-sub">İletişim bilgilerin</h3>
        {!userEmail && (
          <p className="sh-co-login">
            Hesabın var mı?{' '}
            <button type="button" onClick={() => setAuthOpen(true)}>
              Giriş yap
            </button>{' '}
            — bilgilerin otomatik dolsun, rezervasyonunu takip et.
          </p>
        )}
        <div className="sh-co-inputs">
          <label className={`sh-co-input${errors.name ? ' is-invalid' : ''}`}>
            <small>Ad soyad</small>
            <input {...field('name')} autoComplete="name" placeholder="Kimlikteki gibi" />
          </label>
          <label className={`sh-co-input${errors.email ? ' is-invalid' : ''}`}>
            <small>E-posta</small>
            <input {...field('email')} type="email" autoComplete="email" placeholder="ornek@eposta.com" />
          </label>
          <label className={`sh-co-input${errors.phone ? ' is-invalid' : ''}`}>
            <small>Telefon (isteğe bağlı)</small>
            <input {...field('phone')} type="tel" autoComplete="tel" placeholder="+90 5xx xxx xx xx" />
          </label>
        </div>
        {(errors.name || errors.email || errors.phone) && <p className="sh-co-err">{errors.name ?? errors.email ?? errors.phone}</p>}
      </>
    ),
    4: (
      <>
        <dl className="sh-co-review">
          <div>
            <dt>Tarihler</dt>
            <dd>{dateText}</dd>
          </div>
          <div>
            <dt>Misafirler</dt>
            <dd>{trip.guests} misafir</dd>
          </div>
          <div>
            <dt>Ödeme</dt>
            <dd>{whenText}</dd>
          </div>
          <div>
            <dt>Yöntem</dt>
            <dd>{PAY_OPTIONS.find(o => o.key === pay)!.title}</dd>
          </div>
        </dl>
        {ruleItems.length > 0 && (
          <>
            <h3 className="sh-co-sub">Tekne kuralları</h3>
            <ul className="sh-co-rules">
              {ruleItems.map(({ key, icon: Icon, text }) => (
                <li key={key}>
                  <Icon size={20} strokeWidth={1.6} aria-hidden="true" /> {text}
                </li>
              ))}
            </ul>
          </>
        )}
        <label className={`sh-co-agree${errors.agree ? ' is-invalid' : ''}`}>
          <input
            type="checkbox"
            checked={agree}
            onChange={e => {
              setAgree(e.target.checked)
              if (errors.agree) clearError('agree')
            }}
          />
          <span>Rezervasyon şartlarını, iptal politikasını ve tekne kurallarını okudum, kabul ediyorum.</span>
        </label>
        {errors.agree && <p className="sh-co-err">{errors.agree}</p>}
        {submitError && (
          <p className="sh-co-err" role="alert">
            {submitError}
          </p>
        )}
      </>
    ),
  }

  const stepSummary: Record<number, string> = {
    1: whenText,
    2: PAY_OPTIONS.find(o => o.key === pay)!.title,
    3: [form.name.trim(), form.email.trim()].filter(Boolean).join(' · ') || 'İletişim bilgileri',
    4: '',
  }

  const primaryLabel = step === 4 ? (submitting ? 'Gönderiliyor…' : 'Rezervasyon talebi gönder') : 'Sonraki'

  /* ---------- sayfa ---------- */
  return (
    <div className={`sh-co${step === 1 ? ' is-first' : ''}`}>
      <div className="sh-container sh-co-head">
        {step > 1 ? (
          <button type="button" className="sh-icon-btn sh-co-back sh-co-back--m" onClick={back} aria-label="Önceki adım">
            <ArrowLeft size={20} />
          </button>
        ) : null}
        <Link href={listingUrl} className="sh-icon-btn sh-co-back sh-co-back--d" aria-label="İlana dön">
          <ArrowLeft size={20} />
        </Link>
        <h1>
          <span className="sh-co-title-d">Rezervasyon talebi</span>
          <span className="sh-co-title-m">{step === 1 ? 'İncele ve devam et' : STEP_TITLES[step - 1]}</span>
        </h1>
        <Link href={listingUrl} className="sh-icon-btn sh-co-close" aria-label="Kapat">
          <X size={20} />
        </Link>
      </div>

      <div className="sh-container sh-co-grid">
        <div className="sh-co-main">
          {step === 1 && mobileSummary}

          {STEP_TITLES.map((title, i) => {
            const n = i + 1
            const active = n === step
            const completed = n < reached && !active
            return (
              <section key={title} id={`co-step-${n}`} className={`sh-co-step${active ? ' is-active' : ''}${completed ? ' is-done' : ''}`}>
                <header>
                  <h2>
                    <span className="sh-co-step-no">{n}. </span>
                    {title}
                  </h2>
                  {completed && (
                    <button type="button" className="sh-co-pill" onClick={() => goTo(n)}>
                      Değiştir
                    </button>
                  )}
                </header>
                {completed && stepSummary[n] && <p className="sh-co-step-sum">{stepSummary[n]}</p>}
                {active && (
                  <div className="sh-co-step-body">
                    {stepBody[n]}
                    <div className="sh-co-step-foot">
                      <button type="button" className={`sh-co-next${n === 4 ? ' sh-co-next--wide is-final' : ''}`} onClick={next} disabled={submitting}>
                        {submitting && n === 4 && <Loader2 size={18} className="sh-spin" aria-hidden="true" />}
                        {n === 4 ? primaryLabel : 'Sonraki'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <div className="sh-co-side">
          <div className="sh-co-promo">
            <Gift size={22} strokeWidth={1.8} aria-hidden="true" />
            <p>
              <b>Bu rezervasyon onaylanınca %15’e varan cashback kazanırsın.</b> Tutar Ahoy bakiyene eklenir.
            </p>
          </div>
          <div className="sh-co-guard">
            <ShieldCheck size={22} strokeWidth={1.8} aria-hidden="true" />
            <p>
              Kaptan onaylamadan ödeme alınmaz; ilanlar yayına girmeden önce incelenir. <Link href="/neden-ahoy">Nasıl çalışır?</Link>
            </p>
          </div>
          {summary}
        </div>
      </div>

      {/* mobil alt çubuk: ilerleme + ana buton */}
      <div className="sh-co-bar">
        <div className="sh-co-progress" aria-hidden="true">
          {STEP_TITLES.map((t, i) => (
            <span key={t} className={i < step ? 'is-on' : undefined} />
          ))}
        </div>
        <button type="button" className={`sh-co-next sh-co-next--bar${step === 4 ? ' is-final' : ''}`} onClick={next} disabled={submitting}>
          {submitting && <Loader2 size={18} className="sh-spin" aria-hidden="true" />}
          {primaryLabel}
        </button>
      </div>

      {breakdown}

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
          if (errors.trip) clearError('trip')
        }}
      />

      {authOpen && <AuthModal initialMode="signin" onClose={closeAuth} />}
    </div>
  )
}

function houseRuleText(h: { label: string; allowed: boolean; note?: string }): string {
  if (h.label === 'Evcil hayvan')
    return h.allowed ? `Evcil hayvan kabul ediliyor${h.note ? ` (${h.note.toLocaleLowerCase('tr')})` : ''}.` : 'Evcil hayvan kabul edilmiyor.'
  if (h.label.startsWith('Sigara')) return `${h.label}.`
  return `${h.label} ${h.allowed ? 'serbest' : 'izinli değil'}.`
}

/** Airbnb tarzı seçenek satırı (radyo). */
function Option({
  checked,
  onSelect,
  title,
  icon,
  children,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <button type="button" role="radio" aria-checked={checked} className={`sh-co-opt${checked ? ' is-on' : ''}`} onClick={onSelect}>
      {icon && <span className="sh-co-opt-ico">{icon}</span>}
      <span className="sh-co-opt-text">
        <b>{title}</b>
        <small>{children}</small>
      </span>
      <i aria-hidden="true" />
    </button>
  )
}

function PriceBreakdown({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return createPortal(
    <div className="sh-modal-overlay" onClick={onClose}>
      <div className="sh-modal sh-co-bd-modal" role="dialog" aria-modal="true" aria-label="Fiyat dökümü" onClick={e => e.stopPropagation()}>
        <div className="sh-modal-head">
          <button type="button" className="sh-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
          <h2>Fiyat dökümü</h2>
          <span />
        </div>
        <div className="sh-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
