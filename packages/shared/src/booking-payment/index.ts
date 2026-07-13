import { z } from "zod";

export const BookingPaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  PAYOUT_SENT: "PAYOUT_SENT",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;
export type BookingPaymentStatus =
  (typeof BookingPaymentStatus)[keyof typeof BookingPaymentStatus];

export const BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  [BookingPaymentStatus.PENDING]: "Bekleniyor",
  [BookingPaymentStatus.PAID]: "Ödendi",
  [BookingPaymentStatus.PAYOUT_SENT]: "Hesabınızda",
  [BookingPaymentStatus.REFUNDED]: "İade",
  [BookingPaymentStatus.FAILED]: "Başarısız",
};

/** Platform service fee applied to a booking's gross amount. */
export const PLATFORM_COMMISSION_RATE = 0.15;

export interface BookingPaymentDTO {
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
  status: BookingPaymentStatus;
  method: string | null;
  paidAt: string | null;
  payoutAt: string | null;
  invoiceUrl: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPaymentStats {
  totalRevenue: number;
  totalNet: number;
  totalCommission: number;
  totalBookings: number;
  monthlyEarnings: number;
  pendingPayout: number;
}

export interface BookingPaymentListResponse {
  payments: BookingPaymentDTO[];
  total: number;
  page: number;
  limit: number;
  stats: BookingPaymentStats;
}

export interface BookingPaymentListQuery {
  status?: BookingPaymentStatus;
  page?: number;
  limit?: number;
}

export const markPaymentPaidSchema = z.object({
  method: z.string().max(50).optional(),
  note: z.string().max(500).optional(),
});
export type MarkPaymentPaidInput = z.infer<typeof markPaymentPaidSchema>;

export function formatBookingPaymentAmount(amount: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency === "TRY" ? "₺" : `${currency} `;
  return `${symbol}${amount.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
