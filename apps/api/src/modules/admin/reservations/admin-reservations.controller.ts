import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type Prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const BOOKING_PAYMENT_SELECT = {
  id: true,
  amount: true,
  commission: true,
  netAmount: true,
  currency: true,
  status: true,
  method: true,
  paidAt: true,
  payoutAt: true,
  invoiceUrl: true,
  note: true,
  createdAt: true,
} as const;

export async function adminReservationsRoutes(app: FastifyInstance) {
  app.get("/reservations", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};
    if (q.status) where.status = q.status as Prisma.EnumBookingStatusFilter["equals"];
    if (q.search) {
      where.OR = [
        { guestName: { contains: q.search, mode: "insensitive" } },
        { guestEmail: { contains: q.search, mode: "insensitive" } },
        { boat: { title: { contains: q.search, mode: "insensitive" } } },
      ];
    }
    if (q.dateFrom || q.dateTo) {
      where.startDate = {};
      if (q.dateFrom) where.startDate.gte = new Date(q.dateFrom);
      if (q.dateTo) where.startDate.lte = new Date(q.dateTo);
    }

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          guestPhone: true,
          guestCount: true,
          rentalType: true,
          startDate: true,
          endDate: true,
          totalPrice: true,
          currency: true,
          status: true,
          rejectionNote: true,
          createdAt: true,
          boat: { select: { id: true, title: true, owner: { select: { id: true, fullName: true, email: true } } } },
          bookingPayment: { select: { status: true, amount: true, currency: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Full reservation detail including payment info
  app.get("/reservations/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        guestCount: true,
        rentalType: true,
        startDate: true,
        endDate: true,
        startTime: true,
        endTime: true,
        totalPrice: true,
        currency: true,
        message: true,
        status: true,
        rejectionNote: true,
        createdAt: true,
        updatedAt: true,
        boat: {
          select: {
            id: true,
            title: true,
            boatTypeKey: true,
            owner: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
        bookingPayment: { select: BOOKING_PAYMENT_SELECT },
        guestConversation: { select: { id: true } },
      },
    });
    if (!booking) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
    return { booking };
  });

  // Cancel a booking (admin override)
  app.patch("/reservations/:id/cancel", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ note: z.string().optional() }).safeParse(req.body);
    const note = parsed.success ? parsed.data.note : undefined;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
    if (booking.status === "CANCELLED") throw new HttpError(400, "Already cancelled", "BAD_REQUEST");

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED", rejectionNote: note ?? "Admin tarafından iptal edildi" },
      select: { id: true, status: true, rejectionNote: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "RESERVATION_CANCELLED",
      targetType: "Booking",
      targetId: id,
      metadata: { note, previousStatus: booking.status },
      ip: req.ip,
    });

    return { booking: updated };
  });

  // Trigger refund: marks BookingPayment as REFUNDED.
  // Actual payment gateway refund must be done manually for now (Stripe not wired).
  app.post("/reservations/:id/refund", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ note: z.string().optional() }).safeParse(req.body);
    const note = parsed.success ? parsed.data.note : undefined;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { bookingPayment: true },
    });
    if (!booking) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
    if (!booking.bookingPayment) throw new HttpError(400, "No payment record for this booking", "BAD_REQUEST");
    if (booking.bookingPayment.status === "REFUNDED") throw new HttpError(400, "Already refunded", "BAD_REQUEST");

    const previousPaymentStatus = booking.bookingPayment.status;

    const [updatedBooking, updatedPayment] = await prisma.$transaction([
      prisma.booking.update({
        where: { id },
        data: { status: "CANCELLED", rejectionNote: note ?? "Admin tarafından iade edildi" },
        select: { id: true, status: true },
      }),
      prisma.bookingPayment.update({
        where: { bookingId: id },
        data: { status: "REFUNDED", note: note ?? "Admin tarafından iade edildi" },
        select: { id: true, status: true, amount: true, currency: true },
      }),
    ]);

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "RESERVATION_REFUNDED",
      targetType: "Booking",
      targetId: id,
      metadata: {
        note,
        amount: booking.bookingPayment.amount,
        currency: booking.bookingPayment.currency,
        previousPaymentStatus,
      },
      ip: req.ip,
    });

    return { booking: updatedBooking, payment: updatedPayment };
  });
}
