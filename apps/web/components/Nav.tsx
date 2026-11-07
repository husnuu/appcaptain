'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import AuthModal from '@/components/auth/AuthModal'
import { CalendarDays, ChevronDown, CircleUserRound, MapPin, Menu, Search, Users } from 'lucide-react'
import { Logo } from '@/components/home/Logo'

const CAPTAIN_APP_URL = process.env.NEXT_PUBLIC_CAPTAIN_URL ?? 'https://appcaptain-captain.vercel.app'

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                   'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const TR_DAYS   = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz']

function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString() }
function fmtShort(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function NavCalMonth({
  year, month,
  startDate, endDate, hoverDate,
  onSelect, onHover,
  onPrev, onNext,
  showPrev, showNext,
}: {
  year: number; month: number
  startDate: Date | null; endDate: Date | null; hoverDate: Date | null
  onSelect: (d: Date) => void
  onHover: (d: Date | null) => void
  onPrev: () => void; onNext: () => void
  showPrev: boolean; showNext: boolean
}) {
  const today    = new Date(); today.setHours(0,0,0,0)
  const firstJS  = new Date(year, month, 1).getDay()
  const startOff = (firstJS + 6) % 7
  const daysInM  = new Date(year, month + 1, 0).getDate()

  const effEnd  = endDate ?? hoverDate
  const rangeS  = startDate && effEnd ? (startDate <= effEnd ? startDate : effEnd) : null
  const rangeE  = startDate && effEnd ? (startDate <= effEnd ? effEnd   : startDate) : null

  const cells: React.ReactNode[] = []
  for (let i = 0; i < startOff; i++) cells.push(<span key={`e${i}`} />)
  for (let i = 1; i <= daysInM; i++) {
    const d      = new Date(year, month, i)
    const isPast = d < today
    const isSel  = (startDate && isSameDay(d, startDate)) || (endDate && isSameDay(d, endDate))
    const isStart = startDate && isSameDay(d, startDate)
    const isEnd   = endDate   && isSameDay(d, endDate)
    const inRange = rangeS && rangeE && d > rangeS && d < rangeE
    cells.push(
      <button
        key={i}
        disabled={isPast}
        className={[
          'ncal-day',
          isPast    ? 'ncal-day--past'  : '',
          isSel     ? 'ncal-day--sel'   : '',
          isStart   ? 'ncal-day--start' : '',
          isEnd     ? 'ncal-day--end'   : '',
          inRange   ? 'ncal-day--range' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => !isPast && onSelect(d)}
        onMouseEnter={() => onHover(d)}
        onMouseLeave={() => onHover(null)}
      >
        {i}
      </button>
    )
  }

  return (
    <div className="ncal-month">
      <div className="ncal-header">
        {showPrev
          ? <button className="ncal-nav" onClick={onPrev} aria-label="Önceki ay">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          : <span />}
        <span className="ncal-title">{TR_MONTHS[month]} {year}</span>
        {showNext
          ? <button className="ncal-nav" onClick={onNext} aria-label="Sonraki ay">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          : <span />}
      </div>
      <div className="ncal-grid">
        {TR_DAYS.map(d => <span key={d} className="ncal-weekday">{d}</span>)}
        {cells}
      </div>
    </div>
  )
}

interface LocationSuggestion {
  label: string
  sub: string
}

const DEFAULT_SUGGESTIONS: LocationSuggestion[] = [
  { label: 'Göcek',    sub: 'Muğla, Türkiye' },
  { label: 'Bodrum',   sub: 'Muğla, Türkiye' },
  { label: 'Marmaris', sub: 'Muğla, Türkiye' },
  { label: 'Çeşme',   sub: 'İzmir, Türkiye' },
  { label: 'Antalya',  sub: 'Antalya, Türkiye' },
]

const DISCOVER_ITEMS = [
  {
    href: '/forum',
    label: 'Forum',
    desc: 'Denizci topluluğuna katılın, soru sorun',
  },
  {
    href: '/blog',
    label: 'Deniz Rehberi',
    desc: 'Rotalar, ipuçları ve deneyim hikayeleri',
  },
  {
    href: '/#map-section',
    label: 'Rota Haritası',
    desc: 'Türkiye kıyılarını haritadan keşfedin',
  },
  {
    href: '/kaptanlar',
    label: 'Kaptanlar',
    desc: 'Lisanslı ve onaylı kaptanlarla tanışın',
  },
  {
    href: '/cashback',
    label: 'Cashback Programı',
    desc: '%5 ile %15 arasında geri kazanın',
  },
]

const USER_MENU_BOTTOM = [
  { href: '/tekne-kiralama', label: 'Tekne Kiralama' },
  { href: '/deneyimler',     label: 'Deneyimler' },
  { href: '/#neden-ahoy',   label: 'Neden Ahoy' },
  { href: '/forum',          label: 'Forum' },
  { href: '/blog',           label: 'Deniz Rehberi' },
  { href: '/cashback',       label: 'Cashback Programı' },
]

interface NavProps {
  logoUrl?: string | null
  locationSuggestions?: LocationSuggestion[]
}

export default function Nav({ logoUrl = null, locationSuggestions = DEFAULT_SUGGESTIONS }: NavProps) {
  const router = useRouter()
  const [discoverOpen,  setDiscoverOpen]  = useState(false)
  const [userMenuOpen,  setUserMenuOpen]  = useState(false)
  const [user,          setUser]          = useState<User | null>(null)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | null>(null)
  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searchMode,    setSearchMode]    = useState<'rental' | 'experience'>('rental')
  const [activeField,   setActiveField]   = useState<'location' | 'date' | 'guests' | null>(null)
  const [location,      setLocation]      = useState('')
  const [guests,        setGuests]        = useState(0)
  // Calendar state
  const now = new Date()
  const [calYear,    setCalYear]    = useState(now.getFullYear())
  const [calMonth,   setCalMonth]   = useState(now.getMonth())
  const [startDate,  setStartDate]  = useState<Date | null>(null)
  const [endDate,    setEndDate]    = useState<Date | null>(null)
  const [hoverDate,  setHoverDate]  = useState<Date | null>(null)

  function handleCalSelect(d: Date) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(d); setEndDate(null)
    } else {
      if (d < startDate) { setStartDate(d); setEndDate(null) }
      else { setEndDate(d); setActiveField('guests') }
    }
  }
  function calPrev() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  function calNext() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }
  const month2 = calMonth === 11 ? 0 : calMonth + 1
  const year2  = calMonth === 11 ? calYear + 1 : calYear

  const datePlaceholder = startDate
    ? endDate
      ? `${fmtShort(startDate)} — ${fmtShort(endDate)}`
      : `${fmtShort(startDate)} — ?`
    : 'Tarih ekleyin'

  const discoverRef  = useRef<HTMLDivElement>(null)
  const userMenuRef  = useRef<HTMLDivElement>(null)
  const searchRef    = useRef<HTMLDivElement>(null)

  // Track the logged-in customer session
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Close all dropdowns/panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!discoverRef.current?.contains(e.target as Node)) setDiscoverOpen(false)
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false)
      if (!searchRef.current?.contains(e.target as Node)) {
        setSearchOpen(false)
        setActiveField(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredSuggestions = locationSuggestions.filter(s =>
    !location || s.label.toLowerCase().includes(location.toLowerCase())
  )

  const locationPlaceholder =
    searchMode === 'rental'
      ? 'Göcek, Bodrum, Marmaris…'
      : 'Dalış, gün batımı, yoga veya lokasyon…'

  const handleSearchSubmit = () => {
    const q = location.trim()
    const path = searchMode === 'rental' ? '/tekne-kiralama' : '/deneyimler'
    const qs = q ? `?city=${encodeURIComponent(q)}` : ''
    setSearchOpen(false)
    setActiveField(null)
    router.push(`${path}${qs}`)
  }

  return (
    <>
      {/* Page overlay when search is open */}
      {searchOpen && (
        <div
          className="nav-search-overlay"
          onClick={() => { setSearchOpen(false); setActiveField(null) }}
          aria-hidden="true"
        />
      )}
    <nav
      className={`sh-nav${searchOpen ? ' sh-nav--open' : ''}`}
      role="navigation"
      aria-label="Ana navigasyon"
    >
      <div className="sh-container sh-nav-inner">

        {/* Logo + Keşfedin */}
        <div className="sh-nav-left">
          <Link href="/" className="sh-nav-logo" aria-label="Ahoy ana sayfa">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Ahoy"
                width={220}
                height={44}
                className="nav-logo-mark"
                unoptimized
                priority
              />
            ) : (
              <Logo />
            )}
          </Link>

          <div className="nav-discover-wrap" ref={discoverRef}>
            <button
              className={`sh-pill-btn${discoverOpen ? ' open' : ''}`}
              onClick={() => setDiscoverOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={discoverOpen}
            >
              Keşfedin
              <ChevronDown
                size={16}
                strokeWidth={2}
                aria-hidden="true"
                style={{ transform: discoverOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>

            {discoverOpen && (
              <div className="nav-dropdown" role="menu" aria-label="Keşfedin alt menüsü">
                <div className="nav-dropdown-grid">
                  {DISCOVER_ITEMS.map(item => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={() => setDiscoverOpen(false)}
                    >
                      <div>
                        <div className="nav-dropdown-label">{item.label}</div>
                        <div className="nav-dropdown-desc">{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Orta: arama */}
        <div className="sh-nav-center" ref={searchRef}>
            {!searchOpen && (
              <button
                className="sh-search-pill"
                onClick={() => { setSearchOpen(true); setActiveField('location') }}
                aria-label="Arama formunu aç"
              >
                <span className="sh-sp-field">
                  <MapPin size={18} fill="currentColor" stroke="#fff" strokeWidth={1.5} aria-hidden="true" />
                  {location || 'Nereye?'}
                </span>
                <span className="sh-sp-div" aria-hidden="true" />
                <span className="sh-sp-field">
                  <CalendarDays size={18} aria-hidden="true" />
                  {startDate && endDate ? `${fmtShort(startDate)} – ${fmtShort(endDate)}` : 'Ne zaman?'}
                </span>
                <span className="sh-sp-div" aria-hidden="true" />
                <span className="sh-sp-field">
                  <Users size={18} fill="currentColor" aria-hidden="true" />
                  {guests > 0 ? `${guests} misafir` : 'Misafir'}
                </span>
                <span className="sh-sp-btn" aria-hidden="true">
                  <Search size={20} strokeWidth={2} />
                </span>
              </button>
            )}

            {/* Expanded search bar */}
            {searchOpen && (
              <div className="nse-panel" role="search">
                <p className="nse-panel-eyebrow">Ne arıyorsunuz?</p>
                <div className="nse-mode" role="tablist" aria-label="Kiralama veya deneyim">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={searchMode === 'rental'}
                    className={`nse-mode-opt${searchMode === 'rental' ? ' nse-mode-opt--active' : ''}`}
                    onClick={() => setSearchMode('rental')}
                  >
                    <span className="nse-mode-text">
                      <span className="nse-mode-label">Tekne kiralama</span>
                      <span className="nse-mode-desc">Gulet, yelkenli, motoryat ve diğer tekneler</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={searchMode === 'experience'}
                    className={`nse-mode-opt${searchMode === 'experience' ? ' nse-mode-opt--active' : ''}`}
                    onClick={() => setSearchMode('experience')}
                  >
                    <span className="nse-mode-text">
                      <span className="nse-mode-label">Deneyim</span>
                      <span className="nse-mode-desc">Turlar, dalış, etkinlikler ve günlük aktiviteler</span>
                    </span>
                  </button>
                </div>

                <div className="nse-bar">
                {/* Location field */}
                <div
                  className={`nse-field${activeField === 'location' ? ' nse-field--active' : ''}`}
                  onClick={() => setActiveField('location')}
                >
                  <span className="nse-label">{searchMode === 'rental' ? 'Liman veya rota' : 'Deneyim veya yer'}</span>
                  <input
                    autoFocus
                    className="nse-input"
                    placeholder={locationPlaceholder}
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    aria-label="Konum"
                  />
                  {/* Location suggestions */}
                  {activeField === 'location' && (
                    <div className="nse-suggestions">
                      <p className="nse-sug-title">Önerilen noktalar</p>
                      {filteredSuggestions.map(s => (
                        <button
                          key={s.label}
                          className="nse-sug-item"
                          onClick={() => { setLocation(s.label); setActiveField('date') }}
                        >
                          <span className="nse-sug-ico" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                            </svg>
                          </span>
                          <span>
                            <span className="nse-sug-label">{s.label}</span>
                            <span className="nse-sug-sub">{s.sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="nse-divider" aria-hidden="true" />

                {/* Date field */}
                <div
                  className={`nse-field nse-field--date${activeField === 'date' ? ' nse-field--active' : ''}`}
                  onClick={() => setActiveField('date')}
                >
                  <span className="nse-label">Ne zaman?</span>
                  <span className={`nse-placeholder${startDate ? ' nse-placeholder--filled' : ''}`}>
                    {datePlaceholder}
                  </span>

                  {/* Two-month calendar dropdown */}
                  {activeField === 'date' && (
                    <div className="nse-calendar" onClick={e => e.stopPropagation()}>
                      {/* Clear button */}
                      {(startDate || endDate) && (
                        <button
                          className="ncal-clear"
                          onClick={() => { setStartDate(null); setEndDate(null) }}
                        >
                          Tarihleri temizle
                        </button>
                      )}
                      <div className="ncal-months-wrap">
                        <NavCalMonth
                          year={calYear} month={calMonth}
                          startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                          onSelect={handleCalSelect}
                          onHover={setHoverDate}
                          onPrev={calPrev} onNext={calNext}
                          showPrev={true} showNext={false}
                        />
                        <NavCalMonth
                          year={year2} month={month2}
                          startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                          onSelect={handleCalSelect}
                          onHover={setHoverDate}
                          onPrev={calPrev} onNext={calNext}
                          showPrev={false} showNext={true}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="nse-divider" aria-hidden="true" />

                {/* Guests field */}
                <div
                  className={`nse-field nse-field--guests${activeField === 'guests' ? ' nse-field--active' : ''}`}
                  onClick={() => setActiveField('guests')}
                >
                  <span className="nse-label">Kişiler</span>
                  <span className="nse-placeholder">{guests > 0 ? `${guests} misafir` : 'Misafir ekleyin'}</span>
                  {activeField === 'guests' && (
                    <div className="nse-guest-picker">
                      <span className="nse-gp-label">Misafir sayısı</span>
                      <div className="nse-gp-row">
                        <button className="nse-gp-btn" onClick={e => { e.stopPropagation(); setGuests(g => Math.max(0, g - 1)) }} disabled={guests === 0}>−</button>
                        <span className="nse-gp-num">{guests}</span>
                        <button className="nse-gp-btn" onClick={e => { e.stopPropagation(); setGuests(g => Math.min(20, g + 1)) }}>+</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search button */}
                <button
                  className="nse-submit"
                  type="button"
                  onClick={handleSearchSubmit}
                  aria-label={searchMode === 'rental' ? 'Tekne kiralama ara' : 'Deneyim ara'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <span>{searchMode === 'rental' ? 'Kiralama ara' : 'Deneyim ara'}</span>
                </button>

                </div>
              </div>
            )}
        </div>

        {/* Sağ: Kaptan Paneli + menü */}
        <div className="sh-nav-right">
          <a href={CAPTAIN_APP_URL} className="sh-btn sh-btn--navy sh-captain-btn">Kaptan Paneli</a>

          {/* User menu */}
          <div className="nav-user-wrap" ref={userMenuRef}>
            <button
              className={`sh-menu-pill${userMenuOpen ? ' open' : ''}`}
              onClick={() => setUserMenuOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={userMenuOpen}
              aria-label="Kullanıcı menüsü"
            >
              <Menu size={26} strokeWidth={2} aria-hidden="true" />
              {user?.email ? (
                <span className="sh-menu-avatar" aria-hidden="true">{user.email.charAt(0).toUpperCase()}</span>
              ) : (
                <CircleUserRound size={30} strokeWidth={1.8} aria-hidden="true" />
              )}
            </button>

            {userMenuOpen && (
              <div className="nav-user-dropdown" role="menu" aria-label="Kullanıcı menüsü">
                {/* Top: auth links */}
                <div className="nav-ud-section">
                  {user ? (
                    <>
                      <div className="nav-ud-item nav-ud-item--email" role="none">{user.email}</div>
                      <Link href="/hesabim" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>Hesabım</Link>
                      <Link href="/rezervasyonlarim" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>Rezervasyonlarım</Link>
                      <button
                        type="button"
                        className="nav-ud-item nav-ud-item--button"
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); void supabase.auth.signOut() }}
                      >
                        Çıkış yap
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="nav-ud-item nav-ud-item--button nav-ud-item--bold"
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); setAuthModalMode('signin') }}
                      >
                        Giriş yap
                      </button>
                      <button
                        type="button"
                        className="nav-ud-item nav-ud-item--button"
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); setAuthModalMode('signup') }}
                      >
                        Kayıt ol
                      </button>
                    </>
                  )}
                  <a href={CAPTAIN_APP_URL} className="nav-ud-item nav-ud-item--bold" role="menuitem" onClick={() => setUserMenuOpen(false)}>Kaptan Paneli</a>
                </div>
                <div className="nav-ud-divider" aria-hidden="true" />
                {/* Bottom: nav links */}
                <div className="nav-ud-section">
                  {USER_MENU_BOTTOM.map(item => (
                    <Link key={item.href} href={item.href} className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      {item.label}
                    </Link>
                  ))}
                </div>
                <div className="nav-ud-divider" aria-hidden="true" />
                {/* Bottom util */}
                <div className="nav-ud-section">
                  <Link href="#" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>Yardım Merkezi</Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </nav>

    {authModalMode ? (
      <AuthModal initialMode={authModalMode} onClose={() => setAuthModalMode(null)} />
    ) : null}
    </>
  )
}
