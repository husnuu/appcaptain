import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const reviewStatusSchema = z
  .object({
    status: z.enum(["APPROVED", "CHANGES_REQUESTED", "REJECTED"]),
    note: z.string().trim().min(5).max(2000).optional(),
  })
  .refine((v) => v.status === "APPROVED" || !!v.note, {
    message: "Not girilmesi gerekli",
    path: ["note"],
  });

export async function adminExperiencesRoutes(app: FastifyInstance) {
  // List experiences with filters (review queue + general management)
  app.get("/experiences", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      status?: string;
      category?: string;
      search?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: "insensitive" } },
        { title: { contains: query.search, mode: "insensitive" } },
        { captain: { email: { contains: query.search, mode: "insensitive" } } },
        { captain: { fullName: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
          coverPhotoUrl: true,
          createdAt: true,
          updatedAt: true,
          captain: { select: { id: true, email: true, fullName: true } },
        },
      }),
      prisma.experience.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Get single experience detail for review
  app.get("/experiences/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };

    const experience = await prisma.experience.findUnique({
      where: { id },
      include: {
        captain: { select: { id: true, email: true, fullName: true, phone: true } },
      },
    });
    if (!experience) throw new HttpError(404, "Experience not found", "NOT_FOUND");

    return { experience };
  });

  // Approve / request changes / reject a pending-review experience
  app.patch("/experiences/:id/status", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = reviewStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { status, note } = parsed.data;

    const experience = await prisma.experience.findUnique({ where: { id } });
    if (!experience) throw new HttpError(404, "Experience not found", "NOT_FOUND");
    if (experience.status !== "PENDING_REVIEW") {
      throw new HttpError(400, "Sadece incelemedeki deneyimler onaylanabilir/reddedilebilir", "BAD_REQUEST");
    }

    const updated = await prisma.experience.update({
      where: { id },
      data: {
        status,
        reviewNote: status === "APPROVED" ? null : note,
        reviewedAt: new Date(),
      },
      select: { id: true, status: true, reviewNote: true, reviewedAt: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: `EXPERIENCE_STATUS_CHANGED_TO_${status}`,
      targetType: "Experience",
      targetId: id,
      metadata: { previousStatus: experience.status, newStatus: status, note },
      ip: req.ip,
    });

    return { experience: updated };
  });
}
