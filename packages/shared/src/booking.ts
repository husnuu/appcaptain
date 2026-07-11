import { BookingStatus, RentalType } from "./enums";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "Bekliyor",
  [BookingStatus.APPROVED]: "Onaylandı",
  [BookingStatus.REJECTED]: "Reddedildi",
  [BookingStatus.CANCELLED]: "İptal",
  [BookingStatus.COMPLETED]: "Tamamlandı",
};

export const RENTAL_TYPE_LABELS: Record<RentalType, string> = {
  [RentalType.HOURLY]: "Saatlik",
  [RentalType.DAILY]: "Günlük",
  [RentalType.WEEKLY]: "Haftalık",
  [RentalType.STAY]: "Konaklama",
};

/** Human-readable price, e.g. "€1.200" / "₺15.000". */
export function formatBookingPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
