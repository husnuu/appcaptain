'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowDownWideNarrow,
  Check,
  Headset,
  Minus,
  Plus,
  RotateCcw,
  Sailboat,
  ShieldCheck,
  Ship,
  SlidersHorizontal,
  UserRoundCheck,
  X,
} from 'lucide-react'
import type { PublicBoatSummary } from '@/lib/api'
import BoatListCard from '@/components/boats/BoatListCard'
import { CashbackCard } from '@/components/home/HomeStatic'
import { TRUST_FEATURES } from '@/components/home/content'
import { boatTypeLabel, listingModelLabel, lowestPrice } from '@/lib/boatFormat'

type Sort = 'recommended' | 'price-asc' | 'price-desc' | 'newest' | 'capacity'
const SORTS: { value: Sort; label: string }[] = [
  { value: 'recommended', label: 'Önerilen' },
  { value: 'price-asc', label: 'Fiyat: Düşükten yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten düşüğe' },
  { value: 'capacity', label: 'Kapasite: En geniş' },
  { value: 'newest', label: 'Model yılı: En yeni' },
]

const TRUST_ICONS = { shield: ShieldCheck, ship: Ship, headset: Headset, user: UserRoundCheck }

type Range = [number, number]
type Crew = 'with' | 'without'

interface Filters {
  city: string
  types: string[]
  models: string[]
  price: Range
  instant: boolean
  flexible: boolean
  crew: Crew[]
  guests: number
  cabins: number
  berths: number
  length: Range
  power: Range
}

interface Bounds {
  price: Range
  length: Range
  power: Range
  currency: string
  maxGuests: number
}

const norm = (s: string) => s.toLocaleLowerCase('tr').trim()

/** Değerleri adım katlarına yuvarlayarak kaydırıcı sınırı üretir. */
function niceBounds(values: number[], step: number): Range {
  if (values.length === 0) return [0, step]
  const lo = Math.floor(Math.min(...values) / step) * step
  const hi = Math.ceil(Math.max(...values) / step) * step
  return [lo, hi > lo ? hi : lo + step]
}

const priceStep = (r: Range) => (r[1] - r[0] <= 2000 ? 50 : r[1] - r[0] <= 10000 ? 100 : 500)
const isFull = (r: Range, b: Range) => r[0] <= b[0] && r[1] >= b[1]
const inRange = (v: number | null | undefined, r: Range, b: Range) => isFull(r, b) || (v != null && v >= r[0] && v <= r[1])

interface Props {
  boats: PublicBoatSummary[]
  initialCity: string
  initialType: string
}

export default function RentalClient({ boats, initialCity, initialType }: Props) {
  const bounds = useMemo<Bounds>(() => {
    const prices = boats.map(b => lowestPrice(b.pricing)?.price).filter((v): v is number => v != null)
    const rawPrice = niceBounds(prices, 10)
    return {
      price: niceBounds(prices, priceStep(rawPrice)),
      length: niceBounds(boats.map(b => b.length).filter((v): v is number => v != null), 1),
      power: niceBounds(boats.map(b => b.enginePowerHp).filter((v): v is number => v != null), 10),
      currency: boats.flatMap(b => b.pricing)[0]?.currency ?? 'EUR',
      maxGuests: Math.max(12, ...boats.map(b => b.capacity ?? 0)),
    }
  }, [boats])

  const blank = useMemo<Filters>(
    () => ({
      city: '',
      types: [],
      models: [],
      price: bounds.price,
      instant: false,
      flexible: false,
      crew: [],
      guests: 0,
      cabins: 0,
      berths: 0,
      length: bounds.length,
      power: bounds.power,
    }),
    [bounds],
  )

  const [f, setF] = useState<Filters>(() => ({
    ...blank,
    city: initialCity,
    types: initialType ? initialType.split(',').filter(Boolean) : [],
  }))
  const [sort, setSort] = useState<Sort>('recommended')
  const [drawer, setDrawer] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setF(cur => ({ ...cur, [key]: value }))
  const toggleIn = <K extends 'types' | 'models' | 'crew'>(key: K, value: Filters[K][number]) =>
    setF(cur => {
      const list = cur[key] as string[]
      return { ...cur, [key]: list.includes(value) ? list.filter(x => x !== value) : [...list, value] }
    })

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Paylaşılabilir URL: lokasyon ve tekne tipleri adres çubuğunda tutulur.
  useEffect(() => {
    const qs = new URLSearchParams()
    if (f.city) qs.set('city', f.city)
    if (f.types.length) qs.set('type', f.types.join(','))
    const next = `${window.location.pathname}${qs.toString() ? `?${qs}` : ''}`
    window.history.replaceState(null, '', next)
  }, [f.city, f.types])

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  const cities = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of boats) if (b.city) m.set(b.city, (m.get(b.city) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [boats])

  const types = useMemo(() => {
    const m = new Map<string, { label: string; count: number }>()
    for (const b of boats) {
      if (!b.boatType) continue
      const cur = m.get(b.boatType.key)
      m.set(b.boatType.key, { label: boatTypeLabel(b.boatType) ?? b.boatType.label, count: (cur?.count ?? 0) + 1 })
    }
    // URL'den gelen ama henüz ilanı olmayan tip de listede görünür (0 tekne).
    for (const t of f.types) if (!m.has(t)) m.set(t, { label: boatTypeLabel({ key: t, label: t }) ?? t, count: 0 })
    return [...m.entries()]
  }, [boats, f.types])

  const modelOptions = useMemo(() => {
    const m = new Map<string, string>()
    for (const b of boats) for (const lm of b.listingModels) m.set(lm.key, listingModelLabel(lm.key, lm.label))
    return [...m.entries()]
  }, [boats])

  const hasCrewData = boats.some(b => b.crewCount != null)
  const hasPower = boats.some(b => b.enginePowerHp != null)
  const hasLength = boats.some(b => b.length != null)

  const filtered = useMemo(() => {
    const list = boats.filter(b => {
      const price = lowestPrice(b.pricing)?.price
      if (f.city && norm(b.city ?? '') !== norm(f.city)) return false
      if (f.types.length && !f.types.includes(b.boatType?.key ?? '')) return false
      if (f.models.length && !b.listingModels.some(m => f.models.includes(m.key))) return false
      if (!inRange(price, f.price, bounds.price)) return false
      if (f.instant && !b.instantBooking) return false
      if (f.flexible && b.cancellationPolicy !== 'flexible') return false
      if (f.crew.length === 1) {
        if (b.crewCount == null) return false
        if (f.crew[0] === 'with' ? b.crewCount === 0 : b.crewCount > 0) return false
      }
      if (f.guests && (b.capacity ?? 0) < f.guests) return false
      if (f.cabins && (b.cabinCount ?? 0) < f.cabins) return false
      if (f.berths && (b.berths ?? 0) < f.berths) return false
      if (!inRange(b.length, f.length, bounds.length)) return false
      if (!inRange(b.enginePowerHp, f.power, bounds.power)) return false
      return true
    })
    const price = (b: PublicBoatSummary) => lowestPrice(b.pricing)?.price ?? Number.POSITIVE_INFINITY
    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => price(a) - price(b))
      case 'price-desc':
        return [...list].sort((a, b) => (price(b) === Infinity ? -1 : price(b)) - (price(a) === Infinity ? -1 : price(a)))
      case 'capacity':
        return [...list].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0))
      case 'newest':
        return [...list].sort((a, b) => (b.productionYear ?? 0) - (a.productionYear ?? 0))
      default:
        return list
    }
  }, [boats, f, bounds, sort])

  const money = (n: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: bounds.currency, maximumFractionDigits: 0 }).format(n)

  const chips = [
    f.city && { key: 'city', label: f.city, clear: () => set('city', '') },
    ...f.types.map(t => ({ key: `t-${t}`, label: types.find(([k]) => k === t)?.[1].label ?? t, clear: () => toggleIn('types', t) })),
    ...f.models.map(m => ({ key: `m-${m}`, label: listingModelLabel(m), clear: () => toggleIn('models', m) })),
    !isFull(f.price, bounds.price) && { key: 'price', label: `${money(f.price[0])} – ${money(f.price[1])}`, clear: () => set('price', bounds.price) },
    f.instant && { key: 'instant', label: 'Anında rezervasyon', clear: () => set('instant', false) },
    f.flexible && { key: 'flex', label: 'Esnek iptal', clear: () => set('flexible', false) },
    ...f.crew.map(c => ({ key: `c-${c}`, label: c === 'with' ? 'Kaptanlı' : 'Kaptansız', clear: () => toggleIn('crew', c) })),
    f.guests > 0 && { key: 'guests', label: `${f.guests}+ kişi`, clear: () => set('guests', 0) },
    f.cabins > 0 && { key: 'cabins', label: `${f.cabins}+ kabin`, clear: () => set('cabins', 0) },
    f.berths > 0 && { key: 'berths', label: `${f.berths}+ yatak`, clear: () => set('berths', 0) },
    !isFull(f.length, bounds.length) && { key: 'len', label: `${f.length[0]}–${f.length[1]} m`, clear: () => set('length', bounds.length) },
    !isFull(f.power, bounds.power) && { key: 'pow', label: `${f.power[0]}–${f.power[1]} hp`, clear: () => set('power', bounds.power) },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[]

  const reset = () => setF(blank)
  const title = f.city ? `${f.city} tekne kiralama` : 'Tekne kiralama'

  const panel = (
    <FilterPanel
      f={f}
      bounds={bounds}
      set={set}
      toggleIn={toggleIn}
      cities={cities}
      types={types}
      modelOptions={modelOptions}
      totalBoats={boats.length}
      hasCrewData={hasCrewData}
      hasPower={hasPower}
      hasLength={hasLength}
      money={money}
    />
  )

  return (
    <div className="sh-home sh-rl-page">
      <div className="sh-container">
        <nav className="sh-crumbs" aria-label="Sayfa yolu">
          <Link href="/">Ana sayfa</Link>
          <span aria-hidden="true">/</span>
          {f.city ? (
            <>
              <Link href="/tekne-kiralama" onClick={() => set('city', '')}>
                Tekne kiralama
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{f.city}</span>
            </>
          ) : (
            <span aria-current="page">Tekne kiralama</span>
          )}
        </nav>
        <header className="sh-rl-head">
          <h1 className="sh-rl-title">{title}</h1>
          <p className="sh-rl-sub">Doğrulanmış kaptanların teknelerini karşılaştır, sana uygun olanı seç ve rezervasyon talebini gönder.</p>
        </header>

        <div className="sh-rl">
          <aside className="sh-rl-side" aria-label="Filtreler">
            <div className="sh-flt-top">
              <h2>Filtreler</h2>
              {chips.length > 0 && (
                <button type="button" className="sh-link-btn" onClick={reset}>
                  Temizle
                </button>
              )}
            </div>
            {panel}
          </aside>

          <section className="sh-rl-main" aria-labelledby="rl-count">
            <div className="sh-rl-bar">
              <div>
                <h2 className="sh-rl-count" id="rl-count">
                  {filtered.length > 0 ? `${filtered.length} tekne mevcut` : 'Uygun tekne yok'}
                </h2>
                <p className="sh-rl-note">Fiyatlar seçilen kiralama türünün başlangıç fiyatıdır.</p>
              </div>
              <div className="sh-rl-actions">
                <button type="button" className="sh-pill-btn sh-rl-filterbtn" onClick={() => setDrawer(true)}>
                  <SlidersHorizontal size={17} strokeWidth={2} aria-hidden="true" /> Filtreler
                  {chips.length > 0 && <span className="sh-count">{chips.length}</span>}
                </button>
                <div className="sh-sort" ref={sortRef}>
                  <button
                    type="button"
                    className={`sh-pill-btn${sortOpen ? ' open' : ''}`}
                    onClick={() => setSortOpen(o => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                  >
                    <ArrowDownWideNarrow size={17} strokeWidth={2} aria-hidden="true" />
                    {SORTS.find(s => s.value === sort)?.label}
                  </button>
                  {sortOpen && (
                    <ul className="sh-pop sh-pop-list sh-sort-list" role="listbox">
                      {SORTS.map(s => (
                        <li key={s.value}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={sort === s.value}
                            className="sh-pop-item sh-sort-item"
                            onClick={() => {
                              setSort(s.value)
                              setSortOpen(false)
                            }}
                          >
                            <b>{s.label}</b>
                            {sort === s.value && <Check size={16} aria-hidden="true" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {chips.length > 0 && (
              <div className="sh-rent-chips">
                {chips.map(c => (
                  <button key={c.key} type="button" className="sh-fchip" onClick={c.clear}>
                    {c.label} <X size={14} strokeWidth={2.2} aria-label="Kaldır" />
                  </button>
                ))}
                <button type="button" className="sh-link-btn" onClick={reset}>
                  Tümünü temizle
                </button>
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="sh-bgrid sh-bgrid--rl">
                {filtered.map(b => (
                  <BoatListCard key={b.id} boat={b} />
                ))}
              </div>
            ) : (
              <div className="sh-empty">
                <span className="sh-empty-ico">
                  <Sailboat size={30} strokeWidth={1.6} />
                </span>
                <h3>{f.city ? `${f.city} için uygun tekne bulunamadı` : 'Uygun tekne bulunamadı'}</h3>
                <p>Filtreleri gevşetmeyi ya da yakındaki lokasyonlara göz atmayı deneyebilirsin.</p>
                {chips.length > 0 && (
                  <button type="button" className="sh-btn sh-btn--navy" onClick={reset}>
                    <RotateCcw size={16} aria-hidden="true" /> Filtreleri temizle
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="sh-rent-why">
          {TRUST_FEATURES.map(t => {
            const Icon = TRUST_ICONS[t.icon]
            return (
              <div key={t.title} className="sh-why">
                <span className="sh-why-ico">
                  <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
      <CashbackCard />

      {/* ---------- mobil filtre çekmecesi ---------- */}
      {drawer &&
        createPortal(
          <div className="sh-drawer-overlay" onClick={() => setDrawer(false)}>
            <aside className="sh-drawer" role="dialog" aria-modal="true" aria-label="Filtreler" onClick={e => e.stopPropagation()}>
              <header className="sh-drawer-head">
                <h2>Filtreler</h2>
                <button type="button" className="sh-icon-btn" onClick={() => setDrawer(false)} aria-label="Kapat">
                  <X size={20} />
                </button>
              </header>
              <div className="sh-drawer-body">{panel}</div>
              <footer className="sh-drawer-foot">
                <button type="button" className="sh-link-btn" onClick={reset}>
                  Temizle
                </button>
                <button type="button" className="sh-btn sh-btn--navy" onClick={() => setDrawer(false)}>
                  {filtered.length} tekneyi göster
                </button>
              </footer>
            </aside>
          </div>,
          document.body,
        )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface PanelProps {
  f: Filters
  bounds: Bounds
  set: <K extends keyof Filters>(key: K, value: Filters[K]) => void
  toggleIn: <K extends 'types' | 'models' | 'crew'>(key: K, value: Filters[K][number]) => void
  cities: [string, number][]
  types: [string, { label: string; count: number }][]
  modelOptions: [string, string][]
  totalBoats: number
  hasCrewData: boolean
  hasPower: boolean
  hasLength: boolean
  money: (n: number) => string
}

function FilterPanel({ f, bounds, set, toggleIn, cities, types, modelOptions, totalBoats, hasCrewData, hasPower, hasLength, money }: PanelProps) {
  return (
    <div className="sh-flt">
      {cities.length > 0 && (
        <section className="sh-flt-sec">
          <h3>Lokasyon</h3>
          <div className="sh-check-list">
            <CheckRow on={!f.city} radio label="Tüm lokasyonlar" count={totalBoats} onClick={() => set('city', '')} />
            {cities.map(([c, n]) => (
              <CheckRow key={c} on={f.city === c} radio label={c} count={n} onClick={() => set('city', f.city === c ? '' : c)} />
            ))}
          </div>
        </section>
      )}

      {types.length > 0 && (
        <section className="sh-flt-sec">
          <h3>Tekne tipi</h3>
          <div className="sh-check-list">
            {types.map(([k, t]) => (
              <CheckRow key={k} on={f.types.includes(k)} label={t.label} count={t.count} onClick={() => toggleIn('types', k)} />
            ))}
          </div>
        </section>
      )}

      {bounds.price[1] > bounds.price[0] && (
        <section className="sh-flt-sec">
          <h3>Başlangıç fiyatı</h3>
          <RangeFilter
            bounds={bounds.price}
            step={priceStep(bounds.price)}
            value={f.price}
            onChange={v => set('price', v)}
            format={money}
            unit={bounds.currency === 'EUR' ? '€' : bounds.currency === 'TRY' ? '₺' : bounds.currency}
            plusAtMax
          />
        </section>
      )}

      <section className="sh-flt-sec">
        <Toggle
          on={f.instant}
          onChange={v => set('instant', v)}
          label="Anında rezervasyon"
          hint="Kaptanın onayını beklemeden rezervasyon yap"
        />
        <Toggle on={f.flexible} onChange={v => set('flexible', v)} label="Esnek iptal" hint="Esnek iptal politikası olan tekneler" />
      </section>

      {hasCrewData && (
        <section className="sh-flt-sec">
          <h3>Kaptan</h3>
          <div className="sh-check-list">
            <CheckRow on={f.crew.includes('with')} label="Kaptanlı" onClick={() => toggleIn('crew', 'with')} />
            <CheckRow on={f.crew.includes('without')} label="Kaptansız" onClick={() => toggleIn('crew', 'without')} />
          </div>
        </section>
      )}

      <section className="sh-flt-sec">
        <Counter label="Kişi sayısı" value={f.guests} max={bounds.maxGuests} onChange={v => set('guests', v)} />
        <Counter label="Kabin sayısı" value={f.cabins} max={10} onChange={v => set('cabins', v)} />
        <Counter label="Yatak sayısı" value={f.berths} max={20} onChange={v => set('berths', v)} />
      </section>

      {modelOptions.length > 0 && (
        <section className="sh-flt-sec">
          <h3>Kiralama türü</h3>
          <div className="sh-check-list">
            {modelOptions.map(([k, label]) => (
              <CheckRow key={k} on={f.models.includes(k)} label={label} onClick={() => toggleIn('models', k)} />
            ))}
          </div>
        </section>
      )}

      {hasLength && bounds.length[1] > bounds.length[0] && (
        <section className="sh-flt-sec">
          <h3>
            Tekne boyu
            <small>
              {f.length[0]} – {f.length[1]}
              {f.length[1] >= bounds.length[1] ? '+' : ''} m
            </small>
          </h3>
          <RangeFilter bounds={bounds.length} step={1} value={f.length} onChange={v => set('length', v)} hideInputs />
        </section>
      )}

      {hasPower && bounds.power[1] > bounds.power[0] && (
        <section className="sh-flt-sec">
          <h3>
            Motor gücü
            <small>
              {f.power[0]} – {f.power[1]}
              {f.power[1] >= bounds.power[1] ? '+' : ''} hp
            </small>
          </h3>
          <RangeFilter bounds={bounds.power} step={10} value={f.power} onChange={v => set('power', v)} hideInputs />
        </section>
      )}
    </div>
  )
}

function CheckRow({ on, label, count, radio, onClick }: { on: boolean; label: string; count?: number; radio?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`sh-check${on ? ' is-on' : ''}${radio ? ' sh-check--radio' : ''}`} aria-pressed={on} onClick={onClick}>
      <span className="sh-check-box">{on && (radio ? <span className="sh-check-dot" /> : <Check size={14} strokeWidth={3} />)}</span>
      <span className="sh-check-label">{label}</span>
      {count != null && <span className="sh-check-count">{count}</span>}
    </button>
  )
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="sh-flt-toggle">
      <span>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className="sh-switch" onClick={() => onChange(!on)} />
    </div>
  )
}

function Counter({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="sh-flt-count">
      <span>{label}</span>
      <div className="sh-mini-stepper">
        <button type="button" aria-label={`${label} azalt`} disabled={value <= 0} onClick={() => onChange(value - 1)}>
          <Minus size={16} strokeWidth={2.2} />
        </button>
        <output aria-live="polite">{value === 0 ? 'Tümü' : `${value}+`}</output>
        <button type="button" aria-label={`${label} arttır`} disabled={value >= max} onClick={() => onChange(value + 1)}>
          <Plus size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}

function RangeFilter({
  bounds,
  step,
  value,
  onChange,
  format,
  unit,
  plusAtMax,
  hideInputs,
}: {
  bounds: Range
  step: number
  value: Range
  onChange: (v: Range) => void
  format?: (n: number) => string
  unit?: string
  plusAtMax?: boolean
  hideInputs?: boolean
}) {
  const [lo, hi] = value
  const span = bounds[1] - bounds[0] || 1
  const pct = (v: number) => ((v - bounds[0]) / span) * 100
  const clamp = (v: number) => Math.min(bounds[1], Math.max(bounds[0], v))

  return (
    <div>
      <div className="sh-range">
        <span className="sh-range-track" />
        <span className="sh-range-fill" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          min={bounds[0]}
          max={bounds[1]}
          step={step}
          value={lo}
          aria-label="En az"
          aria-valuetext={format ? format(lo) : String(lo)}
          onChange={e => onChange([Math.min(Number(e.target.value), hi - step), hi])}
        />
        <input
          type="range"
          min={bounds[0]}
          max={bounds[1]}
          step={step}
          value={hi}
          aria-label="En çok"
          aria-valuetext={format ? format(hi) : String(hi)}
          onChange={e => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
        />
      </div>
      {!hideInputs && (
        <div className="sh-range-inputs">
          <NumberBox label="Minimum" unit={unit} value={lo} onCommit={v => onChange([clamp(Math.min(v, hi - step)), hi])} />
          <span aria-hidden="true">–</span>
          <NumberBox
            label="Maksimum"
            unit={unit}
            value={hi}
            suffix={plusAtMax && hi >= bounds[1] ? '+' : ''}
            onCommit={v => onChange([lo, clamp(Math.max(v, lo + step))])}
          />
        </div>
      )}
    </div>
  )
}

function NumberBox({ label, unit, value, suffix = '', onCommit }: { label: string; unit?: string; value: number; suffix?: string; onCommit: (v: number) => void }) {
  const [text, setText] = useState<string | null>(null)
  const shown = text ?? `${value.toLocaleString('tr-TR')}${suffix}`
  const commit = () => {
    if (text == null) return
    const n = Number(text.replace(/[^\d]/g, ''))
    if (text.trim() !== '' && Number.isFinite(n)) onCommit(n)
    setText(null)
  }
  return (
    <label>
      {label}
      <span>
        {unit && <i>{unit}</i>}
        <input
          inputMode="numeric"
          value={shown}
          onFocus={() => setText(String(value))}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
      </span>
    </label>
  )
}
