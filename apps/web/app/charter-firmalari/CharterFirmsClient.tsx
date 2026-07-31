'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, X } from 'lucide-react'

import { CalMonth, fmtDate, type DateState } from '@/components/hero/heroSearchCalendar'

import { COUNTRIES, FIRMS } from './data'

interface GuestState {
  adult: number
  child: number
  infant: number
}

const GUEST_MAX = { adult: 12, child: 8, infant: 4 }

export default function CharterFirmsClient({ coverImageUrl }: { coverImageUrl?: string }) {
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'rental' | 'experience'>('rental')
  const [locationVal, setLocationVal] = useState('')

  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [guestOpen, setGuestOpen] = useState(false)

  const now = new Date()
  const [dateState, setDateState] = useState<DateState>({
    startDate: null,
    endDate: null,
    hoverDate: null,
    viewYear: now.getFullYear(),
    viewMonth: now.getMonth(),
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

  const prevMonth = () =>
    setDateState(prev => {
      const m = prev.viewMonth === 0 ? 11 : prev.viewMonth - 1
      const y = prev.viewMonth === 0 ? prev.viewYear - 1 : prev.viewYear
      return { ...prev, viewMonth: m, viewYear: y }
    })

  const nextMonth = () =>
    setDateState(prev => {
      const m = prev.viewMonth === 11 ? 0 : prev.viewMonth + 1
      const y = prev.viewMonth === 11 ? prev.viewYear + 1 : prev.viewYear
      return { ...prev, viewMonth: m, viewYear: y }
    })

  const clearDates = () =>
    setDateState(prev => ({ ...prev, startDate: null, endDate: null, hoverDate: null }))

  const month2 = dateState.viewMonth === 11 ? 0 : dateState.viewMonth + 1
  const year2 = dateState.viewMonth === 11 ? dateState.viewYear + 1 : dateState.viewYear

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
    if (guests.adult) parts.push(`${guests.adult} yetişkin`)
    if (guests.child) parts.push(`${guests.child} çocuk`)
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
      document.getElementById('charter-inp-location')?.focus()
      return
    }
    router.push(searchMode === 'rental' ? '/listing' : '/deneyimler')
  }

  const cities = useMemo(() => {
    if (!selectedCountry) return []
    const citySet = new Set(
      FIRMS.filter(firm => firm.countryId === selectedCountry).map(firm => firm.city),
    )
    return Array.from(citySet)
  }, [selectedCountry])

  const firms = useMemo(() => {
    return FIRMS
      .filter(firm => (selectedCountry ? firm.countryId === selectedCountry : true))
      .filter(firm => (selectedCity ? firm.city === selectedCity : true))
      .filter(firm => (query.trim() ? firm.name.toLowerCase().includes(query.trim().toLowerCase()) : true))
  }, [selectedCountry, selectedCity, query])

  const coverStyle = coverImageUrl
    ? { backgroundImage: `linear-gradient(180deg, rgba(8, 20, 36, 0.2), rgba(8, 20, 36, 0.45)), url(${coverImageUrl})` }
    : undefined

  const selectedCountryLabel = COUNTRIES.find(country => country.id === selectedCountry)?.label

  return (
    <section className="charter-page" aria-labelledby="charter-page-title">
      <div className="charter-page-cover" style={coverStyle}>
        <div className="charter-page-shell charter-page-cover-inner">
          <h1 id="charter-page-title" className="charter-page-title">
            Charter Firmaları
          </h1>
        </div>
      </div>

      <div className="charter-page-shell charter-filter-area">
        <div className="charter-floating-search">
          <div
            ref={searchOuterRef}
            className="search-outer hero-search-card-wrap charter-hero-search-wrap"
          >
            <div className="hero-mode-row">
              <div className="hero-picker" role="tablist" aria-label="Arama kategorisi">
                <span className="hero-pick-indicator" data-mode={searchMode} aria-hidden="true" />
                <button
                  type="button"
                  className={`hero-pick-btn${searchMode === 'rental' ? ' active' : ''}`}
                  role="tab"
                  aria-selected={searchMode === 'rental'}
                  onClick={() => setSearchMode('rental')}
                >
                  <span>Tekne Kiralama</span>
                </button>
                <button
                  type="button"
                  className={`hero-pick-btn${searchMode === 'experience' ? ' active' : ''}`}
                  role="tab"
                  aria-selected={searchMode === 'experience'}
                  onClick={() => setSearchMode('experience')}
                >
                  <span>Deneyim</span>
                </button>
              </div>
            </div>

            <div className="hero-search-card">
              <div className="hero-search-card__bar" role="search">
                <div
                  className="hero-field hero-field--loc hero-field--loc-single"
                  onClick={() => {
                    setDatePickerOpen(false)
                    setGuestOpen(false)
                  }}
                  role="group"
                  aria-label="Konum"
                >
                  <span className="hero-field-label">Konum</span>
                  <input
                    id="charter-inp-location"
                    className="hero-field-input"
                    placeholder={
                      searchMode === 'rental' ? 'Liman veya bölge seçin' : 'Konum veya kategori'
                    }
                    value={locationVal}
                    onChange={e => setLocationVal(e.target.value)}
                    autoComplete="off"
                  />
                  {locationVal ? (
                    <button
                      type="button"
                      className="hero-field-clear"
                      aria-label="Temizle"
                      onClick={e => {
                        e.stopPropagation()
                        setLocationVal('')
                      }}
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
                <button type="button" className="cal-clear-btn" onClick={clearDates}>
                  Temizle
                </button>
                <button type="button" className="cal-done-btn" onClick={() => setDatePickerOpen(false)}>
                  Kapat
                </button>
              </div>
            </div>

            <div
              className={`guest-popup guest-popup--hero${guestOpen ? ' open' : ''}`}
              role="dialog"
              aria-label="Misafir seçici"
            >
              {(
                [
                  { key: 'adult' as const, label: 'Yetişkin', sub: '13 yaş ve üzeri' },
                  { key: 'child' as const, label: 'Çocuk', sub: '2–12 yaş' },
                  { key: 'infant' as const, label: 'Bebek', sub: '2 yaş altı' },
                ] as const
              ).map(({ key, label, sub }) => (
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
                    >
                      −
                    </button>
                    <span className="g-num">{guests[key]}</span>
                    <button
                      type="button"
                      className="g-btn"
                      disabled={guests[key] >= GUEST_MAX[key]}
                      onClick={() => changeGuest(key, 1)}
                      aria-label={`${label} artır`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="guest-popup-actions">
                <button type="button" className="cal-done-btn" onClick={() => setGuestOpen(false)}>
                  Uygula
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="charter-filter-panel">
          <p className="charter-filter-intro">
            Sıradaki tekne kiralama ve deneyim planınız için SeaHub anlaşmalı charter firmalarını keşfedin.
          </p>

          <div className="charter-company-search">
            <input
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Firma ara"
              aria-label="Firma ara"
            />
          </div>

          {!selectedCountry ? (
            <>
              <p className="charter-filter-label">Ülkeye göre filtrele</p>
              <div className="charter-country-strip" role="tablist" aria-label="Ülke seçimi">
                {COUNTRIES.map(country => (
                  <button
                    key={country.id}
                    type="button"
                    className="charter-country-btn"
                    onClick={() => {
                      setSelectedCountry(country.id)
                      setSelectedCity(null)
                    }}
                    role="tab"
                    aria-selected={false}
                  >
                    <span>{country.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="charter-city-head">
                <button
                  type="button"
                  className="charter-back-btn"
                  onClick={() => {
                    setSelectedCountry(null)
                    setSelectedCity(null)
                  }}
                >
                  ← Ülkelere dön
                </button>
                <p className="charter-filter-label charter-filter-label--inline">
                  {selectedCountryLabel} / Şehre göre filtrele
                </p>
              </div>

              <div className="charter-country-strip" role="tablist" aria-label="Şehir seçimi">
                <button
                  type="button"
                  className={`charter-country-btn${selectedCity === null ? ' is-active' : ''}`}
                  onClick={() => setSelectedCity(null)}
                  role="tab"
                  aria-selected={selectedCity === null}
                >
                  Tümü
                </button>
                {cities.map(city => (
                  <button
                    key={city}
                    type="button"
                    className={`charter-country-btn${selectedCity === city ? ' is-active' : ''}`}
                    onClick={() => setSelectedCity(city)}
                    role="tab"
                    aria-selected={selectedCity === city}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="charter-page-shell charter-firms-wrap">
        <div className="charter-firms-grid">
          {firms.map(firm => (
            <Link className="charter-firm-card" key={firm.id} href={`/charter-firmalari/${firm.slug}`}>
              <div className={`charter-firm-logo tone-${firm.logoTone}`} aria-hidden="true">
                <span>{firm.logoText}</span>
              </div>
              <p className="charter-firm-name">{firm.name}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
