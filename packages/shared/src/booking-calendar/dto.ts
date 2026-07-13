import type { BlockReason } from "./enums";

export interface CreateBlockInput {
  boatId: string;
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
  createdBy: string;
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
