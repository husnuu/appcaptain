import type {
  BookingPaymentDTO,
  BookingPaymentListQuery,
  BookingPaymentStats,
  BookingPaymentStatus,
} from "@getyourboat/shared";

export interface CreateBookingPaymentData {
  bookingId: string;
  captainId: string;
  guestName: string;
  guestEmail: string;
  boatName: string;
  amount: number;
  commission: number;
  netAmount: number;
  currency: string;
}

export interface BookingPaymentRepository {
  existsForBooking(bookingId: string): Promise<boolean>;
  create(data: CreateBookingPaymentData): Promise<BookingPaymentDTO>;
  listForCaptain(
    captainId: string,
    query: BookingPaymentListQuery
  ): Promise<{ payments: BookingPaymentDTO[]; total: number; page: number; limit: number }>;
  statsForCaptain(captainId: string): Promise<BookingPaymentStats>;
  getById(id: string): Promise<BookingPaymentDTO | null>;
  markPaid(
    id: string,
    method?: string | null,
    note?: string | null
  ): Promise<BookingPaymentDTO>;
  markPayout(id: string): Promise<BookingPaymentDTO>;
}

export interface BookingPaymentRow {
  id: string;
  bookingId: string;
  captainId: string;
  guestName: string;
  guestEmail: string;
  boatName: string;
  amount: number;
  commission: number;
  netAmount: number;
  currency: string;
  status: string;
  method: string | null;
  paidAt: Date | null;
  payoutAt: Date | null;
  invoiceUrl: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toBookingPaymentDTO(row: BookingPaymentRow): BookingPaymentDTO {
  return {
    id: row.id,
    bookingId: row.bookingId,
    captainId: row.captainId,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    boatName: row.boatName,
    amount: row.amount,
    commission: row.commission,
    netAmount: row.netAmount,
    currency: row.currency,
    status: row.status as BookingPaymentStatus,
    method: row.method,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    payoutAt: row.payoutAt ? row.payoutAt.toISOString() : null,
    invoiceUrl: row.invoiceUrl,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
