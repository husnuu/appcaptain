import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CheckoutClient from '@/components/checkout/CheckoutClient'
import { fetchBoat } from '@/lib/api'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Rezervasyonu tamamla — Ahoy',
  robots: { index: false },
}

export default async function CheckoutPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const boat = await fetchBoat(id)
  if (!boat) notFound()
  return <CheckoutClient boat={boat} search={sp} />
}
