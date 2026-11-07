import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Anchor, ArrowRight, Plus, Sailboat, Ship, Sunset, Waves } from 'lucide-react'
import { MARQUEE } from '@/components/home/content'

/**
 * Kurumsal sayfaların (Neden Ahoy, Hakkımızda) yapı taşları — ana sayfanın diliyle:
 * sans + serif başlık, dalga kenarlı büyük fotoğraf, ince çizgili metin blokları,
 * kayan şeritli fotoğraf bandı.
 */

type Cta = { href: string; label: string; external?: boolean }

function CtaLink({ cta, className, children }: { cta: Cta; className: string; children: ReactNode }) {
  return cta.external ? (
    <a href={cta.href} className={className}>
      {children}
    </a>
  ) : (
    <Link href={cta.href} className={className}>
      {children}
    </Link>
  )
}

/** Ana sayfa hero'su gibi: solda iki satırlı başlık (ikinci satır serif), sağda dalga kenarlı fotoğraf. */
export function EdHero({
  l1,
  l2,
  lede,
  image,
  alt,
  primary,
  secondary,
}: {
  l1: string
  l2: string
  lede: string
  image: string
  alt: string
  primary: Cta
  secondary?: Cta
}) {
  return (
    <section className="sh-ed-hero">
      <div className="sh-container sh-ed-stage">
        <div className="sh-ed-photo">
          <Image src={image} alt={alt} fill priority sizes="(max-width: 860px) 100vw, 900px" />
        </div>
        <div className="sh-ed-copy">
          <h1 className="sh-ed-title">
            <span className="l1">{l1}</span>
            <span className="l2">{l2}</span>
          </h1>
          <p className="sh-ed-lede">{lede}</p>
          <div className="sh-ed-ctas">
            <CtaLink cta={primary} className="sh-btn sh-btn--navy">
              {primary.label} <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </CtaLink>
            {secondary && (
              <CtaLink cta={secondary} className="sh-link-arrow">
                {secondary.label}
              </CtaLink>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Üstünde ince çizgi olan metin sütunları (ana sayfadaki "Seyahatini planla" adımları gibi). */
export function LinedColumns({ items, numbered = false }: { items: { title: string; text: string }[]; numbered?: boolean }) {
  return (
    <ul className={`sh-ed-cols sh-ed-cols--${items.length}`}>
      {items.map((it, i) => (
        <li key={it.title}>
          {numbered && <small>{String(i + 1).padStart(2, '0')}</small>}
          <h3>{it.title}</h3>
          <p>{it.text}</p>
        </li>
      ))}
    </ul>
  )
}

/** Sık sorulan sorular — kutusuz, ince çizgilerle ayrılan liste. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="sh-ed-faq-list">
      {items.map(it => (
        <details key={it.q}>
          <summary>
            {it.q}
            <Plus size={20} strokeWidth={1.8} aria-hidden="true" />
          </summary>
          <p>{it.a}</p>
        </details>
      ))}
    </div>
  )
}

const MARQUEE_ICONS = { sailboat: Sailboat, anchor: Anchor, ship: Ship, sunset: Sunset, waves: Waves }

/** Ana sayfadaki keşfet bandı gibi: tam genişlik fotoğraf, ortada başlık + butonlar, altta kayan şerit. */
export function PhotoBanner({
  title,
  text,
  image = '/home/discover.webp',
  primary,
  secondary,
}: {
  title: ReactNode
  text: string
  image?: string
  primary: Cta
  secondary?: Cta
}) {
  const items = [...MARQUEE, ...MARQUEE]
  return (
    <div className="sh-disc-wrap sh-ed-banner">
      <div className="sh-container">
        <div className="sh-disc">
          <Image src={image} alt="" fill sizes="1280px" />
          <div className="sh-disc-body">
            <h2 className="sh-disc-title">{title}</h2>
            <p className="sh-disc-desc">{text}</p>
            <div className="sh-disc-ctas">
              <CtaLink cta={primary} className="sh-btn sh-btn--white">
                {primary.label} <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
              </CtaLink>
              {secondary && (
                <CtaLink cta={secondary} className="sh-btn sh-btn--glass">
                  {secondary.label}
                </CtaLink>
              )}
            </div>
          </div>
          <div className="sh-marquee" aria-hidden="true">
            <div className="sh-marquee-track">
              {items.map((m, i) => {
                const Icon = MARQUEE_ICONS[m.icon]
                return (
                  <span key={i} className="sh-marquee-item">
                    <Icon size={22} strokeWidth={1.6} />
                    {m.text}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
