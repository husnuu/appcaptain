// Server component — ana sayfa içeriği lib/data.ts + lib/homeContent.ts'ten okunur.
import HeroSection         from '@/components/hero/HeroSection'
import CashbackSection     from '@/components/sections/CashbackSection'
import CashbackProgramBanner from '@/components/sections/CashbackProgramBanner'
import EcosystemSection    from '@/components/sections/EcosystemSection'
import BrowseSection       from '@/components/sections/BrowseSection'
import LocationSection     from '@/components/sections/LocationSection'
import MapSection          from '@/components/sections/MapSection'
import DiscoverBannerSection from '@/components/sections/DiscoverBannerSection'
import TrustSection        from '@/components/sections/TrustSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import BlogSection            from '@/components/sections/BlogSection'
import PopularBookingsSection from '@/components/sections/PopularBookingsSection'
import PopularLinksSection   from '@/components/sections/PopularLinksSection'
import NewsletterSection     from '@/components/sections/NewsletterSection'

import { getHomePageContent } from '@/lib/homeContent'

export const revalidate = 60

export default function HomePage() {
  const home = getHomePageContent()

  return (
    <>
      <div className="home-hero-stack">
        <HeroSection content={home.hero} />
        <CashbackSection />
      </div>

      <EcosystemSection
        title={home.ecosystem.title}
        subtitle={home.ecosystem.subtitle}
        features={home.ecosystem.features}
      />

      <BrowseSection boatTypes={home.boatTypes} experiences={home.experiences} />

      <CashbackProgramBanner />

      <LocationSection
        rentalLocations={home.rentalLocations}
        experienceLocations={home.experienceLocations}
      />

      <MapSection content={home.mapSection} logoUrl={null} />

      <DiscoverBannerSection content={home.discoverBanner} />

      <TrustSection
        title={home.trustHeader.title}
        subtitle={home.trustHeader.subtitle}
        features={home.trustFeatures}
      />

      <TestimonialsSection testimonials={home.testimonials} />

      <BlogSection posts={home.blogPosts} />

      <PopularBookingsSection />

      <PopularLinksSection />

      <NewsletterSection />
    </>
  )
}
