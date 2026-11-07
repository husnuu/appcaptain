'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Heart, Sailboat, Ship, ShipWheel, Star, Zap } from 'lucide-react'
import type { PublicBoatSummary } from '@/lib/api'
import { boatTypeLabel, cleanText, formatMoney, listingModelLabel, lowestPrice, priceUnit } from '@/lib/boatFormat'
import { useFavorite } from '@/lib/favorites'

const CANCEL_LABEL: Record<string, string> = {
  flexible: 'Esnek iptal',
  moderate: 'Orta esneklikte iptal',
}

const SAIL_TYPES = new Set(['sailboat', 'catamaran', 'gulet'])

export default function BoatListCard({ boat }: { boat: PublicBoatSummary }) {
  const photos = boat.photoUrls?.length ? boat.photoUrls : boat.coverPhotoUrl ? [boat.coverPhotoUrl] : []
  const [slide, setSlide] = useState(0)
  const trackRef = useRef<HTMLAnchorElement>(null)
  const [saved, toggleSaved] = useFavorite(boat.id)

  const href = `/listing/${boat.id}`
  const price = lowestPrice(boat.pricing)
  const type = boatTypeLabel(boat.boatType)
  const place = cleanText([boat.city, boat.country].filter(Boolean).join(', ') || 'Türkiye')
  const make = cleanText([boat.brand, boat.model].filter(Boolean).join(' '))
  const name = make ? [type, make].filter(Boolean).join(' ') : cleanText(boat.title ?? 'İsimsiz tekne')

  const chips = [
    boat.crewCount != null ? { Icon: ShipWheel, label: boat.crewCount > 0 ? 'Kaptanlı' : 'Kaptansız' } : null,
    type ? { Icon: SAIL_TYPES.has(boat.boatType?.key ?? '') ? Sailboat : Ship, label: type } : null,
  ].filter(Boolean) as { Icon: typeof Ship; label: string }[]

  const specs = [
    boat.capacity ? `${boat.capacity} kişi` : null,
    boat.cabinCount ? `${boat.cabinCount} kabin` : null,
    boat.berths ? `${boat.berths} yatak` : null,
    boat.enginePowerHp ? `${boat.enginePowerHp} hp` : null,
    boat.length ? `${boat.length} m` : null,
  ].filter(Boolean)

  const checks = [boat.cancellationPolicy ? CANCEL_LABEL[boat.cancellationPolicy] : null].filter(Boolean) as string[]

  const go = (dir: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const next = Math.max(0, Math.min(photos.length - 1, slide + dir))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }
  const onScroll = () => {
    const el = trackRef.current
    if (el) setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
  }

  return (
    <article className="sh-bcard">
      <div className="sh-bcard-media">
        <Link
          href={href}
          className="sh-bcard-track"
          ref={trackRef}
          onScroll={onScroll}
          aria-label={cleanText(boat.title ?? name)}
          tabIndex={-1}
        >
          {photos.length > 0 ? (
            photos.map((src, i) => (
              <span key={src} className="sh-bcard-slide">
                <Image
                  src={src}
                  alt={i === 0 ? cleanText(boat.title ?? name) : ''}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1199px) 45vw, 360px"
                />
              </span>
            ))
          ) : (
            <span className="sh-bcard-slide sh-bcard-noimg" aria-hidden="true" />
          )}
        </Link>

        {boat.instantBooking && (
          <span className="sh-bcard-flag">
            <Zap size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />
            Anında rezervasyon
          </span>
        )}

        <button
          type="button"
          className="sh-bcard-fav"
          aria-pressed={saved}
          aria-label={saved ? 'Kaydedilenlerden çıkar' : 'Tekneyi kaydet'}
          onClick={toggleSaved}
        >
          <Heart size={26} strokeWidth={2} aria-hidden="true" />
        </button>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="sh-bcard-nav sh-bcard-nav--prev"
              aria-label="Önceki fotoğraf"
              disabled={slide === 0}
              onClick={() => go(-1)}
            >
              <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="sh-bcard-nav sh-bcard-nav--next"
              aria-label="Sonraki fotoğraf"
              disabled={slide >= photos.length - 1}
              onClick={() => go(1)}
            >
              <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <span className="sh-bcard-dots" aria-hidden="true">
              {photos.map((src, i) => (
                <span key={src} className={i === slide ? 'on' : undefined} />
              ))}
            </span>
          </>
        )}
      </div>

      <Link href={href} className="sh-bcard-link">
        <div className="sh-bcard-body">
          <div className="sh-bcard-row">
            <h3 className="sh-bcard-place">{place}</h3>
            {boat.rating ? (
              <span className="sh-bcard-rating">
                <Star size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                {boat.rating.toFixed(1)}
              </span>
            ) : (
              <span className="sh-bcard-new">Yeni</span>
            )}
          </div>
          <p className="sh-bcard-sub" title={cleanText(boat.title ?? '')}>
            <span>{name}</span>
            {boat.productionYear ? <span>({boat.productionYear})</span> : null}
          </p>

          {chips.length > 0 && (
            <ul className="sh-bcard-chips">
              {chips.map(({ Icon, label }) => (
                <li key={label}>
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          )}

          {specs.length > 0 && <p className="sh-bcard-specs">{specs.join(' · ')}</p>}
        </div>

        <div className="sh-bcard-foot">
          {checks.length > 0 && (
            <ul className="sh-bcard-checks">
              {checks.map(c => (
                <li key={c}>
                  <Check size={15} strokeWidth={2.6} aria-hidden="true" />
                  {c}
                </li>
              ))}
            </ul>
          )}
          {price ? (
            <p className="sh-bcard-price" title={listingModelLabel(price.listingModelKey)}>
              <span>Şu fiyattan itibaren</span>
              <b>{formatMoney(price.price, price.currency)}</b> / {priceUnit(price.listingModelKey)}
            </p>
          ) : (
            <p className="sh-bcard-price">Fiyat için iletişime geçin</p>
          )}
        </div>
      </Link>
    </article>
  )
}
