'use client'

import { useState } from 'react'

const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                   'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

interface Props {
  originalPrice?: number
  price: number
  currency?: string
}

export default function BookingPanel({ originalPrice, price, currency = '₺' }: Props) {
  const [guests, setGuests] = useState(1)
  const [language, setLanguage] = useState('Türkçe')
  const [showCal, setShowCal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())

  const today = new Date(); today.setHours(0,0,0,0)
  const firstJS = new Date(viewYear, viewMonth, 1).getDay()
  const startOff = (firstJS + 6) % 7
  const daysInM = new Date(viewYear, viewMonth + 1, 0).getDate()

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  const total = price * guests

  return (
    <div className="bpanel">
      {/* Price header */}
      <div className="bpanel-price-row">
        {originalPrice && (
          <span className="bpanel-original">{originalPrice.toLocaleString('tr-TR')} {currency}</span>
        )}
        <span className="bpanel-price">{price.toLocaleString('tr-TR')} {currency}</span>
        <span className="bpanel-per">kişi başı</span>
      </div>

      {/* Guest selector */}
      <div className="bpanel-field">
        <div className="bpanel-field-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Yetişkin x {guests}
        </div>
        <div className="bpanel-stepper">
          <button className="bpanel-step-btn" onClick={() => setGuests(g => Math.max(1, g - 1))} disabled={guests === 1}>−</button>
          <span className="bpanel-step-num">{guests}</span>
          <button className="bpanel-step-btn" onClick={() => setGuests(g => Math.min(20, g + 1))}>+</button>
        </div>
      </div>

      {/* Date picker */}
      <div className="bpanel-field bpanel-field--clickable" onClick={() => setShowCal(c => !c)}>
        <div className="bpanel-field-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {selectedDate ? fmtDate(selectedDate) : 'Tarih seçin'}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: showCal ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Mini calendar */}
      {showCal && (
        <div className="bpanel-cal">
          <div className="bpanel-cal-header">
            <button className="bpanel-cal-nav" onClick={prevMonth} aria-label="Önceki ay">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="bpanel-cal-title">{TR_MONTHS[viewMonth]} {viewYear}</span>
            <button className="bpanel-cal-nav" onClick={nextMonth} aria-label="Sonraki ay">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="bpanel-cal-grid">
            {['Pt','Sa','Ça','Pe','Cu','Ct','Pz'].map(d => (
              <span key={d} className="bpanel-cal-day-name">{d}</span>
            ))}
            {Array.from({ length: startOff }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: daysInM }).map((_, i) => {
              const d = new Date(viewYear, viewMonth, i + 1)
              const isPast = d < today
              const isSel = selectedDate?.toDateString() === d.toDateString()
              return (
                <button
                  key={i}
                  className={`bpanel-cal-day${isSel ? ' bpanel-cal-day--sel' : ''}${isPast ? ' bpanel-cal-day--past' : ''}`}
                  disabled={isPast}
                  onClick={() => { setSelectedDate(d); setShowCal(false) }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Language */}
      <div className="bpanel-field">
        <div className="bpanel-field-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <select className="bpanel-lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
            <option>Türkçe</option>
            <option>İngilizce</option>
            <option>Almanca</option>
            <option>Rusça</option>
          </select>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {/* Total */}
      {guests > 1 && (
        <div className="bpanel-total">
          <span>Toplam ({guests} kişi)</span>
          <span className="bpanel-total-price">{total.toLocaleString('tr-TR')} {currency}</span>
        </div>
      )}

      {/* CTA */}
      <button className="bpanel-cta">Uygunluk durumunu kontrol et</button>

      {/* Trust badges */}
      <div className="bpanel-trust">
        <div className="bpanel-trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a9d3f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div>
            <div className="bpanel-trust-title">Ücretsiz iptal</div>
            <div className="bpanel-trust-desc">24 saat öncesine kadar iptal et ve paranın tamamını geri al</div>
          </div>
        </div>
        <div className="bpanel-trust-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a9d3f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div>
            <div className="bpanel-trust-title">Şimdi ayırt ve sonra öde</div>
            <div className="bpanel-trust-desc">Seyahat planlarını esnek tut — yerini ayırt ve bugün hiçbir şey ödeme</div>
          </div>
        </div>
      </div>
    </div>
  )
}
