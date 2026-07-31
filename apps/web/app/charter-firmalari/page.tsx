import type { Metadata } from 'next'
import CharterFirmsClient from './CharterFirmsClient'
import { DEFAULT_HERO } from '@/lib/content/heroDefaults'

export const metadata: Metadata = {
  title: 'Charter Firmaları — SeaHub',
  description: 'Ülkeye göre charter firmalarını keşfedin. Popüler şirketleri logo ve isimleriyle inceleyin.',
}

export default function CharterFirmsPage() {
  return <CharterFirmsClient coverImageUrl={DEFAULT_HERO.backgroundImageUrl} />
}
