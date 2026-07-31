'use client'

/**
 * Takvim bileşeni ve tarih seçim yardımcıları — HeroSection ile Charter Firmaları
 * üzerinde aynı arama deneyimi için paylaşılır.
 */

import type { ReactNode } from 'react'

export interface DateState {
  startDate: Date | null
  endDate: Date | null
  hoverDate: Date | null
  viewYear: number
  viewMonth: number
}

export const TR_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

export const TR_DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

export function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

export function CalMonth({
  year,
  month,
  isFirst,
  dateState,
  onSelect,
  onHover,
  onPrev,
  onNext,
}: {
  year: number
  month: number
  isFirst: boolean
  dateState: DateState
  onSelect: (d: Date) => void
  onHover: (d: Date | null) => void
  onPrev: () => void
  onNext: () => void
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstJS = new Date(year, month, 1).getDay()
  const startOff = (firstJS + 6) % 7
  const daysInM = new Date(year, month + 1, 0).getDate()

  const { startDate, endDate, hoverDate } = dateState
  const effEnd = endDate ?? hoverDate

  const rangeStart =
    startDate && effEnd ? (startDate <= effEnd ? startDate : effEnd) : null
  const rangeEnd =
    startDate && effEnd ? (startDate <= effEnd ? effEnd : startDate) : null

  const days: ReactNode[] = []

  for (let i = 0; i < startOff; i++) {
    days.push(<div key={`e${i}`} className="cal-day empty" aria-hidden="true" />)
  }

  for (let d = 1; d <= daysInM; d++) {
    const date = new Date(year, month, d)
    date.setHours(0, 0, 0, 0)

    const isPast = date < today
    const isToday = isSameDay(date, today)
    const isStart = !!startDate && isSameDay(date, startDate)
    const isEnd = !!endDate && isSameDay(date, endDate)
    const inRange = !!(rangeStart && rangeEnd && date > rangeStart && date < rangeEnd)

    let cls = 'cal-day'
    if (isPast) cls += ' past'
    if (isToday) cls += ' today'
    if (isStart) cls += ' start'
    if (isEnd) cls += ' end'
    if (inRange) {
      cls += ' in-range'
      if (rangeStart && isSameDay(new Date(date.getTime() - 86400000), rangeStart)) cls += ' range-start'
      if (rangeEnd && isSameDay(new Date(date.getTime() + 86400000), rangeEnd)) cls += ' range-end'
    }

    days.push(
      <div
        key={d}
        className={cls}
        role={isPast ? undefined : 'button'}
        tabIndex={isPast ? undefined : 0}
        aria-label={`${d} ${TR_MONTHS[month]}`}
        aria-disabled={isPast}
        onClick={isPast ? undefined : () => onSelect(date)}
        onMouseEnter={isPast ? undefined : () => onHover(date)}
        onMouseLeave={isPast ? undefined : () => onHover(null)}
        onKeyDown={isPast ? undefined : e => e.key === 'Enter' && onSelect(date)}
      >
        {isToday && <span className="cal-day-badge">BUGÜN</span>}
        <span className="cal-day-num">{d}</span>
      </div>,
    )
  }

  return (
    <div className="cal-month">
      <div className="cal-month-head">
        <button
          type="button"
          className={`cal-nav-btn${isFirst ? '' : ' invisible'}`}
          onClick={onPrev}
          aria-label="Önceki ay"
        >
          ‹
        </button>
        <span className="cal-month-name">
          {TR_MONTHS[month]} {year}
        </span>
        <button
          type="button"
          className={`cal-nav-btn${isFirst ? ' invisible' : ''}`}
          onClick={onNext}
          aria-label="Sonraki ay"
        >
          ›
        </button>
      </div>
      <div className="cal-day-headers">
        {TR_DAYS.map(day => (
          <div key={day} className="cal-day-h">
            {day}
          </div>
        ))}
      </div>
      <div className="cal-grid cal-grid--boxed">{days}</div>
    </div>
  )
}
