import type { Metadata } from 'next'
import ExperiencesClient from './ExperiencesClient'
import { fetchExperiences } from '@/lib/api'
import { experienceToCard, EXPERIENCE_CATEGORIES } from '@/lib/mappers'

export const metadata: Metadata = {
  title: 'Deneyimler — SeaHub',
  description: 'Türkiye kıyılarında yelken, dalış, tekne turu ve daha fazlası. Yerel rehberlerle unutulmaz deniz deneyimleri.',
}

// Data comes from the live API — don't try to prerender at build time.
export const dynamic = 'force-dynamic'

export default async function DeneyimlerPage() {
  const { items } = await fetchExperiences({ limit: 100 })
  return (
    <ExperiencesClient
      experiences={items.map(experienceToCard)}
      locations={[]}
      categories={EXPERIENCE_CATEGORIES}
    />
  )
}
