'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CalMonth, fmtDate, type DateState } from '@/components/hero/heroSearchCalendar'

export function countBookingDays(start: Date | null, end: Date | null, fallback = 3) {
  if (!start || !end) return fallback
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
}

type Props = {
  maxGuests?: number
  onRangeChange?: (start: Date | null, end: Date | null, days: number) => void
}

export default function BookingDatePicker({ maxGuests = 8, onRangeChange }: Props) {
  const now = new Date()
  const [open, setOpen] = useState(false)
  const [activeField, setActiveField] = useState<'start' | 'end'>('start')
  const [dateState, setDateState] = useState<DateState>({
    startDate: null,
    endDate: null,
    hoverDate: null,
    viewYear: now.getFullYear(),
    viewMonth: now.getMonth(),
  })
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    onRangeChange?.(
      dateState.startDate,
      dateState.endDate,
      countBookingDays(dateState.startDate, dateState.endDate),
    )
  }, [dateState.startDate, dateState.endDate, onRangeChange])

  const handleDateSelect = useCallback((date: Date) => {
    setDateState(prev => {
      if (!prev.startDate || (prev.startDate && prev.endDate)) {
        setActiveField('end')
        return { ...prev, startDate: date, endDate: null, hoverDate: null }
      }
      if (date > prev.startDate) {
        setTimeout(() => setOpen(false), 280)
        return { ...prev, endDate: date, hoverDate: null }
      }
      if (date < prev.startDate) {
        setActiveField('end')
        return { ...prev, startDate: date, endDate: null, hoverDate: null }
      }
      setTimeout(() => setOpen(false), 280)
      return { ...prev, endDate: date, hoverDate: null }
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

  const clearDates = () => {
    setDateState(prev => ({ ...prev, startDate: null, endDate: null, hoverDate: null }))
    setActiveField('start')
  }

  const openPicker = (field: 'start' | 'end') => {
    setActiveField(field)
    setOpen(true)
  }

  const month2 = dateState.viewMonth === 11 ? 0 : dateState.viewMonth + 1
  const year2 = dateState.viewMonth === 11 ? dateState.viewYear + 1 : dateState.viewYear

  const startLabel = dateState.startDate ? fmtDate(dateState.startDate) : 'Tarih seçin'
  const endLabel = dateState.endDate ? fmtDate(dateState.endDate) : 'Tarih seçin'

  return (
    <div className="date-guest-picker" ref={wrapRef}>
      <div className="picker-row">
        <button
          type="button"
          className={`picker-cell${open && activeField === 'start' ? ' is-active' : ''}`}
          aria-expanded={open && activeField === 'start'}
          onClick={() => openPicker('start')}
        >
          <span className="picker-label">Kalkış</span>
          <span className={`picker-value${dateState.startDate ? ' has-val' : ''}`}>{startLabel}</span>
        </button>
        <button
          type="button"
          className={`picker-cell${open && activeField === 'end' ? ' is-active' : ''}`}
          aria-expanded={open && activeField === 'end'}
          onClick={() => openPicker('end')}
        >
          <span className="picker-label">Dönüş</span>
          <span className={`picker-value${dateState.endDate ? ' has-val' : ''}`}>{endLabel}</span>
        </button>
      </div>

      <div
        className={`cal-popup cal-popup--booking${open ? ' open' : ''}`}
        role="dialog"
        aria-label="Kalkış ve dönüş tarihi seçici"
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
          <button type="button" className="cal-done-btn" onClick={() => setOpen(false)}>
            Kapat
          </button>
        </div>
      </div>

      <div className="picker-row">
        <div className="picker-cell picker-full">
          <span className="picker-label">Misafir</span>
          <span className="picker-value">Kişi sayısı (en fazla {maxGuests})</span>
        </div>
      </div>
    </div>
  )
}
