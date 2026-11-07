'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, CircleCheck, Gift, Minus, Plus, ShieldCheck } from 'lucide-react'
import type { SerializedBoatDTO } from '@getyourboat/shared'
import RangeCalendar from '@/components/sh/RangeCalendar'
import { fetchAvailability, type BlockedRange } from '@/lib/api'
import { TIME_OPTIONS, checkoutHref, estimatePrice, minutesOf } from '@/lib/bookingPrice'
import { formatDayMonth, formatMoney, listingModelLabel, priceUnit } from '@/lib/boatFormat'
import TripPickerModal, { tripIsComplete, type TripValue } from './TripPickerModal'

interface Props {
  boat: SerializedBoatDTO
  coverUrl: string | null
  place: string
  maxGuests: number
  approvalLabel: string | null
  cancellationLabel: string | null
  minDuration: string | null
}

export default function BookingPanel({ boat, coverUrl, place, maxGuests, approvalLabel, cancellationLabel, minDuration }: Props) {
  const router = useRouter()
  const prices = boat.pricing.filter(p => p.price > 0)
  const [priceKey, setPriceKey] = useState(prices[0]?.listingModelKey ?? '')
  const price = prices.find(p => p.listingModelKey === priceKey) ?? prices[0] ?? null
  const hourly = price?.listingModelKey === 'hourly'

  const [trip, setTrip] = useState<TripValue>({ range: { start: null, end: null }, guests: 1, startTime: null, endTime: null })
  const [calOpen, setCalOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [blocked, setBlocked] = useState<BlockedRange[]>([])
  const [topBar, setTopBar] = useState(false)
  const [mounted, setMounted] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAvailability(boat.id).then(setBlocked).catch(() => setBlocked([]))
  }, [boat.id])

  // Galeri geçildiğinde üstte fiyat + CTA çubuğu (masaüstü) gösterilir.
  useEffect(() => {
    setMounted(true)
    const onScroll = () => {
      const body = document.querySelector('.sh-lst-body') as HTMLElement | null
      setTopBar(!!body && body.getBoundingClientRect().top < 40)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!calRef.current?.contains(e.target as Node)) setCalOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const unit = priceUnit(price?.listingModelKey)
  const estimate = useMemo(
    () => estimatePrice(price, trip.range.start, trip.range.end, trip.startTime, trip.endTime),
    [price, trip],
  )
  const ready = tripIsComplete(trip, hourly)

  const tripText = (v: TripValue) =>
    v.range.start
      ? hourly
        ? `${formatDayMonth(v.range.start)}${v.startTime && v.endTime ? ` · ${v.startTime}–${v.endTime}` : ''}`
        : `${formatDayMonth(v.range.start)} — ${v.range.end ? formatDayMonth(v.range.end) : '?'}`
      : 'Tarih seçin'

  const goCheckout = (v: TripValue) => {
    router.push(
      checkoutHref(boat.id, {
        start: v.range.start,
        end: v.range.end,
        guests: v.guests,
        model: price?.listingModelKey ?? null,
        startTime: hourly ? v.startTime : null,
        endTime: hourly ? v.endTime : null,
      }),
    )
  }

  const reserve = () => (ready ? goCheckout(trip) : setModal(true))

  const priceLine = price ? (
    <p className="sh-bk-price">
      <b>{formatMoney(price.price, price.currency)}</b>
      <span> / {unit}</span>
    </p>
  ) : (
    <p className="sh-bk-price">
      <span>Fiyat için iletişime geçin</span>
    </p>
  )

  return (
    <>
      {/* ---------- masaüstü kart ---------- */}
      <aside className="sh-bk-card" aria-label="Rezervasyon">
        <div className="sh-bk-head">
          {priceLine}
          {price && <span className="sh-bk-model">{listingModelLabel(price.listingModelKey, price.listingModelLabel)}</span>}
        </div>

        {prices.length > 1 && (
          <div className="sh-toggle sh-bk-models" role="tablist" aria-label="Kiralama türü">
            {prices.map(p => (
              <button
                key={p.listingModelKey}
                type="button"
                role="tab"
                aria-selected={p.listingModelKey === price?.listingModelKey}
                onClick={() => {
                  setPriceKey(p.listingModelKey)
                  setTrip(t => ({ ...t, range: { start: null, end: null }, startTime: null, endTime: null }))
                }}
              >
                {listingModelLabel(p.listingModelKey, p.listingModelLabel).replace(' kiralama', '')}
              </button>
            ))}
          </div>
        )}

        <div className="sh-bk-box" ref={calRef}>
          <button type="button" className="sh-bk-dates" onClick={() => setCalOpen(o => !o)} aria-expanded={calOpen}>
            {hourly ? (
              <span>
                <small>Tarih</small>
                <b>{trip.range.start ? formatDayMonth(trip.range.start) : 'Gün seçin'}</b>
              </span>
            ) : (
              <>
                <span>
                  <small>Giriş</small>
                  <b>{trip.range.start ? formatDayMonth(trip.range.start) : 'Tarih ekle'}</b>
                </span>
                <span>
                  <small>Çıkış</small>
                  <b>{trip.range.end ? formatDayMonth(trip.range.end) : 'Tarih ekle'}</b>
                </span>
              </>
            )}
          </button>
          {calOpen && (
            <div className="sh-pop sh-bk-cal">
              <RangeCalendar
                value={trip.range}
                blocked={blocked}
                single={hourly}
                onChange={range => {
                  setTrip(t => ({ ...t, range }))
                  if (range.start && range.end) setCalOpen(false)
                }}
              />
            </div>
          )}
          {hourly && (
            <div className="sh-bk-times">
              <select value={trip.startTime ?? ''} onChange={e => setTrip(t => ({ ...t, startTime: e.target.value || null }))} aria-label="Başlangıç saati">
                <option value="">Başlangıç</option>
                {TIME_OPTIONS.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <select value={trip.endTime ?? ''} onChange={e => setTrip(t => ({ ...t, endTime: e.target.value || null }))} aria-label="Bitiş saati">
                <option value="">Bitiş</option>
                {TIME_OPTIONS.filter(t => !trip.startTime || minutesOf(t) > minutesOf(trip.startTime)).map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
          <div className="sh-bk-guests">
            <span>
              <b>Misafir</b>
              <small>En fazla {maxGuests} kişi</small>
            </span>
            <div className="sh-stepper sh-stepper--sm">
              <button type="button" aria-label="Azalt" disabled={trip.guests <= 1} onClick={() => setTrip(t => ({ ...t, guests: t.guests - 1 }))}>
                <Minus size={15} />
              </button>
              <span>
                <b>{trip.guests}</b>
              </span>
              <button type="button" aria-label="Arttır" disabled={trip.guests >= maxGuests} onClick={() => setTrip(t => ({ ...t, guests: t.guests + 1 }))}>
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        <button type="button" className="sh-btn sh-btn--navy sh-bk-cta" onClick={reserve}>
          {ready ? 'Rezervasyon yap' : 'Müsaitliği kontrol et'}
        </button>
        <p className="sh-bk-note">Şimdi ücret alınmaz. Kaptan onayından sonra ödeme yaparsın.</p>

        {estimate && price && (
          <dl className="sh-bk-sum">
            <div>
              <dt>
                {formatMoney(price.price, price.currency)} × {estimate.label}
              </dt>
              <dd>{formatMoney(estimate.total, price.currency)}</dd>
            </div>
            <div className="sh-bk-total">
              <dt>Tahmini toplam</dt>
              <dd>{formatMoney(estimate.total, price.currency)}</dd>
            </div>
          </dl>
        )}

        <ul className="sh-bk-meta">
          {approvalLabel && (
            <li>
              <ShieldCheck size={17} strokeWidth={1.8} aria-hidden="true" /> {approvalLabel}
            </li>
          )}
          {cancellationLabel && (
            <li>
              <CircleCheck size={17} strokeWidth={1.8} aria-hidden="true" /> {cancellationLabel}
            </li>
          )}
          {minDuration && (
            <li>
              <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" /> En az {minDuration}
            </li>
          )}
        </ul>

        <Link href="/cashback" className="sh-bk-cash">
          <Gift size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>
            <b>%15’e varan cashback</b> — onaylanan rezervasyonda bakiyene eklenir.
          </span>
        </Link>
      </aside>

      {/* ---------- masaüstü yapışkan üst çubuk (body'ye taşınır; header'ın üstünde kalsın) ---------- */}
      {mounted &&
        createPortal(
          <div className={`sh-bk-top${topBar ? ' is-visible' : ''}`} aria-hidden={!topBar}>
            <div className="sh-container sh-bk-top-inner">
              <div className="sh-bk-top-boat">
                {coverUrl && (
                  <span className="sh-bk-top-img">
                    <Image src={coverUrl} alt="" fill sizes="60px" />
                  </span>
                )}
                <span>
                  <b>{boat.title}</b>
                  <small>{place}</small>
                </span>
              </div>
              <div className="sh-bk-top-cta">
                <span>
                  {priceLine}
                  <small>{ready ? tripText(trip) : 'Şimdi ücret alınmaz'}</small>
                </span>
                <button type="button" className="sh-btn sh-btn--navy" onClick={reserve} tabIndex={topBar ? 0 : -1}>
                  {ready ? 'Rezervasyon yap' : 'Tarih seç'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ---------- mobil alt çubuk ---------- */}
      <div className="sh-bk-bar">
        <div>
          {priceLine}
          <button type="button" className="sh-bk-bar-dates" onClick={() => setModal(true)}>
            {ready ? tripText(trip) : 'Tarih seç'}
          </button>
        </div>
        <button type="button" className="sh-btn sh-btn--navy" onClick={() => setModal(true)}>
          Rezervasyon yap
        </button>
      </div>

      <TripPickerModal
        open={modal}
        initial={trip}
        hourly={hourly}
        maxGuests={maxGuests}
        blocked={blocked}
        confirmLabel="Devam et"
        footerNote={v => {
          const e = estimatePrice(price, v.range.start, v.range.end, v.startTime, v.endTime)
          return e && price ? (
            <>
              <b>{formatMoney(e.total, price.currency)}</b> · {e.label}
            </>
          ) : (
            tripText(v)
          )
        }}
        onClose={() => setModal(false)}
        onConfirm={v => {
          setTrip(v)
          setModal(false)
          goCheckout(v)
        }}
      />
    </>
  )
}
