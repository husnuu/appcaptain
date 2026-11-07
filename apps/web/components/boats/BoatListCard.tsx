'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, Gift, Heart, ShipWheel, Star, Zap } from 'lucide-react'
import type { PublicBoatSummary } from '@/lib/api'
import AuthModal from '@/components/auth/AuthModal'
import { boatTypeLabel, cleanText, formatMoney, lowestPrice, priceUnit } from '@/lib/boatFormat'
import { setPendingFavorite, useFavorites } from '@/lib/favorites'

/** Kart galerisinde gösterilecek en fazla fotoğraf (nokta sayısı da bu kadar). */
const MAX_PHOTOS = 5

/**
 * Tekne kartı — kaydırmalı fotoğraf galerisi (noktalar + masaüstünde oklar),
 * rozetler, favori kalbi, marka · yıl · şehir satırı, özellik etiketleri,
 * kapasite satırı ve fiyat alanı.
 */
export default function BoatListCard({ boat }: { boat: PublicBoatSummary }) {
  const href = `/listing/${boat.id}`
  const title = cleanText(boat.title ?? 'İsimsiz tekne')
  const price = lowestPrice(boat.pricing)
  const type = boatTypeLabel(boat.boatType)
  const photos = (boat.photoUrls?.length ? boat.photoUrls : boat.coverPhotoUrl ? [boat.coverPhotoUrl] : []).slice(0, MAX_PHOTOS)

  const meta = [boat.brand ? cleanText(boat.brand) : type, boat.productionYear, boat.city ? cleanText(boat.city) : null]
    .filter(Boolean)
    .join(' • ')
  const specs = [
    boat.berths ? `Konaklama ${boat.berths} kişi` : null,
    boat.cabinCount ? `${boat.cabinCount} kabin` : null,
    boat.capacity ? `Seyir ${boat.capacity} kişi` : null,
    boat.length ? `${boat.length} m` : null,
  ].filter(Boolean) as string[]
  const chips = [
    boat.crewCount ? { key: 'crew', icon: <ShipWheel size={16} strokeWidth={1.7} aria-hidden="true" />, text: 'Mürettebatlı' } : null,
    boat.cancellationPolicy === 'flexible'
      ? { key: 'cancel', icon: <Check size={16} strokeWidth={2.2} className="sh-bc-ok" aria-hidden="true" />, text: 'Esnek iptal' }
      : null,
  ].filter(Boolean) as { key: string; icon: ReactNode; text: string }[]

  /* ---------- galeri ---------- */
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const onScroll = useCallback(() => {
    const el = trackRef.current
    if (el) setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
  }, [])
  const go = (dir: number) => {
    const el = trackRef.current
    if (!el) return
    const next = Math.min(photos.length - 1, Math.max(0, index + dir))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }

  /* ---------- favori + giriş ---------- */
  const fav = useFavorites()
  const saved = fav.isFavorite(boat.id)
  const [auth, setAuth] = useState(false)
  const closeAuth = useCallback(() => setAuth(false), [])
  const toggleFav = () => {
    if (!fav.ready) return
    if (!fav.user) {
      setPendingFavorite(boat.id)
      setAuth(true)
      return
    }
    void fav.toggle(boat.id).catch(() => {})
  }

  return (
    <article className="sh-bc">
      <div className="sh-bc-media">
        {photos.length > 0 ? (
          <div className="sh-bc-track" ref={trackRef} onScroll={onScroll}>
            {photos.map((src, i) => (
              <Link key={src} href={href} className="sh-bc-slide" tabIndex={i === 0 ? 0 : -1} aria-label={i === 0 ? title : undefined} aria-hidden={i === 0 ? undefined : true}>
                <Image src={src} alt={i === 0 ? title : ''} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 420px" />
              </Link>
            ))}
          </div>
        ) : (
          <Link href={href} className="sh-bc-noimg" aria-label={title} />
        )}

        <div className="sh-bc-badges">
          {type && <span className="sh-bc-badge sh-bc-badge--type">{type.toLocaleUpperCase('tr')}</span>}
          {boat.instantBooking && (
            <span className="sh-bc-badge">
              <Zap size={13} strokeWidth={2.4} aria-hidden="true" /> ANINDA REZERVASYON
            </span>
          )}
        </div>

        <button
          type="button"
          className={`sh-bc-heart${saved ? ' is-saved' : ''}`}
          onClick={toggleFav}
          aria-pressed={saved}
          aria-label={saved ? 'Favorilerimden çıkar' : 'Favorilerime ekle'}
        >
          <Heart size={26} strokeWidth={2} fill={saved ? 'currentColor' : 'rgba(0,0,0,0.25)'} aria-hidden="true" />
        </button>

        {photos.length > 1 && (
          <>
            <button type="button" className="sh-bc-nav sh-bc-prev" onClick={() => go(-1)} disabled={index === 0} aria-label="Önceki fotoğraf">
              <ChevronLeft size={18} strokeWidth={2.4} />
            </button>
            <button type="button" className="sh-bc-nav sh-bc-next" onClick={() => go(1)} disabled={index >= photos.length - 1} aria-label="Sonraki fotoğraf">
              <ChevronRight size={18} strokeWidth={2.4} />
            </button>
            <div className="sh-bc-dots" aria-hidden="true">
              {photos.map((src, i) => (
                <span key={src} className={i === index ? 'is-active' : undefined} />
              ))}
            </div>
          </>
        )}
      </div>

      <Link href={href} className="sh-bc-body">
        <div className="sh-bc-row">
          <p className="sh-bc-meta">{meta || title}</p>
          <span className="sh-bc-rate">
            <Star size={16} strokeWidth={0} fill="currentColor" aria-hidden="true" />
            {boat.rating ? boat.rating.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : 'Yeni'}
          </span>
        </div>
        {chips.length > 0 && (
          <ul className="sh-bc-chips">
            {chips.map(c => (
              <li key={c.key}>
                {c.icon}
                {c.text}
              </li>
            ))}
          </ul>
        )}
        {specs.length > 0 && (
          <p className="sh-bc-specs">
            {specs.map((s, i) => (
              <span key={s}>
                {s}
                {i < specs.length - 1 && <i aria-hidden="true">•</i>}
              </span>
            ))}
          </p>
        )}
      </Link>

      <div className="sh-bc-foot">
        <Link href={href} className="sh-bc-price">
          {price ? (
            <>
              En düşük <b>{formatMoney(price.price, price.currency)}</b> / {priceUnit(price.listingModelKey)}
            </>
          ) : (
            'Fiyat için iletişime geçin'
          )}
        </Link>
        {fav.user ? (
          <p className="sh-bc-perk">
            <Gift size={17} strokeWidth={1.8} aria-hidden="true" /> %15’e varan cashback
          </p>
        ) : (
          <button type="button" className="sh-bc-cta" onClick={() => setAuth(true)}>
            <Gift size={17} strokeWidth={1.8} aria-hidden="true" />
            <span>
              Cashback için <u>giriş yap</u>
            </span>
          </button>
        )}
      </div>

      {auth && <AuthModal reason="Favorilerini kaydetmek ve %15’e varan cashback kazanmak için giriş yap." onClose={closeAuth} />}
    </article>
  )
}
