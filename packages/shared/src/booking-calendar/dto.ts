import type { BlockReason, BookingModel } from "./enums.js";

export interface CreateBlockRequestDTO {
  boatId: string;
  model: BookingModel;
  reason: BlockReason;
  note?: string;
  // Day-based models (DAILY, STAY_INCLUDED, WEEKLY):
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  // Hourly model:
  date?: string;      // 'YYYY-MM-DD'
  startTime?: string; // 'HH:mm'
  endTime?: string;   // 'HH:mm'
}

/** Only note, reason, and date/time fields are patchable — boatId and model are immutable. */
export interface UpdateBlockRequestDTO {
  reason?: BlockReason;
  note?: string;
  // Day-based:
  startDate?: string;
  endDate?: string;
  // Hourly:
  date?: string;
  startTime?: string;
  endTime?: string;
}

export interface BlockResponseDTO {
  id: string;
  boatId: string;
  model: BookingModel;
  reason: BlockReason;
  note: string | null;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  startTime: string | null; // 'HH:mm'
  endTime: string | null;   // 'HH:mm'
  createdAt: string;
  createdById: string;
}

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
