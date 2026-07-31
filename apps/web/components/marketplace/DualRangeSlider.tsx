'use client'

import { useCallback, useId } from 'react'

type Props = {
  min: number
  max: number
  step?: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  formatValue?: (n: number) => string
  'aria-label'?: string
}

export default function DualRangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  formatValue = n => String(n),
  'aria-label': ariaLabel = 'Aralık',
}: Props) {
  const id = useId()

  const range = max - min || 1
  const leftPct = ((valueMin - min) / range) * 100
  const rightPct = ((valueMax - min) / range) * 100
  const fillW = Math.max(0, rightPct - leftPct)

  const onMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value)
      onChange(Math.min(v, valueMax), valueMax)
    },
    [onChange, valueMax],
  )
  const onMax = useCallback(
    (e: React.ChangeEvent<HTMLElement>) => {
      const v = Number((e.target as HTMLInputElement).value)
      onChange(valueMin, Math.max(v, valueMin))
    },
    [onChange, valueMin],
  )

  return (
    <div className="mp-dual-range" role="group" aria-label={ariaLabel}>
      <div className="mp-dual-range__track" id={id}>
        <div
          className="mp-dual-range__fill"
          style={{ left: `${leftPct}%`, width: `${fillW}%` }}
        />
        <input
          type="range"
          className="mp-dual-range__input mp-dual-range__input--min"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          onChange={onMin}
          aria-valuemin={min}
          aria-valuemax={valueMax}
          aria-label={`${ariaLabel} minimum`}
        />
        <input
          type="range"
          className="mp-dual-range__input mp-dual-range__input--max"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          onChange={onMax}
          aria-valuemin={valueMin}
          aria-valuemax={max}
          aria-label={`${ariaLabel} maksimum`}
        />
      </div>
      <div className="mp-dual-range__labels">
        <span className="mp-dual-range__val">{formatValue(valueMin)}</span>
        <span className="mp-dual-range__val mp-dual-range__val--end">{formatValue(valueMax)}</span>
      </div>
    </div>
  )
}
