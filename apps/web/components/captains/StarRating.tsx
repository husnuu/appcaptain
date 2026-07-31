import { Star } from 'lucide-react'

export default function StarRating({
  value,
  size = 16,
  showValue = false,
}: {
  value: number
  size?: number
  showValue?: boolean
}) {
  const full = Math.floor(value)
  const half = value - full >= 0.25 && value - full < 0.85

  return (
    <span className="captain-stars" aria-label={`${value.toFixed(2)} / 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && half)
        return (
          <Star
            key={i}
            size={size}
            strokeWidth={1.75}
            className={filled ? 'captain-stars__icon captain-stars__icon--on' : 'captain-stars__icon'}
            fill={filled ? 'currentColor' : 'none'}
            aria-hidden
          />
        )
      })}
      {showValue ? <span className="captain-stars__value">{value.toFixed(2)}</span> : null}
    </span>
  )
}
