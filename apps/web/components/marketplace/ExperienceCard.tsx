'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Star } from 'lucide-react'
import { useState } from 'react'

export interface Experience {
  id: string
  slug: string
  images: string[]
  badge?: string
  category: string
  title: string
  location: string
  duration: string
  extras?: string[]
  rating: number
  reviewCount: number
  startingPrice: number
  isBestSeller?: boolean
  isNew?: boolean
}

function formatRating(n: number) {
  return n.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function formatPrice(n: number) {
  return `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TRY`
}

function buildDetails(exp: Experience) {
  const parts = [exp.duration, ...(exp.extras ?? [])]
  return parts.join(' • ')
}

export default function ExperienceCard({
  exp,
  variant = 'vertical',
}: {
  exp: Experience
  variant?: 'vertical' | 'featured'
}) {
  const [liked, setLiked] = useState(false)
  const [imgIdx, setImgIdx] = useState(0)

  const showHot = exp.isBestSeller && !exp.badge
  const details = buildDetails(exp)

  if (variant === 'featured') {
    return (
      <article className="ec-wrap ec-wrap--featured">
        <Link href={`/deneyimler/${exp.slug}`} className="ec-featured-link">
          <div className="ec-featured-thumb">
            {exp.images[0] ? (
              <Image src={exp.images[0]} alt="" fill className="ec-img" sizes="120px" />
            ) : (
              <div className="ec-img ec-img--placeholder" aria-hidden />
            )}
          </div>
          <div className="ec-featured-body">
            <h3 className="ec-featured-title">{exp.title}</h3>
            <p className="ec-featured-meta">{exp.duration}</p>
            <div className="ec-featured-foot">
              <span className="ec-rating-inline">
                <span className="ec-rating-num">{formatRating(exp.rating)}</span>
                <Star size={14} fill="currentColor" strokeWidth={0} aria-hidden />
                <span className="ec-review-count">({exp.reviewCount.toLocaleString('tr-TR')})</span>
              </span>
              <span className="ec-featured-price">{formatPrice(exp.startingPrice)}</span>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="ec-wrap ec-wrap--gyg">
      <div className="ec-img-wrap">
        <Link href={`/deneyimler/${exp.slug}`} className="ec-img-link" tabIndex={-1}>
          {exp.images[imgIdx] ? (
            <Image
              src={exp.images[imgIdx]}
              alt={exp.title}
              fill
              className="ec-img"
              sizes="(max-width: 640px) 88vw, (max-width: 1100px) 45vw, 280px"
            />
          ) : (
            <div className="ec-img ec-img--placeholder" aria-hidden />
          )}
        </Link>

        {exp.badge ? <span className="ec-badge ec-badge--certified">{exp.badge}</span> : null}
        {showHot ? <span className="ec-badge ec-badge--hot">Muhtemelen tükenir</span> : null}
        {exp.isNew ? <span className="ec-badge ec-badge--new">Yeni</span> : null}

        <button
          type="button"
          className={`ec-heart ec-heart--gyg${liked ? ' ec-heart--active' : ''}`}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            setLiked(l => !l)
          }}
          aria-label={liked ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        >
          <Heart
            size={18}
            strokeWidth={2}
            fill={liked ? '#0097A7' : 'none'}
            color={liked ? '#0097A7' : '#1a1a1a'}
            aria-hidden
          />
        </button>

        {exp.images.length > 1 ? (
          <div className="ec-dots" aria-hidden="true">
            {exp.images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`ec-dot${i === imgIdx ? ' ec-dot--active' : ''}`}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setImgIdx(i)
                }}
              />
            ))}
          </div>
        ) : null}
      </div>

      <Link href={`/deneyimler/${exp.slug}`} className="ec-info ec-info--gyg">
        <span className="ec-category ec-category--gyg">{exp.category}</span>
        <h3 className="ec-title ec-title--gyg">{exp.title}</h3>
        <p className="ec-meta ec-meta--gyg">{details}</p>

        <div className="ec-bottom ec-bottom--gyg">
          <div className="ec-rating-inline">
            <span className="ec-rating-num">{formatRating(exp.rating)}</span>
            <Star size={15} fill="currentColor" strokeWidth={0} className="ec-star-ico" aria-hidden />
            <span className="ec-review-count">({exp.reviewCount.toLocaleString('tr-TR')})</span>
          </div>
          <div className="ec-price-col">
            <span className="ec-price-label">Başlangıç fiyatı</span>
            <span className="ec-price ec-price--gyg">{formatPrice(exp.startingPrice)}</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
