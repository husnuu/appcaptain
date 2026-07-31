import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FIRMS, getFirmBySlug } from '../data'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return FIRMS.map(firm => ({ slug: firm.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const firm = getFirmBySlug(slug)
  if (!firm) {
    return { title: 'Charter Firmasi Bulunamadi — SeaHub' }
  }
  return {
    title: `${firm.name} — Charter Detaylari | SeaHub`,
    description: `${firm.name} icin rota, indirim ve filo detaylarini inceleyin.`,
  }
}

export default async function CharterFirmDetailPage({ params }: Props) {
  const { slug } = await params
  const firm = getFirmBySlug(slug)
  if (!firm) notFound()

  return (
    <section className="charter-detail-page">
      <div className="charter-detail-topbar">
        <div className="charter-page-shell">
          <Link className="charter-detail-back" href="/charter-firmalari">
            Charter firmalarina don
          </Link>
          <h1 className="charter-detail-title">{firm.name}: Feribotlar, Biletler ve Bilgiler</h1>
          <p className="charter-detail-breadcrumb">Charter firmalari &gt; {firm.countryLabel} &gt; {firm.name}</p>
        </div>
      </div>

      <div className="charter-page-shell charter-detail-grid">
        <article className="charter-detail-main">
          <nav className="charter-detail-tabs" aria-label="Firma detay sekmeleri">
            <button type="button" className="charter-detail-tab is-active">Genel bilgiler</button>
            <button type="button" className="charter-detail-tab">Rotalar</button>
            <button type="button" className="charter-detail-tab">Indirimler</button>
            <button type="button" className="charter-detail-tab">Filo</button>
            <button type="button" className="charter-detail-tab">Sartlar</button>
          </nav>

          <section className="charter-detail-box">
            <h2 className="charter-detail-box-title">Genel bilgiler</h2>
            <p className="charter-detail-text">{firm.summary}</p>

            <h3 className="charter-detail-subtitle">Bagaj hakki</h3>
            <p className="charter-detail-text">{firm.luggagePolicy}</p>
          </section>

          <section className="charter-detail-box">
            <h2 className="charter-detail-box-title">Populer rotalar</h2>
            <ul className="charter-route-list">
              {firm.routes.map(route => (
                <li key={`${route.from}-${route.to}`} className="charter-route-item">
                  <span>{route.from} - {route.to}</span>
                  <Link href="/tekne-kiralama" className="charter-route-cta">Tekne bul</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="charter-detail-box">
            <h2 className="charter-detail-box-title">Indirimler</h2>
            <ul className="charter-bullet-list">
              {firm.discounts.map(discount => <li key={discount}>{discount}</li>)}
            </ul>
          </section>

          <section className="charter-detail-box">
            <h2 className="charter-detail-box-title">Filo one cikanlar</h2>
            <ul className="charter-bullet-list">
              {firm.fleetHighlights.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </article>

        <aside className="charter-detail-aside" aria-label="Hizli arama">
          <h2 className="charter-aside-title">Feribot bileti ayirtin</h2>
          <div className="charter-aside-field">Cikis noktasi</div>
          <div className="charter-aside-field">Varis noktasi</div>
          <div className="charter-aside-field">Gidis tarihi</div>
          <div className="charter-aside-field">Donus tarihi</div>
          <button type="button" className="charter-aside-btn">Ara</button>
        </aside>
      </div>
    </section>
  )
}
