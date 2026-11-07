import { toISODate } from './boatFormat'

const DAY = 86_400_000

export interface PriceOption {
  listingModelKey: string
  listingModelLabel?: string
  price: number
  currency: string
}

export interface Estimate {
  label: string
  total: number
}

/** "10:30" → 630 dakika */
export function minutesOf(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/**
 * Tahmini tutar — kesin tutarı kaptan onayda belirler.
 * daily: gün sayısı (uçlar dahil), overnight: gece, weekly_charter: hafta (yukarı yuvarlanır), hourly: saat.
 */
export function estimatePrice(
  option: PriceOption | null,
  start: Date | null,
  end: Date | null,
  startTime?: string | null,
  endTime?: string | null,
): Estimate | null {
  if (!option || !start || !end) return null
  const nights = Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY))
  switch (option.listingModelKey) {
    case 'hourly': {
      if (!startTime || !endTime) return null
      const hours = (minutesOf(endTime) - minutesOf(startTime)) / 60
      if (hours <= 0) return null
      return { label: `${hours.toLocaleString('tr-TR')} saat`, total: hours * option.price }
    }
    case 'daily':
      return { label: `${nights + 1} gün`, total: (nights + 1) * option.price }
    case 'overnight':
      return nights > 0 ? { label: `${nights} gece`, total: nights * option.price } : null
    case 'weekly_charter': {
      const weeks = Math.max(1, Math.ceil(nights / 7))
      return { label: `${weeks} hafta`, total: weeks * option.price }
    }
    default:
      return null
  }
}

/** Ön ödeme oranı (structuredRules.deposit_type_payment_before) */
export function depositRatio(key: unknown): number | null {
  if (key === 'percent_20') return 0.2
  if (key === 'percent_50') return 0.5
  if (key === 'full') return 1
  return null
}

export interface CheckoutParams {
  start: Date | null
  end: Date | null
  guests: number
  model: string | null
  startTime: string | null
  endTime: string | null
}

const parseDate = (v: string | null | undefined) => {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(y!, m! - 1, d!)
  return Number.isNaN(date.getTime()) ? null : date
}
const parseTime = (v: string | null | undefined) => (v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : null)

export function parseCheckoutParams(sp: Record<string, string | undefined>): CheckoutParams {
  const guests = Number(sp.guests)
  return {
    start: parseDate(sp.start),
    end: parseDate(sp.end),
    guests: Number.isInteger(guests) && guests > 0 ? guests : 1,
    model: sp.model ?? null,
    startTime: parseTime(sp.from),
    endTime: parseTime(sp.to),
  }
}

export function checkoutHref(boatId: string, p: CheckoutParams): string {
  const qs = new URLSearchParams()
  if (p.start) qs.set('start', toISODate(p.start))
  if (p.end) qs.set('end', toISODate(p.end))
  qs.set('guests', String(p.guests))
  if (p.model) qs.set('model', p.model)
  if (p.startTime) qs.set('from', p.startTime)
  if (p.endTime) qs.set('to', p.endTime)
  return `/listing/${boatId}/rezervasyon?${qs}`
}

/** 08:00 – 22:00 arası yarım saatlik seçenekler */
export const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const mins = 8 * 60 + i * 30
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
})
