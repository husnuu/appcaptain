import type { BlockReason, BlockResponseDTO, BookingModel } from "@getyourboat/shared";

export interface CreateBlockData {
  boatId: string;
  model: BookingModel;
  reason: BlockReason;
  note?: string;
  startDate: Date;
  endDate: Date;
  startTime?: string;
  endTime?: string;
  createdById: string;
}

export interface UpdateBlockData {
  reason?: BlockReason;
  note?: string | null;
  startDate?: Date;
  endDate?: Date;
  startTime?: string | null;
  endTime?: string | null;
}

/** Minimal shape returned from the Reservation table for availability checks. */
export interface ReservationDateRange {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface CreateMockReservationData {
  boatId: string;
  model: BookingModel;
  startDate: Date;
  endDate: Date;
  guestName: string;
  note?: string;
}

export interface MockReservationRow {
  id: string;
  boatId: string;
  model: string;
  startDate: string;
  endDate: string;
  guestName: string;
  note: string | null;
  createdAt: string;
}

export function toMockReservationRow(row: {
  id: string;
  boatId: string;
  model: string;
  startDate: Date;
  endDate: Date;
  guestName: string;
  note: string | null;
  createdAt: Date;
}): MockReservationRow {
  return {
    id: row.id,
    boatId: row.boatId,
    model: row.model,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    guestName: row.guestName,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface BookingCalendarRepository {
  createBlock(data: CreateBlockData): Promise<BlockResponseDTO>;
  updateBlock(id: string, data: UpdateBlockData): Promise<BlockResponseDTO>;
  deleteBlock(id: string): Promise<void>;
  getBlockById(id: string): Promise<BlockResponseDTO | null>;
  getBlocksByBoatAndRange(
    boatId: string,
    start: Date,
    end: Date,
  ): Promise<BlockResponseDTO[]>;
  getActiveBookingsByBoatAndRange(
    boatId: string,
    start: Date,
    end: Date,
  ): Promise<ReservationDateRange[]>;
  getBoatListingModelKeys(boatId: string): Promise<string[]>;
  getBoatOwnerById(boatId: string): Promise<string | null>;
  createMockReservation(data: CreateMockReservationData): Promise<MockReservationRow>;
  listMockReservations(boatId: string, start: Date, end: Date): Promise<MockReservationRow[]>;
  deleteMockReservation(id: string): Promise<void>;
  getMockReservationById(id: string): Promise<MockReservationRow | null>;
}

export function toBlockResponseDTO(row: CalendarBlockRow): BlockResponseDTO {
  return {
    id: row.id,
    boatId: row.boatId,
    model: row.model as BookingModel,
    reason: row.reason as BlockReason,
    note: row.note,
    startDate: row.startDate.toISOString().slice(0, 10),
    endDate: row.endDate.toISOString().slice(0, 10),
    startTime: row.startTime,
    endTime: row.endTime,
    createdAt: row.createdAt.toISOString(),
    createdById: row.createdById,
  };
}

export type CalendarBlockRow = {
  id: string;
  boatId: string;
  model: string;
  reason: string;
  note: string | null;
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
};
