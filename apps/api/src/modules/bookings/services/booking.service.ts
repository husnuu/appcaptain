import type {
  BookingListQuery,
  CreateBookingInput,
} from "@getyourboat/shared";
import { bookingRepository } from "@getyourboat/database";
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

  return bookingRepository.create(input, captainId);
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
  return bookingRepository.approve(id, totalPrice);
}

export async function rejectBooking(
  id: string,
  captainId: string,
  rejectionNote?: string | null
) {
  await loadOwnedBooking(id, captainId);
  return bookingRepository.reject(id, rejectionNote);
}
