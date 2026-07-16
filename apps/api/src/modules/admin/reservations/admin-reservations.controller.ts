import type { FastifyInstance } from "fastify";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

export async function adminReservationsRoutes(app: FastifyInstance) {
  app.get("/reservations", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as {
      status?: string;
      search?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;
    if (q.search) {
      where.OR = [
        { guestName: { contains: q.search, mode: "insensitive" } },
        { guestEmail: { contains: q.search, mode: "insensitive" } },
        { boat: { title: { contains: q.search, mode: "insensitive" } } },
      ];
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
          startTime: true,
          endTime: true,
          totalPrice: true,
          currency: true,
          status: true,
          rejectionNote: true,
          createdAt: true,
          updatedAt: true,
          boat: { select: { id: true, title: true, owner: { select: { id: true, fullName: true, email: true } } } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  app.get("/reservations/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        boat: { select: { id: true, title: true, owner: { select: { id: true, fullName: true, email: true } } } },
      },
    });
    if (!booking) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
    return { booking };
  });

  app.patch("/reservations/:id/cancel", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const body = req.body as { note?: string };

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new HttpError(404, "Reservation not found", "NOT_FOUND");
    if (booking.status === "CANCELLED") throw new HttpError(400, "Already cancelled", "BAD_REQUEST");

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED", rejectionNote: body?.note ?? "Admin tarafından iptal edildi" },
      select: { id: true, status: true, rejectionNote: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "RESERVATION_CANCELLED",
      targetType: "Booking",
      targetId: id,
      metadata: { note: body?.note, previousStatus: booking.status },
      ip: req.ip,
    });

    return { booking: updated };
  });
}
