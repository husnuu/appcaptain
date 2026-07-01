import { prisma } from "../../client.js";
import type {
  BookingCalendarRepository,
  CreateBlockData,
  CreateMockReservationData,
  UpdateBlockData,
} from "../booking-calendar.repository.js";
import { toBlockResponseDTO, toMockReservationRow } from "../booking-calendar.repository.js";

export class PrismaBookingCalendarRepository
  implements BookingCalendarRepository
{
  async createBlock(data: CreateBlockData) {
    const row = await prisma.calendarBlock.create({
      data: {
        boatId: data.boatId,
        model: data.model,
        reason: data.reason,
        note: data.note,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        createdById: data.createdById,
      },
    });
    return toBlockResponseDTO(row);
  }

  async updateBlock(id: string, data: UpdateBlockData) {
    const row = await prisma.calendarBlock.update({
      where: { id },
      data: {
        ...(data.reason !== undefined && { reason: data.reason }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
      },
    });
    return toBlockResponseDTO(row);
  }

  async deleteBlock(id: string) {
    await prisma.calendarBlock.delete({ where: { id } });
  }

  async getBlockById(id: string) {
    const row = await prisma.calendarBlock.findUnique({ where: { id } });
    return row ? toBlockResponseDTO(row) : null;
  }

  async getBlocksByBoatAndRange(boatId: string, start: Date, end: Date) {
    const rows = await prisma.calendarBlock.findMany({
      where: {
        boatId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      orderBy: { startDate: "asc" },
    });
    return rows.map(toBlockResponseDTO);
  }

  async getActiveBookingsByBoatAndRange(boatId: string, start: Date, end: Date) {
    const rows = await prisma.reservation.findMany({
      where: {
        boatId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { id: true, startDate: true, endDate: true },
    });
    return rows;
  }

  async getBoatListingModelKeys(boatId: string) {
    const rows = await prisma.boatListingModel.findMany({
      where: { boatId },
      select: { listingModelKey: true },
    });
    return rows.map((r) => r.listingModelKey);
  }

  async getBoatOwnerById(boatId: string) {
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
      select: { ownerId: true },
    });
    return boat?.ownerId ?? null;
  }

  async createMockReservation(data: CreateMockReservationData) {
    const row = await prisma.calendarMockReservation.create({
      data: {
        boatId: data.boatId,
        startDate: data.startDate,
        endDate: data.endDate,
        guestName: data.guestName,
        note: data.note,
      },
    });
    return toMockReservationRow(row);
  }

  async listMockReservations(boatId: string, start: Date, end: Date) {
    const rows = await prisma.calendarMockReservation.findMany({
      where: {
        boatId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      orderBy: { startDate: "asc" },
    });
    return rows.map(toMockReservationRow);
  }

  async deleteMockReservation(id: string) {
    await prisma.calendarMockReservation.delete({ where: { id } });
  }

  async getMockReservationById(id: string) {
    const row = await prisma.calendarMockReservation.findUnique({ where: { id } });
    return row ? toMockReservationRow(row) : null;
  }
}
