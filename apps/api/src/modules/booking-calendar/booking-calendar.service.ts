import { bookingCalendarRepository } from "@getyourboat/database";
import type { CreateBlockData, UpdateBlockData } from "@getyourboat/database";
import {
  BookingModel,
  SlotStatus,
} from "@getyourboat/shared";
import type {
  AvailabilityMap,
  BlockResponseDTO,
  CalendarDay,
  CreateBlockInput,
  TimeSlot,
  UpdateBlockInput,
} from "@getyourboat/shared";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import type { AuthUser } from "../../plugins/captain-auth.js";

// Default operating window for hourly boats.
// TODO: make this configurable per boat via boat settings.
const HOURLY_START = "08:00";
const HOURLY_END = "22:00";
const SLOT_DURATION_MINUTES = 60;

// Maps BookingModel enum → the seeded ListingModelOption key stored in the DB.
const BOOKING_MODEL_TO_LISTING_KEY: Record<BookingModel, string> = {
  HOURLY: "hourly",
  DAILY: "daily",
  STAY_INCLUDED: "overnight",
  WEEKLY: "weekly_charter",
};

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function parseDate(dateStr: string): Date {
  // Parse YYYY-MM-DD as UTC midnight to avoid timezone drift.
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Produces every YYYY-MM-DD between start and end inclusive. */
function eachDayInRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(toDateString(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

/** Generates time slots for a single day between HOURLY_START and HOURLY_END. */
function generateSlots(_date: string): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];
  const [startH = 8, startM = 0] = HOURLY_START.split(":").map(Number);
  const [endH = 22, endM = 0] = HOURLY_END.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  for (let t = startTotal; t + SLOT_DURATION_MINUTES <= endTotal; t += SLOT_DURATION_MINUTES) {
    const sh = String(Math.floor(t / 60)).padStart(2, "0");
    const sm = String(t % 60).padStart(2, "0");
    const et = t + SLOT_DURATION_MINUTES;
    const eh = String(Math.floor(et / 60)).padStart(2, "0");
    const em = String(et % 60).padStart(2, "0");
    slots.push({ startTime: `${sh}:${sm}`, endTime: `${eh}:${em}` });
  }
  return slots;
}

function timeToMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

function timeSlotsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart);
}

// -------------------------------------------------------------------
// Validation
// -------------------------------------------------------------------

function validateModelFields(input: CreateBlockInput): void {
  if (input.model === BookingModel.HOURLY) {
    if (!input.date || !input.startTime || !input.endTime) {
      throw badRequest("Hourly model requires date, startTime, and endTime");
    }
    if (timeToMinutes(input.startTime) >= timeToMinutes(input.endTime)) {
      throw badRequest("startTime must be before endTime");
    }
  } else {
    if (!input.startDate || !input.endDate) {
      throw badRequest("This model requires startDate and endDate");
    }
    if (input.startDate > input.endDate) {
      throw badRequest("startDate must be on or before endDate");
    }
  }
}

// -------------------------------------------------------------------
// Overlap check
// -------------------------------------------------------------------

async function checkOverlap(
  boatId: string,
  model: BookingModel,
  startDate: Date,
  endDate: Date,
  startTime?: string,
  endTime?: string,
  excludeBlockId?: string,
): Promise<void> {
  const [existingBlocks, existingBookings] = await Promise.all([
    bookingCalendarRepository.getBlocksByBoatAndRange(boatId, startDate, endDate),
    bookingCalendarRepository.getActiveBookingsByBoatAndRange(boatId, startDate, endDate),
  ]);

  const blocksToCheck = excludeBlockId
    ? existingBlocks.filter((b) => b.id !== excludeBlockId)
    : existingBlocks;

  if (model === BookingModel.HOURLY && startTime && endTime) {
    const day = toDateString(startDate);
    for (const block of blocksToCheck) {
      if (block.model === BookingModel.HOURLY && block.startDate === day) {
        if (
          block.startTime &&
          block.endTime &&
          timeSlotsOverlap(startTime, endTime, block.startTime, block.endTime)
        ) {
          throw conflict(
            `Time slot overlaps with an existing block (${block.startTime}–${block.endTime})`,
          );
        }
      }
    }
    for (const booking of existingBookings) {
      // Reservations occupy the full day for now; treat as fully blocked.
      if (toDateString(booking.startDate) <= day && toDateString(booking.endDate) >= day) {
        throw conflict("A confirmed booking exists on this date");
      }
    }
  } else {
    if (blocksToCheck.length > 0) {
      const b = blocksToCheck[0]!;
      throw conflict(
        `Date range overlaps with an existing block (${b.startDate}–${b.endDate})`,
      );
    }
    if (existingBookings.length > 0) {
      const bk = existingBookings[0]!;
      throw conflict(
        `Date range overlaps with a confirmed booking (${toDateString(bk.startDate)}–${toDateString(bk.endDate)})`,
      );
    }
  }
}

// -------------------------------------------------------------------
// Public service functions
// -------------------------------------------------------------------

export async function createBlock(
  input: CreateBlockInput,
  user: AuthUser,
): Promise<BlockResponseDTO> {
  validateModelFields(input);

  // Reject past-date blocks server-side (UI already prevents this, but guard the API too).
  const blockStartStr = input.model === BookingModel.HOURLY ? input.date! : input.startDate!;
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  if (parseDate(blockStartStr) < todayUTC) {
    throw badRequest("Cannot create a block in the past");
  }

  const enabledKeys = await bookingCalendarRepository.getBoatListingModelKeys(input.boatId);
  const requiredKey = BOOKING_MODEL_TO_LISTING_KEY[input.model];
  if (!enabledKeys.includes(requiredKey)) {
    throw badRequest(`This boat does not support the ${input.model} booking model`);
  }

  let startDate: Date;
  let endDate: Date;
  let startTime: string | undefined;
  let endTime: string | undefined;

  if (input.model === BookingModel.HOURLY) {
    startDate = parseDate(input.date!);
    endDate = parseDate(input.date!);
    startTime = input.startTime;
    endTime = input.endTime;
  } else {
    startDate = parseDate(input.startDate!);
    endDate = parseDate(input.endDate!);
  }

  await checkOverlap(input.boatId, input.model, startDate, endDate, startTime, endTime);

  const data: CreateBlockData = {
    boatId: input.boatId,
    model: input.model,
    reason: input.reason,
    note: input.note,
    startDate,
    endDate,
    startTime,
    endTime,
    createdById: user.id,
  };

  return bookingCalendarRepository.createBlock(data);
}

export async function updateBlock(
  id: string,
  input: UpdateBlockInput,
  user: AuthUser,
): Promise<BlockResponseDTO> {
  const existing = await bookingCalendarRepository.getBlockById(id);
  if (!existing) throw notFound("Block not found");

  if (existing.createdById !== user.id && user.role !== "ADMIN") {
    const ownerId = await bookingCalendarRepository.getBoatOwnerById(existing.boatId);
    if (ownerId !== user.id) throw forbidden("You do not have permission to update this block");
  }

  // Resolve the final date/time values for overlap check.
  const isHourly = existing.model === BookingModel.HOURLY;

  let newStartDate: Date | undefined;
  let newEndDate: Date | undefined;
  let newStartTime: string | null | undefined;
  let newEndTime: string | null | undefined;

  if (isHourly) {
    if (input.date) {
      newStartDate = parseDate(input.date);
      newEndDate = parseDate(input.date);
    }
    newStartTime = input.startTime ?? existing.startTime;
    newEndTime = input.endTime ?? existing.endTime;

    if (newStartTime && newEndTime) {
      if (timeToMinutes(newStartTime) >= timeToMinutes(newEndTime)) {
        throw badRequest("startTime must be before endTime");
      }
    }
  } else {
    if (input.startDate) newStartDate = parseDate(input.startDate);
    if (input.endDate) newEndDate = parseDate(input.endDate);

    const effectiveStart = newStartDate ?? parseDate(existing.startDate);
    const effectiveEnd = newEndDate ?? parseDate(existing.endDate);
    if (effectiveStart > effectiveEnd) {
      throw badRequest("startDate must be on or before endDate");
    }
  }

  // Re-check overlap if dates are changing.
  if (newStartDate || newEndDate || newStartTime !== undefined || newEndTime !== undefined) {
    const checkStart = newStartDate ?? parseDate(existing.startDate);
    const checkEnd = newEndDate ?? parseDate(existing.endDate);
    const checkStartTime = isHourly ? (newStartTime ?? existing.startTime ?? undefined) : undefined;
    const checkEndTime = isHourly ? (newEndTime ?? existing.endTime ?? undefined) : undefined;

    await checkOverlap(
      existing.boatId,
      existing.model,
      checkStart,
      checkEnd,
      checkStartTime,
      checkEndTime,
      id,
    );
  }

  const updateData: UpdateBlockData = {
    ...(input.reason !== undefined && { reason: input.reason }),
    ...(input.note !== undefined && { note: input.note }),
    ...(newStartDate !== undefined && { startDate: newStartDate }),
    ...(newEndDate !== undefined && { endDate: newEndDate }),
    ...(newStartTime !== undefined && { startTime: newStartTime }),
    ...(newEndTime !== undefined && { endTime: newEndTime }),
  };

  return bookingCalendarRepository.updateBlock(id, updateData);
}

export async function deleteBlock(id: string, user: AuthUser): Promise<void> {
  const existing = await bookingCalendarRepository.getBlockById(id);
  if (!existing) throw notFound("Block not found");
  if (existing.createdById !== user.id && user.role !== "ADMIN") {
    const ownerId = await bookingCalendarRepository.getBoatOwnerById(existing.boatId);
    if (ownerId !== user.id) throw forbidden("You do not have permission to delete this block");
  }
  await bookingCalendarRepository.deleteBlock(id);
}

export async function listBlocks(boatId: string): Promise<BlockResponseDTO[]> {
  // Range covers ±2 years; sufficient for calendar management.
  const start = new Date();
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  const end = new Date();
  end.setUTCFullYear(end.getUTCFullYear() + 2);
  return bookingCalendarRepository.getBlocksByBoatAndRange(boatId, start, end);
}

export async function computeAvailability(
  boatId: string,
  model: BookingModel,
  rangeStart: string,
  rangeEnd: string,
): Promise<AvailabilityMap> {
  const start = parseDate(rangeStart);
  const end = parseDate(rangeEnd);

  const [blocks, bookings] = await Promise.all([
    bookingCalendarRepository.getBlocksByBoatAndRange(boatId, start, end),
    bookingCalendarRepository.getActiveBookingsByBoatAndRange(boatId, start, end),
  ]);

  if (model === BookingModel.HOURLY) {
    const daySlots: TimeSlot[] = [];

    for (const day of eachDayInRange(start, end)) {
      const generated = generateSlots(day);

      // All blocks (any model) that cover this day
      const dayBlocks = blocks.filter((b) => b.startDate <= day && b.endDate >= day);
      const dayBookings = bookings.filter(
        (bk) => toDateString(bk.startDate) <= day && toDateString(bk.endDate) >= day,
      );

      // A non-HOURLY block has no time specificity — it blocks the entire day
      const fullDayBlock = dayBlocks.find((b) => b.model !== BookingModel.HOURLY);

      for (const { startTime, endTime } of generated) {
        if (fullDayBlock) {
          daySlots.push({ date: day, startTime, endTime, status: SlotStatus.BLOCKED, blockId: fullDayBlock.id });
          continue;
        }
        const timeBlock = dayBlocks.find(
          (b) =>
            b.model === BookingModel.HOURLY &&
            b.startTime &&
            b.endTime &&
            timeSlotsOverlap(startTime, endTime, b.startTime, b.endTime),
        );
        if (timeBlock) {
          daySlots.push({ date: day, startTime, endTime, status: SlotStatus.BLOCKED, blockId: timeBlock.id });
          continue;
        }
        if (dayBookings.length > 0) {
          daySlots.push({ date: day, startTime, endTime, status: SlotStatus.BOOKED, bookingId: dayBookings[0]!.id });
          continue;
        }
        daySlots.push({ date: day, startTime, endTime, status: SlotStatus.AVAILABLE });
      }
    }

    // Day-level summary so the month grid can show blocked/booked days on the HOURLY tab.
    const days: CalendarDay[] = eachDayInRange(start, end).map((day) => {
      const slotsForDay = daySlots.filter((s) => s.date === day);
      const blocked = slotsForDay.find((s) => s.status === SlotStatus.BLOCKED);
      if (blocked) return { date: day, status: SlotStatus.BLOCKED, blockId: blocked.blockId };
      const booked = slotsForDay.find((s) => s.status === SlotStatus.BOOKED);
      if (booked) return { date: day, status: SlotStatus.BOOKED, bookingId: booked.bookingId };
      return { date: day, status: SlotStatus.AVAILABLE };
    });

    return { boatId, model, rangeStart, rangeEnd, slots: daySlots, days };
  }

  // Day-based models: any block (including HOURLY) that touches the day marks it blocked.
  const days: CalendarDay[] = eachDayInRange(start, end).map((day) => {
    const block = blocks.find(
      (b) => b.startDate <= day && b.endDate >= day,
    );
    if (block) {
      return { date: day, status: SlotStatus.BLOCKED, blockId: block.id };
    }
    const booking = bookings.find(
      (bk) => toDateString(bk.startDate) <= day && toDateString(bk.endDate) >= day,
    );
    if (booking) {
      return { date: day, status: SlotStatus.BOOKED, bookingId: booking.id };
    }
    return { date: day, status: SlotStatus.AVAILABLE };
  });

  return { boatId, model, rangeStart, rangeEnd, days };
}
