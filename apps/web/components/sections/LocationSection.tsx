'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import type { Location } from '@/types/content'

interface Props {
  rentalLocations: Location[]
  experienceLocations: Location[]
}

/** Referans düzeni: 5 kart — köşeler + ortada tam yükseklik “portre” kart */
function takeFiveSlots(items: Location[]): Location[] {
  if (items.length === 0) return []
  return Array.from({ length: 5 }, (_, i) => items[i % items.length]!)
}

export default function LocationSection({ rentalLocations, experienceLocations }: Props) {
  const [activeTab, setActiveTab] = useState<'rental' | 'experience'>('rental')
  const [startIdx, setStartIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const items = activeTab === 'rental' ? rentalLocations : experienceLocations

  const displayFive = useMemo(() => {
    if (items.length === 0) return []
    if (items.length >= 5) {
      const rotated = [...items.slice(startIdx), ...items.slice(0, startIdx)]
      return rotated.slice(0, 5)
    }
    return takeFiveSlots(items)
  }, [items, startIdx])

  const n = Math.max(items.length, 1)
  const canRotate = items.length >= 5

  const nextPack = () => {
    if (!canRotate) return
    setStartIdx(i => (i + 1) % n)
  }

  const prevPack = () => {
    if (!canRotate) return
    setStartIdx(i => (i - 1 + n) % n)
  }

  const scrollGrid = (dir: number) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 380), behavior: 'smooth' })
  }

  const allHref = activeTab === 'rental' ? '/listing' : '/deneyimler'
  const primaryCta =
    activeTab === 'rental' ? 'Tüm kiralama lokasyonları' : 'Tüm deneyim lokasyonları'

  return (
    <section className="location-section" aria-labelledby="loc-heading">
      <div className="section-inner">
        <div className="location-hero">
          {/* Sol: blob + CTA (referans “Discover your destination”) */}
          <div className="location-cta">
            <div className="location-cta-blob" aria-hidden="true" />
            <div className="location-cta-inner">
              <p className="location-cta-eyebrow">Popüler lokasyonlar</p>
              <h2 id="loc-heading" className="location-cta-heading">
                <span className="location-cta-heading-accent">Keşfedin</span>
                <span className="location-cta-heading-rest"> bir sonraki rotanızı</span>
              </h2>
              <p className="location-cta-desc">
                Yolculuğunuz burada başlıyor — Türkiye kıyılarında limanları ve deneyim noktalarını
                keşfedin.
              </p>

              <button
                type="button"
                className="browse-switch location-browse-switch"
                onClick={() => {
                  setActiveTab(t => (t === 'rental' ? 'experience' : 'rental'))
                  setStartIdx(0)
                }}
                aria-label={`Şu an: ${activeTab === 'rental' ? 'Kiralama' : 'Deneyim'} — değiştirmek için tıkla`}
              >
                <span className={`browse-switch-opt${activeTab === 'rental' ? ' on' : ''}`}>Kiralama</span>
                <span className="browse-switch-sep" aria-hidden="true" />
                <span className={`browse-switch-opt${activeTab === 'experience' ? ' on' : ''}`}>Deneyim</span>
              </button>

              <Link href={allHref} className="location-cta-btn">
                {primaryCta}
              </Link>
              <Link href={allHref} className="location-cta-link">
                Haritada tümünü gör →
              </Link>
            </div>
          </div>

          {/* Sağ: noktalar + masonry + oklar */}
          <div className="location-masonry-panel">
            <div className="location-dots" aria-hidden="true">
              <span className={`location-dot${activeTab === 'rental' ? ' is-on' : ''}`} />
              <span className={`location-dot${activeTab === 'experience' ? ' is-on' : ''}`} />
            </div>

            <div className="location-masonry-scroll" ref={scrollRef}>
              <div className="loc-masonry-grid">
                {displayFive.map((loc, i) => (
                  <Link
                    key={`${loc.id}-${i}-${activeTab}`}
                    href={loc.href ?? allHref}
                    className={`loc-grid-card${i === 2 ? ' loc-grid-card--tall' : ''}`}
                  >
                    <div className="loc-grid-card-img">
                      <Image
                        src={loc.image}
                        alt={loc.name}
                        fill
                        sizes="(max-width: 900px) 85vw, (max-width: 1200px) 28vw, 360px"
                        className="loc-grid-card-media"
                      />
                      <div className="loc-grid-card-overlay" aria-hidden="true" />
                      <div className="loc-grid-card-caption">
                        <span className="loc-grid-card-name">{loc.name}</span>
                        <span className="loc-grid-card-meta">
                          {loc.count} {loc.countUnit} mevcut
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="location-masonry-toolbar">
              <div className="location-masonry-arrows">
                <button
                  type="button"
                  className="location-masonry-arrow"
                  onClick={() => {
                    prevPack()
                    scrollGrid(-1)
                  }}
                  aria-label="Önceki lokasyonlar"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="location-masonry-arrow"
                  onClick={() => {
                    nextPack()
                    scrollGrid(1)
                  }}
                  aria-label="Sonraki lokasyonlar"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
