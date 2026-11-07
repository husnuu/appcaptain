// Ana sayfa — Figma tasarımı (components/home). İçerik: components/home/content.ts
import HomeHero from '@/components/home/HomeHero'
import {
  BoatTypeCards,
  CashbackCard,
  DiscoverBanner,
  ExperienceCards,
  TrustBlock,
} from '@/components/home/HomeStatic'
import {
  BlogRail,
  Newsletter,
  PlanTrip,
  PopularLocations,
  PopularSearches,
  RailSection,
  Testimonials,
} from '@/components/home/HomeInteractive'

export const revalidate = 60

export default function HomePage() {
  return (
    <div className="sh-home">
      <HomeHero />

      <section className="sh-sect sh-sect--white" aria-label="Kiralama ve deneyimler">
        <RailSection
          title="Kiralama seçenekleri"
          moreHref="/tekne-kiralama"
          subtitle="Tekne tiplerini karşılaştır ve seyahat planına uygun kiralama seçeneğini keşfet."
        >
          <BoatTypeCards />
        </RailSection>
        <RailSection
          title="Tatiline göre deneyimler"
          moreHref="/deneyimler"
          subtitle="Tatil stiline, konfor beklentine ve seyahat planına uygun deneyimleri keşfet."
        >
          <ExperienceCards />
        </RailSection>
        <CashbackCard />
      </section>

      <PopularLocations />

      <section className="sh-sect sh-sect--white" aria-label="Seyahatini planla">
        <PlanTrip />
        <DiscoverBanner />
      </section>

      <TrustBlock />
      <Testimonials />
      <BlogRail />

      <section className="sh-sect sh-sect--white" aria-label="Popüler aramalar">
        <PopularSearches />
        <Newsletter />
      </section>
    </div>
  )
}
