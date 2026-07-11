import type {
  BookingListQuery,
  CreateBookingInput,
} from "@getyourboat/shared";
import { BookingStatus } from "@getyourboat/shared";
import { Prisma } from "../../client.js";
import { prisma } from "../../client.js";
import type { BookingRepository } from "../booking.repository.js";
import { toBookingDTO } from "../booking.repository.js";

const includeBoat = {
  boat: {
    select: {
      id: true,
      title: true,
      photos: {
        where: { publicUrl: { not: null } },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { publicUrl: true },
      },
    },
  },
} satisfies Prisma.BookingInclude;

const ACTIVE_STATUSES = [BookingStatus.PENDING, BookingStatus.APPROVED];

export class PrismaBookingRepository implements BookingRepository {
  async findConflict(boatId: string, startDate: Date, endDate: Date) {
    const row = await prisma.booking.findFirst({
      where: {
        boatId,
        status: { in: ACTIVE_STATUSES },
        AND: [{ startDate: { lte: endDate } }, { endDate: { gte: startDate } }],
      },
      select: { startDate: true, endDate: true },
    });
    return row ?? null;
  }

  async create(input: CreateBookingInput, captainId: string) {
    const row = await prisma.booking.create({
      data: {
        boatId: input.boatId,
        captainId,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone ?? null,
        guestCount: input.guestCount,
        rentalType: input.rentalType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        message: input.message ?? null,
      },
      include: includeBoat,
    });
    return toBookingDTO(row);
  }

  async getById(id: string) {
    const row = await prisma.booking.findUnique({
      where: { id },
      include: includeBoat,
    });
    return row ? toBookingDTO(row) : null;
  }

  async listByCaptain(captainId: string, query: BookingListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where: Record<string, unknown> = { captainId };
    if (query.status) where.status = query.status;

    const [rows, total, pendingCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: includeBoat,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
      prisma.booking.count({
        where: { captainId, status: BookingStatus.PENDING },
      }),
    ]);

    return {
      bookings: rows.map(toBookingDTO),
      total,
      page,
      limit,
      pendingCount,
    };
  }

  async approve(id: string, totalPrice?: number | null) {
    const row = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.APPROVED,
        ...(totalPrice != null ? { totalPrice } : {}),
      },
      include: includeBoat,
    });
    return toBookingDTO(row);
  }

  async reject(id: string, rejectionNote?: string | null) {
    const row = await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.REJECTED, rejectionNote: rejectionNote ?? null },
      include: includeBoat,
    });
    return toBookingDTO(row);
  }

  async getBoatCaptainId(boatId: string) {
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { ownerId: true },
    });
    return boat?.ownerId ?? null;
  }

  async listAvailability(boatId: string) {
    const rows = await prisma.booking.findMany({
      where: {
        boatId,
        status: { in: ACTIVE_STATUSES },
        endDate: { gte: new Date() },
      },
      select: { startDate: true, endDate: true, status: true },
      orderBy: { startDate: "asc" },
    });
    return rows.map((r) => ({
      startDate: r.startDate.toISOString(),
      endDate: r.endDate.toISOString(),
      status: r.status as BookingStatus,
    }));
  }
}
