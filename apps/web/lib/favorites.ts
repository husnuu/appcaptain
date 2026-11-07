'use client'

import { useCallback, useSyncExternalStore } from 'react'

// Kaydedilen tekneler yalnızca bu cihazda (localStorage) tutulur; hesap gerektirmez.
const KEY = 'ahoy:favorites'
const EMPTY: string[] = []
let cache: string[] | null = null
const listeners = new Set<() => void>()

function read(): string[] {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    cache = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    cache = []
  }
  return cache
}

function write(next: string[]) {
  cache = next
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* gizli sekme vb. — yalnızca bellekte tutulur */
  }
  listeners.forEach(l => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function useFavorite(id: string): [boolean, () => void] {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY)
  const saved = list.includes(id)
  const toggle = useCallback(() => {
    const cur = read()
    write(cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id])
  }, [id])
  return [saved, toggle]
}
