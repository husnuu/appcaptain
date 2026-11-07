'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * Favori tekneler — kullanıcının Supabase hesabında (user_metadata.favorites)
 * tutulur; böylece veritabanı şeması değişmeden cihazlar arası senkron kalır.
 *
 * Tek bir ortak kaynak (store) vardır: sayfada kaç kart olursa olsun Supabase
 * oturumu bir kez dinlenir.
 *
 * Giriş yapmamış kullanıcı favoriye tıklarsa tekne "bekleyen favori" olarak
 * saklanır ve giriş yapıldığı anda otomatik eklenir (e-posta doğrulaması
 * sonrası geri dönüşte de çalışsın diye localStorage'da, 1 saat geçerli).
 */

const PENDING_KEY = 'ahoy:pending-favorite'
const PENDING_TTL = 60 * 60 * 1000
const MAX_FAVORITES = 200

interface FavState {
  user: User | null
  ids: string[]
  ready: boolean
}

const SERVER_STATE: FavState = { user: null, ids: [], ready: false }
let state: FavState = SERVER_STATE
let started = false
const listeners = new Set<() => void>()
const pendingListeners = new Set<(id: string) => void>()

const readIds = (user: User | null): string[] => {
  const raw = user?.user_metadata?.favorites
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
}

function setState(patch: Partial<FavState>) {
  state = { ...state, ...patch }
  listeners.forEach(l => l())
}

export function setPendingFavorite(id: string) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ id, at: Date.now() }))
  } catch {
    /* gizli sekme vb. */
  }
}

function takePendingFavorite(): string | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    localStorage.removeItem(PENDING_KEY)
    const { id, at } = JSON.parse(raw) as { id?: unknown; at?: unknown }
    return typeof id === 'string' && typeof at === 'number' && Date.now() - at < PENDING_TTL ? id : null
  } catch {
    return null
  }
}

async function saveIds(ids: string[]): Promise<User | null> {
  const { data, error } = await supabase.auth.updateUser({ data: { favorites: ids.slice(0, MAX_FAVORITES) } })
  if (error) throw error
  return data.user
}

async function applyUser(user: User | null) {
  let ids = readIds(user)
  setState({ user, ids, ready: true })
  if (!user) return
  // Giriş öncesi tıklanan favori varsa şimdi ekle.
  const pending = takePendingFavorite()
  if (!pending || ids.includes(pending)) return
  ids = [pending, ...ids]
  setState({ ids })
  try {
    const saved = await saveIds(ids)
    if (saved) setState({ user: saved })
    pendingListeners.forEach(l => l(pending))
  } catch {
    setState({ ids: readIds(user) })
  }
}

function start() {
  if (started) return
  started = true
  supabase.auth.getUser().then(({ data }) => applyUser(data.user))
  supabase.auth.onAuthStateChange((_event, session) => {
    void applyUser(session?.user ?? null)
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  start()
  return () => {
    listeners.delete(listener)
  }
}

/** Favoriye ekler / çıkarır; sonucu (true = eklendi) döner. Giriş yoksa null. */
async function toggleFavorite(id: string): Promise<boolean | null> {
  const { user, ids } = state
  if (!user) return null
  const had = ids.includes(id)
  const next = had ? ids.filter(x => x !== id) : [id, ...ids]
  setState({ ids: next }) // iyimser güncelleme
  try {
    const saved = await saveIds(next)
    if (saved) setState({ user: saved })
    return !had
  } catch {
    setState({ ids })
    throw new Error('Favori kaydedilemedi')
  }
}

export function useFavorites(options?: { onPendingAdded?: (id: string) => void }) {
  const snap = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  )

  // Geri çağırım ref'te: her render'da yeni fonksiyon gelse de abonelik yenilenmez.
  const onPendingAdded = useRef(options?.onPendingAdded)
  useEffect(() => {
    onPendingAdded.current = options?.onPendingAdded
  })
  useEffect(() => {
    const l = (id: string) => onPendingAdded.current?.(id)
    pendingListeners.add(l)
    return () => {
      pendingListeners.delete(l)
    }
  }, [])

  const isFavorite = useCallback((id: string) => snap.ids.includes(id), [snap.ids])

  return { user: snap.user, ready: snap.ready, ids: snap.ids, isFavorite, toggle: toggleFavorite }
}
