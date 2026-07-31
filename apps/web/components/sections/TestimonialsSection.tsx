'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Testimonial } from '@/types/content'
import { PLACEHOLDER_AVATAR } from '@/lib/constants/images'

export default function TestimonialsSection({ testimonials = [] }: { testimonials?: Testimonial[] }) {
  const len = testimonials.length
  const [active, setActive] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const next = useCallback(() => len > 0 && setActive(i => (i + 1) % len), [len])
  const prev = useCallback(() => len > 0 && setActive(i => (i - 1 + len) % len), [len])

  useEffect(() => {
    setActive(0)
  }, [len])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || len < 2) return
    const changed = e.changedTouches[0]
    if (!changed) return
    const dx = changed.clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -40) next()
    else if (dx > 40) prev()
  }

  if (len === 0) return null

  const pct = (active / len) * 100

  return (
    <section className="testimonials-section" aria-labelledby="testi-heading">
      <div className="section-inner">

        <header className="browse-head">
          <h2 id="testi-heading" className="browse-title">Partnerlerimiz Ne Diyor?</h2>
          <p className="browse-subtitle">
            Tekne sahipleri, charter şirketleri ve sektör liderlerinden gerçek görüşler.
          </p>
        </header>

        <div className="testi-carousel-outer">
          <button
            type="button"
            className="testi-arrow testi-arrow--prev"
            onClick={prev}
            aria-label="Önceki yorum"
          >
            ‹
          </button>

          <div
            className="testi-viewport"
            aria-live="polite"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="testi-track"
              style={{
                width: `${len * 100}%`,
                transform: `translateX(-${pct}%)`,
              }}
            >
              {testimonials.map(t => (
                <article
                  key={t.id}
                  className="testi-slide"
                  style={{ flex: `0 0 ${100 / len}%` }}
                >
                  <div className="testi-avatar-ring">
                    <div className="testi-avatar-inner">
                      <Image
                        src={t.authorAvatar?.trim() || PLACEHOLDER_AVATAR}
                        alt=""
                        width={64}
                        height={64}
                        className="testi-avatar-img"
                        sizes="64px"
                      />
                    </div>
                  </div>
                  <blockquote className="testi-quote">
                    <span className="testi-quote-mark" aria-hidden="true">&ldquo;</span>
                    {t.text}
                    <span className="testi-quote-mark" aria-hidden="true">&rdquo;</span>
                  </blockquote>
                  <p className="testi-person-name">{t.authorName}</p>
                  <p className="testi-firm">{t.authorCompany}</p>
                </article>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="testi-arrow testi-arrow--next"
            onClick={next}
            aria-label="Sonraki yorum"
          >
            ›
          </button>
        </div>

        <div className="testi-dots" role="tablist" aria-label="Yorum seçici">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              className={`testi-dot${i === active ? ' active' : ''}`}
              aria-selected={i === active}
              aria-label={`${i + 1}. yorum`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
