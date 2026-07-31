'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import type { SerializedBoatDTO } from '@getyourboat/shared'
import { submitBooking } from '@/lib/api'
import { priceUnitLabel, toRentalType } from '@/lib/pricing'
import BookingDatePicker from './BookingDatePicker'

type Step = 'calendar' | 'form' | 'success'

interface Props {
  boat: SerializedBoatDTO
}

function formatMoney(n: number) {
  return n.toLocaleString('tr-TR')
}

export default function BookingPanel({ boat }: Props) {
  const primaryPricing = boat.pricing[0] ?? null
  const price = primaryPricing?.price ?? 0
  const currency = primaryPricing?.currency ?? 'EUR'
  const priceUnit = priceUnitLabel(primaryPricing?.listingModelKey)
  const rentalType = toRentalType(primaryPricing?.listingModelKey)
  const capacityRaw = Number(boat.features.find(f => f.key === 'capacity')?.value ?? 8)
  const capacity = Number.isFinite(capacityRaw) && capacityRaw > 0 ? capacityRaw : 8

  const [step, setStep] = useState<Step>('calendar')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [days, setDays] = useState(0)
  const [guestCount, setGuestCount] = useState(Math.min(2, capacity))
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const servicePct = 11
  const subtotal = price * days
  const serviceFee = Math.round(subtotal * (servicePct / 100))
  const cleaning = 500
  const total = subtotal + serviceFee + cleaning

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startDate || !endDate) return
    setSubmitting(true)
    setServerError(null)
    const result = await submitBooking({
      boatId: boat.id,
      guestName: name.trim(),
      guestEmail: email.trim(),
      guestPhone: phone.trim() || null,
      guestCount,
      rentalType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      message: message.trim() || null,
    })
    setSubmitting(false)
    if (result.ok) {
      setBookingId(result.bookingId ?? null)
      setStep('success')
    } else {
      setServerError(result.error ?? 'Bir hata oluştu')
    }
  }

  if (step === 'calendar') {
    return (
      <div className="booking-panel">
        <div style={{ marginBottom: 18 }}>
          <div className="booking-price">
            {price > 0 ? `${formatMoney(price)} ${currency}` : 'Fiyat bilgisi yok'} <span className="per">/ {priceUnit}</span>
          </div>
          <div className="ld-booking-rating">
            <Star aria-hidden fill="currentColor" strokeWidth={0} />
            <span>Yeni ilan</span>
          </div>
        </div>

        <BookingDatePicker
          maxGuests={capacity}
          onRangeChange={(s, e, d) => {
            setStartDate(s)
            setEndDate(e)
            setDays(d)
          }}
        />

        <div className="bp-field bp-field--guests">
          <label htmlFor="bp-guest-count">Misafir sayısı</label>
          <select
            id="bp-guest-count"
            value={guestCount}
            onChange={ev => setGuestCount(Number(ev.target.value))}
          >
            {Array.from({ length: capacity }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>
                {n} misafir
              </option>
            ))}
          </select>
        </div>

        {startDate && endDate ? (
          <>
            <div className="price-breakdown">
              <div className="price-row">
                <span>{formatMoney(price)} × {days} {priceUnit === 'gün' ? 'gün' : 'gece'}</span>
                <span>{formatMoney(subtotal)} {currency}</span>
              </div>
              <div className="price-row">
                <span>Hizmet bedeli (%{servicePct})</span>
                <span>{formatMoney(serviceFee)} {currency}</span>
              </div>
              <div className="price-row">
                <span>Temizlik ücreti</span>
                <span>{formatMoney(cleaning)} {currency}</span>
              </div>
              <div className="price-row total">
                <span>Toplam</span>
                <span>{formatMoney(total)} {currency}</span>
              </div>
            </div>
            <button type="button" className="reserve-btn" onClick={() => setStep('form')}>
              Rezervasyon talebinde bulun
            </button>
          </>
        ) : (
          <p className="bp-hint">Tarihleri seçin</p>
        )}
      </div>
    )
  }

  if (step === 'form') {
    return (
      <form className="booking-panel" onSubmit={handleSubmit}>
        <button type="button" className="bp-back" onClick={() => setStep('calendar')}>
          ← Tarihleri değiştir
        </button>
        <h3 className="bp-form-title">İletişim bilgileriniz</h3>
        <div className="bp-field">
          <label htmlFor="bp-name">Ad Soyad *</label>
          <input id="bp-name" required value={name} onChange={e => setName(e.target.value)} placeholder="Adınız Soyadınız" />
        </div>
        <div className="bp-field">
          <label htmlFor="bp-email">E-posta *</label>
          <input id="bp-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@mail.com" />
        </div>
        <div className="bp-field">
          <label htmlFor="bp-phone">Telefon</label>
          <input id="bp-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" />
        </div>
        <div className="bp-field">
          <label htmlFor="bp-message">Mesaj (isteğe bağlı)</label>
          <textarea id="bp-message" rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Özel istek veya sorularınız..." />
        </div>
        <div className="price-breakdown">
          <div className="price-row">
            <span>{formatMoney(price)} × {days} {priceUnit === 'gün' ? 'gün' : 'gece'}</span>
            <span>{formatMoney(subtotal)} {currency}</span>
          </div>
          <div className="price-row">
            <span>Hizmet bedeli</span>
            <span>{formatMoney(serviceFee)} {currency}</span>
          </div>
          <div className="price-row">
            <span>Temizlik</span>
            <span>{formatMoney(cleaning)} {currency}</span>
          </div>
          <div className="price-row total">
            <span>Toplam</span>
            <span>{formatMoney(total)} {currency}</span>
          </div>
        </div>
        {serverError ? <p className="bp-error">{serverError}</p> : null}
        <button type="submit" className="reserve-btn" disabled={submitting}>
          {submitting ? 'Gönderiliyor…' : 'Talebi gönder'}
        </button>
        <p className="no-charge-note">Ücretlendirme yapılmaz — kaptan onayladıktan sonra ödeme adımına geçilir.</p>
      </form>
    )
  }

  return (
    <div className="booking-panel bp-success">
      <div className="bp-success-icon">✓</div>
      <h3>Talebiniz alındı!</h3>
      <p>
        Kaptan en geç 24 saat içinde size dönecek. Onay e-postası <strong>{email}</strong> adresine gönderildi.
      </p>
      {bookingId ? (
        <p className="bp-booking-id">
          Rezervasyon no: <code>{bookingId}</code>
        </p>
      ) : null}
    </div>
  )
}
