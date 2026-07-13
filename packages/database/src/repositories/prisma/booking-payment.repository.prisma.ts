import {
  BookingPaymentStatus,
  type BookingPaymentListQuery,
  type BookingPaymentStats,
} from "@getyourboat/shared";
import { prisma } from "../../client.js";
import type {
  BookingPaymentRepository,
  CreateBookingPaymentData,
} from "../booking-payment.repository.js";
import { toBookingPaymentDTO } from "../booking-payment.repository.js";

export class PrismaBookingPaymentRepository implements BookingPaymentRepository {
  async existsForBooking(bookingId: string) {
    const count = await prisma.bookingPayment.count({ where: { bookingId } });
    return count > 0;
  }

  async create(data: CreateBookingPaymentData) {
    const row = await prisma.bookingPayment.create({ data });
    return toBookingPaymentDTO(row);
  }

  async listForCaptain(captainId: string, query: BookingPaymentListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const where = {
      captainId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.bookingPayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.bookingPayment.count({ where }),
    ]);
    return { payments: rows.map(toBookingPaymentDTO), total, page, limit };
  }

  async statsForCaptain(captainId: string): Promise<BookingPaymentStats> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [all, monthly, pending] = await Promise.all([
      prisma.bookingPayment.aggregate({
        where: { captainId },
        _sum: { amount: true, netAmount: true, commission: true },
        _count: true,
      }),
      prisma.bookingPayment.aggregate({
        where: {
          captainId,
          status: BookingPaymentStatus.PAID,
          createdAt: { gte: startOfMonth },
        },
        _sum: { netAmount: true },
      }),
      prisma.bookingPayment.aggregate({
        where: { captainId, status: BookingPaymentStatus.PAID },
        _sum: { netAmount: true },
      }),
    ]);

    return {
      totalRevenue: all._sum.amount ?? 0,
      totalNet: all._sum.netAmount ?? 0,
      totalCommission: all._sum.commission ?? 0,
      totalBookings: all._count,
      monthlyEarnings: monthly._sum.netAmount ?? 0,
      pendingPayout: pending._sum.netAmount ?? 0,
    };
  }

  async getById(id: string) {
    const row = await prisma.bookingPayment.findUnique({ where: { id } });
    return row ? toBookingPaymentDTO(row) : null;
  }

  async markPaid(id: string, method?: string | null, note?: string | null) {
    const row = await prisma.bookingPayment.update({
      where: { id },
      data: {
        status: BookingPaymentStatus.PAID,
        paidAt: new Date(),
        method: method ?? null,
        note: note ?? null,
      },
    });
    return toBookingPaymentDTO(row);
  }

  async markPayout(id: string) {
    const row = await prisma.bookingPayment.update({
      where: { id },
      data: { status: BookingPaymentStatus.PAYOUT_SENT, payoutAt: new Date() },
    });
    return toBookingPaymentDTO(row);
  }
}
