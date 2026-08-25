'use client'

import { useEffect, useMemo, useState } from 'react'
import { BoatDetailView, type BoatBookingFormValues } from '@getyourboat/ui'
import { toBoatDetailViewModel, type SerializedBoatDTO } from '@getyourboat/shared'
import { submitBooking } from '@/lib/api'
import { toRentalType } from '@/lib/pricing'
import { supabase } from '@/lib/supabase'

interface Props {
  boat: SerializedBoatDTO
}

export default function ListingDetail({ boat }: Props) {
  const model = useMemo(() => toBoatDetailViewModel(boat), [boat])

  const capacityRaw = Number(boat.features.find((f) => f.key === 'capacity')?.value ?? 8)
  const maxGuests = Number.isFinite(capacityRaw) && capacityRaw > 0 ? capacityRaw : 8

  const [guestEmail, setGuestEmail] = useState<string | undefined>(undefined)
  const [guestName, setGuestName] = useState<string | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setGuestEmail(data.user?.email ?? undefined)
      const name = data.user?.user_metadata?.full_name
      setGuestName(typeof name === 'string' ? name : undefined)
    })
  }, [])

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

  return (
    <BoatDetailView
      model={model}
      maxGuests={maxGuests}
      onSubmitBooking={handleSubmitBooking}
      defaultGuestName={guestName}
      defaultGuestEmail={guestEmail}
    />
  )
}
