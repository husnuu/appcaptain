'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  Award,
  Bath,
  BedDouble,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Heart,
  MapPin,
  Ruler,
  Sailboat,
  Ship,
  Star,
  UserRound,
  Users,
  UtensilsCrossed,
  Zap,
} from 'lucide-react'

export interface Boat {
  id: string
  slug: string
  images: string[]
  name: string
  year: number
  location: string
  rating: number
  reviewCount: number
  badges: Array<'indirim' | 'aninda-rezervasyon' | 'guest-favorite'>
  tags: Array<{ icon: string; label: string }>
  specs: { accommodation: number; cabins: number; sailing: number; length: number; wc: number }
  pricePerNight: number
}

function TagIcon({ label }: { label: string }) {
  const l = label.toLowerCase()
  const common = { className: 'bc-tag-lucide', size: 13, strokeWidth: 2, 'aria-hidden': true as const }
  if (l.includes('bareboat')) return <Sailboat {...common} />
  if (l.includes('süper')) return <Award {...common} />
  if (l.includes('yakıt')) return <Fuel {...common} />
  if (l.includes('mürettebat')) return <Users {...common} />
  if (l.includes('pansiyon') || l.includes('kahvaltı')) return <UtensilsCrossed {...common} />
  if (l.includes('motor')) return <Ship {...common} />
  if (l.includes('kaptan')) return <UserRound {...common} />
  return <Sailboat {...common} />
}

export default function BoatCard({ boat }: { boat: Boat }) {
  const [liked, setLiked] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  return (
    <div className="bc-wrap">
      {/* ── Image carousel ── */}
      <div className="bc-img-wrap">
        <Link href={`/listing/${boat.slug}`} className="bc-img-link" tabIndex={-1}>
          {boat.images[imgIdx] ? (
            <Image
              src={boat.images[imgIdx]}
              alt={boat.name}
              fill
              className="bc-img"
              sizes="(max-width: 720px) 100vw, 240px"
            />
          ) : (
            <div className="bc-img bc-img--placeholder" aria-hidden />
          )}
        </Link>

        {/* Badges top-left */}
        <div className="bc-badges">
          {boat.badges.includes('indirim') && (
            <span className="bc-badge bc-badge--discount">İNDİRİM</span>
          )}
          {boat.badges.includes('aninda-rezervasyon') && (
            <span className="bc-badge bc-badge--instant">
              <Zap size={11} strokeWidth={2.5} fill="currentColor" aria-hidden />
              Anında rezervasyon
            </span>
          )}
        </div>

        {/* Heart top-right */}
        <button
          type="button"
          className={`bc-heart${liked ? ' bc-heart--active' : ''}`}
          onClick={() => setLiked(l => !l)}
          aria-label={liked ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart
            className="bc-heart-svg"
            size={18}
            strokeWidth={2}
            fill={liked ? 'currentColor' : 'none'}
            aria-hidden
          />
        </button>

        {/* Carousel nav */}
        {boat.images.length > 1 && (
          <>
            {imgIdx > 0 && (
              <button className="bc-arr bc-arr--prev" onClick={() => setImgIdx(i => i - 1)} aria-label="Önceki fotoğraf">
                <ChevronLeft size={16} strokeWidth={2.25} aria-hidden />
              </button>
            )}
            {imgIdx < boat.images.length - 1 && (
              <button className="bc-arr bc-arr--next" onClick={() => setImgIdx(i => i + 1)} aria-label="Sonraki fotoğraf">
                <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
              </button>
            )}
            {/* Dots */}
            <div className="bc-dots" aria-hidden="true">
              {boat.images.map((_, i) => (
                <button key={i} className={`bc-dot${i === imgIdx ? ' bc-dot--active' : ''}`} onClick={() => setImgIdx(i)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Info ── */}
      <Link href={`/listing/${boat.slug}`} className="bc-info">
        <div className="bc-top-row">
          <div className="bc-title-block">
            <h3 className="bc-title">{boat.name}</h3>
            <p className="bc-meta">
              <span className="bc-year">{boat.year}</span>
              <span className="bc-meta-sep" aria-hidden="true">
                ·
              </span>
              <span className="bc-loc bc-loc-row">
                <MapPin className="bc-meta-ico" size={13} strokeWidth={2} aria-hidden />
                {boat.location}
              </span>
            </p>
          </div>
          <div
            className="bc-score"
            aria-label={`${boat.rating} üzerinden 5, ${boat.reviewCount} değerlendirme`}
          >
            <span className="bc-score-pill">
              <Star className="bc-score-star" size={13} strokeWidth={2} fill="currentColor" aria-hidden />
              <span className="bc-score-val">{boat.rating.toFixed(2)}</span>
            </span>
            <span className="bc-review-count">{boat.reviewCount} yorum</span>
          </div>
        </div>

        {/* Tags */}
        <div className="bc-tags">
          {boat.tags.map((t, i) => (
            <span key={i} className="bc-tag">
              <TagIcon label={t.label} />
              {t.label}
            </span>
          ))}
        </div>

        {/* Specs */}
        <ul className="bc-spec-grid" aria-label="Tekne özellikleri">
          <li className="bc-spec-item" title={`Konaklama: ${boat.specs.accommodation} kişi`}>
            <Users className="bc-spec-ico" size={14} strokeWidth={2} aria-hidden />
            <span className="bc-spec-val">{boat.specs.accommodation}</span>
          </li>
          <li className="bc-spec-item" title={`Kabin: ${boat.specs.cabins}`}>
            <BedDouble className="bc-spec-ico" size={14} strokeWidth={2} aria-hidden />
            <span className="bc-spec-val">{boat.specs.cabins}</span>
          </li>
          <li className="bc-spec-item" title={`Seyir: ${boat.specs.sailing} kişi`}>
            <Sailboat className="bc-spec-ico" size={14} strokeWidth={2} aria-hidden />
            <span className="bc-spec-val">{boat.specs.sailing}</span>
          </li>
          <li className="bc-spec-item" title={`Uzunluk: ${boat.specs.length} m`}>
            <Ruler className="bc-spec-ico" size={14} strokeWidth={2} aria-hidden />
            <span className="bc-spec-val">{boat.specs.length} m</span>
          </li>
          <li className="bc-spec-item" title={`WC: ${boat.specs.wc}`}>
            <Bath className="bc-spec-ico" size={14} strokeWidth={2} aria-hidden />
            <span className="bc-spec-val">{boat.specs.wc}</span>
          </li>
        </ul>

        <div className="bc-divider" aria-hidden="true" />

        <div className="bc-info-bottom">
          <div className="bc-price-row">
            <span className="bc-price-label">Başlangıç</span>
            <span className="bc-price">{boat.pricePerNight.toLocaleString('tr-TR')} ₺</span>
            <span className="bc-price-unit">/ gece</span>
          </div>

          <div className="bc-date-cta">
            <Calendar className="bc-date-ico" size={16} strokeWidth={2} aria-hidden />
            <span>
              Kesin tutarı görmek için <span className="bc-date-link">tarih seçin</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
