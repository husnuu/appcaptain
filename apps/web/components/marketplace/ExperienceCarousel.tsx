'use client'

import { useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import ExperienceCard, { type Experience } from './ExperienceCard'

interface Props {
  title: string
  subtitle?: string
  items: Experience[]
  onSeeAll?: () => void
  seeAllLabel?: string
}

export default function ExperienceCarousel({
  title,
  subtitle,
  items,
  onSeeAll,
  seeAllLabel = 'Tümünü gör',
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollNext = () => {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: Math.min(el.clientWidth * 0.85, 920), behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section className="gyg-section" aria-labelledby={`gyg-sec-${title.replace(/\s/g, '-')}`}>
      <div className="gyg-section-head">
        <div>
          <h2 id={`gyg-sec-${title.replace(/\s/g, '-')}`} className="gyg-section-title">
            {title}
          </h2>
          {subtitle ? <p className="gyg-section-sub">{subtitle}</p> : null}
        </div>
        {onSeeAll ? (
          <button type="button" className="gyg-see-all" onClick={onSeeAll}>
            {seeAllLabel}
            <ChevronRight size={18} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="gyg-carousel-wrap">
        <div className="gyg-carousel-track" ref={trackRef}>
          {items.map(exp => (
            <div key={exp.id} className="gyg-carousel-item">
              <ExperienceCard exp={exp} />
            </div>
          ))}
        </div>
        {items.length > 4 ? (
          <button
            type="button"
            className="gyg-carousel-next"
            onClick={scrollNext}
            aria-label="Sonraki deneyimler"
          >
            <ChevronRight size={22} strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  )
}
