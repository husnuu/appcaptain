import Image from 'next/image'
import Link from 'next/link'
import type { DiscoverBannerContent } from '@/types/content'

export default function DiscoverBannerSection({ content }: { content: DiscoverBannerContent }) {
  if (!content.enabled) return null

  const href = content.ctaHref?.trim() || '/listing'
  const isExternal = /^https?:\/\//i.test(href)

  const cta = isExternal ? (
    <a
      href={href}
      className="discover-banner-cta"
      target="_blank"
      rel="noopener noreferrer"
    >
      {content.ctaLabel}
    </a>
  ) : (
    <Link href={href} className="discover-banner-cta">
      {content.ctaLabel}
    </Link>
  )

  return (
    <section className="discover-banner" aria-labelledby="discover-banner-heading">
      <div className="discover-banner-media">
        <Image
          src={content.backgroundImageUrl}
          alt=""
          fill
          sizes="100vw"
          className="discover-banner-img"
          priority={false}
        />
        <div className="discover-banner-scrim" aria-hidden="true" />
      </div>
      <div className="discover-banner-inner">
        <h2 id="discover-banner-heading" className="discover-banner-title">
          {content.title}
        </h2>
        <p className="discover-banner-subtitle">{content.subtitle}</p>
        {cta}
      </div>
    </section>
  )
}
