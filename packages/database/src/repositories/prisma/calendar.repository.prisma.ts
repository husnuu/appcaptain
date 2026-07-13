import { BookingStatus, type BlockReason } from "@getyourboat/shared";
import { prisma } from "../../client.js";
import type {
  CalendarBusyBooking,
  CalendarPriceOverrideRow,
  CalendarRepository,
  CreateCalendarBlockData,
  UpsertPriceOverrideData,
} from "../calendar.repository.js";
import { toCalendarBlockDTO } from "../calendar.repository.js";

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.APPROVED];

export class PrismaCalendarRepository implements CalendarRepository {
  async createBlock(data: CreateCalendarBlockData) {
    const row = await prisma.calendarBlock.create({
      data: {
        boatId: data.boatId,
        reason: data.reason as BlockReason,
        note: data.note ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        createdBy: data.createdBy,
      },
    });
    return toCalendarBlockDTO(row);
  }

  async deleteBlock(id: string) {
    await prisma.calendarBlock.delete({ where: { id } });
  }

  async getBlockById(id: string) {
    const row = await prisma.calendarBlock.findUnique({
      where: { id },
      select: { id: true, boatId: true },
    });
    return row ?? null;
  }

  async getBlocksByRange(boatId: string, start: Date, end: Date) {
    const rows = await prisma.calendarBlock.findMany({
      where: { boatId, startDate: { lte: end }, endDate: { gte: start } },
      orderBy: { startDate: "asc" },
    });
    return rows.map(toCalendarBlockDTO);
  }

  async getAllBlocks(boatId: string, page: number, limit: number) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const rows = await prisma.calendarBlock.findMany({
      where: { boatId },
      orderBy: { startDate: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });
    return rows.map(toCalendarBlockDTO);
  }

  async getBusyBookingsByRange(
    boatId: string,
    start: Date,
    end: Date
  ): Promise<CalendarBusyBooking[]> {
    const rows = await prisma.booking.findMany({
      where: {
        boatId,
        status: { in: ACTIVE_STATUSES },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
      },
    });
    return rows;
  }

  async upsertPriceOverride(
    data: UpsertPriceOverrideData
  ): Promise<CalendarPriceOverrideRow> {
    const startTime = data.startTime ?? null;
    const endTime = data.endTime ?? null;

    // Compound unique includes nullable times; Postgres treats NULLs as distinct,
    // so we match manually rather than relying on prisma.upsert for day overrides.
    const existing = await prisma.calendarPriceOverride.findFirst({
      where: { boatId: data.boatId, date: data.date, startTime, endTime },
      select: { id: true },
    });

    const row = existing
      ? await prisma.calendarPriceOverride.update({
          where: { id: existing.id },
          data: { price: data.price, currency: data.currency },
        })
      : await prisma.calendarPriceOverride.create({
          data: {
            boatId: data.boatId,
            date: data.date,
            startTime,
            endTime,
            price: data.price,
            currency: data.currency,
          },
        });

    return {
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      price: row.price,
      currency: row.currency,
    };
  }

  async getPriceOverridesByRange(
    boatId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarPriceOverrideRow[]> {
    const rows = await prisma.calendarPriceOverride.findMany({
      where: { boatId, date: { gte: startDate, lte: endDate } },
    });
    return rows.map((r) => ({
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      price: r.price,
      currency: r.currency,
    }));
  }

  async getBoatOwnerId(boatId: string) {
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { ownerId: true },
    });
    return boat?.ownerId ?? null;
  }

  async getModelPricing(boatId: string, modelKey: string) {
    const row = await prisma.boatPricing.findUnique({
      where: { boatId_listingModelKey: { boatId, listingModelKey: modelKey } },
      select: { price: true, currency: true },
    });
    return row ? { price: Number(row.price), currency: row.currency } : null;
  }
}
