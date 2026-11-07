'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  Anchor,
  Award,
  CalendarCheck,
  CircleCheck,
  Cigarette,
  FileCheck2,
  FileText,
  Fuel,
  Gift,
  Heart,
  MapPin,
  MessageCircleMore,
  Navigation,
  PartyPopper,
  PawPrint,
  Sailboat,
  Share,
  ShieldCheck,
  Ship,
  ShipWheel,
  SprayCan,
  Star,
  Utensils,
  Wine,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { ApprovalType, toBoatDetailViewModel, type SerializedBoatDTO } from '@getyourboat/shared'
import type { PublicBoatSummary } from '@/lib/api'
import BoatListCard from '@/components/boats/BoatListCard'
import AuthModal from '@/components/auth/AuthModal'
import AhoyGuarantee from '@/components/sh/AhoyGuarantee'
import Art3D from '@/components/sh/Art3D'
import ShareModal from '@/components/sh/ShareModal'
import RangeCalendar from '@/components/sh/RangeCalendar'
import { boatTypeLabel, cleanText, formatDayMonth, formatMoney, prettyValue } from '@/lib/boatFormat'
import { estimatePrice } from '@/lib/bookingPrice'
import { setPendingFavorite, useFavorites } from '@/lib/favorites'
import ListingGallery from './ListingGallery'
import BookingPanel, { useBookingState, type ListingSection } from './BookingPanel'
import HostAvatar from './HostAvatar'
import MessageCaptainModal from './MessageCaptainModal'
import { groupAmenities, missingAmenities, type AmenityGroup, type MissingAmenity } from './amenityCatalog'
import { DEFAULT_SPEC_ICON, SPEC_GROUPS, SPEC_ICONS, type FeatureIcon } from './featureIcons'
import { buildRules } from './listingRules'

interface Props {
  boat: SerializedBoatDTO
  similar: PublicBoatSummary[]
}

type AnyIcon = FeatureIcon | LucideIcon

/** "Etiket: değer" satırı (hizmetler, ilan özellikleri). */
interface Row {
  key: string
  icon: AnyIcon
  label: string
  value: string
}

/** Başlık + açıklama (öne çıkanlar, koşullar, kurallar). */
interface Note {
  icon?: AnyIcon
  /** Renkli 3D ikon (/public/icons/3d/<ad>.webp). */
  art?: string
  title: string
  text: string
}

const DOC_LABELS: Record<string, string> = {
  certificate_of_insurance: 'Sigorta poliçesi',
  certificate_of_ownership: 'Tekne ruhsatı',
  certificate_of_registry: 'Tescil belgesi',
  captain_license: 'Kaptan ehliyeti',
}

const FEE_ICONS: Record<string, LucideIcon> = {
  'Liman ücreti': Anchor,
  'Final temizliği': SprayCan,
  'Transit log': FileText,
}

const EXTRA_UNIT: Record<string, string> = {
  PER_BOOKING: 'rezervasyon başı',
  PER_PERSON: 'kişi başı',
  PER_DAY: 'gün başı',
  PER_HOUR: 'saat başı',
}

/** Özellikler popup'ında "Tekne" grubunun başına eklenen genel satırlar. */
const GENERAL_SPEC_KEYS = ['boat_type', 'manufacturer_brand', 'model']

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const AMENITY_PREVIEW = 8
/** Önizlemede imkanların sonunda gösterilen, teknede olmayan (üstü çizili) imkan sayısı. */
const MISSING_PREVIEW = 2
const SERVICE_PREVIEW = 5
const SPEC_PREVIEW = 6

export default function ListingDetail({ boat, similar }: Props) {
  const model = useMemo(() => toBoatDetailViewModel(boat), [boat])
  const booking = useBookingState(boat)
  // "Tümünü göster" listeleri sayfayı uzatmak yerine popup'ta açılır.
  const [sheet, setSheet] = useState<'amenities' | 'services' | 'specs' | null>(null)
  const closeSheet = useCallback(() => setSheet(null), [])
  const [descOpen, setDescOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  // giriş penceresi hangi işlem için açıldı (favori / kaptana mesaj)
  const [authFor, setAuthFor] = useState<'favorite' | 'message' | null>(null)
  const [msgOpen, setMsgOpen] = useState(false)
  const [toast, setToast] = useState<{ text: string; link?: boolean } | null>(null)
  const closeShare = useCallback(() => setShareOpen(false), [])
  const closeAuth = useCallback(() => setAuthFor(null), [])
  const closeMsg = useCallback(() => setMsgOpen(false), [])

  const showToast = useCallback((text: string, link = false) => {
    setToast({ text, link })
    window.setTimeout(() => setToast(t => (t?.text === text ? null : t)), 3200)
  }, [])
  // Giriş öncesi kalbe basıldıysa giriş yapılınca otomatik eklenir.
  const fav = useFavorites({ onPendingAdded: id => id === boat.id && showToast('Favorilerine eklendi', true) })
  const saved = fav.isFavorite(boat.id)

  /* ---------- ilan sahibi + kaptana mesaj ---------- */
  const owner = boat.owner ?? null
  const hostName = owner?.name ?? 'Kaptan'
  const openMessage = () => {
    if (!fav.ready) return
    if (!fav.user) setAuthFor('message')
    else setMsgOpen(true)
  }
  const toggleFavorite = async () => {
    if (!fav.ready) return
    if (!fav.user) {
      setPendingFavorite(boat.id)
      setAuthFor('favorite')
      return
    }
    try {
      const added = await fav.toggle(boat.id)
      showToast(added ? 'Favorilerine eklendi' : 'Favorilerinden çıkarıldı', !!added)
    } catch {
      showToast('Bir sorun oluştu, lütfen tekrar dene')
    }
  }

  const feature = (key: string) => boat.features.find(f => f.key === key)?.value?.trim() || null
  const num = (key: string) => {
    const n = Number(feature(key) ?? 0)
    return Number.isFinite(n) ? n : 0
  }
  const capacityRaw = Number(feature('capacity') ?? 8)
  const maxGuests = Number.isFinite(capacityRaw) && capacityRaw > 0 ? capacityRaw : 8
  const year = feature('year_of_manufacture')
  const refit = feature('year_of_refit')
  const type = boatTypeLabel(boat.boatType) ?? model.boatTypeLabel
  const loc = model.location
  const place = cleanText([loc?.marina, loc?.city, loc?.region].filter(Boolean).join(', ') || 'Türkiye')
  const instant = boat.approvalType === ApprovalType.INSTANT
  const crew = num('number_of_crew_members')
  const crewIncluded = num('crew_members_included_in_the_price')

  const r = useMemo(
    () => buildRules(boat.structuredRules as Record<string, unknown> | null, model.contactForFuelCost, model.fuelCostNote),
    [boat.structuredRules, model.contactForFuelCost, model.fuelCostNote],
  )
  const cond = (label: string) => r.conditions.find(c => c.label.startsWith(label))?.value ?? null
  const minDuration = cond('Minimum')
  const weeklyDay = cond('Haftalık')
  const acUsage = cond('Günlük klima')
  const docs = boat.documents.map(d => DOC_LABELS[d.documentTypeKey] ?? d.documentTypeLabel)

  /* ---------- özet satırı: "Yelkenli · 8 kişi · 1 kabin · 14 m · 2019" ---------- */
  const facts = [
    type,
    ...model.stats.map(s => s.value),
    year ? (refit && refit !== year ? `${year} (${refit} yenileme)` : year) : null,
  ].filter(Boolean) as string[]

  /* ---------- öne çıkanlar ---------- */
  const highlights: Note[] = [
    crew > 0 && { icon: ShipWheel, title: 'Mürettebatlı kiralama', text: `Teknede ${crew} kişilik profesyonel mürettebat bulunur.` },
    instant
      ? { icon: Zap, title: 'Anında rezervasyon', text: 'Talebin kaptan onayı beklemeden kesinleşir.' }
      : { icon: ShieldCheck, title: 'Kaptan onaylı rezervasyon', text: 'Kaptan talebini genellikle birkaç saat içinde yanıtlar.' },
    model.cancellationLabel && { icon: CalendarCheck, title: model.cancellationLabel, text: 'Bu teknede kaptanın belirlediği iptal politikası geçerlidir.' },
    docs.length > 0 && { icon: FileCheck2, title: 'Belgeli tekne', text: `${joinTr(docs)} Ahoy’a yüklendi.` },
  ].filter(Boolean) as Note[]

  /* ---------- imkanlar ---------- */
  const amenityGroups = useMemo(() => groupAmenities(boat.amenities), [boat.amenities])
  const amenities = amenityGroups.flatMap(g => g.items)
  const missing = useMemo(() => missingAmenities(boat.amenities), [boat.amenities])

  /* ---------- hizmetler ve ekstralar ---------- */
  const services: Row[] = [
    crew > 0 && {
      key: 'crew',
      icon: ShipWheel,
      label: `Mürettebat (${crew} kişi)`,
      value: crewIncluded >= crew ? 'Fiyata dahil' : crewIncluded > 0 ? `${crewIncluded} kişi fiyata dahil` : 'Fiyata dahil değil',
    },
    ...r.included.map(f => ({ key: `inc-${f.label}`, icon: FEE_ICONS[f.label] ?? CircleCheck, label: f.label, value: 'Fiyata dahil' })),
    ...r.extras.map(f => ({ key: `ext-${f.label}`, icon: FEE_ICONS[f.label] ?? CircleCheck, label: f.label, value: f.value ? `Ayrıca ödenir · ${f.value}` : 'Ayrıca ödenir' })),
    model.contactForFuelCost
      ? { key: 'fuel', icon: Fuel, label: 'Yakıt', value: 'Kaptanla netleştirilir' }
      : model.fuelCostNote
        ? { key: 'fuel', icon: Fuel, label: 'Yakıt', value: model.fuelCostNote }
        : null,
    ...amenities
      .filter(a => a.isExtra)
      .map(a => ({ key: `am-${a.key}`, icon: a.icon, label: a.label, value: a.price ? `Ücretli · ${a.price.replace('+', '')}` : 'Ücretli' })),
    ...boat.extras.map(e => ({
      key: `x-${e.id}`,
      icon: Gift,
      label: e.name,
      value: `${formatMoney(e.price, e.currency)}${EXTRA_UNIT[e.pricingType] ? ` · ${EXTRA_UNIT[e.pricingType]}` : ''}`,
    })),
    r.services && { key: 'services', icon: PartyPopper, label: 'Ek hizmetler', value: r.services },
  ].filter(Boolean) as Row[]

  /* ---------- ilan özellikleri ---------- */
  const brand = feature('manufacturer_brand')
  const modelName = feature('model')
  const specRows: Row[] = [
    type && { key: 'boat_type', icon: Sailboat, label: 'Tekne tipi', value: type },
    brand && { key: 'manufacturer_brand', icon: Award, label: 'Marka', value: brand },
    modelName && { key: 'model', icon: Ship, label: 'Model', value: modelName },
    ...model.specs.map(sp => ({
      key: sp.key ?? sp.label,
      icon: (sp.key && SPEC_ICONS[sp.key]) || DEFAULT_SPEC_ICON,
      label: sp.label,
      value: prettyValue(sp.value),
    })),
  ].filter(Boolean) as Row[]

  /* ---------- ücret ve koşullar ---------- */
  const terms: Note[] = [
    minDuration && { art: 'hourglass', title: `Minimum kiralama: ${minDuration}`, text: `Bu tekne en az ${minDuration} için kiralanabilir.` },
    weeklyDay && { art: 'spiral-calendar', title: `Haftalık teslim günü: ${weeklyDay}`, text: `Haftalık kiralamalarda giriş ve çıkış ${weeklyDay} günü yapılır.` },
    model.contactForFuelCost
      ? { art: 'fuel-pump', title: 'Yakıt: kaptanla netleştirilir', text: 'Yakıt ücreti rotaya ve seyir süresine göre kaptanla birlikte belirlenir.' }
      : model.fuelCostNote
        ? { art: 'fuel-pump', title: `Yakıt: ${model.fuelCostNote}`, text: 'Yakıt ücreti kullanıma göre hesaplanır.' }
        : null,
    acUsage && { art: 'snowflake', title: `Klima kullanımı: ${acUsage}`, text: 'Kaptanın belirlediği günlük klima kullanım süresidir.' },
    {
      art: 'credit-card',
      title: model.depositLabel ? `Ödeme: ${model.depositLabel}` : 'Ödeme',
      text: model.depositLabel
        ? `Kaptan talebini onayladıktan sonra ${model.depositLabel.toLocaleLowerCase('tr')} alınır; o zamana kadar ödeme yapmazsın.`
        : 'Kaptan talebini onayladıktan sonra ödeme alınır; o zamana kadar ödeme yapmazsın.',
    },
    model.cancellationLabel && {
      art: 'calendar',
      title: `İptal politikası: ${model.cancellationLabel.replace(/ iptal$/, '')}`,
      text: 'Kaptanın belirlediği iptal politikası uygulanır. Ayrıntılar için kaptana sorabilirsin.',
    },
  ].filter(Boolean) as Note[]

  /* ---------- tekne kuralları ---------- */
  const house: Note[] = r.house.map(h => {
    if (h.label === 'Evcil hayvan')
      return { icon: PawPrint, title: 'Evcil hayvan', text: h.allowed ? `Kabul ediliyor${h.note ? ` (${h.note.toLocaleLowerCase('tr')})` : ''}` : 'Kabul edilmiyor' }
    if (h.label.startsWith('Sigara')) return { icon: Cigarette, title: 'Sigara', text: 'Yalnızca açık alanda içilebilir' }
    if (h.label === 'Alkol') return { icon: Wine, title: 'Alkol', text: h.allowed ? 'Serbest' : 'İzin verilmiyor' }
    return { icon: Utensils, title: h.label, text: h.allowed ? 'Serbest' : 'İzin verilmiyor' }
  })

  const desc = model.description ?? ''
  const longDesc = desc.length > 420

  const mapUrl =
    loc?.latitude != null && loc.longitude != null && MAPBOX_TOKEN
      ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+183d85(${loc.longitude},${loc.latitude})/${loc.longitude},${loc.latitude},12.5,0/1280x440@2x?access_token=${MAPBOX_TOKEN}`
      : null
  const directionsUrl =
    loc?.latitude != null && loc.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`
      : loc?.summary
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.summary)}`
        : null

  const hasInfo = r.schedules.length > 0 || terms.length > 0 || house.length > 0 || !!model.rules
  const sections = useMemo<ListingSection[]>(
    () =>
      [
        { id: 'fotograflar', label: 'Fotoğraflar' },
        amenities.length > 0 && { id: 'imkanlar', label: 'İmkanlar' },
        services.length > 0 && { id: 'hizmetler', label: 'Hizmetler' },
        specRows.length > 0 && { id: 'ozellikler', label: 'Özellikler' },
        { id: 'musaitlik', label: 'Müsaitlik' },
        loc && { id: 'konum', label: 'Konum' },
        hasInfo && { id: 'bilinmesi-gerekenler', label: 'Bilinmesi gerekenler' },
      ].filter(Boolean) as ListingSection[],
    [amenities.length, services.length, specRows.length, loc, hasInfo],
  )

  /* ---------- satır içi takvim ---------- */
  const { trip, setTrip, blocked, hourly } = booking
  // Süre etiketi fiyat hesabıyla aynı: günlükte "5 gün", konaklamalıda "4 gece", haftalıkta "1 hafta".
  const span = estimatePrice(booking.price, trip.range.start, trip.range.end)?.label ?? null
  const calStatus = trip.range.start
    ? trip.range.end && !hourly
      ? `${formatDayMonth(trip.range.start)} — ${formatDayMonth(trip.range.end)}${span ? ` · ${span}` : ''}`
      : hourly
        ? `${formatDayMonth(trip.range.start)} · saatleri rezervasyon kartından seçebilirsin`
        : 'Şimdi çıkış tarihini seç'
    : 'Giriş tarihini seçerek müsaitliği ve tahmini fiyatı gör.'

  return (
    <div className="sh-ld">
      <div className="sh-container">
        {/* ---------- başlık + galeri ---------- */}
        <div className="sh-ld-top">
          <header className="sh-ld-head">
            <h1 className="sh-ld-title">{model.title}</h1>
            <div className="sh-ld-actions">
              <button type="button" className="sh-ld-act" onClick={() => setShareOpen(true)} aria-label="Paylaş">
                <Share size={18} strokeWidth={2} aria-hidden="true" />
                <span>Paylaş</span>
              </button>
              <button
                type="button"
                className={`sh-ld-act${saved ? ' is-saved' : ''}`}
                onClick={toggleFavorite}
                aria-pressed={saved}
                aria-label={saved ? 'Favorilerimden çıkar' : 'Favorilerime ekle'}
              >
                <Heart size={18} strokeWidth={2} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
                <span>{saved ? 'Favorilerimde' : 'Favorilerime ekle'}</span>
              </button>
            </div>
          </header>
          <div id="fotograflar" className="sh-ld-gal">
            <ListingGallery photos={model.gallery} title={model.title} />
          </div>
        </div>

        {/* ---------- iki sütun: ayrıntılar + rezervasyon kartı ---------- */}
        <div className="sh-ld-body">
          <div className="sh-ld-main">
            <section className="sh-ld-sec sh-ld-overview">
              <div className="sh-ld-place">
                <h2>{place}</h2>
                {instant && (
                  <span className="sh-ld-instant">
                    <Zap size={14} strokeWidth={2.2} aria-hidden="true" /> Anında rezervasyon
                  </span>
                )}
              </div>
              {facts.length > 0 && (
                <p className="sh-ld-facts">
                  {/* ayraç öncekine bağlı: satır kırılınca nokta satır sonunda kalır */}
                  {facts.map((f, i) => (
                    <span key={f}>
                      {f}
                      {i < facts.length - 1 && (
                        <i className="sh-ld-dot" aria-hidden="true">
                          ·
                        </i>
                      )}
                    </span>
                  ))}
                </p>
              )}
              <p className="sh-ld-new">
                <Star size={16} strokeWidth={0} fill="currentColor" aria-hidden="true" /> Yeni ilan
              </p>
            </section>

            {owner && (
              <section className="sh-ld-sec sh-ld-host" aria-label="İlan sahibi">
                <HostAvatar name={hostName} src={owner.avatarUrl} size={56} />
                <div className="sh-ld-host-text">
                  <b>İlan sahibi: {hostName}</b>
                  <p>
                    {hostSince(owner.joinedAt)}
                    {owner.badge ? ` · ${owner.badge}` : ''}
                  </p>
                </div>
                <button type="button" className="sh-ld-outline sh-ld-host-btn" onClick={openMessage}>
                  <MessageCircleMore size={19} strokeWidth={1.8} aria-hidden="true" />
                  Kaptana mesaj gönder
                </button>
              </section>
            )}

            <section className="sh-ld-sec">
              <ul className="sh-ld-hl">
                {highlights.map(({ icon: Icon, title, text }) => (
                  <li key={title}>
                    {Icon && <Icon size={30} strokeWidth={1.3} aria-hidden="true" />}
                    <div>
                      <b>{title}</b>
                      <p>{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {desc && (
              <section className="sh-ld-sec" id="hakkinda">
                <h2 className="sh-ld-h2">Tekne hakkında</h2>
                <p className={`sh-ld-text${longDesc && !descOpen ? ' is-clamped' : ''}`}>{desc}</p>
                {longDesc && (
                  <button type="button" className="sh-ld-more" onClick={() => setDescOpen(o => !o)}>
                    {descOpen ? 'Daha az göster' : 'Daha fazla göster'}
                  </button>
                )}
              </section>
            )}

            <section className="sh-ld-sec">
              <div className="sh-ld-promo">
                <Gift size={36} strokeWidth={1.6} className="sh-ld-promo-ico" aria-hidden="true" />
                <div>
                  <h3>
                    Bu ilanda <em>%15’e varan cashback</em> var!
                  </h3>
                  <p>Onaylanan her rezervasyonda tutarın bir kısmı Ahoy bakiyene eklenir; sonraki kiralamanda kullanırsın.</p>
                  <Link href="/cashback" className="sh-ld-outline">
                    Cashback’i keşfet
                  </Link>
                </div>
              </div>
            </section>

            {amenities.length > 0 && (
              <section className="sh-ld-sec" id="imkanlar">
                <h2 className="sh-ld-h2">İmkanlar</h2>
                {/* iki sütun; teknede olmayan önemli imkanlar sonda, üstü çizili */}
                <ul className="sh-ld-list sh-ld-list--2">
                  {amenities.slice(0, AMENITY_PREVIEW).map(({ key, label, icon: Icon, isExtra }) => (
                    <li key={key}>
                      <Icon size={24} strokeWidth={1.5} />
                      <span>
                        {label}
                        {isExtra && <small> · Ücretli</small>}
                      </span>
                    </li>
                  ))}
                  {missing.slice(0, MISSING_PREVIEW).map(({ key, label, icon: Icon }) => (
                    <li key={key} className="is-off">
                      <span className="sh-ico-off">
                        <Icon size={24} strokeWidth={1.5} />
                      </span>
                      <s>
                        <span className="sr-only">Yok: </span>
                        {label}
                      </s>
                    </li>
                  ))}
                </ul>
                {(amenities.length > AMENITY_PREVIEW || missing.length > MISSING_PREVIEW) && (
                  <button type="button" className="sh-ld-outline" onClick={() => setSheet('amenities')}>
                    {amenities.length} imkanın tümünü göster
                  </button>
                )}
              </section>
            )}

            {services.length > 0 && (
              <section className="sh-ld-sec" id="hizmetler">
                <h2 className="sh-ld-h2">Sunulan hizmetler ve ekstralar</h2>
                <RowList rows={services.slice(0, SERVICE_PREVIEW)} />
                {services.length > SERVICE_PREVIEW && (
                  <button type="button" className="sh-ld-outline" onClick={() => setSheet('services')}>
                    {services.length} hizmetin tümünü göster
                  </button>
                )}
              </section>
            )}

            <section className="sh-ld-sec">
              <AhoyGuarantee />
            </section>

            {specRows.length > 0 && (
              <section className="sh-ld-sec" id="ozellikler">
                <h2 className="sh-ld-h2">İlan özellikleri</h2>
                <RowList rows={specRows.slice(0, SPEC_PREVIEW)} />
                {specRows.length > SPEC_PREVIEW && (
                  <button type="button" className="sh-ld-outline" onClick={() => setSheet('specs')}>
                    +{specRows.length - SPEC_PREVIEW} özelliğin tümünü göster
                  </button>
                )}
              </section>
            )}

            <section className="sh-ld-sec" id="musaitlik">
              <h2 className="sh-ld-h2">Müsaitlik</h2>
              <p className="sh-ld-sub">{calStatus}</p>
              <div className="sh-ld-cal">
                <RangeCalendar value={trip.range} blocked={blocked} single={hourly} onChange={range => setTrip(t => ({ ...t, range }))} />
              </div>
              {(minDuration || weeklyDay) && (
                <p className="sh-ld-cal-note">
                  {minDuration && (
                    <>
                      Bu tekne en az <b>{minDuration}</b> kiralanabilir.{' '}
                    </>
                  )}
                  {weeklyDay && (
                    <>
                      Haftalık kiralamalarda teslim günü <b>{weeklyDay}</b>.
                    </>
                  )}
                </p>
              )}
            </section>
          </div>

          <div className="sh-ld-side">
            <BookingPanel
              boat={boat}
              booking={booking}
              sections={sections}
              maxGuests={maxGuests}
              approvalLabel={model.approvalLabel}
              cancellationLabel={model.cancellationLabel}
              minDuration={minDuration}
            />
          </div>
        </div>

        {/* ---------- tam genişlik bölümler ---------- */}
        {loc && (
          <section className="sh-ld-sec sh-ld-wide" id="konum">
            <h2 className="sh-ld-h2">Nereden bineceksin?</h2>
            <p className="sh-ld-loc">{place}</p>
            {loc.summary && <p className="sh-ld-sub">{cleanText(loc.summary)}</p>}
            <div className="sh-ld-map">
              {mapUrl ? (
                // Mapbox statik harita — next/image optimizasyonu gerekmiyor.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mapUrl} alt={`${model.title} konumu`} loading="lazy" />
              ) : (
                <div className="sh-ld-map-fallback">
                  <MapPin size={28} aria-hidden="true" />
                </div>
              )}
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="sh-btn sh-btn--white sh-ld-map-btn">
                  Yol tarifi al <Navigation size={16} fill="currentColor" aria-hidden="true" />
                </a>
              )}
            </div>
          </section>
        )}

        {hasInfo && (
          <div id="bilinmesi-gerekenler">
            {r.schedules.length > 0 && (
              <section className="sh-ld-sec sh-ld-wide">
                <h2 className="sh-ld-h2">Giriş ve çıkış saatleri</h2>
                <div className="sh-ld-cols">
                  {r.schedules.map(s => (
                    <div key={s.title}>
                      <Art3D name={s.title.startsWith('Günlük') ? 'sun' : 'moon'} size={44} className="sh-ld-art" />
                      <b>{s.title}</b>
                      <p>Giriş: {s.checkIn ?? '—'}</p>
                      <p>Çıkış: {s.checkOut ?? '—'}</p>
                    </div>
                  ))}
                  {(boat.checkInNotes || boat.checkOutNotes) && (
                    <div>
                      <Art3D name="memo" size={44} className="sh-ld-art" />
                      <b>Kaptandan not</b>
                      {boat.checkInNotes && <p>{boat.checkInNotes}</p>}
                      {boat.checkOutNotes && <p>{boat.checkOutNotes}</p>}
                    </div>
                  )}
                </div>
              </section>
            )}

            {terms.length > 0 && (
              <section className="sh-ld-sec sh-ld-wide">
                <h2 className="sh-ld-h2">Ücret ve koşullar</h2>
                <div className="sh-ld-cols">
                  {terms.map(t => (
                    <div key={t.title}>
                      {t.art && <Art3D name={t.art} size={44} className="sh-ld-art" />}
                      <b>{t.title}</b>
                      <p>{t.text}</p>
                    </div>
                  ))}
                </div>
                <button type="button" className="sh-ld-ask" onClick={openMessage}>
                  <MessageCircleMore size={22} strokeWidth={1.6} aria-hidden="true" />
                  <span>
                    Ek açıklamaya mı ihtiyacın var? <u>Ayrıntılar için kaptana mesaj gönder.</u>
                  </span>
                </button>
              </section>
            )}

            {(house.length > 0 || model.rules) && (
              <section className="sh-ld-sec sh-ld-wide">
                <h2 className="sh-ld-h2">Tekne kuralları</h2>
                {house.length > 0 && (
                  <ul className="sh-ld-cols sh-ld-cols--ico">
                    {house.map(({ icon: Icon, title, text }) => (
                      <li key={title}>
                        {Icon && <Icon size={28} strokeWidth={1.4} aria-hidden="true" />}
                        <div>
                          <b>{title}</b>
                          <p>{text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {model.rules && (
                  <p className="sh-ld-foot">
                    <b>Kaptanın notu:</b> {model.rules}
                  </p>
                )}
              </section>
            )}
          </div>
        )}

        {similar.length > 0 && (
          <section className="sh-ld-sec sh-ld-wide sh-ld-similar" aria-labelledby="similar-title">
            <div className="sh-ld-similar-head">
              <h2 className="sh-ld-h2" id="similar-title">
                Benzer tekneler
              </h2>
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

      {shareOpen && (
        <ShareModal
          url={window.location.href}
          title={model.title}
          image={model.gallery[0]?.url ?? null}
          subtitle={[type, place].filter(Boolean).join(' · ')}
          onClose={closeShare}
        />
      )}
      {authFor && (
        <AuthModal
          reason={
            authFor === 'message'
              ? `${hostName} kaptana mesaj göndermek için giriş yap ya da ücretsiz hesap oluştur.`
              : 'Favorilerine eklemek için giriş yap ya da ücretsiz hesap oluştur.'
          }
          // Mesaj için giriş yapıldıysa pencere kapanınca mesaj penceresi açılır.
          onSuccess={authFor === 'message' ? () => setMsgOpen(true) : undefined}
          onClose={closeAuth}
        />
      )}
      {msgOpen && (
        <MessageCaptainModal
          boatId={boat.id}
          boatTitle={model.title}
          hostName={hostName}
          hostAvatar={owner?.avatarUrl ?? null}
          onClose={closeMsg}
          onAuthRequired={() => {
            setMsgOpen(false)
            setAuthFor('message')
          }}
        />
      )}
      {toast && (
        <div className="sh-toast" role="status">
          <Heart size={16} strokeWidth={2.2} fill={toast.link ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>{toast.text}</span>
          {toast.link && <Link href="/hesabim#favoriler">Favorilerim</Link>}
        </div>
      )}

      {sheet === 'amenities' && (
        <FeatureSheet title="İmkanlar" onClose={closeSheet}>
          <AmenitySheetContent groups={amenityGroups} missing={missing} />
        </FeatureSheet>
      )}
      {sheet === 'services' && (
        <FeatureSheet title="Sunulan hizmetler ve ekstralar" onClose={closeSheet}>
          <ul className="sh-sheet-list">
            {services.map(({ key, icon: Icon, label, value }) => (
              <li key={key}>
                <Icon size={26} strokeWidth={1.5} />
                <span>{label}</span>
                <b className="sh-sheet-val">{value}</b>
              </li>
            ))}
          </ul>
        </FeatureSheet>
      )}
      {sheet === 'specs' && (
        <FeatureSheet title="İlan özellikleri" onClose={closeSheet}>
          <SpecSheetContent rows={specRows} />
        </FeatureSheet>
      )}
    </div>
  )
}

function RowList({ rows }: { rows: Row[] }) {
  return (
    <ul className="sh-ld-list">
      {rows.map(({ key, icon: Icon, label, value }) => (
        <li key={key}>
          <Icon size={24} strokeWidth={1.5} />
          <span>
            {label}: <b>{value}</b>
          </span>
        </li>
      ))}
    </ul>
  )
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

function AmenitySheetContent({ groups, missing }: { groups: AmenityGroup[]; missing: MissingAmenity[] }) {
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
      {missing.length > 0 && (
        <section className="sh-sheet-group">
          <h3>Mevcut olmayan imkanlar</h3>
          <ul className="sh-sheet-list">
            {missing.map(({ key, label, icon: Icon, safety }) => (
              <li key={key} className="is-off">
                <span className="sh-ico-off">
                  <Icon size={26} strokeWidth={1.5} />
                </span>
                <span>
                  <s>{label}</s>
                  {safety && <small>Kaptan bu ekipmanı belirtmedi. Sorun varsa kaptana mesaj gönderebilirsin.</small>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function SpecSheetContent({ rows }: { rows: Row[] }) {
  const known = new Set([...GENERAL_SPEC_KEYS, ...SPEC_GROUPS.flatMap(g => g.keys)])
  const groups = SPEC_GROUPS.map((g, i) => ({
    title: g.title,
    items: (i === 0 ? [...GENERAL_SPEC_KEYS, ...g.keys] : g.keys).flatMap(k => rows.filter(row => row.key === k)),
  })).filter(g => g.items.length > 0)
  const other = rows.filter(row => !known.has(row.key))
  if (other.length > 0) groups.push({ title: 'Diğer', items: other })

  return (
    <>
      {groups.map(g => (
        <section key={g.title} className="sh-sheet-group">
          <h3>{g.title}</h3>
          <ul className="sh-sheet-list">
            {g.items.map(({ key, label, value, icon: Icon }) => (
              <li key={key}>
                <Icon size={26} strokeWidth={1.5} />
                <span>{label}</span>
                <b className="sh-sheet-val">{value}</b>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}

/** Katılım tarihinden "4 aydır ilan sahibi" / "2 yıldır ilan sahibi". */
function hostSince(joinedAt: string): string {
  const joined = new Date(joinedAt)
  const now = new Date()
  const months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth()) - (now.getDate() < joined.getDate() ? 1 : 0)
  if (!Number.isFinite(months) || months < 1) return 'Ahoy’a yeni katıldı'
  if (months < 12) return `${months} aydır ilan sahibi`
  return `${Math.floor(months / 12)} yıldır ilan sahibi`
}

/** ["a","b","c"] → "a, b ve c" */
function joinTr(list: string[]): string {
  if (list.length <= 1) return list.join('')
  return `${list.slice(0, -1).join(', ')} ve ${list[list.length - 1]}`
}
