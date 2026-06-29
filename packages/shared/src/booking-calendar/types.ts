import type { BookingModel, SlotStatus } from "./enums.js";

/** State of a single day for day-based models (DAILY, STAY_INCLUDED, WEEKLY). */
export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  status: SlotStatus;
  bookingId?: string;
  blockId?: string;
}

/** State of a single time slot for the HOURLY model. */
export interface TimeSlot {
  date: string;      // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
  endTime: string;   // 'HH:mm'
  status: SlotStatus;
  bookingId?: string;
  blockId?: string;
}

/** Full availability map for a boat over a date range. */
export interface AvailabilityMap {
  boatId: string;
  model: BookingModel;
  rangeStart: string; // 'YYYY-MM-DD'
  rangeEnd: string;   // 'YYYY-MM-DD'
  /** Populated when model !== HOURLY */
  days?: CalendarDay[];
  /** Populated when model === HOURLY */
  slots?: TimeSlot[];
}
