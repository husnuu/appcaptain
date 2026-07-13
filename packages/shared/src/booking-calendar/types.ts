import type { SlotStatus } from "./enums";

export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  status: SlotStatus;
  bookingId?: string;
  blockId?: string;
  basePrice?: number; // override price for that day, if any
  currency?: string;
}

export interface TimeSlot {
  date: string;
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  status: SlotStatus;
  bookingId?: string;
  blockId?: string;
  basePrice?: number;
}

export interface AvailabilityMap {
  boatId: string;
  /** Listing-model key the availability was computed for. */
  model: string;
  rangeStart: string;
  rangeEnd: string;
  /** Default price for the model (from boat pricing) when no override exists. */
  defaultPrice?: number;
  currency?: string;
  days?: CalendarDay[]; // non-hourly models
  slots?: TimeSlot[]; // hourly model
}

export interface PriceOverride {
  date: string;
  startTime?: string;
  endTime?: string;
  price: number;
  currency: string;
}
