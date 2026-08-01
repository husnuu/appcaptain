import { fetchLocations } from '@/lib/api'
import Nav from './Nav'

// City → region label. New cities not listed here fall back to "Türkiye".
const CITY_REGION: Record<string, string> = {
  'Göcek': 'Muğla, Türkiye',
  'Bodrum': 'Muğla, Türkiye',
  'Marmaris': 'Muğla, Türkiye',
  'Çeşme': 'İzmir, Türkiye',
  'Antalya': 'Antalya, Türkiye',
  'Fethiye': 'Muğla, Türkiye',
  'İstanbul': 'İstanbul, Türkiye',
  'Kaş': 'Antalya, Türkiye',
  'Datça': 'Muğla, Türkiye',
  'Kuşadası': 'Aydın, Türkiye',
}

export default async function NavWrapper() {
  const locations = await fetchLocations()
  const suggestions = locations.map(l => ({
    label: l.city,
    sub: CITY_REGION[l.city] ?? 'Türkiye',
  }))
  return <Nav locationSuggestions={suggestions.length > 0 ? suggestions : undefined} />
}
