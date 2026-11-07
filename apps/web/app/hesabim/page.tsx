'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useFavorites } from '@/lib/favorites'
import AuthModal from '@/components/auth/AuthModal'
import FavoriteBoats from '@/components/account/FavoriteBoats'

export default function HesabimPage() {
  const { user, ready, ids } = useFavorites()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const closeAuth = useCallback(() => setAuthModalOpen(false), [])

  if (!ready) {
    return <main className="mx-auto max-w-lg px-4 py-24 text-center text-gray-400">Yükleniyor…</main>
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-ink">Hesabım</h1>
        <p className="mt-3 text-gray-600">Hesap bilgilerini ve favorilerini görmek için giriş yap.</p>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="mt-6 rounded-full bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Giriş yap
        </button>
        {authModalOpen ? <AuthModal onClose={closeAuth} /> : null}
      </main>
    )
  }

  const joinedAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Hesabım</h1>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {user.email ? user.email.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="font-semibold text-ink">{user.email}</p>
              {joinedAt ? <p className="text-caption text-gray-400">{joinedAt} tarihinden beri üye</p> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="mt-6 w-full rounded-full border border-gray-200 py-2.5 text-body-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Çıkış yap
          </button>
        </div>

        <Link href="/rezervasyonlarim" className="block rounded-2xl border border-gray-200 bg-white p-6 hover:border-brand-300">
          <p className="font-semibold text-ink">Rezervasyonlarım</p>
          <p className="mt-1 text-body-sm text-gray-500">Geçmiş ve bekleyen rezervasyonlarını görüntüle</p>
        </Link>
      </div>

      <FavoriteBoats ids={ids} />
    </main>
  )
}
