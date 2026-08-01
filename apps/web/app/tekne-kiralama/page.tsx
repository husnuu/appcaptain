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

interface Props {
  searchParams: Promise<{ city?: string }>
}

export default async function TekneKiralamaPage({ searchParams }: Props) {
  const { city: searchCity } = await searchParams

  // All cities with at least one ACTIVE boat — drives the tab/nav suggestion list.
  const locationList = await fetchLocations()

  // A search from Nav — fetch just that city and show it as the only section.
  // Falls back to the full location list if the search turned up nothing.
  if (searchCity) {
    const { items } = await fetchBoats({ city: searchCity, limit: 20 })
    const boats = { [searchCity]: items.map(publicBoatToCard) }
    const locations = items.length > 0 ? [searchCity] : locationList.map((l) => l.city)
    return <MarketplaceClient boats={boats} locations={locations} activeCity={searchCity} />
  }

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
