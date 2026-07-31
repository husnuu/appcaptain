'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import type { BoatType, Experience } from '@/types/content'

interface Props {
  boatTypes: BoatType[]
  experiences: Experience[]
}

export default function BrowseSection({ boatTypes, experiences }: Props) {
  const [activeTab, setActiveTab] = useState<'rental' | 'experience'>('rental')
  const scrollRentalRef = useRef<HTMLDivElement>(null)
  const scrollExpRef    = useRef<HTMLDivElement>(null)

  const scrollBy = (ref: React.RefObject<HTMLDivElement>, dir: number) => {
    if (!ref.current) return
    const card = ref.current.querySelector('.browse-card') as HTMLElement
    const cardW = card?.offsetWidth ?? 260
    ref.current.scrollBy({ left: dir * (cardW + 16), behavior: 'smooth' })
  }

  const TabContent = ({
    items, scrollRef, seeAllHref, seeAllLabel,
  }: {
    items: Array<BoatType | Experience>
    scrollRef: React.RefObject<HTMLDivElement>
    seeAllHref: string
    seeAllLabel: string
  }) => {
    const previewImgs = items.slice(0, 3).map(i => i.image)

    return (
      <div className="browse-scroll-wrap">
        <button
          className="scroll-arrow left"
          onClick={() => scrollBy(scrollRef, -1)}
          aria-label="Sola kaydır"
        >‹</button>
        <button
          className="scroll-arrow right"
          onClick={() => scrollBy(scrollRef, 1)}
          aria-label="Sağa kaydır"
        >›</button>

        <div className="browse-scroll" ref={scrollRef}>
          {items.map(item => (
            <Link key={item.id} href={item.href ?? '/listing'} className="browse-card">
              <div className="browse-card-img">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 60vw, 25vw"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="browse-card-name">{item.name}</div>
              {item.description && (
                <div className="browse-card-desc">{item.description}</div>
              )}
              <div className="browse-card-count">
                {item.count} {activeTab === 'rental' ? 'tekne' : 'deneyim'} mevcut
              </div>
            </Link>
          ))}

          {/* "Hepsini gör" kartı */}
          <Link href={seeAllHref} className="browse-card browse-card--seeall">
            <div className="browse-seeall-photos" aria-hidden="true">
              {previewImgs.map((src, i) => (
                <div
                  key={i}
                  className="browse-seeall-photo"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <Image src={src} alt="" fill sizes="80px" style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <span className="browse-seeall-label">{seeAllLabel}</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className="browse-section" aria-labelledby="browse-heading">
      <div className="section-inner">
        <header className="browse-head">
          <h2 id="browse-heading" className="browse-title">Tekne tipine göre kiralama seçenekleri</h2>
          <p className="browse-subtitle">
            Gulet, yelkenli, katamaran, motoryat, sürat teknesi ve şişme bot gibi farklı tekne tiplerini karşılaştırın.
            Tatil stilinize, konfor beklentinize ve seyahat planınıza uygun kiralama seçeneğini keşfedin.
          </p>
        </header>

        {/* Tek toggle butonu */}
        <button
          className="browse-switch"
          onClick={() => setActiveTab(t => t === 'rental' ? 'experience' : 'rental')}
          aria-label={`Şu an: ${activeTab === 'rental' ? 'Kiralama' : 'Deneyim'} — değiştirmek için tıkla`}
        >
          <span className={`browse-switch-opt${activeTab === 'rental' ? ' on' : ''}`}>Kiralama</span>
          <span className="browse-switch-sep" aria-hidden="true" />
          <span className={`browse-switch-opt${activeTab === 'experience' ? ' on' : ''}`}>Deneyim</span>
        </button>

        <div className={`browse-panel${activeTab === 'rental' ? ' active' : ''}`}>
          <TabContent
            items={boatTypes}
            scrollRef={scrollRentalRef}
            seeAllHref="/listing"
            seeAllLabel="Tüm tekne kiralama seçeneklerini incele"
          />
        </div>
        <div className={`browse-panel${activeTab === 'experience' ? ' active' : ''}`}>
          <TabContent
            items={experiences}
            scrollRef={scrollExpRef}
            seeAllHref="/deneyimler"
            seeAllLabel="Tüm deneyimleri incele"
          />
        </div>
      </div>
    </section>
  )
}
