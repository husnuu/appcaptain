import type { BlockReason, CalendarBlockDTO } from "@getyourboat/shared";

export interface CreateCalendarBlockData {
  boatId: string;
  reason: BlockReason;
  note?: string | null;
  startDate: Date;
  endDate: Date;
  startTime?: string | null;
  endTime?: string | null;
  createdBy: string;
}

export interface UpsertPriceOverrideData {
  boatId: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  price: number;
  currency: string;
}

/** Booking rows that occupy the calendar (PENDING/APPROVED). */
export interface CalendarBusyBooking {
  id: string;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
}

export interface CalendarPriceOverrideRow {
  date: string;
  startTime: string | null;
  endTime: string | null;
  price: number;
  currency: string;
}

export interface CalendarRepository {
  createBlock(data: CreateCalendarBlockData): Promise<CalendarBlockDTO>;
  deleteBlock(id: string): Promise<void>;
  getBlockById(id: string): Promise<{ id: string; boatId: string } | null>;
  getBlocksByRange(
    boatId: string,
    start: Date,
    end: Date
  ): Promise<CalendarBlockDTO[]>;
  getAllBlocks(
    boatId: string,
    page: number,
    limit: number
  ): Promise<CalendarBlockDTO[]>;
  getBusyBookingsByRange(
    boatId: string,
    start: Date,
    end: Date
  ): Promise<CalendarBusyBooking[]>;
  upsertPriceOverride(
    data: UpsertPriceOverrideData
  ): Promise<CalendarPriceOverrideRow>;
  getPriceOverridesByRange(
    boatId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarPriceOverrideRow[]>;
  getBoatOwnerId(boatId: string): Promise<string | null>;
  /** Default price/currency for a listing model, from boat pricing. */
  getModelPricing(
    boatId: string,
    modelKey: string
  ): Promise<{ price: number; currency: string } | null>;
}

export interface CalendarBlockRow {
  id: string;
  boatId: string;
  reason: string;
  note: string | null;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export function toCalendarBlockDTO(row: CalendarBlockRow): CalendarBlockDTO {
  return {
    id: row.id,
    boatId: row.boatId,
    reason: row.reason as CalendarBlockDTO["reason"],
    note: row.note,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    startTime: row.startTime,
    endTime: row.endTime,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}
