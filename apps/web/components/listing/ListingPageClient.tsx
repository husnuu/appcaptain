'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  MapPin,
  MapPinned,
  MessageCircle,
  RefreshCw,
  Sailboat,
  Star,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import type { BoatFeatureValueDTO, SerializedBoatDTO } from '@getyourboat/shared'
import BookingPanel from '@/components/listing/BookingPanel'
import { priceUnitLabel } from '@/lib/pricing'

function getF(features: BoatFeatureValueDTO[], key: string): string | null {
  return features.find(f => f.key === key)?.value ?? null
}

function avatarUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0097A7&color=fff&size=128`
}

export default function ListingPageClient({ boat }: { boat: SerializedBoatDTO }) {
  const f = (key: string) => getF(boat.features, key)

  const [galleryOpen, setGalleryOpen] = useState(false)

  const title = boat.title ?? 'İsimsiz tekne'
  const boatTypeLabel = boat.boatType?.label ?? 'Tekne'
  const city = f('city')
  const country = f('country')
  const location = [city, country].filter(Boolean).join(', ') || 'Ege'
  const marina = f('marina')

  const primaryPricing = boat.pricing[0] ?? null
  const price = primaryPricing?.price ?? 0
  const currency = primaryPricing?.currency ?? 'EUR'
  const priceUnit = priceUnitLabel(primaryPricing?.listingModelKey)

  const year = f('year_of_manufacture') ? Number(f('year_of_manufacture')) : null
  const lengthM = f('length_ft_m')
  const beamM = f('beam_width')
  const draftM = f('draft')
  const berths = f('capacity') ? Number(f('capacity')) : null
  const cabins = f('number_of_cabins_for_customer_without_crew')
    ? Number(f('number_of_cabins_for_customer_without_crew'))
    : null
  const bathrooms = f('total_toilets_just_for_customers')
    ? Number(f('total_toilets_just_for_customers'))
    : null
  const captainName = 'Kaptan'
  const isInstant = boat.approvalType === 'INSTANT'

  const photos = boat.photos
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(p => p.publicUrl)
    .filter((u): u is string => Boolean(u))
  const hasPhotos = photos.length > 0
  const coverPhoto = photos[0]

  const highlights = [
    { title: 'Öne çıkan tekne', description: 'Misafir geri bildirimlerinde sürekli yüksek puan.', icon: Award },
    { title: 'Deneyimli kaptan', description: `${captainName} ile güvenli ve keyifli bir rota.`, icon: UserRound },
    { title: 'Özel koy rotaları', description: 'Kalabalıktan uzak koylarda demir ve yüzme molaları.', icon: MapPin },
    { title: 'Esnek iptal', description: boat.rulesText ?? '7 güne kadar ücretsiz iptal.', icon: BadgeCheck },
  ]

  const technicalSpecs = [
    { label: 'Üretim yılı', value: year ? String(year) : null },
    { label: 'Boy (m)', value: lengthM },
    { label: 'Eni (m)', value: beamM },
    { label: 'Su çekimi (m)', value: draftM },
    { label: 'Motor', value: f('total_engine_power_hp') ? `${f('total_engine_power_hp')} HP` : null },
    { label: 'Yakıt tankı (lt)', value: f('fuel_tank_capacity') },
  ].filter((s): s is { label: string; value: string } => Boolean(s.value))

  const amenities = boat.amenities.filter(a => a.isIncluded).map(a => ({ label: a.label }))

  const cancellationPolicy = boat.rulesText ?? '7 güne kadar ücretsiz iptal'

  const leadParts = [
    year ? `${year}` : null,
    lengthM ? `${lengthM} m LOA` : null,
    beamM ? `En ${beamM} m` : null,
    draftM ? `Su çekimi ${draftM} m` : null,
    berths ? `${berths} yatak` : null,
    cabins ? `${cabins}+1 kabin` : null,
    bathrooms ? `WC/duş ${bathrooms}` : null,
  ].filter(Boolean)

  return (
    <div className="listing-detail">
      <div className="detail-hero">
        <nav className="ld-breadcrumb" aria-label="Sayfa konumu">
          <Link href="/">SeaHub</Link>
          <ChevronRight className="ld-bc-icon" aria-hidden />
          <Link href="/tekne-kiralama">Tekne kiralama</Link>
          <ChevronRight className="ld-bc-icon" aria-hidden />
          <span>{city ?? title}</span>
        </nav>

        <div className="ld-hero-intro">
          <p className="ld-section-label">
            {boatTypeLabel}
            {isInstant ? ' · Anında onay' : ''}
          </p>
          <h1 className="detail-hero-title">{title}</h1>
          <div className="detail-meta-row">
            <span className="ld-rating-pill" aria-label="Yeni ilan">
              <Star aria-hidden fill="currentColor" strokeWidth={0} />
              <span>Yeni</span>
            </span>
            <span className="sep">·</span>
            <span className="ld-badge-verified">
              <BadgeCheck aria-hidden />
              Doğrulanmış ilan
            </span>
            {isInstant ? (
              <>
                <span className="sep">·</span>
                <span className="ld-badge-instant">
                  <Zap size={12} strokeWidth={2.4} aria-hidden />
                  Anında rezervasyon
                </span>
              </>
            ) : null}
            <span className="sep">·</span>
            <Link href="#location">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} strokeWidth={2} aria-hidden />
                {location}
              </span>
            </Link>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          {coverPhoto ? (
            <>
              <div className="photo-grid">
                <div className="photo-main">
                  <Image src={coverPhoto} alt={title} fill sizes="50vw" style={{ objectFit: 'cover' }} priority />
                </div>
                <div className="photo-thumb-grid">
                  {photos.slice(1, 5).map((src, i) => (
                    <div key={src + i} className="photo-thumb">
                      <Image src={src} alt={`${title} ${i + 2}`} fill sizes="25vw" style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
              <button type="button" className="show-all-btn" onClick={() => setGalleryOpen(true)}>
                <LayoutGrid aria-hidden />
                Tüm fotoğraflar ({photos.length})
              </button>
            </>
          ) : (
            <div className="ld-photo-empty">
              <LayoutGrid size={40} strokeWidth={1.4} aria-hidden />
              <p className="ld-photo-empty-title">Fotoğraf yok</p>
              <p className="ld-photo-empty-hint">Bu ilan için henüz fotoğraf yüklenmedi.</p>
            </div>
          )}
        </div>
      </div>

      <div className="detail-nav" id="detail-nav">
        <div className="detail-nav-inner">
          {['Fotoğraflar', 'Donanım', 'Değerlendirmeler', 'Konum', 'Kaptan'].map((label, i) => (
            <a
              key={label}
              href={`#${['photos', 'amenities', 'reviews', 'location', 'captain'][i]}`}
              className={`detail-nav-link${i === 0 ? ' active' : ''}`}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="detail-body" id="photos">
        <div>
          <div className="ld-host-row">
            <div>
              <p className="ld-section-label">Tekne ve rota</p>
              <h2 className="ld-h2">
                {title} — {city ?? location}
              </h2>
              <p className="ld-lead">
                {leadParts.length > 0 ? leadParts.join(' · ') : 'Teknik bilgiler yakında eklenecek'}
              </p>
            </div>
            <div className="ld-avatar">
              <Image src={avatarUrl(captainName)} alt={captainName} fill style={{ objectFit: 'cover' }} sizes="120px" />
            </div>
          </div>

          <div className="ld-divider" />

          <div>
            {highlights.map(h => (
              <div key={h.title} className="ld-highlight">
                <div className="ld-highlight-icon" aria-hidden>
                  <h.icon strokeWidth={1.75} />
                </div>
                <div>
                  <h4>{h.title}</h4>
                  <p>{h.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="ld-divider" />

          <div>
            {(boat.description || 'Bu ilan için henüz açıklama girilmedi.').split('\n\n').map((para, i) => (
              <p key={i} className="ld-prose">
                {para}
              </p>
            ))}
          </div>

          <div className="ld-divider" />

          {technicalSpecs.length > 0 ? (
            <>
              <div id="specs">
                <h3 className="ld-h3">Teknik özellikler</h3>
                <dl className="ld-specs-table">
                  {technicalSpecs.map(s => (
                    <div key={s.label} className="ld-specs-row">
                      <dt>{s.label}</dt>
                      <dd>{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="ld-divider" />
            </>
          ) : null}

          <div id="amenities">
            <h3 className="ld-h3">Donanım</h3>
            {amenities.length > 0 ? (
              <div className="ld-amenities-grid">
                {amenities.map(a => (
                  <div key={a.label} className="ld-amenity-item">
                    <Sailboat strokeWidth={1.75} aria-hidden />
                    {a.label}
                  </div>
                ))}
              </div>
            ) : (
              <p className="ld-lead">Donanım bilgisi henüz girilmedi.</p>
            )}
          </div>

          <div className="ld-divider" />

          <div id="reviews">
            <div className="ld-reviews-head">
              <span className="ld-score-big">
                <Star aria-hidden fill="currentColor" strokeWidth={0} />
                Yeni
              </span>
              <span className="ld-review-meta">Henüz değerlendirme yok</span>
            </div>
          </div>

          <div className="ld-divider" />

          <div id="location">
            <h3 className="ld-h3">Konum</h3>
            <p className="ld-lead" style={{ marginBottom: 16 }}>
              {marina ? `${marina}, ` : ''}
              {location}
            </p>
            <div className="ld-map-card">
              <MapPinned aria-hidden />
              <p className="ld-map-caption">Harita önizlemesi — rezervasyon sonrası tam koordinatlar</p>
            </div>
          </div>

          <div className="ld-divider" />

          <div id="captain">
            <h3 className="ld-h3">Tekne sahibi & kaptan</h3>
            <div className="ld-captain-card">
              <div className="ld-captain-avatar">
                <Image src={avatarUrl(captainName)} alt={captainName} fill style={{ objectFit: 'cover' }} sizes="64px" />
              </div>
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 500, color: 'var(--ld-heading)', margin: '0 0 4px' }}>
                  {captainName}
                </h4>
                <p className="ld-review-text" style={{ marginBottom: 14 }}>
                  İlan sahibi kaptan bilgileri yakında burada görünecek.
                </p>
                <button type="button" className="ld-btn-outline">
                  <MessageCircle size={16} strokeWidth={2} aria-hidden />
                  Kaptana yazın
                </button>
              </div>
            </div>
          </div>

          <div className="ld-divider" />

          <div>
            <h3 className="ld-h3">Bilinmesi gerekenler</h3>
            <div className="ld-rules-grid">
              <div className="ld-rules-col">
                <ClipboardList strokeWidth={1.75} aria-hidden />
                <h4>Tekne kuralları</h4>
                <p>{boat.rulesText ?? 'Kurallar henüz girilmedi.'}</p>
              </div>
              <div className="ld-rules-col">
                <AlertTriangle strokeWidth={1.75} aria-hidden />
                <h4>Güvenlik</h4>
                <p>Can yelekleri ve ilk yardım kiti mevcut</p>
              </div>
              <div className="ld-rules-col">
                <RefreshCw strokeWidth={1.75} aria-hidden />
                <h4>İptal politikası</h4>
                <p>{cancellationPolicy}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-panel-wrap" id="booking-panel">
          <BookingPanel boat={boat} />
        </div>
      </div>

      <div className="mobile-reserve-bar">
        <div>
          <div className="mob-reserve-price">
            {price > 0 ? `${price.toLocaleString('tr-TR')} ${currency}` : 'Fiyat bilgisi yok'}{' '}
            <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ld-body)' }}>/ {priceUnit}</span>
          </div>
          <div className="ld-booking-rating" style={{ marginTop: 4 }}>
            <Star size={13} aria-hidden fill="currentColor" strokeWidth={0} />
            Yeni ilan
          </div>
        </div>
        <a href="#booking-panel" className="mob-reserve-btn">
          Devam
        </a>
      </div>

      {galleryOpen && hasPhotos ? (
        <div className="ld-lightbox" role="dialog" aria-modal="true" aria-label="Fotoğraf galerisi">
          <button type="button" className="ld-lightbox-close" onClick={() => setGalleryOpen(false)} aria-label="Kapat">
            <X size={22} />
          </button>
          <div className="ld-lightbox-grid">
            {photos.map((src, i) => (
              <figure key={src + i} className="ld-lightbox-item">
                <Image src={src} alt={`${title} ${i + 1}`} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
