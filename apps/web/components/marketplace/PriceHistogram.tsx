'use client'

export default function PriceHistogram({
  buckets,
  valueMin,
  valueMax,
  extentMin,
  extentMax,
}: {
  buckets: number[]
  valueMin: number
  valueMax: number
  extentMin: number
  extentMax: number
}) {
  const maxC = Math.max(1, ...buckets)
  const n = buckets.length
  const range = extentMax - extentMin || 1

  return (
    <div className="mp-hist" aria-hidden>
      {buckets.map((c, i) => {
        const h = 4 + (c / maxC) * 28
        const lo = extentMin + (i / n) * range
        const hi = extentMin + ((i + 1) / n) * range
        const inRange = hi > valueMin && lo < valueMax
        return (
          <div
            key={i}
            className={`mp-hist__bar${inRange ? ' mp-hist__bar--in' : ''}`}
            style={{ height: `${h}px` }}
          />
        )
      })}
    </div>
  )
}
