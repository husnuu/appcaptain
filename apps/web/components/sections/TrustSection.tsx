import Image from 'next/image'
import { Headphones, Lock, ShieldCheck, UserCheck } from 'lucide-react'
import type { TrustFeature } from '@/types/content'

export interface TrustSectionProps {
  title: string
  subtitle: string
  features: TrustFeature[]
}

const ICON_MAP: Record<string, React.ReactNode> = {
  captains:   <UserCheck   size={52} strokeWidth={1.65} />,
  insurance:  <ShieldCheck size={52} strokeWidth={1.65} />,
  support:    <Headphones  size={52} strokeWidth={1.65} />,
  protection: <Lock        size={52} strokeWidth={1.65} />,
}

const COLOR_MAP: Record<string, string> = {
  orange: '#f97316',
  blue:   '#00aeef',
  green:  '#22c55e',
  purple: '#a855f7',
}

export default function TrustSection({ title, subtitle, features }: TrustSectionProps) {
  return (
    <section className="trust-section" aria-labelledby="trust-heading">
      <div className="section-inner">

        <header className="browse-head">
          <h2 id="trust-heading" className="browse-title">{title}</h2>
          <p className="browse-subtitle">{subtitle}</p>
        </header>

        <div className="trust-grid">
          {features.map(f => {
            const color = COLOR_MAP[f.colorClass] ?? '#6a6a6a'
            return (
              <div key={f.id} className="trust-item">
                {/* Sanity'den SVG/görsel yüklendiyse göster, yoksa Lucide ikon */}
                {f.image ? (
                  <div className="trust-item-img" aria-hidden="true">
                    <Image
                      src={f.image}
                      alt=""
                      width={168}
                      height={168}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <span className="trust-item-icon" style={{ color }} aria-hidden="true">
                    {ICON_MAP[f.id] ?? <ShieldCheck size={52} strokeWidth={1.65} />}
                  </span>
                )}
                <h4 className="trust-item-title">{f.title}</h4>
                <p className="trust-item-desc">{f.description}</p>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
