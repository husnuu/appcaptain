import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type Prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";
import { sendOwnerWarningEmail } from "../../../lib/email.js";

const REVIEW_SELECT = {
  id: true,
  rating: true,
  comment: true,
  isHidden: true,
  reportCount: true,
  ownerResponse: true,
  ownerResponseApproved: true,
  createdAt: true,
  customer: { select: { id: true, name: true, email: true } },
  boat: { select: { id: true, title: true, owner: { select: { id: true, fullName: true, email: true } } } },
} as const;

export async function adminReviewsRoutes(app: FastifyInstance) {
  // ── List reviews ─────────────────────────────────────────────────────

  app.get("/reviews", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as {
      search?: string;
      minRating?: string;
      maxRating?: string;
      hidden?: string;
      reported?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {};
    if (q.search) {
      where.OR = [
        { comment: { contains: q.search, mode: "insensitive" } },
        { customer: { name: { contains: q.search, mode: "insensitive" } } },
        { customer: { email: { contains: q.search, mode: "insensitive" } } },
        { boat: { title: { contains: q.search, mode: "insensitive" } } },
      ];
    }
    if (q.minRating) where.rating = { ...((where.rating as object) ?? {}), gte: Number(q.minRating) };
    if (q.maxRating) where.rating = { ...((where.rating as object) ?? {}), lte: Number(q.maxRating) };
    if (q.hidden === "true") where.isHidden = true;
    if (q.hidden === "false") where.isHidden = false;
    if (q.reported === "true") where.reportCount = { gt: 0 };

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: q.reported === "true" ? { reportCount: "desc" } : { createdAt: "desc" },
        select: REVIEW_SELECT,
      }),
      prisma.review.count({ where }),
    ]);

    const reportedCount = await prisma.review.count({ where: { reportCount: { gt: 0 } } });

    return { items, total, page, limit, reportedCount };
  });

  // ── Single review detail ──────────────────────────────────────────────

  app.get("/reviews/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const review = await prisma.review.findUnique({
      where: { id },
      select: {
        ...REVIEW_SELECT,
        reservation: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            guests: true,
            status: true,
          },
        },
      },
    });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");
    return { review };
  });

  // ── Hide / restore (soft-delete) ──────────────────────────────────────

  app.patch("/reviews/:id/visibility", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ hidden: z.boolean() }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");

    const updated = await prisma.review.update({
      where: { id },
      data: { isHidden: parsed.data.hidden },
      select: { id: true, isHidden: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: parsed.data.hidden ? "REVIEW_HIDDEN" : "REVIEW_RESTORED",
      targetType: "Review",
      targetId: id,
      metadata: { boatId: review.boatId, rating: review.rating, customerId: review.customerId },
      ip: req.ip,
    });

    return { review: updated };
  });

  // ── Hard delete ───────────────────────────────────────────────────────

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
      metadata: { boatId: review.boatId, rating: review.rating, customerId: review.customerId },
      ip: req.ip,
    });

    return { deleted: true };
  });

  // ── Report (flag) a review ────────────────────────────────────────────

  app.post("/reviews/:id/report", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ count: z.number().int().min(1).max(100).default(1) }).safeParse(req.body);
    const increment = parsed.success ? parsed.data.count : 1;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");

    const updated = await prisma.review.update({
      where: { id },
      data: { reportCount: { increment } },
      select: { id: true, reportCount: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "REVIEW_REPORT_COUNT_UPDATED",
      targetType: "Review",
      targetId: id,
      metadata: { increment, newCount: updated.reportCount },
      ip: req.ip,
    });

    return { review: updated };
  });

  // Clear report flag
  app.delete("/reviews/:id/report", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");

    const updated = await prisma.review.update({
      where: { id },
      data: { reportCount: 0 },
      select: { id: true, reportCount: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "REVIEW_REPORT_CLEARED",
      targetType: "Review",
      targetId: id,
      metadata: { previousCount: review.reportCount },
      ip: req.ip,
    });

    return { review: updated };
  });

  // ── Warn reviewer ─────────────────────────────────────────────────────

  app.post("/reviews/:id/warn", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ message: z.string().min(1).max(1000) }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "message is required", "BAD_REQUEST");

    const review = await prisma.review.findUnique({
      where: { id },
      include: { customer: { select: { name: true, email: true } } },
    });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");

    const emailSent = await sendOwnerWarningEmail({
      to: review.customer.email,
      name: review.customer.name,
      message: parsed.data.message,
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "REVIEW_USER_WARNED",
      targetType: "Review",
      targetId: id,
      metadata: { customerId: review.customerId, email: review.customer.email, emailSent, message: parsed.data.message },
      ip: req.ip,
    });

    return { emailSent };
  });

  // ── Owner response management ─────────────────────────────────────────

  // Approve owner response
  app.patch("/reviews/:id/owner-response/approve", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");
    if (!review.ownerResponse) throw new HttpError(400, "No owner response to approve", "BAD_REQUEST");
    if (review.ownerResponseApproved) throw new HttpError(400, "Already approved", "BAD_REQUEST");

    const updated = await prisma.review.update({
      where: { id },
      data: { ownerResponseApproved: true },
      select: { id: true, ownerResponse: true, ownerResponseApproved: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "REVIEW_OWNER_RESPONSE_APPROVED",
      targetType: "Review",
      targetId: id,
      metadata: { boatId: review.boatId },
      ip: req.ip,
    });

    return { review: updated };
  });

  // Remove owner response
  app.delete("/reviews/:id/owner-response", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpError(404, "Review not found", "NOT_FOUND");
    if (!review.ownerResponse) throw new HttpError(400, "No owner response", "BAD_REQUEST");

    const updated = await prisma.review.update({
      where: { id },
      data: { ownerResponse: null, ownerResponseApproved: false },
      select: { id: true, ownerResponse: true, ownerResponseApproved: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "REVIEW_OWNER_RESPONSE_REMOVED",
      targetType: "Review",
      targetId: id,
      metadata: { boatId: review.boatId, removedText: review.ownerResponse },
      ip: req.ip,
    });

    return { review: updated };
  });
}
