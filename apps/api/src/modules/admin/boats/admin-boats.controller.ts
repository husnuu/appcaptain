import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "SUSPENDED"]),
  rejectionReason: z.string().optional(),
});

const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
  status: z.enum(["ACTIVE", "SUSPENDED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

export async function adminBoatsRoutes(app: FastifyInstance) {
  // List available boat type keys (for filter dropdown)
  app.get("/boats/types", { onRequest: [app.requireAdminAuth] }, async () => {
    const types = await prisma.boatTypeOption.findMany({
      orderBy: { sortOrder: "asc" },
      select: { key: true, label: true },
    });
    return { types };
  });

  // List all boats with filters
  app.get("/boats", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      status?: string;
      search?: string;
      boatTypeKey?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.boatTypeKey) where.boatTypeKey = query.boatTypeKey;

    if (query.dateFrom || query.dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (query.dateFrom) dateFilter.gte = new Date(query.dateFrom);
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter.lte = to;
      }
      where.createdAt = dateFilter;
    }

    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: "insensitive" } },
        { title: { contains: query.search, mode: "insensitive" } },
        { owner: { email: { contains: query.search, mode: "insensitive" } } },
        { owner: { fullName: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.boat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          approvalType: true,
          boatTypeKey: true,
          submittedAt: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { id: true, email: true, fullName: true } },
        },
      }),
      prisma.boat.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Get single boat detail
  app.get("/boats/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const boat = await prisma.boat.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, fullName: true, phone: true } },
        photos: { select: { id: true, publicUrl: true, isCover: true } },
        documents: { select: { id: true, documentTypeKey: true, status: true } },
        listingModels: { select: { listingModelKey: true } },
        pricing: { select: { listingModelKey: true, price: true, currency: true } },
      },
    });
    if (!boat) throw new HttpError(404, "Boat not found", "NOT_FOUND");
    return { boat };
  });

  // Update single boat status (approve / reject / suspend)
  app.patch("/boats/:id/status", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { status, rejectionReason } = parsed.data;

    const boat = await prisma.boat.findUnique({ where: { id } });
    if (!boat) throw new HttpError(404, "Boat not found", "NOT_FOUND");

    const updated = await prisma.boat.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? (rejectionReason ?? null) : null,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true, rejectionReason: true, reviewedAt: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: `BOAT_STATUS_CHANGED_TO_${status}`,
      targetType: "Boat",
      targetId: id,
      metadata: { previousStatus: boat.status, newStatus: status, rejectionReason },
      ip: req.ip,
    });

    return { boat: updated };
  });

  // Bulk status change (approve / suspend / reject multiple boats)
  app.post("/boats/bulk-status", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const parsed = bulkStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { ids, status, rejectionReason } = parsed.data;

    const { count } = await prisma.boat.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? (rejectionReason ?? null) : null,
        reviewedAt: new Date(),
      },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: `BULK_BOAT_STATUS_CHANGED_TO_${status}`,
      targetType: "Boat",
      targetId: ids.join(","),
      metadata: { ids, newStatus: status, count },
      ip: req.ip,
    });

    return { updated: count };
  });

  // Bulk delete boats
  app.delete("/boats/bulk", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const parsed = bulkDeleteSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { ids } = parsed.data;

    await prisma.$transaction(async (tx) => {
      // Resolve legacy reservations that block FK deletion
      const reservations = await tx.reservation.findMany({
        where: { boatId: { in: ids } },
        select: { id: true },
      });
      const reservationIds = reservations.map((r) => r.id);

      if (reservationIds.length > 0) {
        await tx.payout.deleteMany({ where: { reservationId: { in: reservationIds } } });
        await tx.review.deleteMany({ where: { reservationId: { in: reservationIds } } });
        await tx.reservation.deleteMany({ where: { id: { in: reservationIds } } });
      }

      await tx.boat.deleteMany({ where: { id: { in: ids } } });
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "BULK_BOATS_DELETED",
      targetType: "Boat",
      targetId: ids.join(","),
      metadata: { ids, count: ids.length },
      ip: req.ip,
    });

    return { deleted: ids.length };
  });
}
