import {
  BlockReason,
  SlotStatus,
  isHourlyModel,
  type AvailabilityMap,
  type CalendarDay,
  type CreateBlockInput,
  type SetPriceOverrideInput,
  type TimeSlot,
} from "@getyourboat/shared";
import { calendarRepository } from "@getyourboat/database";
import { badRequest, conflict, forbidden, notFound } from "../../../lib/errors.js";

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

/** Hourly grid rendered on the calendar (09:00–18:00, 1h slots). */
function generateDaySlots(): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = [];
  for (let h = 9; h < 18; h++) {
    slots.push({
      start: `${String(h).padStart(2, "0")}:00`,
      end: `${String(h + 1).padStart(2, "0")}:00`,
    });
  }
  return slots;
}

function timeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && aEnd > bStart;
}

async function assertBoatAccess(
  boatId: string,
  userId: string,
  isAdmin: boolean
) {
  const ownerId = await calendarRepository.getBoatOwnerId(boatId);
  if (!ownerId) throw notFound("Tekne bulunamadı");
  if (!isAdmin && ownerId !== userId) {
    throw forbidden("Bu teknenin takvimine erişim yetkiniz yok");
  }
}

export async function createBlock(
  input: CreateBlockInput,
  createdBy: string,
  isAdmin: boolean
) {
  await assertBoatAccess(input.boatId, createdBy, isAdmin);

  const isHourly = !!input.date;
  if (isHourly) {
    if (!input.startTime || !input.endTime) {
      throw badRequest("Saatlik blok için başlangıç ve bitiş saati zorunludur.");
    }
    const day = new Date(`${input.date}T00:00:00.000Z`);
    const existing = await calendarRepository.getBlocksByRange(
      input.boatId,
      day,
      day
    );
    const clash = existing.find(
      (b) =>
        b.startTime &&
        b.endTime &&
        toDateStr(new Date(b.startDate)) === input.date &&
        timeOverlaps(input.startTime!, input.endTime!, b.startTime, b.endTime)
    );
    if (clash) throw conflict("Bu saat aralığı zaten bloke edilmiş.");

    return calendarRepository.createBlock({
      boatId: input.boatId,
      reason: input.reason ?? BlockReason.MANUAL,
      note: input.note ?? null,
      startDate: day,
      endDate: day,
      startTime: input.startTime,
      endTime: input.endTime,
      createdBy,
    });
  }

  if (!input.startDate || !input.endDate) {
    throw badRequest("Gün bazlı blok için başlangıç ve bitiş tarihi zorunludur.");
  }
  const start = new Date(`${input.startDate}T00:00:00.000Z`);
  const end = new Date(`${input.endDate}T00:00:00.000Z`);
  if (start > end) throw badRequest("Başlangıç tarihi bitişten sonra olamaz.");

  const existing = await calendarRepository.getBlocksByRange(
    input.boatId,
    start,
    end
  );
  // Day blocks (no times) that overlap the requested range.
  const clash = existing.some((b) => !b.startTime && !b.endTime);
  if (clash) throw conflict("Seçili tarih aralığında çakışan blok var.");

  return calendarRepository.createBlock({
    boatId: input.boatId,
    reason: input.reason ?? BlockReason.MANUAL,
    note: input.note ?? null,
    startDate: start,
    endDate: end,
    createdBy,
  });
}

export async function deleteBlock(
  id: string,
  userId: string,
  isAdmin: boolean
) {
  const block = await calendarRepository.getBlockById(id);
  if (!block) throw notFound("Blok bulunamadı");
  await assertBoatAccess(block.boatId, userId, isAdmin);
  await calendarRepository.deleteBlock(id);
}

export async function listBlocks(
  boatId: string,
  page: number,
  limit: number,
  userId: string,
  isAdmin: boolean
) {
  await assertBoatAccess(boatId, userId, isAdmin);
  return calendarRepository.getAllBlocks(boatId, page, limit);
}

export async function setPriceOverride(
  input: SetPriceOverrideInput,
  userId: string,
  isAdmin: boolean
) {
  await assertBoatAccess(input.boatId, userId, isAdmin);
  return calendarRepository.upsertPriceOverride({
    boatId: input.boatId,
    date: input.date,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    price: input.price,
    currency: input.currency,
  });
}

export async function computeAvailability(
  boatId: string,
  model: string,
  rangeStart: string,
  rangeEnd: string
): Promise<AvailabilityMap> {
  const start = new Date(`${rangeStart}T00:00:00.000Z`);
  const end = new Date(`${rangeEnd}T00:00:00.000Z`);

  const [blocks, bookings, overrides, pricing] = await Promise.all([
    calendarRepository.getBlocksByRange(boatId, start, end),
    calendarRepository.getBusyBookingsByRange(boatId, start, end),
    calendarRepository.getPriceOverridesByRange(boatId, rangeStart, rangeEnd),
    calendarRepository.getModelPricing(boatId, model),
  ]);

  const overrideMap = new Map(
    overrides.map((o) => [
      `${o.date}|${o.startTime ?? ""}|${o.endTime ?? ""}`,
      o.price,
    ])
  );

  const dayBlocks = blocks.map((b) => ({
    ...b,
    startStr: toDateStr(new Date(b.startDate)),
    endStr: toDateStr(new Date(b.endDate)),
  }));
  const dayBookings = bookings.map((b) => ({
    ...b,
    startStr: toDateStr(new Date(b.startDate)),
    endStr: toDateStr(new Date(b.endDate)),
  }));

  const base = {
    boatId,
    model,
    rangeStart,
    rangeEnd,
    defaultPrice: pricing?.price,
    currency: pricing?.currency,
  };

  if (isHourlyModel(model)) {
    const slots: TimeSlot[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateStr = toDateStr(cursor);
      for (const slot of generateDaySlots()) {
        const block = dayBlocks.find((b) => {
          if (b.startTime && b.endTime) {
            return (
              b.startStr === dateStr &&
              timeOverlaps(slot.start, slot.end, b.startTime, b.endTime)
            );
          }
          // Whole-day block covers all slots.
          return dateStr >= b.startStr && dateStr <= b.endStr;
        });
        const booking = dayBookings.find((b) => {
          if (b.startTime && b.endTime && b.startStr === dateStr) {
            return timeOverlaps(slot.start, slot.end, b.startTime, b.endTime);
          }
          return dateStr >= b.startStr && dateStr <= b.endStr;
        });
        slots.push({
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          status: block
            ? SlotStatus.BLOCKED
            : booking
              ? SlotStatus.BOOKED
              : SlotStatus.AVAILABLE,
          blockId: block?.id,
          bookingId: booking?.id,
          basePrice: overrideMap.get(`${dateStr}|${slot.start}|${slot.end}`),
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { ...base, slots };
  }

  const days: CalendarDay[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dateStr = toDateStr(cursor);
    const block = dayBlocks.find(
      (b) => !b.startTime && dateStr >= b.startStr && dateStr <= b.endStr
    );
    const booking = dayBookings.find(
      (b) => dateStr >= b.startStr && dateStr <= b.endStr
    );
    days.push({
      date: dateStr,
      status: block
        ? SlotStatus.BLOCKED
        : booking
          ? SlotStatus.BOOKED
          : SlotStatus.AVAILABLE,
      blockId: block?.id,
      bookingId: booking?.id,
      basePrice: overrideMap.get(`${dateStr}||`),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { ...base, days };
}
