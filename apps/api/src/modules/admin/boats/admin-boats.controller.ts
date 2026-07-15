import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ACTIVE", "REJECTED", "SUSPENDED"]),
  rejectionReason: z.string().optional(),
});

export async function adminBoatsRoutes(app: FastifyInstance) {
  // List all boats with filters
  app.get("/boats", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      status?: string;
      search?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
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

  // Update boat status (approve / reject / suspend)
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
}
