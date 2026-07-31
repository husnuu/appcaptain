'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Anchor,
  Calendar,
  Compass,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

import { DEFAULT_HERO, type HeroContent } from '@/lib/content/heroDefaults'
import {
  CalMonth,
  fmtDate,
  type DateState,
} from '@/components/hero/heroSearchCalendar'

export interface HeroSectionProps {
  content?: Partial<HeroContent>
}

type Mode = 'rental' | 'experience'

interface GuestState { adult: number; child: number; infant: number }

const GUEST_MAX = { adult: 12, child: 8, infant: 4 }

function stripLeadingDeco(s: string): string {
  if (!s) return s
  return s.replace(/^[^\p{L}\p{N}]+/u, '').trim() || s
}

export default function HeroSection({ content = {} }: HeroSectionProps) {
  const merged = { ...DEFAULT_HERO, ...content }
  const hero = {
    ...merged,
    backgroundImageUrl: merged.backgroundImageUrl?.trim() || DEFAULT_HERO.backgroundImageUrl,
  }
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('rental')
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [guestOpen, setGuestOpen] = useState(false)
  const [locationVal, setLocationVal] = useState('')

  const now = new Date()
  const [dateState, setDateState] = useState<DateState>({
    startDate: null, endDate: null, hoverDate: null,
    viewYear: now.getFullYear(), viewMonth: now.getMonth(),
  })
  const [guests, setGuests] = useState<GuestState>({ adult: 0, child: 0, infant: 0 })

  const searchOuterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!searchOuterRef.current?.contains(e.target as Node)) {
        setDatePickerOpen(false)
        setGuestOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDateSelect = useCallback((date: Date) => {
    setDateState(prev => {
      if (!prev.startDate || (prev.startDate && prev.endDate)) {
        return { ...prev, startDate: date, endDate: null, hoverDate: null }
      }
      if (date > prev.startDate) {
        setTimeout(() => setDatePickerOpen(false), 280)
        return { ...prev, endDate: date, hoverDate: null }
      }
      if (date < prev.startDate) {
        setTimeout(() => setDatePickerOpen(false), 280)
        return { ...prev, endDate: prev.startDate, startDate: date, hoverDate: null }
      }
      return prev
    })
  }, [])

  const handleHover = useCallback((d: Date | null) => {
    setDateState(prev => ({ ...prev, hoverDate: d }))
  }, [])

  const prevMonth = () => setDateState(prev => {
    const m = prev.viewMonth === 0 ? 11 : prev.viewMonth - 1
    const y = prev.viewMonth === 0 ? prev.viewYear - 1 : prev.viewYear
    return { ...prev, viewMonth: m, viewYear: y }
  })

  const nextMonth = () => setDateState(prev => {
    const m = prev.viewMonth === 11 ? 0 : prev.viewMonth + 1
    const y = prev.viewMonth === 11 ? prev.viewYear + 1 : prev.viewYear
    return { ...prev, viewMonth: m, viewYear: y }
  })

  const clearDates = () => setDateState(prev => ({ ...prev, startDate: null, endDate: null, hoverDate: null }))

  const month2 = dateState.viewMonth === 11 ? 0 : dateState.viewMonth + 1
  const year2  = dateState.viewMonth === 11 ? dateState.viewYear + 1 : dateState.viewYear

  const changeGuest = (type: keyof GuestState, delta: number) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(GUEST_MAX[type], prev[type] + delta)),
    }))
  }

  const guestLabel = () => {
    const total = guests.adult + guests.child + guests.infant
    if (!total) return 'Misafir ekle'
    const parts = []
    if (guests.adult)  parts.push(`${guests.adult} yetişkin`)
    if (guests.child)  parts.push(`${guests.child} çocuk`)
    if (guests.infant) parts.push(`${guests.infant} bebek`)
    return parts.join(', ')
  }

  const dateFieldLabel = () => {
    if (dateState.startDate && dateState.endDate) {
      return `${fmtDate(dateState.startDate)} – ${fmtDate(dateState.endDate)}`
    }
    if (dateState.startDate) return `${fmtDate(dateState.startDate)} – …`
    return 'Tarih seçin'
  }

  const handleSearch = () => {
    if (!locationVal.trim() && !dateState.startDate) {
      document.getElementById('inp-location')?.focus()
      return
    }
    router.push(mode === 'rental' ? '/listing' : '/deneyimler')
  }

  const eyebrowText     = stripLeadingDeco(hero.eyebrow)
  const rentalLabel     = stripLeadingDeco(hero.rentalTabLabel)
  const experienceLabel = stripLeadingDeco(hero.experienceTabLabel)

  return (
    <section className="hero" role="banner">
      <div className="hero-bg">
        <Image
          src={hero.backgroundImageUrl}
          alt={hero.titleLine1}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-glow hero-glow-1" aria-hidden="true" />
      <div className="hero-glow hero-glow-2" aria-hidden="true" />

      <div className="hero-content">
        <span className="hero-eyebrow">
          <Compass size={14} strokeWidth={2.2} aria-hidden="true" />
          <span>{eyebrowText}</span>
        </span>

        <h1 className="hero-title">
          {hero.titleLine1} {hero.titleLine2}
        </h1>

        <p className="hero-subtitle">{hero.subtitle}</p>

        <ul className="hero-trust" aria-label="Güven göstergeleri">
          <li className="trust-chip">
            <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>Anlık onay</span>
          </li>
          <li className="trust-chip">
            <Sparkles size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>12.000+ tekne &amp; deneyim</span>
          </li>
          <li className="trust-chip">
            <Anchor size={14} strokeWidth={2.2} aria-hidden="true" />
            <span>Türkiye geneli 80+ liman</span>
          </li>
        </ul>
      </div>

      <div className="hero-bridge">
        <div className="search-outer hero-search-card-wrap" ref={searchOuterRef}>
          {/* Kiralama | Deneyim — kartın üstünde ayrı çubuk */}
          <div className="hero-mode-row">
            <div className="hero-picker" role="tablist" aria-label="Arama kategorisi">
              <span
                className="hero-pick-indicator"
                data-mode={mode}
                aria-hidden="true"
              />
              <button
                type="button"
                className={`hero-pick-btn${mode === 'rental' ? ' active' : ''}`}
                role="tab"
                aria-selected={mode === 'rental'}
                onClick={() => setMode('rental')}
              >
                <span>{rentalLabel}</span>
              </button>
              <button
                type="button"
                className={`hero-pick-btn${mode === 'experience' ? ' active' : ''}`}
                role="tab"
                aria-selected={mode === 'experience'}
                onClick={() => setMode('experience')}
              >
                <span>{experienceLabel}</span>
              </button>
            </div>
          </div>

          <div className="hero-search-card">
            <div className="hero-search-card__bar" role="search">
              <div
                className="hero-field hero-field--loc hero-field--loc-single"
                onClick={() => { setDatePickerOpen(false); setGuestOpen(false) }}
                role="group"
                aria-label="Konum"
              >
                <span className="hero-field-label">Konum</span>
                <input
                  id="inp-location"
                  className="hero-field-input"
                  placeholder={mode === 'rental' ? 'Liman veya bölge seçin' : 'Konum veya kategori'}
                  value={locationVal}
                  onChange={e => setLocationVal(e.target.value)}
                  autoComplete="off"
                />
                {locationVal ? (
                  <button
                    type="button"
                    className="hero-field-clear"
                    aria-label="Temizle"
                    onClick={e => { e.stopPropagation(); setLocationVal('') }}
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                ) : null}
              </div>

              <div className="hero-field hero-field--date-wrap">
                <button
                  type="button"
                  className={`hero-field hero-field--date${datePickerOpen ? ' is-open' : ''}`}
                  aria-expanded={datePickerOpen}
                  aria-haspopup="dialog"
                  onClick={() => {
                    setGuestOpen(false)
                    setDatePickerOpen(o => !o)
                  }}
                >
                  <span className="hero-field-label">Tarihler</span>
                  <span className={`hero-field-value${dateState.startDate ? ' has-val' : ''}`}>
                    {dateFieldLabel()}
                  </span>
                  <Calendar size={18} strokeWidth={2} className="hero-field-cal-icon" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                className={`hero-field hero-field--guest${guestOpen ? ' is-open' : ''}`}
                aria-expanded={guestOpen}
                onClick={() => {
                  setDatePickerOpen(false)
                  setGuestOpen(g => !g)
                }}
              >
                <span className="hero-field-label">Misafir</span>
                <span className={`hero-field-value${guestLabel() !== 'Misafir ekle' ? ' has-val' : ''}`}>
                  {guestLabel()}
                </span>
              </button>

              <button type="button" className="hero-search-cta" aria-label="Ara" onClick={handleSearch}>
                <span className="hero-search-cta-text">Ara</span>
              </button>
            </div>
          </div>

          <div
            className={`cal-popup cal-popup--hero${datePickerOpen ? ' open' : ''}`}
            role="dialog"
            aria-label="Tarih seçici"
            aria-modal="true"
          >
            <div className="cal-inner">
              <div className="cal-months-wrap">
                <CalMonth
                  year={dateState.viewYear}
                  month={dateState.viewMonth}
                  isFirst
                  dateState={dateState}
                  onSelect={handleDateSelect}
                  onHover={handleHover}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                />
                <CalMonth
                  year={year2}
                  month={month2}
                  isFirst={false}
                  dateState={dateState}
                  onSelect={handleDateSelect}
                  onHover={handleHover}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                />
              </div>
            </div>
            <div className="cal-popup-footer">
              <button type="button" className="cal-clear-btn" onClick={clearDates}>Temizle</button>
              <button type="button" className="cal-done-btn" onClick={() => setDatePickerOpen(false)}>Kapat</button>
            </div>
          </div>

          <div className={`guest-popup guest-popup--hero${guestOpen ? ' open' : ''}`} role="dialog" aria-label="Misafir seçici">
            {([
              { key: 'adult' as const,  label: 'Yetişkin', sub: '13 yaş ve üzeri' },
              { key: 'child' as const,  label: 'Çocuk',    sub: '2–12 yaş'        },
              { key: 'infant' as const, label: 'Bebek',    sub: '2 yaş altı'      },
            ]).map(({ key, label, sub }) => (
              <div key={key} className="guest-row">
                <div>
                  <div className="guest-type-label">{label}</div>
                  <div className="guest-type-sub">{sub}</div>
                </div>
                <div className="guest-counter">
                  <button
                    type="button"
                    className="g-btn"
                    disabled={guests[key] === 0}
                    onClick={() => changeGuest(key, -1)}
                    aria-label={`${label} azalt`}
                  >−</button>
                  <span className="g-num">{guests[key]}</span>
                  <button
                    type="button"
                    className="g-btn"
                    disabled={guests[key] >= GUEST_MAX[key]}
                    onClick={() => changeGuest(key, 1)}
                    aria-label={`${label} artır`}
                  >+</button>
                </div>
              </div>
            ))}
            <div className="guest-popup-actions">
              <button type="button" className="cal-done-btn" onClick={() => setGuestOpen(false)}>Uygula</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
