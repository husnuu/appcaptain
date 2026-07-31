'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Award, MapPin, Search, ShieldCheck, Ship } from 'lucide-react'

import StarRating from '@/components/captains/StarRating'
import { CAPTAIN_REGIONS, type Captain } from './data'

function formatPrice(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n)
}

export default function CaptainsClient({ captains }: { captains: Captain[] }) {
  const [query, setQuery] = useState('')
  const [region, setRegion] = useState<string>('Tümü')
  const [sort, setSort] = useState<'rating' | 'reviews' | 'experience'>('rating')

  const filtered = useMemo(() => {
    let list = [...captains]
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.basePort.toLowerCase().includes(q) ||
          c.specialties.some(s => s.toLowerCase().includes(q)),
      )
    }
    if (region !== 'Tümü') {
      list = list.filter(c => c.region === region)
    }
    switch (sort) {
      case 'reviews':
        list.sort((a, b) => b.reviewCount - a.reviewCount)
        break
      case 'experience':
        list.sort((a, b) => b.yearsExperience - a.yearsExperience)
        break
      default:
        list.sort((a, b) => b.rating - a.rating)
    }
    return list
  }, [captains, query, region, sort])

  return (
    <>
      <div className="captains-toolbar">
        <div className="captains-search" role="search">
          <Search size={18} strokeWidth={2} aria-hidden className="captains-search-icon" />
          <input
            type="search"
            className="captains-search-input"
            placeholder="Kaptan, liman veya uzmanlık ara…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Kaptan ara"
          />
        </div>

        <div className="captains-filters">
          <div className="captains-filter-chips" role="tablist" aria-label="Bölge">
            {CAPTAIN_REGIONS.map(r => (
              <button
                key={r}
                type="button"
                role="tab"
                className={`captains-chip${region === r ? ' captains-chip--on' : ''}`}
                aria-selected={region === r}
                onClick={() => setRegion(r)}
              >
                {r}
              </button>
            ))}
          </div>

          <label className="captains-sort">
            <span className="captains-sort-label">Sırala</span>
            <select
              className="captains-sort-select"
              value={sort}
              onChange={e => setSort(e.target.value as typeof sort)}
              aria-label="Sıralama"
            >
              <option value="rating">En yüksek puan</option>
              <option value="reviews">En çok yorum</option>
              <option value="experience">En deneyimli</option>
            </select>
          </label>
        </div>
      </div>

      <p className="captains-result-count">
        {filtered.length} kaptan listeleniyor
      </p>

      <div className="captains-grid">
        {filtered.map(captain => (
          <article key={captain.id} className="captain-card">
            <div className="captain-card-top">
              <div className="captain-card-avatar-wrap">
                <Image
                  src={captain.avatar}
                  alt=""
                  width={88}
                  height={88}
                  className="captain-card-avatar"
                />
                {captain.verified ? (
                  <span className="captain-card-verified" title="Doğrulanmış kaptan">
                    <ShieldCheck size={14} strokeWidth={2.5} aria-hidden />
                  </span>
                ) : null}
              </div>

              <div className="captain-card-head">
                <h2 className="captain-card-name">{captain.name}</h2>
                <p className="captain-card-title">{captain.title}</p>
                <p className="captain-card-meta">
                  <MapPin size={14} strokeWidth={2} aria-hidden />
                  {captain.basePort} · {captain.region}
                </p>
                <div className="captain-card-rating-row">
                  <StarRating value={captain.rating} size={15} showValue />
                  <span className="captain-card-review-count">({captain.reviewCount} yorum)</span>
                </div>
              </div>
            </div>

            <div className="captain-card-badges">
              {captain.superCaptain ? (
                <span className="captain-badge captain-badge--super">
                  <Award size={13} strokeWidth={2.2} aria-hidden />
                  Süper Kaptan
                </span>
              ) : null}
              <span className="captain-badge">{captain.yearsExperience} yıl deneyim</span>
              <span className="captain-badge">{captain.tripCount}+ sefer</span>
            </div>

            <p className="captain-card-bio">{captain.bio}</p>

            <div className="captain-card-boats">
              <h3 className="captain-card-section-label">
                <Ship size={15} strokeWidth={2} aria-hidden />
                Tekneleri ({captain.boats.length})
              </h3>
              <ul className="captain-boat-mini-list">
                {captain.boats.slice(0, 2).map(boat => (
                  <li key={boat.id}>
                    <Link href={`/tekne-kiralama`} className="captain-boat-mini">
                      <div className="captain-boat-mini-img">
                        <Image src={boat.image} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="captain-boat-mini-copy">
                        <span className="captain-boat-mini-name">{boat.name}</span>
                        <span className="captain-boat-mini-meta">
                          {boat.type} · {boat.location} · {formatPrice(boat.pricePerNight)}/gece
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {captain.reviews[0] ? (
              <blockquote className="captain-card-review-preview">
                <StarRating value={captain.reviews[0].rating} size={13} />
                <p>&ldquo;{captain.reviews[0].text}&rdquo;</p>
                <footer>— {captain.reviews[0].authorName}</footer>
              </blockquote>
            ) : null}

            <div className="captain-card-actions">
              <Link href={`/kaptanlar/${captain.slug}`} className="captains-btn captains-btn--primary">
                Profili ve yorumları gör
              </Link>
              <Link href="/tekne-kiralama" className="captains-btn captains-btn--outline">
                Tekneleri keşfet
              </Link>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="captains-empty">Aramanıza uygun kaptan bulunamadı. Filtreleri temizleyip tekrar deneyin.</p>
      ) : null}
    </>
  )
}
