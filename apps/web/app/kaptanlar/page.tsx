import type { Metadata } from 'next'
import Link from 'next/link'

import CaptainsClient from './CaptainsClient'
import { CAPTAINS } from './data'

export const metadata: Metadata = {
  title: 'Onaylı Kaptanlar — SeaHub',
  description:
    'Lisanslı ve doğrulanmış kaptanları keşfedin. Tekneleri, misafir yorumları ve puanlarıyla karşılaştırın.',
}

export default function CaptainsPage() {
  return (
    <section className="captains-page" aria-labelledby="captains-heading">
      <div className="captains-hero">
        <div className="captains-shell captains-hero-inner">
          <p className="captains-eyebrow">SeaHub Güven Programı</p>
          <h1 id="captains-heading" className="browse-title captains-hero-title">
            Onaylı Kaptanlar
          </h1>
          <p className="browse-subtitle captains-hero-sub">
            Lisanslı kaptanlar, yönettikleri tekneler ve gerçek misafir yorumları tek yerde. Profilinizi
            inceleyin, puanları karşılaştırın, güvenle rezervasyon yapın.
          </p>
          <div className="captains-hero-actions">
            <Link href="/tekne-kiralama" className="captains-btn captains-btn--primary">
              Kaptanlı tekne ara
            </Link>
            <Link href="/#eco-heading" className="captains-btn captains-btn--outline">
              Neden SeaHub?
            </Link>
          </div>
        </div>
      </div>

      <div className="captains-shell captains-main">
        <CaptainsClient captains={CAPTAINS} />
      </div>
    </section>
  )
}
