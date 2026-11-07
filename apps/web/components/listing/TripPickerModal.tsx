'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Minus, Plus, X } from 'lucide-react'
import RangeCalendar, { type DateRangeValue } from '@/components/sh/RangeCalendar'
import type { BlockedRange } from '@/lib/api'
import { TIME_OPTIONS, minutesOf } from '@/lib/bookingPrice'
import { formatDayMonth } from '@/lib/boatFormat'

export interface TripValue {
  range: DateRangeValue
  guests: number
  startTime: string | null
  endTime: string | null
}

interface Props {
  open: boolean
  title?: string
  initial: TripValue
  hourly: boolean
  maxGuests: number
  blocked: BlockedRange[]
  confirmLabel: string
  footerNote?: (v: TripValue) => React.ReactNode
  onClose: () => void
  onConfirm: (v: TripValue) => void
}

export function tripIsComplete(v: TripValue, hourly: boolean): boolean {
  if (!v.range.start || !v.range.end) return false
  if (hourly) return !!v.startTime && !!v.endTime && minutesOf(v.endTime) > minutesOf(v.startTime)
  return true
}

export default function TripPickerModal({ open, title = 'Tarih ve misafir seçin', initial, hourly, maxGuests, blocked, confirmLabel, footerNote, onClose, onConfirm }: Props) {
  const [v, setV] = useState<TripValue>(initial)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setV(initial)
      setError('')
    }
    // açılışta dışarıdaki değerle eşitle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const confirm = () => {
    if (!v.range.start || !v.range.end) return setError(hourly ? 'Lütfen bir gün seçin.' : 'Lütfen giriş ve çıkış tarihlerini seçin.')
    if (hourly && !tripIsComplete(v, true)) return setError('Lütfen başlangıç ve bitiş saatini seçin.')
    onConfirm(v)
  }

  const summary = v.range.start
    ? hourly
      ? `${formatDayMonth(v.range.start)}${v.startTime && v.endTime ? ` · ${v.startTime}–${v.endTime}` : ''}`
      : `${formatDayMonth(v.range.start)} — ${v.range.end ? formatDayMonth(v.range.end) : 'çıkış seçin'}`
    : hourly
      ? 'Gün seçin'
      : 'Giriş tarihini seçin'

  return createPortal(
    <div className="sh-modal-overlay" onClick={onClose}>
      <div className="sh-modal sh-trip" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <header className="sh-trip-head">
          <h2>{title}</h2>
          <button type="button" className="sh-icon-btn" onClick={onClose} aria-label="Kapat">
            <X size={20} />
          </button>
        </header>

        <div className="sh-modal-body">
          <div className="sh-trip-row">
            <span>
              <b>Misafir</b>
              <small>En fazla {maxGuests} kişi</small>
            </span>
            <div className="sh-stepper sh-stepper--sm">
              <button type="button" aria-label="Azalt" disabled={v.guests <= 1} onClick={() => setV(s => ({ ...s, guests: s.guests - 1 }))}>
                <Minus size={15} />
              </button>
              <span>
                <b>{v.guests}</b>
              </span>
              <button type="button" aria-label="Arttır" disabled={v.guests >= maxGuests} onClick={() => setV(s => ({ ...s, guests: s.guests + 1 }))}>
                <Plus size={15} />
              </button>
            </div>
          </div>

          <p className="sh-trip-label">{summary}</p>
          <RangeCalendar value={v.range} blocked={blocked} single={hourly} onChange={range => setV(s => ({ ...s, range }))} />

          {hourly && (
            <div className="sh-trip-times">
              <label>
                <span>Başlangıç</span>
                <select value={v.startTime ?? ''} onChange={e => setV(s => ({ ...s, startTime: e.target.value || null }))}>
                  <option value="">Saat seçin</option>
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bitiş</span>
                <select value={v.endTime ?? ''} onChange={e => setV(s => ({ ...s, endTime: e.target.value || null }))}>
                  <option value="">Saat seçin</option>
                  {TIME_OPTIONS.filter(t => !v.startTime || minutesOf(t) > minutesOf(v.startTime)).map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {error && (
            <p className="sh-form-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <footer className="sh-modal-foot">
          <span className="sh-modal-foot-info">{footerNote ? footerNote(v) : summary}</span>
          <button type="button" className="sh-btn sh-btn--navy" onClick={confirm}>
            {confirmLabel} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
