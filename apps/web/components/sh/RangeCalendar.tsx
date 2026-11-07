'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

export interface DateRangeValue {
  start: Date | null
  end: Date | null
}

interface Props {
  value: DateRangeValue
  onChange: (v: DateRangeValue) => void
  /** Dolu (rezerve) aralıklar — ISO tarih stringleri, uçlar dahil. */
  blocked?: { startDate: string; endDate: string }[]
  /** Tek gün seçimi (saatlik kiralama): başlangıç = bitiş. */
  single?: boolean
}

const strip = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const same = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime()

export default function RangeCalendar({ value, onChange, blocked = [], single = false }: Props) {
  const today = strip(new Date())
  const [view, setView] = useState(() => {
    const base = value.start ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [hover, setHover] = useState<Date | null>(null)

  const blockedRanges = blocked.map(b => ({ s: strip(new Date(b.startDate)), e: strip(new Date(b.endDate)) }))
  const isBlocked = (d: Date) => blockedRanges.some(r => d >= r.s && d <= r.e)
  const spansBlocked = (a: Date, b: Date) => blockedRanges.some(r => r.s <= b && r.e >= a)

  const pick = (d: Date) => {
    if (single) return onChange({ start: d, end: d })
    const { start, end } = value
    if (!start || end || d < start) return onChange({ start: d, end: null })
    if (same(d, start)) return onChange({ start: d, end: null })
    if (spansBlocked(start, d)) return onChange({ start: d, end: null })
    onChange({ start, end: d })
  }

  const effEnd = value.end ?? (!single && value.start && hover && hover > value.start ? hover : null)

  const month = (offset: number) => {
    const first = new Date(view.getFullYear(), view.getMonth() + offset, 1)
    const lead = (first.getDay() + 6) % 7
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < lead; i++) cells.push(<span key={`e${i}`} />)
    for (let i = 1; i <= days; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), i)
      const disabled = d < today || isBlocked(d)
      const isStart = same(d, value.start)
      const isEnd = same(d, effEnd)
      const inRange = !!value.start && !!effEnd && d > value.start && d < effEnd
      cells.push(
        <button
          key={i}
          type="button"
          disabled={disabled}
          className={[
            'sh-cal-day',
            isStart || isEnd ? 'sh-cal-day--sel' : '',
            inRange ? 'sh-cal-day--range' : '',
            isStart && effEnd && !same(value.start, effEnd) ? 'sh-cal-day--from' : '',
            isEnd && value.start && !same(value.start, effEnd) ? 'sh-cal-day--to' : '',
            same(d, today) ? 'sh-cal-day--today' : '',
            isBlocked(d) && d >= today ? 'sh-cal-day--blocked' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={() => pick(d)}
          onMouseEnter={() => setHover(d)}
          onMouseLeave={() => setHover(null)}
          aria-label={`${i} ${MONTHS[first.getMonth()]}`}
          aria-pressed={isStart || isEnd}
        >
          <span>{i}</span>
        </button>,
      )
    }
    return (
      <div className={`sh-cal-month${offset === 1 ? ' sh-cal-month--second' : ''}`} key={offset}>
        <p className="sh-cal-title">
          {MONTHS[first.getMonth()]} {first.getFullYear()}
        </p>
        <div className="sh-cal-grid">
          {DAYS.map(d => (
            <span key={d} className="sh-cal-wd">
              {d}
            </span>
          ))}
          {cells}
        </div>
      </div>
    )
  }

  const canPrev = view > new Date(today.getFullYear(), today.getMonth(), 1)

  return (
    <div className="sh-cal">
      <div className="sh-cal-nav">
        <button
          type="button"
          className="sh-cal-arrow"
          disabled={!canPrev}
          onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
          aria-label="Önceki ay"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          className="sh-cal-arrow"
          onClick={() => setView(v => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
          aria-label="Sonraki ay"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="sh-cal-months">
        {month(0)}
        {month(1)}
      </div>
      {(value.start || value.end) && (
        <button type="button" className="sh-cal-clear" onClick={() => onChange({ start: null, end: null })}>
          Tarihleri temizle
        </button>
      )}
    </div>
  )
}
