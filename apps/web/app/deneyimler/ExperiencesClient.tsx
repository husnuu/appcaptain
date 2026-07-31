'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownWideNarrow,
  Filter,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import ExperienceCard, { type Experience } from '@/components/marketplace/ExperienceCard'
import ExperienceCarousel from '@/components/marketplace/ExperienceCarousel'
import DualRangeSlider from '@/components/marketplace/DualRangeSlider'
import PriceHistogram from '@/components/marketplace/PriceHistogram'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'reviews', label: 'En Çok Değerlendirilen' },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
]

const DURATION_FILTERS = [
  { value: 'all', label: 'Tüm süreler' },
  { value: 'short', label: '3 saate kadar' },
  { value: 'half', label: '3–6 saat' },
  { value: 'full', label: '6+ saat' },
  { value: 'multi', label: 'Çok günlük' },
]

function parseDurationHours(d: string): number {
  if (d.includes('gün')) return d.startsWith('1') ? 8 : 24
  const m = d.match(/[\d.]+/)
  return m ? parseFloat(m[0]) : 0
}

function sortExperiences(list: Experience[], sortBy: string): Experience[] {
  const copy = [...list]
  switch (sortBy) {
    case 'rating':
      return copy.sort((a, b) => b.rating - a.rating)
    case 'reviews':
      return copy.sort((a, b) => b.reviewCount - a.reviewCount)
    case 'price-asc':
      return copy.sort((a, b) => a.startingPrice - b.startingPrice)
    case 'price-desc':
      return copy.sort((a, b) => b.startingPrice - a.startingPrice)
    default:
      return copy
  }
}

function computePriceBounds(experiences: Experience[]) {
  if (experiences.length === 0) return { minPrice: 0, maxPrice: 10000 }
  let minPrice = Infinity
  let maxPrice = 0
  for (const e of experiences) {
    minPrice = Math.min(minPrice, e.startingPrice)
    maxPrice = Math.max(maxPrice, e.startingPrice)
  }
  return { minPrice, maxPrice }
}

function buildPriceBuckets(
  experiences: Experience[],
  extentMin: number,
  extentMax: number,
  bins = 18,
): number[] {
  const counts = Array.from({ length: bins }, () => 0)
  const range = extentMax - extentMin || 1
  for (const e of experiences) {
    const p = e.startingPrice
    let i = Math.floor(((p - extentMin) / range) * bins)
    if (i < 0) i = 0
    if (i >= bins) i = bins - 1
    counts[i] = (counts[i] ?? 0) + 1
  }
  return counts
}

interface Props {
  experiences: Experience[]
  locations: string[]
  categories: string[]
}

export default function ExperiencesClient({ experiences, locations, categories }: Props) {
  const [search, setSearch] = useState('')
  const [activeLocation, setActiveLocation] = useState<string | null>(null)
  const [locFilters, setLocFilters] = useState<string[]>([])
  const [catFilters, setCatFilters] = useState<string[]>([])
  const [activeDuration, setActiveDuration] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [onlyBadge, setOnlyBadge] = useState(false)
  const [onlyBestSeller, setOnlyBestSeller] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const bounds = useMemo(() => computePriceBounds(experiences), [experiences])
  const [priceMin, setPriceMin] = useState(bounds.minPrice)
  const [priceMax, setPriceMax] = useState(bounds.maxPrice)

  useEffect(() => {
    setPriceMin(bounds.minPrice)
    setPriceMax(bounds.maxPrice)
  }, [bounds])

  const priceBuckets = useMemo(
    () => buildPriceBuckets(experiences, bounds.minPrice, bounds.maxPrice),
    [experiences, bounds.minPrice, bounds.maxPrice],
  )

  const categoryRows = useMemo(() => categories.filter(c => c !== 'Tümü'), [categories])

  const passesFilters = useCallback(
    (e: Experience): boolean => {
      if (activeLocation && e.location !== activeLocation) return false
      if (!activeLocation && locFilters.length > 0 && !locFilters.includes(e.location)) return false
      if (catFilters.length > 0 && !catFilters.includes(e.category)) return false
      if (e.startingPrice < priceMin || e.startingPrice > priceMax) return false
      if (onlyBadge && !e.badge) return false
      if (onlyBestSeller && !e.isBestSeller) return false
      const q = search.toLowerCase().trim()
      if (
        q &&
        !e.title.toLowerCase().includes(q) &&
        !e.location.toLowerCase().includes(q) &&
        !e.category.toLowerCase().includes(q)
      )
        return false
      if (activeDuration !== 'all') {
        const h = parseDurationHours(e.duration)
        if (activeDuration === 'short' && !(h <= 3)) return false
        if (activeDuration === 'half' && !(h > 3 && h <= 6)) return false
        if (activeDuration === 'full' && !(h > 6 && h < 20)) return false
        if (activeDuration === 'multi' && !(h >= 20)) return false
      }
      return true
    },
    [
      activeLocation,
      locFilters,
      catFilters,
      priceMin,
      priceMax,
      onlyBadge,
      onlyBestSeller,
      search,
      activeDuration,
    ],
  )

  const filtered = useMemo(() => {
    const list = experiences.filter(passesFilters)
    return sortExperiences(list, sortBy)
  }, [experiences, passesFilters, sortBy])

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(activeLocation) ||
    locFilters.length > 0 ||
    catFilters.length > 0 ||
    activeDuration !== 'all' ||
    onlyBadge ||
    onlyBestSeller ||
    priceMin > bounds.minPrice ||
    priceMax < bounds.maxPrice

  const featured = useMemo(() => {
    const hot = experiences.filter(e => e.isBestSeller || e.badge)
    const pool = hot.length >= 6 ? hot : experiences
    return [...pool].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8)
  }, [experiences])

  const grouped = useMemo(() => {
    const map: Record<string, Experience[]> = {}
    const base = hasActiveFilters ? filtered : experiences
    base.forEach(e => {
      const list = map[e.location] ?? (map[e.location] = [])
      list.push(e)
    })
    for (const loc of Object.keys(map)) {
      map[loc] = sortExperiences(map[loc] ?? [], 'reviews')
    }
    return map
  }, [experiences, filtered, hasActiveFilters])

  const fmtMoney = (n: number) =>
    `${n.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺`

  const resetFilters = () => {
    setSearch('')
    setLocFilters([])
    setCatFilters([])
    setActiveLocation(null)
    setActiveDuration('all')
    setPriceMin(bounds.minPrice)
    setPriceMax(bounds.maxPrice)
    setOnlyBadge(false)
    setOnlyBestSeller(false)
    setSortBy('recommended')
    setFiltersOpen(false)
  }

  const toggleCat = (cat: string) => {
    setCatFilters(prev => (prev.includes(cat) ? prev.filter(x => x !== cat) : [...prev, cat]))
  }

  const focusLocation = (loc: string) => {
    setLocFilters([])
    setActiveLocation(loc)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="gyg-page">
      <div className="gyg-top">
        <div className="gyg-top-inner">
          <h1 className="gyg-page-title">Deneyimler</h1>
          <p className="gyg-page-lede">
            Tekne turlarından dalışa — doğrulanmış rehberlerle şeffaf fiyatlar ve net süreler.
          </p>

          <div className="gyg-search-row">
            <div className="gyg-search-field">
              <Search size={20} strokeWidth={2} aria-hidden className="gyg-search-ico" />
              <input
                type="search"
                className="gyg-search-input"
                placeholder="Deneyim veya destinasyon ara"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Deneyim ara"
              />
              {search ? (
                <button
                  type="button"
                  className="gyg-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Aramayı temizle"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className={`gyg-filter-btn${filtersOpen ? ' gyg-filter-btn--on' : ''}`}
              onClick={() => setFiltersOpen(o => !o)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={18} strokeWidth={2} aria-hidden />
              Filtrele
            </button>
          </div>

          <div className="gyg-loc-chips" role="tablist" aria-label="Destinasyonlar">
            <button
              type="button"
              role="tab"
              className={`gyg-chip${!activeLocation && locFilters.length === 0 ? ' gyg-chip--on' : ''}`}
              onClick={() => {
                setActiveLocation(null)
                setLocFilters([])
              }}
            >
              Tümü
            </button>
            {locations.map(loc => (
              <button
                key={loc}
                type="button"
                role="tab"
                aria-selected={activeLocation === loc}
                className={`gyg-chip${activeLocation === loc ? ' gyg-chip--on' : ''}`}
                onClick={() => focusLocation(loc)}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="gyg-filters-panel" role="region" aria-label="Filtreler">
          <div className="gyg-filters-inner">
            <div className="gyg-filters-head">
              <h2 className="gyg-filters-title">
                <Filter size={18} strokeWidth={2} aria-hidden />
                Filtreler
              </h2>
              <button type="button" className="gyg-reset" onClick={resetFilters}>
                <RotateCcw size={14} strokeWidth={2} aria-hidden />
                Sıfırla
              </button>
            </div>

            <div className="gyg-filters-grid">
              <section className="gyg-filter-block">
                <p className="gyg-filter-label">Süre</p>
                <select
                  className="gyg-select"
                  value={activeDuration}
                  onChange={e => setActiveDuration(e.target.value)}
                  aria-label="Süre filtresi"
                >
                  {DURATION_FILTERS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </section>

              <section className="gyg-filter-block gyg-filter-block--wide">
                <p className="gyg-filter-label">Fiyat aralığı</p>
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
                      : Math.max(50, Math.round((bounds.maxPrice - bounds.minPrice) / 400))
                  }
                  valueMin={priceMin}
                  valueMax={priceMax}
                  onChange={(a, b) => {
                    setPriceMin(a)
                    setPriceMax(b)
                  }}
                  formatValue={fmtMoney}
                  aria-label="Başlangıç fiyat aralığı"
                />
              </section>

              <section className="gyg-filter-block">
                <p className="gyg-filter-label">Kategori</p>
                <div className="gyg-check-grid">
                  {categoryRows.map(cat => (
                    <label key={cat} className="gyg-check">
                      <input type="checkbox" checked={catFilters.includes(cat)} onChange={() => toggleCat(cat)} />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="gyg-filter-block">
                <p className="gyg-filter-label">Öne çıkanlar</p>
                <label className="gyg-check">
                  <input type="checkbox" checked={onlyBadge} onChange={e => setOnlyBadge(e.target.checked)} />
                  <span>SeaHub Onaylı</span>
                </label>
                <label className="gyg-check">
                  <input
                    type="checkbox"
                    checked={onlyBestSeller}
                    onChange={e => setOnlyBestSeller(e.target.checked)}
                  />
                  <span>Çok Satan</span>
                </label>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      <div className="gyg-main">
        {experiences.length === 0 ? (
          <p className="gyg-empty">Henüz aktif deneyim yok. Onaylanan deneyimler burada listelenecek.</p>
        ) : hasActiveFilters ? (
          <>
            <div className="gyg-results-bar">
              <p className="gyg-results-count">
                <strong>{filtered.length}</strong> deneyim
                {activeLocation ? ` — ${activeLocation}` : ''}
              </p>
              <div className="gyg-sort-wrap">
                <ArrowDownWideNarrow size={16} strokeWidth={2} aria-hidden />
                <select
                  className="gyg-sort-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  aria-label="Sırala"
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="gyg-empty">
                Bu filtrelere uygun deneyim bulunamadı.{' '}
                <button type="button" onClick={resetFilters}>
                  Filtreleri sıfırla
                </button>
              </p>
            ) : (
              <div className="gyg-grid">
                {filtered.map(exp => (
                  <ExperienceCard key={exp.id} exp={exp} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <section className="gyg-featured" aria-label="Öne çıkan deneyimler">
              <div className="gyg-featured-bg" aria-hidden />
              <div className="gyg-featured-inner">
                <h2 className="gyg-featured-title">Öne çıkan deneyimler</h2>
                <div className="gyg-featured-track">
                  {featured.map(exp => (
                    <ExperienceCard key={exp.id} exp={exp} variant="featured" />
                  ))}
                </div>
              </div>
            </section>

            {Object.entries(grouped).map(([loc, exps]) => (
              <ExperienceCarousel
                key={loc}
                title={`${loc} — popüler deneyimler`}
                subtitle={`${exps.length} deneyim`}
                items={exps.slice(0, 12)}
                onSeeAll={() => focusLocation(loc)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
