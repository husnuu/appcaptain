'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { MapPromoFeature, MapSectionContent } from '@/types/content'

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 480,
        borderRadius: 20,
        background: '#f0f4f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center', color: '#6a6a6a' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Harita yükleniyor…</div>
      </div>
    </div>
  ),
})

interface MapSectionProps {
  content: MapSectionContent
  /** Harita işaretçilerinin üzerinde gösterilecek logo (Sanity / header ile aynı kaynak) */
  logoUrl?: string | null
}

export default function MapSection({ content, logoUrl = null }: MapSectionProps) {
  const [activeTab, setActiveTab] = useState<'rental' | 'experience'>('rental')
  const [activeLocation, setActiveLocation] = useState<string | null>(null)

  const subtitle =
    activeTab === 'rental' ? content.rentalSubtitle : content.experienceSubtitle

  const features = useMemo<MapPromoFeature[]>(() => {
    const list =
      activeTab === 'rental' ? content.rentalFeatures : content.experienceFeatures
    return list.slice(0, 2)
  }, [activeTab, content.rentalFeatures, content.experienceFeatures])

  return (
    <section className="map-section" aria-labelledby="map-heading">
      <div className="map-section-inner">
        <header className="map-section-header">
          <div>
            <h2 id="map-heading" className="browse-title">
              {content.title}
            </h2>
            <p className="browse-subtitle" style={{ marginBottom: 0 }}>
              {activeLocation
                ? `${activeLocation} seçildi — detayları görüntüleyin`
                : subtitle}
            </p>
          </div>

          <button
            type="button"
            className="browse-switch"
            onClick={() => {
              setActiveTab(t => (t === 'rental' ? 'experience' : 'rental'))
              setActiveLocation(null)
            }}
            aria-label={`Şu an: ${activeTab === 'rental' ? 'Kiralama' : 'Deneyim'} — değiştirmek için tıkla`}
          >
            <span className={`browse-switch-opt${activeTab === 'rental' ? ' on' : ''}`}>
              Kiralama
            </span>
            <span className="browse-switch-sep" aria-hidden="true" />
            <span className={`browse-switch-opt${activeTab === 'experience' ? ' on' : ''}`}>
              Deneyim
            </span>
          </button>
        </header>

        <div className="map-body">
          <div className="map-container">
            <LeafletMap mode={activeTab} onLocationClick={setActiveLocation} logoUrl={logoUrl} />
          </div>

          <div className="map-features map-features--horizontal">
            {features.map((feature, index) => (
              <article
                key={feature.id}
                className={`map-feature-row${index % 2 === 1 ? ' map-feature-row--reverse' : ''}`}
              >
                <div className="map-feature-photo">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 38vw, 340px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="map-feature-copy">
                  <h3 className="map-feature-title">{feature.title}</h3>
                  <p className="map-feature-desc">{feature.description}</p>
                  {feature.href ? (
                    <Link href={feature.href} className="map-feature-cta">
                      {feature.linkLabel} →
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
