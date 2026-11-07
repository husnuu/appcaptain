import Image from 'next/image'
import Link from 'next/link'
import { BedDouble, Calendar, MapPin, Ruler, Star, Users } from 'lucide-react'
import type { PublicBoatSummary } from '@/lib/api'
import { boatTypeLabel, cleanText, formatMoney, listingModelLabel, lowestPrice, priceUnit } from '@/lib/boatFormat'

export default function BoatListCard({ boat }: { boat: PublicBoatSummary }) {
  const price = lowestPrice(boat.pricing)
  const type = boatTypeLabel(boat.boatType)
  const place = cleanText([boat.marina, boat.city].filter(Boolean).join(', ') || boat.country || 'Türkiye')
  const specs = [
    boat.capacity ? { icon: Users, text: `${boat.capacity} kişi` } : null,
    boat.cabinCount ? { icon: BedDouble, text: `${boat.cabinCount} kabin` } : null,
    boat.length ? { icon: Ruler, text: `${boat.length} m` } : null,
    boat.productionYear ? { icon: Calendar, text: String(boat.productionYear) } : null,
  ].filter(Boolean) as { icon: typeof Users; text: string }[]

  return (
    <Link href={`/listing/${boat.id}`} className="sh-bcard">
      <div className="sh-bcard-img">
        {boat.coverPhotoUrl ? (
          <Image src={boat.coverPhotoUrl} alt={boat.title ?? 'Tekne'} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 410px" />
        ) : (
          <div className="sh-bcard-noimg" aria-hidden="true" />
        )}
        {type && <span className="sh-badge sh-bcard-type">{type}</span>}
      </div>

      <div className="sh-bcard-body">
        <div className="sh-bcard-row">
          <p className="sh-bcard-place">
            <MapPin size={14} strokeWidth={2} aria-hidden="true" />
            <span>{place}</span>
          </p>
          <span className="sh-bcard-rating">
            {boat.rating ? (
              <>
                <Star size={13} fill="currentColor" strokeWidth={0} aria-hidden="true" /> {boat.rating.toFixed(1)}
              </>
            ) : (
              'Yeni'
            )}
          </span>
        </div>
        <h3 className="sh-bcard-title">{cleanText(boat.title ?? 'İsimsiz tekne')}</h3>
        {specs.length > 0 && (
          <ul className="sh-bcard-specs">
            {specs.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        )}
        <div className="sh-bcard-foot">
          {price ? (
            <p className="sh-bcard-price">
              <b>{formatMoney(price.price, price.currency)}</b>
              <span> / {priceUnit(price.listingModelKey)}</span>
            </p>
          ) : (
            <p className="sh-bcard-price">
              <span>Fiyat için iletişime geçin</span>
            </p>
          )}
          {price && <span className="sh-bcard-model">{listingModelLabel(price.listingModelKey)}</span>}
        </div>
      </div>
    </Link>
  )
}
