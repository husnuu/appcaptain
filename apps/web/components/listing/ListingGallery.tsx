'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Grid2x2, X } from 'lucide-react'

interface Photo {
  url: string
  alt: string
}

export default function ListingGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const [slide, setSlide] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const count = photos.length

  const go = useCallback(
    (d: number) => setOpen(i => (i === null ? i : (i + d + count) % count)),
    [count],
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, go])

  // mobil karusel sayaç
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => setSlide(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  if (count === 0) {
    return <div className="sh-gal sh-gal--empty">Bu ilan için henüz fotoğraf eklenmemiş.</div>
  }

  const shown = photos.slice(0, 5)

  return (
    <>
      <div className={`sh-gal sh-gal--n${Math.min(count, 5)}`}>
        {shown.map((p, i) => (
          <button key={p.url + i} type="button" className={`sh-gal-cell${i === 0 ? ' sh-gal-main' : ''}`} onClick={() => setOpen(i)} aria-label={`Fotoğraf ${i + 1}`}>
            <Image src={p.url} alt={p.alt || title} fill priority={i === 0} sizes={i === 0 ? '(max-width: 860px) 100vw, 640px' : '320px'} />
          </button>
        ))}
        {count > 1 && (
          <button type="button" className="sh-btn sh-btn--white sh-gal-all" onClick={() => setOpen(0)}>
            <Grid2x2 size={16} strokeWidth={2} aria-hidden="true" /> Tüm fotoğraflar ({count})
          </button>
        )}
      </div>

      {/* mobil: kaydırmalı */}
      <div className="sh-gal-m">
        <div className="sh-gal-m-track" ref={trackRef}>
          {photos.map((p, i) => (
            <button key={p.url + i} type="button" className="sh-gal-m-slide" onClick={() => setOpen(i)} aria-label={`Fotoğraf ${i + 1}`}>
              <Image src={p.url} alt={p.alt || title} fill priority={i === 0} sizes="100vw" />
            </button>
          ))}
        </div>
        <span className="sh-gal-m-count">
          {slide + 1} / {count}
        </span>
      </div>

      {open !== null && (
        <div className="sh-lightbox" role="dialog" aria-modal="true" aria-label="Fotoğraf galerisi" onClick={() => setOpen(null)}>
          <button type="button" className="sh-lb-close" onClick={() => setOpen(null)} aria-label="Kapat">
            <X size={22} />
          </button>
          <span className="sh-lb-count">
            {open + 1} / {count}
          </span>
          <div className="sh-lb-stage" onClick={e => e.stopPropagation()}>
            <Image src={photos[open]!.url} alt={photos[open]!.alt || title} fill sizes="100vw" style={{ objectFit: 'contain' }} />
          </div>
          {count > 1 && (
            <>
              <button type="button" className="sh-lb-nav sh-lb-prev" onClick={e => { e.stopPropagation(); go(-1) }} aria-label="Önceki">
                <ChevronLeft size={26} />
              </button>
              <button type="button" className="sh-lb-nav sh-lb-next" onClick={e => { e.stopPropagation(); go(1) }} aria-label="Sonraki">
                <ChevronRight size={26} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
