'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import AuthModal from '@/components/auth/AuthModal'
import RangeCalendar, { type DateRangeValue } from '@/components/sh/RangeCalendar'
import { CalendarDays, CircleUserRound, MapPin, Menu, Minus, Plus, Search, Users } from 'lucide-react'
import { Logo } from '@/components/home/Logo'

const CAPTAIN_APP_URL = process.env.NEXT_PUBLIC_CAPTAIN_URL ?? 'https://appcaptain-captain.vercel.app'

function fmtShort(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

interface LocationSuggestion {
  label: string
  sub: string
}

const DEFAULT_SUGGESTIONS: LocationSuggestion[] = [
  { label: 'Göcek', sub: 'Muğla, Türkiye' },
  { label: 'Bodrum', sub: 'Muğla, Türkiye' },
  { label: 'Marmaris', sub: 'Muğla, Türkiye' },
  { label: 'Çeşme', sub: 'İzmir, Türkiye' },
  { label: 'Antalya', sub: 'Antalya, Türkiye' },
]

/** Masaüstü header'ın ortasındaki sayfa bağlantıları (sayfa en üstteyken). */
const NAV_LINKS: { href: string; label: string; match: (path: string) => boolean }[] = [
  { href: '/tekne-kiralama', label: 'Tekneler', match: p => p.startsWith('/tekne-kiralama') || p.startsWith('/listing') },
  { href: '/deneyimler', label: 'Deneyimler', match: p => p.startsWith('/deneyimler') },
  { href: '/neden-ahoy', label: 'Neden Ahoy', match: p => p.startsWith('/neden-ahoy') },
]

const USER_MENU_PAGES = [
  { href: '/tekne-kiralama', label: 'Tekneler' },
  { href: '/deneyimler', label: 'Deneyimler' },
  { href: '/neden-ahoy', label: 'Neden Ahoy' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
]
const USER_MENU_DISCOVER = [
  { href: '/forum', label: 'Forum' },
  { href: '/blog', label: 'Deniz Rehberi' },
  { href: '/#map-section', label: 'Rota Haritası' },
  { href: '/kaptanlar', label: 'Kaptanlar' },
  { href: '/cashback', label: 'Cashback Programı' },
]

/** Header yüksekliği; sayfadaki büyük arama bunun altına kayınca kompakt arama görünür. */
const NAV_HEIGHT = 96

type Mode = 'rental' | 'experience'
type Field = 'location' | 'date' | 'guests' | null

interface NavProps {
  logoUrl?: string | null
  locationSuggestions?: LocationSuggestion[]
}

export default function Nav({ logoUrl = null, locationSuggestions = DEFAULT_SUGGESTIONS }: NavProps) {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | null>(null)
  const closeAuth = useCallback(() => setAuthModalMode(null), [])

  // üstteyken bağlantılar, kaydırınca kompakt arama
  const [compact, setCompact] = useState(false)
  // genişletilmiş arama
  const [searchOpen, setSearchOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('rental')
  const [field, setField] = useState<Field>(null)
  const [location, setLocation] = useState('')
  const [guests, setGuests] = useState(0)
  const [range, setRange] = useState<DateRangeValue>({ start: null, end: null })

  const navRef = useRef<HTMLElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)

  // Giriş yapmış müşteri oturumu
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Sayfada büyük arama kutusu varsa (ana sayfa hero'su) o header'ın altına kayınca,
  // yoksa biraz kaydırınca kompakt aramaya geç.
  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector('[data-hero-search]') as HTMLElement | null
      setCompact(hero ? hero.getBoundingClientRect().bottom < NAV_HEIGHT : window.scrollY > 80)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pathname])

  const closeSearch = useCallback(() => {
    setSearchOpen(false)
    setField(null)
  }, [])

  // Sayfa değişince açık panelleri kapat
  useEffect(() => {
    closeSearch()
    setUserMenuOpen(false)
  }, [pathname, closeSearch])

  // Dışarı tıklama ve Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false)
      if (!navRef.current?.contains(e.target as Node)) closeSearch()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      closeSearch()
      setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [closeSearch])

  const openSearch = (f: Field = 'location') => {
    setSearchOpen(true)
    setField(f)
    if (f === 'location') requestAnimationFrame(() => locationInputRef.current?.focus())
  }

  const submit = () => {
    const q = location.trim()
    const path = mode === 'rental' ? '/tekne-kiralama' : '/deneyimler'
    closeSearch()
    router.push(q ? `${path}?city=${encodeURIComponent(q)}` : path)
  }

  const suggestions = locationSuggestions.filter(
    s => !location || s.label.toLocaleLowerCase('tr').includes(location.toLocaleLowerCase('tr')),
  )
  const dateText = range.start ? `${fmtShort(range.start)} — ${range.end ? fmtShort(range.end) : '?'}` : null

  return (
    <>
      {searchOpen && <div className="nav-search-overlay" onClick={closeSearch} aria-hidden="true" />}
      <nav
        ref={navRef}
        className={`sh-nav${compact ? ' sh-nav--compact' : ''}${searchOpen ? ' sh-nav--open' : ''}`}
        role="navigation"
        aria-label="Ana navigasyon"
      >
        <div className="sh-container sh-nav-inner">
          {/* Logo */}
          <div className="sh-nav-left">
            <Link href="/" className="sh-nav-logo" aria-label="Ahoy ana sayfa">
              {logoUrl ? (
                <Image src={logoUrl} alt="Ahoy" width={220} height={44} className="nav-logo-mark" unoptimized priority />
              ) : (
                <Logo />
              )}
            </Link>
          </div>

          {/* Orta: sayfa bağlantıları ↔ kompakt arama ↔ (açıkken) arama türü sekmeleri */}
          <div className="sh-nav-center">
            {searchOpen ? (
              <div className="sh-nav-modes" role="tablist" aria-label="Arama türü">
                {(
                  [
                    ['rental', 'Tekne kiralama'],
                    ['experience', 'Deneyimler'],
                  ] as const
                ).map(([key, label]) => (
                  <button key={key} type="button" role="tab" aria-selected={mode === key} className={mode === key ? 'is-active' : undefined} onClick={() => setMode(key)}>
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="sh-nav-links" aria-hidden={compact}>
                  {NAV_LINKS.map(l => (
                    <Link key={l.label} href={l.href} className={l.match(pathname) ? 'is-active' : undefined} tabIndex={compact ? -1 : undefined}>
                      {l.label}
                    </Link>
                  ))}
                </div>
                <button
                  type="button"
                  className="sh-search-pill"
                  onClick={() => openSearch('location')}
                  aria-label="Arama formunu aç"
                  aria-hidden={!compact}
                  tabIndex={compact ? undefined : -1}
                >
                  <span className="sh-sp-field">
                    <MapPin size={18} fill="currentColor" stroke="#fff" strokeWidth={1.5} aria-hidden="true" />
                    {location || 'Nereye?'}
                  </span>
                  <span className="sh-sp-div" aria-hidden="true" />
                  <span className="sh-sp-field">
                    <CalendarDays size={18} aria-hidden="true" />
                    {range.start && range.end ? `${fmtShort(range.start)} – ${fmtShort(range.end)}` : 'Ne zaman?'}
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
              </>
            )}
          </div>

          {/* Sağ: Kaptan Paneli + menü */}
          <div className="sh-nav-right">
            <a href={CAPTAIN_APP_URL} className="sh-btn sh-btn--navy sh-captain-btn">
              Kaptan Paneli
            </a>

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
                  <span className="sh-menu-avatar" aria-hidden="true">
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <CircleUserRound size={30} strokeWidth={1.8} aria-hidden="true" />
                )}
              </button>

              {userMenuOpen && (
                <div className="nav-user-dropdown" role="menu" aria-label="Kullanıcı menüsü">
                  <div className="nav-ud-section">
                    {user ? (
                      <>
                        <div className="nav-ud-item nav-ud-item--email" role="none">
                          {user.email}
                        </div>
                        <Link href="/hesabim" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          Hesabım
                        </Link>
                        <Link href="/rezervasyonlarim" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          Rezervasyonlarım
                        </Link>
                        <Link href="/mesajlarim" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          Mesajlarım
                        </Link>
                        <Link href="/hesabim#favoriler" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          Favorilerim
                        </Link>
                        <button
                          type="button"
                          className="nav-ud-item nav-ud-item--button"
                          role="menuitem"
                          onClick={() => {
                            setUserMenuOpen(false)
                            void supabase.auth.signOut()
                          }}
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
                          onClick={() => {
                            setUserMenuOpen(false)
                            setAuthModalMode('signin')
                          }}
                        >
                          Giriş yap
                        </button>
                        <button
                          type="button"
                          className="nav-ud-item nav-ud-item--button"
                          role="menuitem"
                          onClick={() => {
                            setUserMenuOpen(false)
                            setAuthModalMode('signup')
                          }}
                        >
                          Kayıt ol
                        </button>
                      </>
                    )}
                    <a href={CAPTAIN_APP_URL} className="nav-ud-item nav-ud-item--bold" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      Kaptan Paneli
                    </a>
                  </div>
                  <div className="nav-ud-divider" aria-hidden="true" />
                  <div className="nav-ud-section">
                    {USER_MENU_PAGES.map(item => (
                      <Link key={item.href} href={item.href} className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="nav-ud-divider" aria-hidden="true" />
                  <div className="nav-ud-section">
                    {USER_MENU_DISCOVER.map(item => (
                      <Link key={item.href} href={item.href} className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        {item.label}
                      </Link>
                    ))}
                    <Link href="#" className="nav-ud-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                      Yardım Merkezi
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Genişletilmiş arama çubuğu (ikinci satır) */}
          {searchOpen && (
            <div className="sh-nsb-wrap">
              <form
                className={`sh-nsb${field ? ' has-active' : ''}`}
                role="search"
                onSubmit={e => {
                  e.preventDefault()
                  submit()
                }}
              >
                <label className={`sh-nsf sh-nsf--loc${field === 'location' ? ' is-active' : ''}`} onClick={() => setField('location')}>
                  <span className="sh-nsf-label">Nereye</span>
                  <input
                    ref={locationInputRef}
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    onFocus={() => setField('location')}
                    placeholder={mode === 'rental' ? 'Liman veya bölge ara' : 'Deneyim veya bölge ara'}
                    aria-label="Nereye"
                  />
                </label>
                <button type="button" className={`sh-nsf${field === 'date' ? ' is-active' : ''}`} onClick={() => setField(f => (f === 'date' ? null : 'date'))}>
                  <span className="sh-nsf-label">Ne zaman</span>
                  <span className={`sh-nsf-value${dateText ? '' : ' is-empty'}`}>{dateText ?? 'Tarih ekle'}</span>
                </button>
                <button type="button" className={`sh-nsf sh-nsf--guests${field === 'guests' ? ' is-active' : ''}`} onClick={() => setField(f => (f === 'guests' ? null : 'guests'))}>
                  <span className="sh-nsf-label">Kişiler</span>
                  <span className={`sh-nsf-value${guests ? '' : ' is-empty'}`}>{guests > 0 ? `${guests} misafir` : 'Misafir ekle'}</span>
                </button>
                <button type="submit" className="sh-nsb-go" aria-label={mode === 'rental' ? 'Tekne ara' : 'Deneyim ara'}>
                  <Search size={20} strokeWidth={2.4} aria-hidden="true" />
                  <span>Ara</span>
                </button>

                {field === 'location' && suggestions.length > 0 && (
                  <div className="sh-pop sh-pop-list sh-nsb-pop sh-nsb-pop--loc">
                    <p className="sh-nsb-pop-title">Önerilen yerler</p>
                    {suggestions.map(s => (
                      <button
                        key={s.label}
                        type="button"
                        className="sh-pop-item sh-nsb-sug"
                        onClick={() => {
                          setLocation(s.label)
                          setField('date')
                        }}
                      >
                        <span className="sh-nsb-sug-ico" aria-hidden="true">
                          <MapPin size={18} strokeWidth={1.8} />
                        </span>
                        <span>
                          <b>{s.label}</b>
                          <span>{s.sub}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {field === 'date' && (
                  <div className="sh-pop sh-nsb-pop sh-nsb-pop--cal">
                    <RangeCalendar
                      value={range}
                      onChange={v => {
                        setRange(v)
                        if (v.start && v.end) setField('guests')
                      }}
                    />
                  </div>
                )}
                {field === 'guests' && (
                  <div className="sh-pop sh-nsb-pop sh-nsb-pop--guests">
                    <div className="sh-nsb-guests">
                      <span>
                        <b>Misafir</b>
                        <small>Teknedeki toplam kişi</small>
                      </span>
                      <div className="sh-stepper sh-stepper--sm">
                        <button type="button" aria-label="Azalt" disabled={guests === 0} onClick={() => setGuests(g => Math.max(0, g - 1))}>
                          <Minus size={15} />
                        </button>
                        <span>
                          <b>{guests}</b>
                        </span>
                        <button type="button" aria-label="Arttır" disabled={guests >= 30} onClick={() => setGuests(g => g + 1)}>
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </nav>

      {authModalMode ? <AuthModal initialMode={authModalMode} onClose={closeAuth} /> : null}
    </>
  )
}
