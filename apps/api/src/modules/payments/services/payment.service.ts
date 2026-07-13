import type {
  BookingPaymentListQuery,
  BookingPaymentListResponse,
} from "@getyourboat/shared";
import { bookingPaymentRepository } from "@getyourboat/database";
import { forbidden, notFound } from "../../../lib/errors.js";

export async function listCaptainPayments(
  captainId: string,
  query: BookingPaymentListQuery
): Promise<BookingPaymentListResponse> {
  const [list, stats] = await Promise.all([
    bookingPaymentRepository.listForCaptain(captainId, query),
    bookingPaymentRepository.statsForCaptain(captainId),
  ]);
  return { ...list, stats };
}

export async function getPayment(
  id: string,
  requesterId: string,
  isAdmin: boolean
) {
  const payment = await bookingPaymentRepository.getById(id);
  if (!payment) throw notFound("Ödeme bulunamadı");
  if (!isAdmin && payment.captainId !== requesterId) {
    throw forbidden("Bu ödemeye erişim yetkiniz yok");
  }
  return payment;
}

export async function markPaid(
  id: string,
  method?: string | null,
  note?: string | null
) {
  const payment = await bookingPaymentRepository.getById(id);
  if (!payment) throw notFound("Ödeme bulunamadı");
  return bookingPaymentRepository.markPaid(id, method, note);
}

export async function markPayout(id: string) {
  const payment = await bookingPaymentRepository.getById(id);
  if (!payment) throw notFound("Ödeme bulunamadı");
  return bookingPaymentRepository.markPayout(id);
}
