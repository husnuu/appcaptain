import Image from 'next/image'
import type { EcosystemFeature } from '@/types/content'

export interface EcosystemSectionProps {
  title: string
  subtitle: string
  features: EcosystemFeature[]
  /** Üst etiket (eyebrow). Boş bırakırsa gizlenir. */
  eyebrow?: string
}

export default function EcosystemSection({
  title,
  subtitle,
  features,
  eyebrow = 'Ekosistem',
}: EcosystemSectionProps) {
  return (
    <section className="ecosystem-section" aria-labelledby="eco-heading">
      <div className="section-inner">
        <header className="ecosystem-head">
          {eyebrow ? <span className="ecosystem-eyebrow">{eyebrow}</span> : null}
          <h2 id="eco-heading" className="ecosystem-title">
            {title}
          </h2>
          <p className="ecosystem-subtitle">{subtitle}</p>
        </header>

        <div className="ecosystem-grid">
          {features.map(f => (
            <article key={f.id} className="eco-card">
              {f.image ? (
                <div className="eco-photo-wrap" aria-hidden="true">
                  <Image
                    src={f.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: 'contain', objectPosition: 'center' }}
                  />
                </div>
              ) : (
                <div className={`eco-icon-wrap ${f.colorClass}`} aria-hidden="true">
                  {f.icon}
                </div>
              )}
              <h3 className="eco-title">{f.title}</h3>
              <p className="eco-desc">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
