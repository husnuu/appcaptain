// Tekne listesi ve ilan detayı için ortak biçimlendirme yardımcıları.

const BOAT_TYPE_TR: Record<string, string> = {
  sailboat: 'Yelkenli',
  sailing_yacht: 'Yelkenli',
  motoryacht: 'Motoryat',
  motor_yacht: 'Motoryat',
  motorboat: 'Motorbot',
  catamaran: 'Katamaran',
  gulet: 'Gulet',
  speedboat: 'Sürat Teknesi',
  speed_boat: 'Sürat Teknesi',
  rib: 'Şişme Bot',
  luxury_yacht: 'Lüks Yat',
  fishing_boat: 'Balıkçı Teknesi',
  trawler: 'Trawler',
}

export function boatTypeLabel(type: { key: string; label: string } | null | undefined): string | null {
  if (!type) return null
  return BOAT_TYPE_TR[type.key] ?? type.label
}

const LISTING_MODEL_TR: Record<string, string> = {
  hourly: 'Saatlik kiralama',
  daily: 'Günlük kiralama',
  overnight: 'Konaklamalı kiralama',
  weekly_charter: 'Haftalık kiralama',
  bareboat: 'Kaptansız (bareboat)',
  captain_included: 'Kaptanlı',
}

export function listingModelLabel(key: string, fallback?: string): string {
  return LISTING_MODEL_TR[key] ?? fallback ?? key
}

const PRICE_UNIT: Record<string, string> = {
  hourly: 'saat',
  daily: 'gün',
  overnight: 'gece',
  weekly_charter: 'hafta',
}

export function priceUnit(listingModelKey?: string | null): string {
  return (listingModelKey && PRICE_UNIT[listingModelKey]) || 'gün'
}

export function formatMoney(amount: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount.toLocaleString('tr-TR')} ${currency}`
  }
}

/** En düşük fiyatlı seçenek — kartlarda "başlayan fiyat" olarak gösterilir. */
export function lowestPrice<T extends { price: number }>(pricing: T[]): T | null {
  return pricing.filter(p => p.price > 0).reduce<T | null>((min, p) => (!min || p.price < min.price ? p : min), null)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDayMonth(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Türkçe büyük/küçük harf dönüşümünden kalan birleşik noktayı ("i̇") temizler. */
export function cleanText(s: string): string {
  return s.replace(/i\u0307/g, 'i').replace(/I\u0307/g, 'İ')
}

const VALUE_TR: Record<string, string> = {
  STEEL: 'Çelik',
  FIBERGLASS: 'Fiberglas',
  GRP: 'Fiberglas',
  ALUMINIUM: 'Alüminyum',
  ALUMINUM: 'Alüminyum',
  WOOD: 'Ahşap',
  CARBON: 'Karbon',
  DIESEL: 'Dizel',
  GASOLINE: 'Benzin',
  PETROL: 'Benzin',
  ELECTRIC: 'Elektrik',
  HYBRID: 'Hibrit',
  OUTBOARD: 'Dıştan takma',
  INBOARD: 'İçten takma',
  yes: 'Evet',
  no: 'Hayır',
  true: 'Evet',
  false: 'Hayır',
}

/** Teknik özelliklerde gelen ham enum değerlerini okunur hale getirir. */
export function prettyValue(v: string): string {
  return VALUE_TR[v] ?? cleanText(v)
}
