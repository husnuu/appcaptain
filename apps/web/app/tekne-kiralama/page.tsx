import type { Metadata } from 'next'
import MarketplaceClient from './MarketplaceClient'
import { fetchBoats, fetchLocations } from '@/lib/api'
import { publicBoatToCard } from '@/lib/mappers'

export const metadata: Metadata = {
  title: 'Tekne Kiralama — SeaHub',
  description: 'Türkiye\'nin en güzel koylarında yelkenli, motor yat, katamaran ve daha fazlasını kiralayın.',
}

// Data comes from the live API — don't try to prerender at build time.
export const dynamic = 'force-dynamic'

export default async function TekneKiralamaPage() {
  // Cities with at least one ACTIVE boat, driven entirely by the API —
  // a newly-approved city in a new location shows up automatically.
  const locationList = await fetchLocations()
  const cities = locationList.map((l) => l.city)

  const entries = await Promise.all(
    cities.map(async (city) => {
      const { items } = await fetchBoats({ city, limit: 8 })
      return [city, items.map(publicBoatToCard)] as const
    })
  )
  const boats = Object.fromEntries(entries)
  return <MarketplaceClient boats={boats} locations={cities} />
}
