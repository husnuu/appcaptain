import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const KYC_DOC_SELECT = {
  id: true,
  type: true,
  status: true,
  publicUrl: true,
  notes: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  profile: { select: { id: true, fullName: true, email: true, kycStatus: true } },
  reviewedBy: { select: { id: true, fullName: true } },
} as const;

export async function adminKycRoutes(app: FastifyInstance) {
  // ── List KYC documents (queue view) ──────────────────────────────────
  app.get("/kyc", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { status?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const statusFilter = q.status && ["PENDING", "VERIFIED", "REJECTED"].includes(q.status)
      ? q.status as "PENDING" | "VERIFIED" | "REJECTED"
      : undefined;

    const where = statusFilter ? { status: statusFilter } : {};

    const [items, total, pendingCount] = await Promise.all([
      prisma.kycDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        select: KYC_DOC_SELECT,
      }),
      prisma.kycDocument.count({ where }),
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
    ]);

    return { items, total, page, limit, pendingCount };
  });

  // ── Summary stats ─────────────────────────────────────────────────────
  app.get("/kyc/stats", { onRequest: [app.requireAdminAuth] }, async () => {
    const [total, pending, verified, rejected, profilesWithKyc] = await Promise.all([
      prisma.kycDocument.count(),
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
      prisma.kycDocument.count({ where: { status: "VERIFIED" } }),
      prisma.kycDocument.count({ where: { status: "REJECTED" } }),
      prisma.profile.count({ where: { kycStatus: { not: null } } }),
    ]);

    return { total, pending, verified, rejected, profilesWithKyc };
  });

  // ── Get KYC docs for a specific profile ─────────────────────────────
  app.get("/kyc/profiles/:profileId", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { profileId } = req.params as { profileId: string };
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, fullName: true, email: true, kycStatus: true },
    });
    if (!profile) throw new HttpError(404, "Profile not found", "NOT_FOUND");

    const docs = await prisma.kycDocument.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      select: KYC_DOC_SELECT,
    });

    return { profile, docs };
  });

  // ── Create KYC document entry (admin-side manual entry) ──────────────
  app.post("/kyc/profiles/:profileId", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { profileId } = req.params as { profileId: string };
    const parsed = z.object({
      type: z.enum(["PASSPORT", "NATIONAL_ID", "DRIVING_LICENSE", "SELFIE", "PROOF_OF_ADDRESS"]),
      publicUrl: z.string().url().optional(),
      notes: z.string().max(1000).optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) throw new HttpError(404, "Profile not found", "NOT_FOUND");

    const doc = await prisma.kycDocument.create({
      data: {
        profileId,
        type: parsed.data.type,
        publicUrl: parsed.data.publicUrl,
        notes: parsed.data.notes,
      },
      select: KYC_DOC_SELECT,
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "KYC_DOC_CREATED",
      targetType: "KycDocument",
      targetId: doc.id,
      metadata: { profileId, type: doc.type },
      ip: req.ip,
    });

    return { doc };
  });

  // ── Approve or reject a KYC document ─────────────────────────────────
  app.patch("/kyc/:id", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({
      status: z.enum(["VERIFIED", "REJECTED", "PENDING"]),
      notes: z.string().max(1000).optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const existing = await prisma.kycDocument.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "KYC document not found", "NOT_FOUND");

    const doc = await prisma.kycDocument.update({
      where: { id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes ?? existing.notes,
        reviewedAt: parsed.data.status !== "PENDING" ? new Date() : null,
        reviewedById: parsed.data.status !== "PENDING" ? req.adminUser!.id : null,
      },
      select: KYC_DOC_SELECT,
    });

    // Update overall kycStatus on profile based on all docs
    const allDocs = await prisma.kycDocument.findMany({
      where: { profileId: existing.profileId },
      select: { status: true },
    });
    let profileKycStatus: "PENDING" | "VERIFIED" | "REJECTED" | null = null;
    if (allDocs.length > 0) {
      if (allDocs.every((d) => d.status === "VERIFIED")) {
        profileKycStatus = "VERIFIED";
      } else if (allDocs.some((d) => d.status === "REJECTED")) {
        profileKycStatus = "REJECTED";
      } else {
        profileKycStatus = "PENDING";
      }
    }
    await prisma.profile.update({
      where: { id: existing.profileId },
      data: { kycStatus: profileKycStatus },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: `KYC_DOC_${parsed.data.status}`,
      targetType: "KycDocument",
      targetId: id,
      metadata: { profileId: existing.profileId, type: existing.type, status: parsed.data.status },
      ip: req.ip,
    });

    return { doc };
  });

  // ── Delete a KYC document ─────────────────────────────────────────────
  app.delete("/kyc/:id", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.kycDocument.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "KYC document not found", "NOT_FOUND");

    await prisma.kycDocument.delete({ where: { id } });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "KYC_DOC_DELETED",
      targetType: "KycDocument",
      targetId: id,
      metadata: { profileId: existing.profileId, type: existing.type },
      ip: req.ip,
    });

    return { deleted: true };
  });
}
