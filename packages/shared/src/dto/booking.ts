import type { BookingStatus, RentalType } from "../enums";

/** Lightweight reference to the boat a booking targets. */
export interface BookingBoatRefDTO {
  id: string;
  name: string;
  coverPhoto: string | null;
}

export interface BookingDTO {
  id: string;
  boatId: string;
  captainId: string;

  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCount: number;

  rentalType: RentalType;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;

  totalPrice: number | null;
  currency: string;
  message: string | null;

  status: BookingStatus;
  rejectionNote: string | null;

  createdAt: string | Date;
  updatedAt: string | Date;

  boat: BookingBoatRefDTO | null;
}

export interface CreateBookingInput {
  boatId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestCount: number;
  rentalType: RentalType;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  message?: string | null;
}

export interface BookingListQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface BookingListResponse {
  bookings: BookingDTO[];
  total: number;
  page: number;
  limit: number;
  /** Number of PENDING requests — used for sidebar badges. */
  pendingCount: number;
}

/** A busy date range for availability calendars. */
export interface BookingBlockedRange {
  startDate: string;
  endDate: string;
  status: BookingStatus;
}
