import type {
  BookingBlockedRange,
  BookingDTO,
  BookingListQuery,
  BookingListResponse,
  BookingStatus,
  CreateBookingInput,
} from "@getyourboat/shared";

export interface BookingRepository {
  /** Returns the existing overlapping PENDING/APPROVED booking, if any. */
  findConflict(
    boatId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ startDate: Date; endDate: Date } | null>;
  create(input: CreateBookingInput, captainId: string): Promise<BookingDTO>;
  getById(id: string): Promise<BookingDTO | null>;
  /** Captain's incoming requests, scoped by captainId. */
  listByCaptain(
    captainId: string,
    query: BookingListQuery
  ): Promise<BookingListResponse>;
  approve(id: string, totalPrice?: number | null): Promise<BookingDTO>;
  reject(id: string, rejectionNote?: string | null): Promise<BookingDTO>;
  /** Boat owner (Profile id) — used to scope captain access. */
  getBoatCaptainId(boatId: string): Promise<string | null>;
  /** Future busy ranges for availability calendars. */
  listAvailability(boatId: string): Promise<BookingBlockedRange[]>;
}

export interface BookingRow {
  id: string;
  boatId: string;
  captainId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCount: number;
  rentalType: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  totalPrice: number | null;
  currency: string;
  message: string | null;
  status: string;
  rejectionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  boat?: {
    id: string;
    title: string | null;
    photos?: { publicUrl: string | null }[];
  } | null;
}

export function toBookingDTO(row: BookingRow): BookingDTO {
  return {
    id: row.id,
    boatId: row.boatId,
    captainId: row.captainId,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    guestCount: row.guestCount,
    rentalType: row.rentalType as BookingDTO["rentalType"],
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    startTime: row.startTime,
    endTime: row.endTime,
    totalPrice: row.totalPrice,
    currency: row.currency,
    message: row.message,
    status: row.status as BookingStatus,
    rejectionNote: row.rejectionNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    boat: row.boat
      ? {
          id: row.boat.id,
          name: row.boat.title?.trim() || "İsimsiz tekne",
          coverPhoto: row.boat.photos?.[0]?.publicUrl ?? null,
        }
      : null,
  };
}
