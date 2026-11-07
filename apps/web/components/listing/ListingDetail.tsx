'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Anchor,
  Bath,
  BedDouble,
  Calendar,
  CalendarDays,
  CalendarX2,
  CircleCheck,
  Clock,
  FileCheck2,
  Fuel,
  Headset,
  MapPin,
  Navigation,
  PartyPopper,
  ReceiptText,
  Ruler,
  ScrollText,
  Share2,
  ShieldCheck,
  Ship,
  Sparkles,
  UserRoundCheck,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { toBoatDetailViewModel, type SerializedBoatDTO } from '@getyourboat/shared'
import type { PublicBoatSummary } from '@/lib/api'
import BoatListCard from '@/components/boats/BoatListCard'
import { TRUST_FEATURES } from '@/components/home/content'
import { boatTypeLabel, cleanText, prettyValue } from '@/lib/boatFormat'
import ListingGallery from './ListingGallery'
import BookingPanel from './BookingPanel'
import { groupAmenities, type AmenityGroup } from './amenityCatalog'
import { DEFAULT_SPEC_ICON, SPEC_GROUPS, SPEC_ICONS, type FeatureIcon } from './featureIcons'
import { buildRules } from './listingRules'

interface Props {
  boat: SerializedBoatDTO
  similar: PublicBoatSummary[]
}

const STAT_ICONS: Record<string, LucideIcon> = {
  Kapasite: Users,
  Kabin: BedDouble,
  Tuvalet: Bath,
  Uzunluk: Ruler,
}

const DOC_LABELS: Record<string, string> = {
  certificate_of_insurance: 'Sigorta poliçesi',
  certificate_of_ownership: 'Tekne ruhsatı',
  certificate_of_registry: 'Tescil belgesi',
  captain_license: 'Kaptan ehliyeti',
}

const TRUST_ICONS = { shield: ShieldCheck, ship: Ship, headset: Headset, user: UserRoundCheck }
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const AMENITY_PREVIEW = 10
const SPEC_PREVIEW = 8

interface InfoItem {
  icon: LucideIcon
  title: string
  lines: string[]
}

export default function ListingDetail({ boat, similar }: Props) {
  const model = useMemo(() => toBoatDetailViewModel(boat), [boat])
  // "Tümünü göster" listeleri sayfayı uzatmak yerine popup'ta açılır.
  const [sheet, setSheet] = useState<'amenities' | 'specs' | null>(null)
  const closeSheet = useCallback(() => setSheet(null), [])
  const [descOpen, setDescOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const feature = (key: string) => boat.features.find(f => f.key === key)?.value?.trim() || null
  const capacityRaw = Number(feature('capacity') ?? 8)
  const maxGuests = Number.isFinite(capacityRaw) && capacityRaw > 0 ? capacityRaw : 8
  const year = feature('year_of_manufacture')
  const refit = feature('year_of_refit')
  const city = model.location?.city ?? feature('city')
  const type = boatTypeLabel(boat.boatType) ?? model.boatTypeLabel
  const loc = model.location
  const place = cleanText([loc?.marina, loc?.city, loc?.region].filter(Boolean).join(', ') || 'Türkiye')
  const rules = (boat.structuredRules ?? {}) as Record<string, unknown>
  const minDuration = typeof rules.min_rental_duration === 'string' && rules.min_rental_duration ? rules.min_rental_duration : null

  const stats: { icon: LucideIcon; text: string }[] = [
    ...model.stats.map(s => ({ icon: STAT_ICONS[s.label] ?? Anchor, text: s.value })),
    ...(year ? [{ icon: Calendar, text: refit && refit !== year ? `${year} model · ${refit} yenileme` : `${year} model` }] : []),
  ]

  const highlights: InfoItem[] = [
    model.approvalLabel && {
      icon: ShieldCheck,
      title: model.approvalLabel,
      lines: [model.approvalLabel === 'Anında rezervasyon' ? 'Talebin anında onaylanır.' : 'Kaptan talebini genellikle birkaç saat içinde yanıtlar.'],
    },
    model.cancellationLabel && { icon: CalendarX2, title: model.cancellationLabel, lines: ['Bu teknede kaptanın iptal politikası geçerlidir.'] },
    { icon: Wallet, title: 'Şimdi ödeme yok', lines: [model.depositLabel ? `Kaptan onayladıktan sonra ${model.depositLabel.toLocaleLowerCase('tr')} alınır.` : 'Ödeme, kaptan talebini onayladıktan sonra alınır.'] },
  ].filter(Boolean) as InfoItem[]

  /* ---------- olanaklar ---------- */
  const amenityGroups = useMemo(() => groupAmenities(boat.amenities), [boat.amenities])
  const amenityTotal = amenityGroups.reduce((n, g) => n + g.items.length, 0)
  const visibleGroups = (() => {
    if (amenityTotal <= AMENITY_PREVIEW) return amenityGroups
    let left = AMENITY_PREVIEW
    return amenityGroups
      .map(g => {
        const items = g.items.slice(0, Math.max(0, left))
        left -= items.length
        return { ...g, items }
      })
      .filter(g => g.items.length > 0)
  })()

  /* ---------- bilinmesi gerekenler ---------- */
  const r = useMemo(
    () => buildRules(boat.structuredRules as Record<string, unknown> | null, model.contactForFuelCost, model.fuelCostNote),
    [boat.structuredRules, model.contactForFuelCost, model.fuelCostNote],
  )
  const cond = (label: string) => r.conditions.find(c => c.label.startsWith(label))?.value ?? null
  const docs = boat.documents.map(d => DOC_LABELS[d.documentTypeKey] ?? d.documentTypeLabel)
  const info: InfoItem[] = [
    r.schedules.length > 0 && {
      icon: Clock,
      title: 'Giriş ve çıkış',
      lines: r.schedules.map(s => `${s.title.startsWith('Günlük') ? 'Günlük' : 'Konaklamalı'}: giriş ${s.checkIn ?? '—'}, çıkış ${s.checkOut ?? '—'}`),
    },
    (cond('Minimum') || cond('Haftalık')) && {
      icon: CalendarDays,
      title: 'Kiralama süresi',
      lines: [cond('Minimum') && `En az ${cond('Minimum')} kiralanabilir.`, cond('Haftalık') && `Haftalık teslim günü ${cond('Haftalık')}.`].filter(Boolean) as string[],
    },
    (cond('Günlük klima') || cond('Yakıt')) && {
      icon: Fuel,
      title: 'Yakıt ve klima',
      lines: [
        cond('Yakıt') && (model.contactForFuelCost ? 'Yakıt ücreti kaptanla netleştirilir.' : `Yakıt tüketimi ${cond('Yakıt')}.`),
        cond('Günlük klima') && `Günlük klima kullanımı ${cond('Günlük klima')}.`,
      ].filter(Boolean) as string[],
    },
    r.included.length > 0 && {
      icon: CircleCheck,
      title: 'Fiyata dahil',
      lines: [joinTr(r.included.map(f => f.label.toLocaleLowerCase('tr'))).replace(/^./, c => c.toLocaleUpperCase('tr')) + ' fiyata dahildir.'],
    },
    r.extras.length > 0 && {
      icon: ReceiptText,
      title: 'Ayrıca ödenir',
      lines: r.extras.map(f => (f.value ? `${f.label}: ${f.value}` : f.label)),
    },
    r.house.length > 0 && {
      icon: ScrollText,
      title: 'Tekne kuralları',
      lines: r.house.map(h =>
        h.label === 'Evcil hayvan'
          ? h.allowed
            ? `Evcil hayvan kabul ediliyor${h.note ? ` (${h.note.toLocaleLowerCase('tr')})` : ''}.`
            : 'Evcil hayvan kabul edilmiyor.'
          : h.label.startsWith('Sigara')
            ? `${h.label}.`
            : `${h.label} ${h.allowed ? 'serbest' : 'izinli değil'}.`,
      ),
    },
    model.cancellationLabel && { icon: CalendarX2, title: 'İptal politikası', lines: [`${model.cancellationLabel} politikası uygulanır. Ayrıntılar için kaptana sorabilirsin.`] },
    r.services && { icon: PartyPopper, title: 'Ek hizmetler', lines: [r.services] },
    docs.length > 0 && { icon: FileCheck2, title: 'Belgeler', lines: [`${joinTr(docs)} Ahoy’a yüklendi.`] },
  ].filter(Boolean) as InfoItem[]

  const specItems: SpecItem[] = model.specs.map(sp => ({
    label: sp.label,
    value: sp.value,
    key: sp.key,
    icon: (sp.key && SPEC_ICONS[sp.key]) || DEFAULT_SPEC_ICON,
  }))
  const specPreview = specItems.slice(0, SPEC_PREVIEW)
  const desc = model.description ?? ''
  const longDesc = desc.length > 420

  const mapUrl =
    loc?.latitude != null && loc.longitude != null && MAPBOX_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+183d85(${loc.longitude},${loc.latitude})/${loc.longitude},${loc.latitude},12.5,0/1100x460@2x?access_token=${MAPBOX_TOKEN}`
      : null
  const directionsUrl =
    loc?.latitude != null && loc.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`
      : loc?.summary
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.summary)}`
        : null

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: model.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* kullanıcı paylaşımı iptal etti */
    }
  }

  return (
    <div className="sh-home sh-lst">
      <div className="sh-container">
        <nav className="sh-crumbs sh-lst-crumbs" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          <Link href="/tekne-kiralama">Tekne kiralama</Link>
          {city && (
            <>
              <span aria-hidden="true">/</span>
              <Link href={`/tekne-kiralama?city=${encodeURIComponent(city)}`}>{city}</Link>
            </>
          )}
        </nav>

        <header className="sh-lst-head">
          <div>
            <div className="sh-lst-tags">
              {type && <span className="sh-badge sh-badge--static">{type}</span>}
              {model.subtitle && <span className="sh-lst-sub">{model.subtitle}</span>}
            </div>
            <h1 className="sh-lst-title">{model.title}</h1>
            <p className="sh-lst-loc">
              <MapPin size={16} strokeWidth={2} aria-hidden="true" />
              {place}
              <span className="sh-dot-sep" aria-hidden="true" />
              <span className="sh-nowrap">
                <Sparkles size={15} strokeWidth={2} aria-hidden="true" /> Yeni ilan
              </span>
            </p>
          </div>
          <button type="button" className="sh-pill-btn sh-lst-share" onClick={share}>
            <Share2 size={16} strokeWidth={2} aria-hidden="true" /> {copied ? 'Bağlantı kopyalandı' : 'Paylaş'}
          </button>
        </header>

        <ListingGallery photos={model.gallery} title={model.title} />

        <div className="sh-lst-body">
          <div className="sh-lst-main">
            {/* öne çıkanlar */}
            <section className="sh-ls sh-ls--first">
              {stats.length > 0 && (
                <ul className="sh-ls-stats">
                  {stats.map(({ icon: Icon, text }) => (
                    <li key={text}>
                      <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
                      {text}
                    </li>
                  ))}
                </ul>
              )}
              <ul className="sh-ls-highlights">
                {highlights.map(({ icon: Icon, title, lines }) => (
                  <li key={title}>
                    <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
                    <div>
                      <b>{title}</b>
                      <p>{lines[0]}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {desc && (
              <section className="sh-ls">
                <h2 className="sh-ls-h2">Tekne hakkında</h2>
                <p className={`sh-ls-text${longDesc && !descOpen ? ' is-clamped' : ''}`}>{desc}</p>
                {longDesc && (
                  <button type="button" className="sh-link-btn sh-ls-link" onClick={() => setDescOpen(o => !o)}>
                    {descOpen ? 'Daha az göster' : 'Devamını oku'}
                  </button>
                )}
              </section>
            )}

            {amenityTotal > 0 && (
              <section className="sh-ls">
                <h2 className="sh-ls-h2">Teknede neler var?</h2>
                {visibleGroups.map(g => (
                  <div key={g.key} className="sh-ls-group">
                    <h3>{g.title}</h3>
                    <ul className="sh-ls-amen">
                      {g.items.map(({ key, label, icon: Icon, isExtra, price }) => (
                        <li key={key}>
                          <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
                          <span>
                            {label}
                            {isExtra && <small>Ücretli{price ? ` · ${price.replace('+', '')}` : ''}</small>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {amenityTotal > AMENITY_PREVIEW && (
                  <button type="button" className="sh-ls-btn" onClick={() => setSheet('amenities')}>
                    {amenityTotal} olanağın tümünü göster
                  </button>
                )}
              </section>
            )}

            {model.specs.length > 0 && (
              <section className="sh-ls">
                <h2 className="sh-ls-h2">Teknik özellikler</h2>
                <dl className="sh-ls-specs">
                  {specPreview.map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <dt>
                        <Icon size={22} strokeWidth={1.5} />
                        {label}
                      </dt>
                      <dd>{prettyValue(value)}</dd>
                    </div>
                  ))}
                </dl>
                {specItems.length > SPEC_PREVIEW && (
                  <button type="button" className="sh-ls-btn" onClick={() => setSheet('specs')}>
                    {specItems.length} özelliğin tümünü göster
                  </button>
                )}
              </section>
            )}

            {loc && (
              <section className="sh-ls">
                <h2 className="sh-ls-h2">Nereden kalkıyor?</h2>
                <p className="sh-ls-muted">{loc.summary ? cleanText(loc.summary) : place}</p>
                <div className="sh-ls-map">
                  {mapUrl ? (
                    // Mapbox statik harita — next/image optimizasyonu gerekmiyor.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mapUrl} alt={`${model.title} konumu`} loading="lazy" />
                  ) : (
                    <div className="sh-ls-map-fallback">
                      <MapPin size={28} aria-hidden="true" />
                    </div>
                  )}
                  {directionsUrl && (
                    <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="sh-btn sh-btn--white sh-ls-map-btn">
                      Yol tarifi al <Navigation size={16} fill="currentColor" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="sh-lst-side">
            <BookingPanel
              boat={boat}
              coverUrl={model.gallery[0]?.url ?? null}
              place={place}
              maxGuests={maxGuests}
              approvalLabel={model.approvalLabel}
              cancellationLabel={model.cancellationLabel}
              minDuration={minDuration}
            />
          </div>
        </div>

        {/* tam genişlik: bilinmesi gerekenler */}
        {(info.length > 0 || model.rules) && (
          <section className="sh-ls sh-ls--wide" aria-labelledby="know-title">
            <h2 className="sh-ls-h2" id="know-title">
              Bilinmesi gerekenler
            </h2>
            <ul className="sh-ls-info">
              {info.map(({ icon: Icon, title, lines }) => (
                <li key={title}>
                  <Icon size={28} strokeWidth={1.4} aria-hidden="true" />
                  <b>{title}</b>
                  {lines.map(l => (
                    <p key={l}>{l}</p>
                  ))}
                </li>
              ))}
            </ul>
            {model.rules && (
              <div className="sh-ls-note">
                <b>Kaptanın notu</b>
                <p>{model.rules}</p>
              </div>
            )}
          </section>
        )}

        <section className="sh-ls sh-ls--wide" aria-labelledby="trust-title">
          <h2 className="sh-ls-h2" id="trust-title">
            Ahoy güvencesiyle kirala
          </h2>
          <ul className="sh-ls-info sh-ls-info--4">
            {TRUST_FEATURES.map(f => {
              const Icon = TRUST_ICONS[f.icon]
              return (
                <li key={f.title}>
                  <Icon size={28} strokeWidth={1.4} aria-hidden="true" />
                  <b>{f.title}</b>
                  <p>{f.desc}</p>
                </li>
              )
            })}
          </ul>
        </section>

        {similar.length > 0 && (
          <section className="sh-ls sh-ls--wide sh-ls--last" aria-labelledby="similar-title">
            <div className="sh-section-head">
              <div>
                <h2 className="sh-ls-h2" id="similar-title">
                  Benzer tekneler
                </h2>
                <p className="sh-ls-muted">{city ? `${city} ve çevresinde ilgini çekebilecek diğer tekneler.` : 'İlgini çekebilecek diğer tekneler.'}</p>
              </div>
              <Link href="/tekne-kiralama" className="sh-link-arrow">
                Tüm tekneleri gör
              </Link>
            </div>
            <div className="sh-bgrid">
              {similar.slice(0, 3).map(b => (
                <BoatListCard key={b.id} boat={b} />
              ))}
            </div>
          </section>
        )}
      </div>

      {sheet === 'amenities' && (
        <FeatureSheet title="Teknede neler var?" onClose={closeSheet}>
          <AmenitySheetContent groups={amenityGroups} />
        </FeatureSheet>
      )}
      {sheet === 'specs' && (
        <FeatureSheet title="Teknik özellikler" onClose={closeSheet}>
          <SpecSheetContent items={specItems} />
        </FeatureSheet>
      )}
    </div>
  )
}

interface SpecItem {
  key?: string
  label: string
  value: string
  icon: FeatureIcon
}

function FeatureSheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
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
      <div className="sh-modal sh-sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="sh-modal-head">
          <button type="button" className="sh-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
          <h2>{title}</h2>
          <span />
        </div>
        <div className="sh-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

function AmenitySheetContent({ groups }: { groups: AmenityGroup[] }) {
  return (
    <>
      {groups.map(g => (
        <section key={g.key} className="sh-sheet-group">
          <h3>{g.title}</h3>
          <ul className="sh-sheet-list">
            {g.items.map(({ key, label, icon: Icon, isExtra, price }) => (
              <li key={key}>
                <Icon size={26} strokeWidth={1.5} />
                <span>
                  {label}
                  {isExtra && <small>Ücretli{price ? ` · ${price.replace('+', '')}` : ''}</small>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

function SpecSheetContent({ items }: { items: SpecItem[] }) {
  const known = new Set(SPEC_GROUPS.flatMap(g => g.keys))
  const groups = SPEC_GROUPS.map(g => ({
    title: g.title,
    items: g.keys.flatMap(k => items.filter(i => i.key === k)),
  })).filter(g => g.items.length > 0)
  const other = items.filter(i => !i.key || !known.has(i.key))
  if (other.length > 0) groups.push({ title: 'Diğer', items: other })

  return (
    <>
      {groups.map(g => (
        <section key={g.title} className="sh-sheet-group">
          <h3>{g.title}</h3>
          <ul className="sh-sheet-list">
            {g.items.map(({ label, value, icon: Icon }) => (
              <li key={label}>
                <Icon size={26} strokeWidth={1.5} />
                <span>{label}</span>
                <b className="sh-sheet-val">{prettyValue(value)}</b>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

/** ["a","b","c"] → "a, b ve c" */
function joinTr(list: string[]): string {
  if (list.length <= 1) return list.join('')
  return `${list.slice(0, -1).join(', ')} ve ${list[list.length - 1]}`
}
