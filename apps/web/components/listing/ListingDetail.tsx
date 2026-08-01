'use client'

import { useMemo } from 'react'
import { BoatDetailView, type BoatBookingFormValues } from '@getyourboat/ui'
import { toBoatDetailViewModel, type SerializedBoatDTO } from '@getyourboat/shared'
import { submitBooking } from '@/lib/api'
import { toRentalType } from '@/lib/pricing'

interface Props {
  boat: SerializedBoatDTO
}

export default function ListingDetail({ boat }: Props) {
  const model = useMemo(() => toBoatDetailViewModel(boat), [boat])

  const capacityRaw = Number(boat.features.find((f) => f.key === 'capacity')?.value ?? 8)
  const maxGuests = Number.isFinite(capacityRaw) && capacityRaw > 0 ? capacityRaw : 8

  async function handleSubmitBooking(values: BoatBookingFormValues) {
    // BoatDetailView's own form catches this and shows the error inline —
    // no separate error/success UI needed at this level.
    await submitBooking({
      boatId: boat.id,
      guestName: values.guestName,
      guestEmail: values.guestEmail,
      guestPhone: values.guestPhone ?? null,
      guestCount: values.guestCount,
      rentalType: toRentalType(boat.pricing[0]?.listingModelKey),
      startDate: values.startDate,
      endDate: values.endDate,
      message: values.message ?? null,
    })
  }

  return <BoatDetailView model={model} maxGuests={maxGuests} onSubmitBooking={handleSubmitBooking} />
}
