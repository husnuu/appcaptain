import type { FastifyInstance } from "fastify";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

export async function adminReviewsRoutes(app: FastifyInstance) {
  app.get("/reviews", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { search?: string; page?: string; limit?: string; minRating?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q.search) {
      where.OR = [
        { comment: { contains: q.search, mode: "insensitive" } },
        { customer: { name: { contains: q.search, mode: "insensitive" } } },
        { customer: { email: { contains: q.search, mode: "insensitive" } } },
        { boat: { title: { contains: q.search, mode: "insensitive" } } },
      ];
    }
    if (q.minRating) where.rating = { lte: Number(q.minRating) };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          boat: { select: { id: true, title: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  app.get("/reviews/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        boat: { select: { id: true, title: true } },
      },
    });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");
    return { review };
  });

  app.delete("/reviews/:id", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");

    await prisma.review.delete({ where: { id } });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "REVIEW_DELETED",
      targetType: "Review",
      targetId: id,
      metadata: { boatId: review.boatId, rating: review.rating },
      ip: req.ip,
    });

    return { deleted: true };
  });
}
