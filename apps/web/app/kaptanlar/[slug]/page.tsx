import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Award, ArrowLeft, MapPin, ShieldCheck, Ship } from 'lucide-react'

import StarRating from '@/components/captains/StarRating'
import { getAllCaptainSlugs, getCaptainBySlug } from '../data'

type Props = { params: Promise<{ slug: string }> }

function formatPrice(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

export async function generateStaticParams() {
  return getAllCaptainSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const captain = getCaptainBySlug(slug)
  if (!captain) return { title: 'Kaptan bulunamadı — SeaHub' }
  return {
    title: `${captain.name} — Kaptan Profili | SeaHub`,
    description: `${captain.basePort} çıkışlı · ${captain.rating} puan · ${captain.reviewCount} yorum. Tekneleri ve misafir değerlendirmelerini inceleyin.`,
  }
}

export default async function CaptainDetailPage({ params }: Props) {
  const { slug } = await params
  const captain = getCaptainBySlug(slug)
  if (!captain) notFound()

  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = captain.reviews.filter(r => Math.round(r.rating) === stars).length
    const pct = captain.reviews.length ? (count / captain.reviews.length) * 100 : 0
    return { stars, count, pct }
  })

  return (
    <section className="captains-page captains-detail-page">
      <div
        className="captain-detail-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(10, 42, 74, 0.55), rgba(10, 42, 74, 0.75)), url(${captain.coverImage})`,
        }}
      >
        <div className="captains-shell">
          <Link href="/kaptanlar" className="captain-detail-back">
            <ArrowLeft size={16} strokeWidth={2.25} aria-hidden />
            Tüm kaptanlar
          </Link>

          <div className="captain-detail-hero-grid">
            <div className="captain-detail-avatar-wrap">
              <Image
                src={captain.avatar}
                alt=""
                width={120}
                height={120}
                className="captain-detail-avatar"
                priority
              />
              {captain.verified ? (
                <span className="captain-card-verified captain-card-verified--lg" title="Doğrulanmış">
                  <ShieldCheck size={16} strokeWidth={2.5} aria-hidden />
                </span>
              ) : null}
            </div>

            <div className="captain-detail-hero-copy">
              <h1 className="captain-detail-name">{captain.name}</h1>
              <p className="captain-detail-title">{captain.title}</p>
              <p className="captain-detail-meta">
                <MapPin size={15} strokeWidth={2} aria-hidden />
                {captain.basePort} · {captain.region}
              </p>
              <div className="captain-detail-rating-block">
                <StarRating value={captain.rating} size={18} showValue />
                <span>{captain.reviewCount} misafir yorumu</span>
              </div>
              <div className="captain-card-badges captain-card-badges--hero">
                {captain.superCaptain ? (
                  <span className="captain-badge captain-badge--super">
                    <Award size={13} strokeWidth={2.2} aria-hidden />
                    Süper Kaptan
                  </span>
                ) : null}
                <span className="captain-badge captain-badge--light">{captain.yearsExperience} yıl</span>
                <span className="captain-badge captain-badge--light">{captain.tripCount}+ sefer</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="captains-shell captain-detail-body">
        <div className="captain-detail-layout">
          <div className="captain-detail-main">
            <section className="captain-detail-box" aria-labelledby="captain-about">
              <h2 id="captain-about" className="captain-detail-box-title">
                Hakkında
              </h2>
              <p className="captain-detail-text">{captain.bio}</p>
              <p className="captain-detail-license">
                <ShieldCheck size={16} strokeWidth={2} aria-hidden />
                {captain.license}
              </p>
              <div className="captain-specialties">
                {captain.specialties.map(s => (
                  <span key={s} className="captain-specialty-chip">
                    {s}
                  </span>
                ))}
              </div>
              <p className="captain-detail-lang">
                <strong>Diller:</strong> {captain.languages.join(', ')}
              </p>
            </section>

            <section className="captain-detail-box" aria-labelledby="captain-boats">
              <h2 id="captain-boats" className="captain-detail-box-title">
                <Ship size={20} strokeWidth={2} aria-hidden />
                Tekneleri
              </h2>
              <div className="captain-boats-grid">
                {captain.boats.map(boat => (
                  <Link key={boat.id} href="/tekne-kiralama" className="captain-boat-card">
                    <div className="captain-boat-card-img">
                      <Image
                        src={boat.image}
                        alt=""
                        fill
                        sizes="(max-width: 720px) 100vw, 320px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                    <div className="captain-boat-card-body">
                      <h3 className="captain-boat-card-name">{boat.name}</h3>
                      <p className="captain-boat-card-meta">
                        {boat.type} · {boat.lengthM} m · {boat.guests} kişi · {boat.location}
                      </p>
                      <div className="captain-boat-card-foot">
                        <StarRating value={boat.rating} size={14} showValue />
                        <span className="captain-boat-card-price">{formatPrice(boat.pricePerNight)}/gece</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="captain-detail-aside" aria-labelledby="captain-reviews-heading">
            <section className="captain-detail-box captain-reviews-panel">
              <h2 id="captain-reviews-heading" className="captain-detail-box-title">
                Misafir yorumları
              </h2>

              <div className="captain-reviews-summary">
                <div className="captain-reviews-score">
                  <span className="captain-reviews-score-num">{captain.rating.toFixed(2)}</span>
                  <StarRating value={captain.rating} size={16} />
                  <span className="captain-reviews-score-count">{captain.reviewCount} değerlendirme</span>
                </div>
                <ul className="captain-reviews-bars" aria-hidden>
                  {ratingBreakdown.map(row => (
                    <li key={row.stars}>
                      <span>{row.stars}</span>
                      <div className="captain-reviews-bar-track">
                        <div className="captain-reviews-bar-fill" style={{ width: `${row.pct}%` }} />
                      </div>
                      <span className="captain-reviews-bar-count">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="captain-reviews-list">
                {captain.reviews.map(review => (
                  <li key={review.id} className="captain-review-item">
                    <div className="captain-review-head">
                      <Image
                        src={review.authorAvatar}
                        alt=""
                        width={44}
                        height={44}
                        className="captain-review-avatar"
                      />
                      <div>
                        <p className="captain-review-author">{review.authorName}</p>
                        <p className="captain-review-trip">{review.tripLabel}</p>
                      </div>
                      <span className="captain-review-date">{review.date}</span>
                    </div>
                    <StarRating value={review.rating} size={14} />
                    <p className="captain-review-text">{review.text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <Link href="/tekne-kiralama" className="captains-btn captains-btn--primary captains-btn--block">
              Bu kaptanla tekne ara
            </Link>
          </aside>
        </div>
      </div>
    </section>
  )
}
