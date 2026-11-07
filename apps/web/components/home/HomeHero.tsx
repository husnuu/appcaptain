'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, MapPin, Search, Users } from 'lucide-react'
import { fmtDate } from '@/components/hero/heroSearchCalendar'
import RangeCalendar, { type DateRangeValue } from '@/components/sh/RangeCalendar'
import { HERO_SUGGESTIONS, PROMOS } from './content'

type Tab = 'all' | 'rental' | 'experience'
type Field = 'location' | 'date' | 'guests' | null

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'rental', label: 'Tekne Kirala' },
  { key: 'experience', label: 'Deneyimler' },
]

// Mobil hero sekmeleri — markanın üç ana yolu; seçime göre arama metni ve hedef sayfa değişir.
const MOBILE_TABS: { key: Tab; label: string; placeholder: string }[] = [
  { key: 'all', label: 'Tümü', placeholder: 'Nereye gitmek istersin?' },
  { key: 'rental', label: 'Tekne Kirala', placeholder: 'Kiralama için liman seç' },
  { key: 'experience', label: 'Deneyimler', placeholder: 'Deneyim için bölge seç' },
]

export default function HomeHero() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [field, setField] = useState<Field>(null)
  const [location, setLocation] = useState('')
  const [guests, setGuests] = useState(0)
  const [range, setRange] = useState<DateRangeValue>({ start: null, end: null })
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!cardRef.current?.contains(e.target as Node)) setField(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const dateLabel = range.start
    ? `${fmtDate(range.start)} — ${range.end ? fmtDate(range.end) : '?'}`
    : 'Tarihleri seçin'

  const submit = () => {
    const q = location.trim()
    const path = tab === 'experience' ? '/deneyimler' : '/tekne-kiralama'
    setField(null)
    router.push(q ? `${path}?city=${encodeURIComponent(q)}` : path)
  }

  const suggestions = HERO_SUGGESTIONS.filter(
    s => !location || s.label.toLocaleLowerCase('tr').includes(location.toLocaleLowerCase('tr')),
  )

  return (
    <section className="sh-hero" aria-label="Ahoy">
      {/* ---------- mobil hero: tam ekran görsel + beyaz başlık ---------- */}
      <div className="sh-mhero">
        {/* Fotoğraf: Artem Bryzgalov, Unsplash (Ölüdeniz, Fethiye) — Unsplash Lisansı */}
        <Image src="/home/hero-mobile-oludeniz.webp" alt="Ölüdeniz lagünü ve kumsalda demirli tekneler, Fethiye" fill priority sizes="100vw" quality={85} />
        <div className="sh-mhero-shade" aria-hidden="true" />
        <div className="sh-mhero-body">
          <h1 className="sh-mhero-title">
            Deniz senin
            <span>yeni rotan.</span>
          </h1>
          <p className="sh-mhero-lede">Yelkenliden lüks yata, dalış turundan gün batımına kadar tüm deniz maceraları tek adreste.</p>
          <div className="sh-mhero-tabs" role="tablist" aria-label="Arama türü">
            {MOBILE_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                className={tab === key ? 'is-active' : undefined}
                onClick={() => setTab(key)}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
          <form
            className="sh-mhero-search"
            role="search"
            onSubmit={e => {
              e.preventDefault()
              submit()
            }}
          >
            <MapPin size={20} fill="currentColor" stroke="#fff" strokeWidth={1.6} aria-hidden="true" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder={MOBILE_TABS.find(t => t.key === tab)?.placeholder}
              aria-label="Liman veya bölge"
              list="sh-mhero-places"
              enterKeyHint="search"
            />
            <datalist id="sh-mhero-places">
              {HERO_SUGGESTIONS.map(s => (
                <option key={s.label} value={s.label}>
                  {s.sub}
                </option>
              ))}
            </datalist>
            <button type="submit" aria-label={tab === 'experience' ? 'Deneyim ara' : 'Tekne ara'}>
              <Search size={20} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>

      <div className="sh-container sh-hero-stage">
        <div className="sh-hero-photo">
          <Image src="/home/hero.webp" alt="Gün batımında koyda demirli yelkenliler ve tekne üzerinde sofra" fill priority sizes="954px" />
        </div>

        <div className="sh-hero-copy">
          <h1 className="sh-hero-title">
            <span className="l1">Deniz senin</span>
            <span className="l2">yeni rotan.</span>
          </h1>
          <p className="sh-hero-lede">
            Yelkenliden lüks yata, dalış turundan gün batımı deneyimine kadar aradığın tüm deniz maceraları tek bir adreste.
          </p>
        </div>

        <div className="sh-hsearch">
          <div className="sh-htabs" role="tablist" aria-label="Arama türü">
            {TABS.map(t => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={`sh-htab${tab === t.key ? ' sh-htab--active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="sh-hcard" ref={cardRef} role="search">
            <div className="sh-hfield" onClick={() => setField('location')}>
              <MapPin size={26} fill="currentColor" stroke="#fff" strokeWidth={1.6} aria-hidden="true" />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="sh-hfield-label">Yer</span>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  onFocus={() => setField('location')}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="Liman veya bölge seçin"
                  aria-label="Liman veya bölge"
                />
              </span>
              {field === 'location' && suggestions.length > 0 && (
                <div className="sh-pop sh-pop-list" onClick={e => e.stopPropagation()}>
                  {suggestions.map(s => (
                    <button
                      key={s.label}
                      type="button"
                      className="sh-pop-item"
                      onClick={() => { setLocation(s.label); setField('date') }}
                    >
                      <b>{s.label}</b>
                      <span>{s.sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="sh-hfield" role="button" tabIndex={0} onClick={() => setField(f => (f === 'date' ? null : 'date'))}>
              <CalendarDays size={26} aria-hidden="true" />
              <span style={{ minWidth: 0 }}>
                <span className="sh-hfield-label">Ne zaman?</span>
                <span className="sh-hfield-value">{dateLabel}</span>
              </span>
              {field === 'date' && (
                <div className="sh-pop sh-pop--cal" onClick={e => e.stopPropagation()}>
                  <RangeCalendar
                    value={range}
                    onChange={v => {
                      setRange(v)
                      // Bitiş tarihi seçilince kişi alanına geç (önceki davranış).
                      if (v.start && v.end) setField('guests')
                    }}
                  />
                </div>
              )}
            </div>

            <div className="sh-hfield" role="button" tabIndex={0} onClick={() => setField('guests')}>
              <Users size={26} fill="currentColor" aria-hidden="true" />
              <span style={{ minWidth: 0 }}>
                <span className="sh-hfield-label">Kişiler</span>
                <span className="sh-hfield-value">{guests > 0 ? `${guests} misafir` : 'Misafir ekleyin'}</span>
              </span>
              {field === 'guests' && (
                <div className="sh-pop" onClick={e => e.stopPropagation()}>
                  <div className="sh-guests">
                    Misafir sayısı
                    <button type="button" aria-label="Azalt" disabled={guests === 0} onClick={() => setGuests(g => g - 1)}>−</button>
                    <span>{guests}</span>
                    <button type="button" aria-label="Arttır" disabled={guests >= 30} onClick={() => setGuests(g => g + 1)}>+</button>
                  </div>
                </div>
              )}
            </div>

            <button type="button" className="sh-hsubmit" onClick={submit} aria-label="Ara">
              <Search size={36} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="sh-container sh-promos">
        {PROMOS.map(p => (
          <div key={p.cta} className="sh-promo">
            <Image src={p.img} alt="" fill sizes="(max-width: 860px) 100vw, 402px" />
            <p className="sh-promo-title">
              {p.title[0]}
              <br />
              {p.title[1]}
            </p>
            <Link href={p.href} className="sh-btn sh-btn--white">
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}
