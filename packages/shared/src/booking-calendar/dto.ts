import type { BlockReason, BookingModel } from "./enums";

export interface CreateBlockInput {
  boatId: string;
  model?: BookingModel;
  reason: BlockReason;
  note?: string;
  // Day-based (daily / overnight / weekly_charter):
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  // Hourly:
  date?: string; // 'YYYY-MM-DD'
  startTime?: string; // 'HH:mm'
  endTime?: string; // 'HH:mm'
}

export interface CalendarBlockDTO {
  id: string;
  boatId: string;
  reason: BlockReason;
  note: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface SetPriceOverrideInput {
  boatId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  price: number;
  currency: string;
}

export interface GetAvailabilityQuery {
  rangeStart: string;
  rangeEnd: string;
  model: string;
}

/** DTO used by fresh_start's booking-calendar API (model required). */
export interface CreateBlockRequestDTO {
  boatId: string;
  model: BookingModel;
  reason: BlockReason;
  note?: string;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  date?: string;      // 'YYYY-MM-DD'
  startTime?: string; // 'HH:mm'
  endTime?: string;   // 'HH:mm'
}

export interface UpdateBlockRequestDTO {
  reason?: BlockReason;
  note?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface BlockResponseDTO {
  id: string;
  boatId: string;
  model: BookingModel | null;
  reason: BlockReason;
  note: string | null;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  startTime: string | null; // 'HH:mm'
  endTime: string | null;   // 'HH:mm'
  createdAt: string;
  createdBy: string | null;
}

export type UpdateBlockInput = UpdateBlockRequestDTO;

export interface GetAvailabilityRequestDTO {
  boatId: string;
  model: BookingModel;
  rangeStart: string; // 'YYYY-MM-DD'
  rangeEnd: string;   // 'YYYY-MM-DD'
}

export interface MockReservationDTO {
  id: string;
  boatId: string;
  model: BookingModel;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  guestName: string;
  note: string | null;
  createdAt: string;
}
