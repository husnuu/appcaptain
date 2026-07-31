import type { Metadata } from 'next'
import MarketplaceClient from './MarketplaceClient'
import { fetchBoats } from '@/lib/api'
import { publicBoatToCard } from '@/lib/mappers'

export const metadata: Metadata = {
  title: 'Tekne Kiralama — SeaHub',
  description: 'Türkiye\'nin en güzel koylarında yelkenli, motor yat, katamaran ve daha fazlasını kiralayın.',
}

const CITIES = ['Bodrum', 'Göcek', 'Marmaris', 'Çeşme', 'Antalya'] as const

export default async function TekneKiralamaPage() {
  const entries = await Promise.all(
    CITIES.map(async (city) => {
      const { items } = await fetchBoats({ city, limit: 8 })
      return [city, items.map(publicBoatToCard)] as const
    })
  )
  const boats = Object.fromEntries(entries)
  return <MarketplaceClient boats={boats} locations={[...CITIES]} />
}
