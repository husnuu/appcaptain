'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import type { BookingDTO } from '@getyourboat/shared'
import { supabase } from '@/lib/supabase'
import { fetchMyBookings } from '@/lib/api'
import AuthModal from '@/components/auth/AuthModal'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Onay bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  CANCELLED: 'İptal edildi',
  COMPLETED: 'Tamamlandı',
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-brand-100 text-brand-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function RezervasyonlarimPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingDTO[]>([])
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase.auth.getUser()
      if (cancelled) return
      setUser(data.user)
      if (data.user) {
        const items = await fetchMyBookings()
        if (!cancelled) setBookings(items)
      }
      if (!cancelled) setLoading(false)
    }
    load()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-24 text-center text-gray-400">Yükleniyor…</main>
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Rezervasyonlarım</h1>
        <p className="mt-3 text-gray-600">Rezervasyonlarınızı görmek için giriş yapın.</p>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Giriş yap
        </button>
        {authModalOpen ? <AuthModal onClose={() => setAuthModalOpen(false)} /> : null}
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold text-ink">Rezervasyonlarım</h1>

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">Henüz bir rezervasyonunuz yok.</p>
          <Link
            href="/tekne-kiralama"
            className="mt-4 inline-block rounded-full bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            Tekneleri keşfet
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4">
              <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {booking.boat?.coverPhoto ? (
                  <Image
                    src={booking.boat.coverPhoto}
                    alt={booking.boat.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-semibold text-ink">{booking.boat?.name ?? 'İsimsiz tekne'}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-caption font-semibold ${
                      STATUS_CLASS[booking.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </span>
                </div>
                <p className="mt-1 text-body-sm text-gray-500">
                  {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                </p>
                {booking.totalPrice != null ? (
                  <p className="mt-1 text-body-sm font-semibold text-ink">
                    {booking.totalPrice.toLocaleString('tr-TR')} {booking.currency}
                  </p>
                ) : (
                  <p className="mt-1 text-caption text-gray-400">Fiyat kaptan onayı sonrası belirlenecek</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
