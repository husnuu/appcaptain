'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Navigation, Send } from 'lucide-react'
import {
  BLOG_POSTS,
  LOCATIONS,
  PLAN_STEPS,
  POPULAR_RENTAL_LOCATIONS,
  POPULAR_SEARCH_TABS,
  TESTIMONIALS,
} from './content'

/* ---------- yatay ray + oklar ---------- */

function useRail() {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      setEdges({
        start: el.scrollLeft <= 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      })
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.offsetWidth + 32 : el.clientWidth
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }
  return { ref, edges, scroll }
}

function Arrows({
  edges,
  scroll,
  moreHref,
}: {
  edges: { start: boolean; end: boolean }
  scroll: (d: 1 | -1) => void
  moreHref?: string
}) {
  return (
    <div className="sh-arrows">
      <button type="button" className="sh-arrow" disabled={edges.start} onClick={() => scroll(-1)} aria-label="Önceki">
        <ArrowLeft size={edges.start ? 16 : 22} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {edges.end && moreHref ? (
        // Kaydırılacak kart kalmadıysa sağ ok tüm listeye götürür.
        <Link href={moreHref} className="sh-arrow" aria-label="Tümünü gör">
          <ArrowRight size={22} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      ) : (
        <button type="button" className="sh-arrow" disabled={edges.end} onClick={() => scroll(1)} aria-label="Sonraki">
          <ArrowRight size={edges.end ? 16 : 22} strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export function RailSection({
  id,
  title,
  subtitle,
  moreHref,
  children,
}: {
  id?: string
  title: string
  subtitle: string
  moreHref?: string
  children: ReactNode
}) {
  const { ref, edges, scroll } = useRail()
  return (
    <div className="sh-band" id={id}>
      <div className="sh-container">
        <div className="sh-section-head">
          <div>
            <h2 className="sh-h2">{title}</h2>
            <p className="sh-sub">{subtitle}</p>
          </div>
          <Arrows edges={edges} scroll={scroll} moreHref={moreHref} />
        </div>
        <div className="sh-rail" ref={ref}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ---------- popüler lokasyonlar ---------- */

function TurkishFlag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-label="Türkiye" role="img">
      <circle cx="20" cy="20" r="20" fill="#E30A17" />
      <circle cx="16.5" cy="20" r="8.2" fill="#fff" />
      <circle cx="18.6" cy="20" r="6.6" fill="#E30A17" />
      <path fill="#fff" d="m24.2 20 5.95-1.93-3.68 5.06V16.87l3.68 5.06z" />
    </svg>
  )
}

export function PopularLocations() {
  const [mode, setMode] = useState<'rental' | 'experience'>('rental')
  const base = mode === 'rental' ? '/tekne-kiralama' : '/deneyimler'
  return (
    <section className="sh-sect sh-sect--cream sh-locs-wrap" id="lokasyonlar" aria-labelledby="lok-title">
      <div className="sh-container">
        <div className="sh-section-head">
          <div>
            <h2 className="sh-h2" id="lok-title">Popüler Lokasyonlar</h2>
            <p className="sh-sub">Türkiye kıyılarında limanları ve deneyim noktalarını keşfet.</p>
          </div>
          <div className="sh-toggle" role="tablist" aria-label="Lokasyon türü">
            <button type="button" role="tab" aria-selected={mode === 'rental'} onClick={() => setMode('rental')}>
              Tekne kiralama
            </button>
            <button type="button" role="tab" aria-selected={mode === 'experience'} onClick={() => setMode('experience')}>
              Deneyimler
            </button>
          </div>
        </div>

        <div className="sh-loc-grid">
          {LOCATIONS.map(l => (
            <Link
              key={l.slug}
              href={`${base}?city=${encodeURIComponent(l.name)}`}
              className={`sh-loc${l.large ? ' sh-loc--lg' : ''}`}
            >
              <Image src={l.img} alt={`${l.name}, ${l.region}`} fill sizes={l.large ? '(max-width: 860px) 100vw, 624px' : '(max-width: 860px) 100vw, 402px'} />
              <h3 className="sh-loc-name">
                {l.name}
                <span className="sh-loc-region">{l.region}</span>
              </h3>
              <TurkishFlag className="sh-flag" />
              <div className="sh-thumbs">
                {l.thumbs.map(t => (
                  <span key={t}>
                    <Image src={t} alt="" fill sizes="56px" />
                  </span>
                ))}
                <span className="more">+{mode === 'rental' ? l.rentals : l.experiences}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="sh-center">
          <Link href={base} className="sh-btn sh-btn--white">
            Tüm lokasyonları keşfet <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- seyahatini planla ---------- */

export function PlanTrip() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % PLAN_STEPS.length), 6000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="sh-plan-wrap" id="map-section">
      <div className="sh-container">
        <div className="sh-section-head">
          <div>
            <h2 className="sh-h2">Seyahatini planla</h2>
            <p className="sh-sub">Sana yakın olan mevcut tekneleri ya da aktiviteleri keşfet.</p>
          </div>
          <Link href="/#map-section" className="sh-link-arrow">
            Uygulamamız hakkında daha fazla bilgi al <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
          </Link>
        </div>

        <div className="sh-plan-grid">
          <div className="sh-map">
            <Image src="/home/map.webp" alt="Kıyı şeridindeki tekne ve deneyim noktalarını gösteren harita" fill sizes="(max-width: 1199px) 100vw, 842px" />
            <Link href="/tekne-kiralama" className="sh-btn sh-btn--white">
              Seyahatini şimdi planla
              <Navigation size={20} fill="currentColor" style={{ transform: 'rotate(0deg)' }} aria-hidden="true" />
            </Link>
          </div>
          <div className="sh-app">
            <Image src="/home/app-card.webp" alt="Ahoy mobil uygulaması ve indirme QR kodu" fill sizes="402px" />
            <p className="sh-app-text">
              Uygulamamız ile
              <br />
              çok daha fazla
              <br />
              plan yap
            </p>
          </div>
        </div>

        <div className="sh-steps">
          {PLAN_STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              className={`sh-step${i === active ? ' sh-step--active' : ''}`}
              onClick={() => setActive(i)}
            >
              <div className="sh-step-bar" />
              <h3 className="sh-step-title">{s.title}</h3>
              <p className="sh-step-desc">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- partner yorumları ---------- */

export function Testimonials() {
  const { ref, scroll } = useRail()
  const [page, setPage] = useState(0)
  const pages = 4

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth
      setPage(max > 0 ? Math.round((el.scrollLeft / max) * (pages - 1)) : 0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [ref])

  const goTo = (i: number) => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    el.scrollTo({ left: (max * i) / (pages - 1), behavior: 'smooth' })
  }

  // Tasarımda 2 partner kartı var; karusel akışı için aynı kartlar tekrar edilir.
  const cards = [...TESTIMONIALS, ...TESTIMONIALS]
  const tones = ['blue', 'green', 'sand', 'lilac']

  return (
    <section className="sh-sect sh-sect--white sh-testi-wrap" aria-labelledby="testi-title">
      <div className="sh-container">
        <div className="sh-section-head">
          <div>
            <h2 className="sh-h2" id="testi-title">Partnerlerimiz ne diyor?</h2>
            <p className="sh-sub">Tekne sahipleri, charter şirketleri ve sektör liderlerinden gerçek görüşler.</p>
          </div>
          <Link href="/charter-firmalari" className="sh-link-arrow">
            Partnerlerimizin tüm yorumlarını gör <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
          </Link>
        </div>

        <div className="sh-testi-rail" ref={ref}>
          {cards.map((t, i) => (
            <article key={i} className={`sh-testi sh-testi--${tones[i % tones.length]}`}>
              <div className="sh-testi-person">
                <div className="sh-testi-avatar">
                  <Image src={t.avatar} alt={t.name} fill sizes="97px" />
                </div>
                <div>
                  <div className="sh-testi-name">{t.name}</div>
                  <div className="sh-testi-role">
                    {t.role} @ <Link href="/charter-firmalari">{t.company}</Link>
                  </div>
                </div>
              </div>
              <p className="sh-testi-quote">{t.quote}</p>
              <div className="sh-testi-rule" aria-hidden="true" />
              <div className="sh-testi-stat">
                <span className="sh-testi-num">{t.stat}</span>
                <span className="sh-testi-num-desc">{t.statDesc}</span>
                <Link href="/charter-firmalari" className="sh-btn sh-btn--white">
                  Hikayeyi Oku <ArrowRight size={18} strokeWidth={1.6} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="sh-dots">
          <div className="sh-dots-inner">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`sh-dot${i === page ? ' sh-dot--active' : ''}`}
                onClick={() => (i === page ? scroll(1) : goTo(i))}
                aria-label={`${i + 1}. sayfa`}
                aria-current={i === page}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- blog ---------- */

export function BlogRail() {
  const { ref, edges, scroll } = useRail()
  return (
    <section className="sh-blog-wrap" aria-labelledby="blog-title">
      <div className="sh-container">
        <div className="sh-section-head">
          <div>
            <h2 className="sh-h2" id="blog-title">Blogumuzdan popüler yayınlar</h2>
            <p className="sh-sub">Tekne sahipleri, charter şirketleri ve sektör liderlerinden gerçek görüşler.</p>
          </div>
          <Arrows edges={edges} scroll={scroll} moreHref="/blog" />
        </div>
        <div className="sh-blog-rail" ref={ref}>
          {BLOG_POSTS.map(p => (
            <Link key={p.href} href={p.href} className="sh-post">
              <div className={`sh-post-img${'partial' in p ? ' sh-post-img--partial' : ''}`}>
                {'partial' in p ? (
                  <>
                    <Image className="sh-post-blur" src={p.img} alt="" fill sizes="510px" />
                    <span className="sh-post-sharp">
                      <Image src={p.img} alt="" fill sizes="262px" />
                    </span>
                  </>
                ) : (
                  <Image src={p.img} alt="" fill sizes="510px" />
                )}
              </div>
              <div className="sh-post-body">
                <h3 className="sh-post-title">{p.title}</h3>
                <span className="sh-post-date">{p.date}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="sh-center">
          <Link href="/blog" className="sh-btn sh-btn--white">
            Tüm blog yazılarını keşfet <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- popüler aramalar ---------- */

export function PopularSearches() {
  const [tab, setTab] = useState(POPULAR_SEARCH_TABS[0]?.key ?? '')
  const items = POPULAR_SEARCH_TABS.find(t => t.key === tab)?.items ?? []
  return (
    <div className="sh-pop-wrap">
      <div className="sh-container">
        <div className="sh-pop-block">
          <div className="sh-pop-head">
            <div>
              <h2 className="sh-h2">Popüler aramalar</h2>
              <p className="sh-sub">Popüler aramaları keşfet ve aradığın aktiviteyi bul.</p>
            </div>
            <div className="sh-toggle" role="tablist" aria-label="Arama kategorisi">
              {POPULAR_SEARCH_TABS.map(t => (
                <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="sh-links-grid">
            {items.map((it, i) => (
              <Link key={`${it.title}-${i}`} href={it.href}>
                <b>{it.title}</b>
                <span>{it.sub}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="sh-pop-block">
          <h2 className="sh-h2">Popüler kiralama konumları</h2>
          <p className="sh-sub">Popüler konumları keşfet ve aradığın lokasyona şimdi rezervasyon oluştur.</p>
          <div className="sh-links-grid" style={{ marginTop: 52 }}>
            {POPULAR_RENTAL_LOCATIONS.map((it, i) => (
              <Link key={`${it.title}-${i}`} href={it.href}>
                <b>{it.title}</b>
                <span>{it.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- bülten ---------- */

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // TODO: bülten API'si bağlanınca buraya istek eklenecek (önceki bölümde de taslaktı).
    setDone(true)
    setEmail('')
  }

  return (
    <div className="sh-nl-wrap">
      <div className="sh-container">
        <div className="sh-nl">
          <Image className="sh-nl-dimg" src="/home/newsletter.webp" alt="" fill sizes="1280px" />
          {/* Mobil bant fotoğrafı: Bernd Dittrich, Unsplash (Sagres, Portekiz) — Unsplash Lisansı */}
          <Image className="sh-nl-mimg" src="/home/newsletter-mobile.webp" alt="" fill sizes="(max-width: 860px) 100vw, 1px" />
          <div className="sh-nl-card">
            <span className="sh-nl-badge">HABER BÜLTENİ</span>
            <h2 className="sh-nl-title">
              Yeni rotaları, ilham veren{' '}
              <br />
              içerikleri ve özel fırsatları{' '}
              <br />
              kaçırmayın.
            </h2>
            <p className="sh-nl-desc">Özel fırsatlar, yeni rotalar ve deniz dünyasından haberler doğrudan gelen kutunuza gelsin.</p>
            <form className="sh-nl-form" onSubmit={submit}>
              <input
                type="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); setDone(false) }}
                placeholder="E-posta adresinizi girin"
                aria-label="E-posta adresi"
              />
              <button type="submit" aria-label="Abone ol">
                <Send size={22} fill="currentColor" strokeWidth={1.4} aria-hidden="true" />
              </button>
            </form>
            <p className="sh-nl-note" role="status">
              {done ? 'Teşekkürler! Bültenimize kaydınız alındı.' : 'Spam yok. İstediğiniz zaman çıkabilirsiniz. Gizliliğinize saygı duyuyoruz.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
