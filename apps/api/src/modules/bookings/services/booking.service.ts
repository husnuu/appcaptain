import type {
  BookingListQuery,
  CreateBookingInput,
} from "@getyourboat/shared";
import { PLATFORM_COMMISSION_RATE } from "@getyourboat/shared";
import {
  bookingPaymentRepository,
  bookingRepository,
  guestConversationRepository,
} from "@getyourboat/database";
import { conflict, forbidden, notFound } from "../../../lib/errors.js";

export async function createBooking(input: CreateBookingInput) {
  const captainId = await bookingRepository.getBoatCaptainId(input.boatId);
  if (!captainId) throw notFound("Tekne bulunamadı");

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const clash = await bookingRepository.findConflict(input.boatId, start, end);
  if (clash) {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    throw conflict(
      `Bu tarihler için zaten bir rezervasyon var (${fmt(clash.startDate)} → ${fmt(clash.endDate)}).`
    );
  }

  const booking = await bookingRepository.create(input, captainId);

  // Best-effort: open a guest conversation seeded from the request note so the
  // captain can reply. A messaging failure must not fail the booking itself.
  try {
    await guestConversationRepository.getOrCreateForBooking({
      bookingId: booking.id,
      captainId,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      boatId: booking.boatId,
      initialMessage: booking.message ?? null,
    });
  } catch {
    /* ignore — conversation can be created later */
  }

  return booking;
}

export function getAvailability(boatId: string) {
  return bookingRepository.listAvailability(boatId);
}

export function listCaptainBookings(captainId: string, query: BookingListQuery) {
  return bookingRepository.listByCaptain(captainId, query);
}

async function loadOwnedBooking(id: string, captainId: string) {
  const booking = await bookingRepository.getById(id);
  if (!booking) throw notFound("Rezervasyon bulunamadı");
  if (booking.captainId !== captainId) {
    throw forbidden("Bu rezervasyona erişim yetkiniz yok");
  }
  return booking;
}

export async function approveBooking(
  id: string,
  captainId: string,
  totalPrice?: number | null
) {
  await loadOwnedBooking(id, captainId);
  const booking = await bookingRepository.approve(id, totalPrice);

  // Best-effort: open a PENDING payment record (gross - 15% commission) so the
  // captain sees expected earnings. Skipped when no amount is known yet.
  try {
    const amount = booking.totalPrice ?? 0;
    if (amount > 0 && !(await bookingPaymentRepository.existsForBooking(id))) {
      const commission = Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100;
      await bookingPaymentRepository.create({
        bookingId: id,
        captainId: booking.captainId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        boatName: booking.boat?.name ?? "İsimsiz tekne",
        amount,
        commission,
        netAmount: Math.round((amount - commission) * 100) / 100,
        currency: booking.currency,
      });
    }
  } catch {
    /* ignore — payment can be reconciled later */
  }

  return booking;
}

export async function rejectBooking(
  id: string,
  captainId: string,
  rejectionNote?: string | null
) {
  await loadOwnedBooking(id, captainId);
  return bookingRepository.reject(id, rejectionNote);
}
