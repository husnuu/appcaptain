'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownWideNarrow, ChevronRight, MapPin, RotateCcw, Search, X } from 'lucide-react'
import BoatCard, { type Boat } from '@/components/marketplace/BoatCard'
import DualRangeSlider from '@/components/marketplace/DualRangeSlider'
import PriceHistogram from '@/components/marketplace/PriceHistogram'

const BOAT_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: 'Yelkenli', label: 'Yelkenli' },
  { id: 'Motor Yat', label: 'Motorlu yat' },
  { id: 'Katamaran', label: 'Katamaran' },
  { id: 'Gulet', label: 'Gulet' },
  { id: 'Sürat', label: 'Sürat' },
]

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'price-asc', label: 'Fiyat: Düşükten yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten düşüğe' },
  { value: 'rating', label: 'En yüksek puan' },
]

interface Props {
  boats: Record<string, Boat[]>
  locations: string[]
  /** Set when the page was reached via a Nav city search — highlights the search context. */
  activeCity?: string
}

function matchesBoatType(boat: Boat, type: string): boolean {
  const n = boat.name.toLowerCase()
  const isMotor = /motor|princess|azimut|sealine|quicksilver/.test(n)
  const isCat = /lagoon|katamaran|fountaine|catamaran/.test(n)
  const isGulet = /gulet|ahşap/.test(n)
  switch (type) {
    case 'Yelkenli':
      return !isMotor && !isCat && !isGulet
    case 'Motor Yat':
      return isMotor
    case 'Katamaran':
      return isCat
    case 'Gulet':
      return isGulet
    case 'Sürat':
      return false
    default:
      return true
  }
}

function boatMatchesRental(
  boat: Boat,
  captain: boolean,
  bareboat: boolean,
  crewed: boolean,
): boolean {
  if (!captain && !bareboat && !crewed) return true
  const tags = boat.tags.map(t => t.label.toLowerCase()).join(' ')
  let ok = false
  if (bareboat && tags.includes('bareboat')) ok = true
  if (crewed && /mürettebat|tam pansiyon|kahvaltı/.test(tags)) ok = true
  if (captain && /kaptan/.test(tags) && !tags.includes('bareboat')) ok = true
  return ok
}

function sortBoats(list: Boat[], sortBy: string): Boat[] {
  const copy = [...list]
  switch (sortBy) {
    case 'price-asc':
      return copy.sort((a, b) => a.pricePerNight - b.pricePerNight)
    case 'price-desc':
      return copy.sort((a, b) => b.pricePerNight - a.pricePerNight)
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating)
    default:
      return copy
  }
}

function computeBounds(boats: Boat[]) {
  if (boats.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 100000,
      maxCabins: 12,
      maxGuest: 20,
      maxSailing: 20,
      maxWc: 12,
    }
  }
  let minPrice = Infinity
  let maxPrice = 0
  let maxCabins = 0
  let maxGuest = 0
  let maxSailing = 0
  let maxWc = 0
  for (const b of boats) {
    minPrice = Math.min(minPrice, b.pricePerNight)
    maxPrice = Math.max(maxPrice, b.pricePerNight)
    maxCabins = Math.max(maxCabins, b.specs.cabins)
    maxGuest = Math.max(maxGuest, b.specs.accommodation)
    maxSailing = Math.max(maxSailing, b.specs.sailing)
    maxWc = Math.max(maxWc, b.specs.wc)
  }
  return {
    minPrice,
    maxPrice,
    maxCabins: Math.max(maxCabins, 1),
    maxGuest: Math.max(maxGuest, 1),
    maxSailing: Math.max(maxSailing, 1),
    maxWc: Math.max(maxWc, 1),
  }
}

function buildPriceBuckets(boats: Boat[], extentMin: number, extentMax: number, bins = 18): number[] {
  const counts = Array.from({ length: bins }, () => 0)
  const range = extentMax - extentMin || 1
  for (const b of boats) {
    const p = b.pricePerNight
    let i = Math.floor(((p - extentMin) / range) * bins)
    if (i < 0) i = 0
    if (i >= bins) i = bins - 1
    counts[i] = (counts[i] ?? 0) + 1
  }
  return counts
}

export default function MarketplaceClient({ boats, locations, activeCity }: Props) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recommended')
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [rentCaptain, setRentCaptain] = useState(false)
  const [rentBareboat, setRentBareboat] = useState(false)
  const [rentCrewed, setRentCrewed] = useState(false)

  const flatBoats = useMemo(() => Object.values(boats).flat(), [boats])
  const bounds = useMemo(() => computeBounds(flatBoats), [flatBoats])

  const [priceMin, setPriceMin] = useState(bounds.minPrice)
  const [priceMax, setPriceMax] = useState(bounds.maxPrice)
  const [cabMin, setCabMin] = useState(0)
  const [cabMax, setCabMax] = useState(bounds.maxCabins)
  const [guestMin, setGuestMin] = useState(0)
  const [guestMax, setGuestMax] = useState(bounds.maxGuest)
  const [sailMin, setSailMin] = useState(0)
  const [sailMax, setSailMax] = useState(bounds.maxSailing)
  const [wcMin, setWcMin] = useState(0)
  const [wcMax, setWcMax] = useState(bounds.maxWc)

  useEffect(() => {
    setPriceMin(bounds.minPrice)
    setPriceMax(bounds.maxPrice)
    setCabMin(0)
    setCabMax(bounds.maxCabins)
    setGuestMin(0)
    setGuestMax(bounds.maxGuest)
    setSailMin(0)
    setSailMax(bounds.maxSailing)
    setWcMin(0)
    setWcMax(bounds.maxWc)
  }, [bounds])

  const priceBuckets = useMemo(
    () => buildPriceBuckets(flatBoats, bounds.minPrice, bounds.maxPrice),
    [flatBoats, bounds.minPrice, bounds.maxPrice],
  )

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const def of BOAT_TYPE_OPTIONS) {
      c[def.id] = flatBoats.filter(b => matchesBoatType(b, def.id)).length
    }
    return c
  }, [flatBoats])

  const rentalCounts = useMemo(() => {
    let captain = 0
    let bare = 0
    let crew = 0
    for (const b of flatBoats) {
      const tags = b.tags.map(t => t.label.toLowerCase()).join(' ')
      if (/kaptan/.test(tags) && !tags.includes('bareboat')) captain++
      if (tags.includes('bareboat')) bare++
      if (/mürettebat|tam pansiyon|kahvaltı/.test(tags)) crew++
    }
    return { captain, bare, crew }
  }, [flatBoats])

  const toggleType = (id: string) => {
    setTypeFilters(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const passesFilters = useCallback(
    (boat: Boat): boolean => {
      if (typeFilters.length > 0 && !typeFilters.some(t => matchesBoatType(boat, t))) return false
      if (boat.pricePerNight < priceMin || boat.pricePerNight > priceMax) return false
      if (boat.specs.cabins < cabMin || boat.specs.cabins > cabMax) return false
      if (boat.specs.accommodation < guestMin || boat.specs.accommodation > guestMax) return false
      if (boat.specs.sailing < sailMin || boat.specs.sailing > sailMax) return false
      if (boat.specs.wc < wcMin || boat.specs.wc > wcMax) return false
      if (!boatMatchesRental(boat, rentCaptain, rentBareboat, rentCrewed)) return false
      const q = search.toLowerCase().trim()
      if (q && !boat.name.toLowerCase().includes(q) && !boat.location.toLowerCase().includes(q))
        return false
      return true
    },
    [
      typeFilters,
      priceMin,
      priceMax,
      cabMin,
      cabMax,
      guestMin,
      guestMax,
      sailMin,
      sailMax,
      wcMin,
      wcMax,
      rentCaptain,
      rentBareboat,
      rentCrewed,
      search,
    ],
  )

  const visibleCount = useMemo(() => flatBoats.filter(passesFilters).length, [flatBoats, passesFilters])
  const hasAnyBoats = flatBoats.length > 0

  const resetFilters = () => {
    setSearch('')
    setTypeFilters([])
    setRentCaptain(false)
    setRentBareboat(false)
    setRentCrewed(false)
    setPriceMin(bounds.minPrice)
    setPriceMax(bounds.maxPrice)
    setCabMin(0)
    setCabMax(bounds.maxCabins)
    setGuestMin(0)
    setGuestMax(bounds.maxGuest)
    setSailMin(0)
    setSailMax(bounds.maxSailing)
    setWcMin(0)
    setWcMax(bounds.maxWc)
  }

  const fmtMoney = (n: number) =>
    `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`

  return (
    <div className="mp-page mp-page--fullwidth listing-detail">
      <header className="mp-hero">
        <div className="mp-hero-inner">
          <p className="mp-page-eyebrow">Tekne kiralama</p>
          <h1 className="mp-page-title">Kıyı boyunca müsait tekneler</h1>
          <p className="mp-page-lede">
            Listelenen her ilan filo veya sahip doğrulamasından geçer; fiyatlar gecelik, net ve şeffaftır.
          </p>
        </div>
      </header>

      {activeCity ? (
        <div className="mp-search-banner">
          <span>
            <strong>{activeCity}</strong> için arama sonuçları
          </span>
          <Link href="/tekne-kiralama" className="mp-search-banner-reset">
            Tüm lokasyonları gör
          </Link>
        </div>
      ) : null}

      <div className="mp-shell">
        <aside className="mp-sidebar" aria-label="Filtreler">
          <div className="mp-sidebar-inner mp-sidebar-inner--card">
            <div className="mp-sidebar-map-preview">
              <div className="mp-sidebar-map-placeholder" aria-hidden>
                <MapPin size={22} strokeWidth={1.75} />
              </div>
              <Link href="/listing" className="mp-sidebar-map-btn">
                Harita
              </Link>
            </div>

            <div className="mp-sidebar-head">
              <h2 className="mp-sidebar-title">Filtre</h2>
              <button type="button" className="mp-reset-filters" onClick={resetFilters}>
                <RotateCcw size={14} strokeWidth={2} aria-hidden />
                Sıfırla
              </button>
            </div>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">Ara</p>
              <div className="mp-search-field mp-search-field--sidebar">
                <Search className="mp-search-ico" size={17} strokeWidth={2.25} aria-hidden />
                <input
                  type="text"
                  className="mp-search-input"
                  placeholder="Ara"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Tekne ara"
                />
                {search ? (
                  <button type="button" className="mp-search-clear" onClick={() => setSearch('')} aria-label="Aramayı temizle">
                    <X size={17} strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            </section>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">Tekne tipi</p>
              <div className="mp-check-stack">
                {BOAT_TYPE_OPTIONS.map(({ id, label }) => (
                  <label key={id} className="mp-check-row mp-check-row--block">
                    <input type="checkbox" checked={typeFilters.includes(id)} onChange={() => toggleType(id)} />
                    <span className="mp-check-text">
                      {label} <span className="mp-check-paren">({typeCounts[id] ?? 0})</span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">Kabin</p>
              <DualRangeSlider
                min={0}
                max={bounds.maxCabins}
                step={1}
                valueMin={cabMin}
                valueMax={cabMax}
                onChange={(a, b) => {
                  setCabMin(a)
                  setCabMax(b)
                }}
                formatValue={n => String(n)}
                aria-label="Kabin sayısı aralığı"
              />
            </section>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">Fiyat</p>
              <div className="mp-price-hist-wrap">
                <PriceHistogram
                  buckets={priceBuckets}
                  valueMin={priceMin}
                  valueMax={priceMax}
                  extentMin={bounds.minPrice}
                  extentMax={bounds.maxPrice}
                />
                <DualRangeSlider
                  min={bounds.minPrice}
                  max={bounds.maxPrice}
                  step={
                    bounds.maxPrice <= bounds.minPrice
                      ? 1
                      : Math.max(100, Math.round((bounds.maxPrice - bounds.minPrice) / 500))
                  }
                  valueMin={priceMin}
                  valueMax={priceMax}
                  onChange={(a, b) => {
                    setPriceMin(a)
                    setPriceMax(b)
                  }}
                  formatValue={fmtMoney}
                  aria-label="Gecelik fiyat aralığı"
                />
              </div>
            </section>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">Konaklama (kişi)</p>
              <DualRangeSlider
                min={0}
                max={bounds.maxGuest}
                step={1}
                valueMin={guestMin}
                valueMax={guestMax}
                onChange={(a, b) => {
                  setGuestMin(a)
                  setGuestMax(b)
                }}
                formatValue={n => String(n)}
                aria-label="Konaklama kapasitesi"
              />
            </section>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">Seyir (kişi)</p>
              <DualRangeSlider
                min={0}
                max={bounds.maxSailing}
                step={1}
                valueMin={sailMin}
                valueMax={sailMax}
                onChange={(a, b) => {
                  setSailMin(a)
                  setSailMax(b)
                }}
                formatValue={n => String(n)}
                aria-label="Seyir kapasitesi"
              />
            </section>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">WC</p>
              <DualRangeSlider
                min={0}
                max={bounds.maxWc}
                step={1}
                valueMin={wcMin}
                valueMax={wcMax}
                onChange={(a, b) => {
                  setWcMin(a)
                  setWcMax(b)
                }}
                formatValue={n => String(n)}
                aria-label="WC sayısı"
              />
            </section>

            <section className="mp-filter-section">
              <p className="mp-filter-heading">Kiralama türü</p>
              <div className="mp-check-stack">
                <label className="mp-check-row mp-check-row--block">
                  <input type="checkbox" checked={rentCaptain} onChange={e => setRentCaptain(e.target.checked)} />
                  <span className="mp-check-text">
                    Kaptanlı <span className="mp-check-paren">({rentalCounts.captain})</span>
                  </span>
                </label>
                <label className="mp-check-row mp-check-row--block">
                  <input type="checkbox" checked={rentBareboat} onChange={e => setRentBareboat(e.target.checked)} />
                  <span className="mp-check-text">
                    Mürettebatsız (bareboat){' '}
                    <span className="mp-check-paren">({rentalCounts.bare})</span>
                  </span>
                </label>
                <label className="mp-check-row mp-check-row--block">
                  <input type="checkbox" checked={rentCrewed} onChange={e => setRentCrewed(e.target.checked)} />
                  <span className="mp-check-text">
                    Mürettebatlı <span className="mp-check-paren">({rentalCounts.crew})</span>
                  </span>
                </label>
              </div>
            </section>
          </div>
        </aside>

        <div className="mp-main">
          <div className="mp-toolbar">
            <p className="mp-result-count">
              <strong>{visibleCount}</strong> tekne bulundu
            </p>
            <div className="mp-sort-wrap">
              <ArrowDownWideNarrow size={16} strokeWidth={2} aria-hidden className="mp-sort-ico" />
              <select className="mp-sort-select mp-sort-select--toolbar" value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sırala">
                {SORT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mp-body mp-body--flush">
            {!hasAnyBoats ? (
              <p className="mp-empty">Henüz aktif ilan yok. Onaylanan tekneler burada listelenecek.</p>
            ) : visibleCount === 0 ? (
              <p className="mp-empty">Bu filtrelere uygun tekne bulunamadı. Filtreleri sıfırlayın veya aralığı genişletin.</p>
            ) : (
              locations.map(loc => {
                const list = boats[loc] ?? []
                const filtered = sortBoats(list.filter(passesFilters), sortBy)

                return (
                  <section key={loc} className="mp-location-section" id={`loc-${loc}`}>
                    <div className="mp-loc-header">
                      <div>
                        <h2 className="mp-loc-title">{loc}</h2>
                        <p className="mp-loc-sub">
                          {filtered.length > 0 ? `${filtered.length} tekne mevcut` : 'Bu bölgede henüz aktif ilan yok'}
                        </p>
                      </div>
                      <a href={`/tekne-kiralama?konum=${encodeURIComponent(loc)}`} className="mp-loc-see-all">
                        Tümünü gör
                        <ChevronRight size={16} strokeWidth={2} aria-hidden />
                      </a>
                    </div>

                    {filtered.length > 0 ? (
                      <div className="mp-grid">
                        {filtered.slice(0, 4).map(boat => (
                          <BoatCard key={boat.id} boat={boat} />
                        ))}
                      </div>
                    ) : null}
                  </section>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
