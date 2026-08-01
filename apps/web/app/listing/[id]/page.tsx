import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ListingDetail from '@/components/listing/ListingDetail'
import { fetchBoat } from '@/lib/api'

type Props = { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const boat = await fetchBoat(id)
  if (!boat) return { title: 'İlan bulunamadı — SeaHub' }
  const title = boat.title ? `${boat.title} — SeaHub` : 'SeaHub — Tekne kiralama'
  return {
    title,
    description: boat.description?.slice(0, 160) ?? `${boat.title ?? 'Tekne'} — Türkiye tekne kiralama`,
  }
}

export default async function ListingIdPage({ params }: Props) {
  const { id } = await params
  const boat = await fetchBoat(id)
  if (!boat) notFound()
  return <ListingDetail boat={boat} />
}
