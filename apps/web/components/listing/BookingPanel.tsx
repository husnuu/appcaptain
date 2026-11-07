'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Hourglass, Minus, Moon, Plus, ShieldCheck, Sun, Zap, type LucideIcon } from 'lucide-react'
import type { SerializedBoatDTO } from '@getyourboat/shared'
import RangeCalendar from '@/components/sh/RangeCalendar'
import { fetchAvailability, type BlockedRange } from '@/lib/api'
import { TIME_OPTIONS, checkoutHref, estimatePrice, minutesOf } from '@/lib/bookingPrice'
import { formatDayMonth, formatMoney, listingModelLabel, priceUnit } from '@/lib/boatFormat'
import TripPickerModal, { tripIsComplete, type TripValue } from './TripPickerModal'

/**
 * İlan sayfasının rezervasyon durumu. Kart, satır içi müsaitlik takvimi ve
 * üst çubuk aynı state'i paylaşır; bu yüzden state ListingDetail'de tutulur.
 */
export function useBookingState(boat: SerializedBoatDTO) {
  const prices = useMemo(() => boat.pricing.filter(p => p.price > 0), [boat.pricing])
  const [priceKey, setPriceKey] = useState(prices[0]?.listingModelKey ?? '')
  const price = prices.find(p => p.listingModelKey === priceKey) ?? prices[0] ?? null
  const hourly = price?.listingModelKey === 'hourly'
  const [trip, setTrip] = useState<TripValue>({ range: { start: null, end: null }, guests: 1, startTime: null, endTime: null })
  const [blocked, setBlocked] = useState<BlockedRange[]>([])

  useEffect(() => {
    fetchAvailability(boat.id).then(setBlocked).catch(() => setBlocked([]))
  }, [boat.id])

  const selectModel = (key: string) => {
    setPriceKey(key)
    setTrip(t => ({ ...t, range: { start: null, end: null }, startTime: null, endTime: null }))
  }

  return { prices, price, hourly, trip, setTrip, blocked, selectModel }
}

export type BookingState = ReturnType<typeof useBookingState>

export interface ListingSection {
  id: string
  label: string
}

interface Props {
  boat: SerializedBoatDTO
  booking: BookingState
  /** Üst çubuktaki bölüm sekmeleri (sayfadaki section id'leri). */
  sections: ListingSection[]
  maxGuests: number
  approvalLabel: string | null
  cancellationLabel: string | null
  minDuration: string | null
}

/** Üst çubuğun yüksekliği; sekmeye tıklanınca bölüm bu kadar aşağıda durur. */
const BAR_OFFSET = 78

export default function BookingPanel({ boat, booking, sections, maxGuests, approvalLabel, cancellationLabel, minDuration }: Props) {
  const router = useRouter()
  const { prices, price, hourly, trip, setTrip, blocked, selectModel } = booking

  const [calOpen, setCalOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [topBar, setTopBar] = useState(false)
  const [cardGone, setCardGone] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLElement>(null)

  const sectionIds = sections.map(s => s.id).join(',')

  // Galeri geçilince üstte bölüm sekmeleri; kart görünmez olunca sağda fiyat + CTA.
  useEffect(() => {
    setMounted(true)
    const ids = sectionIds ? sectionIds.split(',') : []
    const onScroll = () => {
      const body = document.querySelector('.sh-ld-body') as HTMLElement | null
      setTopBar(!!body && body.getBoundingClientRect().top < 1)
      const card = cardRef.current
      setCardGone(!!card && card.getBoundingClientRect().bottom < BAR_OFFSET + 8)
      let current: string | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= BAR_OFFSET + 24) current = id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [sectionIds])

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

  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - BAR_OFFSET + 1, behavior: 'smooth' })
  }

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

  const facts: { icon: LucideIcon; text: string }[] = [
    price && {
      icon: price.listingModelKey === 'hourly' || price.listingModelKey === 'daily' ? Sun : Moon,
      text: listingModelLabel(price.listingModelKey, price.listingModelLabel),
    },
    minDuration && { icon: Hourglass, text: `En az ${minDuration}` },
    approvalLabel && { icon: approvalLabel === 'Anında rezervasyon' ? Zap : ShieldCheck, text: approvalLabel },
    cancellationLabel && { icon: CircleCheck, text: cancellationLabel },
  ].filter(Boolean) as { icon: LucideIcon; text: string }[]

  return (
    <>
      {/* ---------- masaüstü kart ---------- */}
      <aside className="sh-bk-card" aria-label="Rezervasyon" ref={cardRef}>
        {priceLine}
        <p className="sh-bk-sub">Başlangıç fiyatı</p>

        {prices.length > 1 && (
          <div className="sh-toggle sh-bk-models" role="tablist" aria-label="Kiralama türü">
            {prices.map(p => (
              <button
                key={p.listingModelKey}
                type="button"
                role="tab"
                aria-selected={p.listingModelKey === price?.listingModelKey}
                onClick={() => selectModel(p.listingModelKey)}
              >
                {listingModelLabel(p.listingModelKey, p.listingModelLabel).replace(' kiralama', '')}
              </button>
            ))}
          </div>
        )}

        {facts.length > 0 && (
          <ul className="sh-bk-facts">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text}>
                <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        )}

        <div className="sh-bk-box" ref={calRef}>
          <button type="button" className={`sh-bk-dates${hourly ? ' sh-bk-dates--one' : ''}`} onClick={() => setCalOpen(o => !o)} aria-expanded={calOpen}>
            {hourly ? (
              <span>
                <small>Tarih</small>
                <b className={trip.range.start ? '' : 'is-empty'}>{trip.range.start ? formatDayMonth(trip.range.start) : 'Gün seçin'}</b>
              </span>
            ) : (
              <>
                <span>
                  <small>Giriş</small>
                  <b className={trip.range.start ? '' : 'is-empty'}>{trip.range.start ? formatDayMonth(trip.range.start) : 'Tarih ekleyin'}</b>
                </span>
                <span>
                  <small>Çıkış</small>
                  <b className={trip.range.end ? '' : 'is-empty'}>{trip.range.end ? formatDayMonth(trip.range.end) : 'Tarih ekleyin'}</b>
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
              <small>Misafir</small>
              <b>
                {trip.guests} kişi <i>· en fazla {maxGuests}</i>
              </b>
            </span>
            <div className="sh-stepper sh-stepper--sm">
              <button type="button" aria-label="Azalt" disabled={trip.guests <= 1} onClick={() => setTrip(t => ({ ...t, guests: t.guests - 1 }))}>
                <Minus size={15} />
              </button>
              <button type="button" aria-label="Arttır" disabled={trip.guests >= maxGuests} onClick={() => setTrip(t => ({ ...t, guests: t.guests + 1 }))}>
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>

        <button type="button" className="sh-btn sh-btn--navy sh-bk-cta" onClick={reserve}>
          {ready ? 'Rezervasyon yap' : 'Müsaitliği kontrol et'}
        </button>
        <p className="sh-bk-note">Henüz bir ödeme yapmayacaksın.</p>

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
      </aside>

      {/* ---------- masaüstü yapışkan üst çubuk: bölüm sekmeleri + (kart kaybolunca) fiyat ve CTA ---------- */}
      {mounted &&
        createPortal(
          <div className={`sh-bk-top${topBar ? ' is-visible' : ''}`} aria-hidden={!topBar}>
            <div className="sh-container sh-bk-top-inner">
              <nav className="sh-bk-tabs" aria-label="İlan bölümleri">
                {sections.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={active === s.id ? 'is-active' : undefined}
                    tabIndex={topBar ? 0 : -1}
                    onClick={e => {
                      e.preventDefault()
                      jump(s.id)
                    }}
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
              <div className={`sh-bk-top-cta${cardGone ? ' is-visible' : ''}`} aria-hidden={!cardGone}>
                <span>
                  {priceLine}
                  <small>{ready ? tripText(trip) : 'Tahmini toplam için tarih seç'}</small>
                </span>
                <button type="button" className="sh-btn sh-btn--navy" onClick={reserve} tabIndex={topBar && cardGone ? 0 : -1}>
                  {ready ? 'Rezervasyon yap' : 'Müsaitliği kontrol et'}
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
