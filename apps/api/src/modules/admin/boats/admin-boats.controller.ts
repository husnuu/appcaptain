import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";
import { getSupabaseAdmin, PHOTOS_BUCKET } from "../../../lib/supabase.js";
import { sendBoatRejectionEmail, sendBoatApprovalEmail } from "../../../lib/email.js";

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

const editBoatSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  boatTypeKey: z.string().optional(),
  rulesText: z.string().max(3000).optional(),
  checkInNotes: z.string().max(2000).optional(),
  checkOutNotes: z.string().max(2000).optional(),
});

const editPricingSchema = z.object({
  price: z.number().positive(),
  currency: z.string().length(3).default("EUR"),
});

const reorderPhotosSchema = z.object({
  photos: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })).min(1),
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

  // Distinct city/region/country values for location filter suggestions
  app.get("/boats/cities", { onRequest: [app.requireAdminAuth] }, async () => {
    const rows = await prisma.boatFeatureValue.findMany({
      where: { featureKey: { in: ["city", "region", "country", "marina"] }, value: { not: null } },
      select: { value: true },
      distinct: ["value"],
      orderBy: { value: "asc" },
    });
    const cities = rows.map((r) => r.value).filter(Boolean) as string[];
    return { cities };
  });

  // List all boats with filters
  app.get("/boats", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      status?: string;
      search?: string;
      boatTypeKey?: string;
      location?: string;
      priceMin?: string;
      priceMax?: string;
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

    if (query.location) {
      where.featureValues = {
        some: {
          featureKey: { in: ["city", "region", "country", "marina"] },
          value: { contains: query.location, mode: "insensitive" },
        },
      };
    }

    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      const priceFilter: Record<string, number> = {};
      if (query.priceMin !== undefined) priceFilter.gte = Number(query.priceMin);
      if (query.priceMax !== undefined) priceFilter.lte = Number(query.priceMax);
      where.pricing = { some: { price: priceFilter } };
    }

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
          featureValues: {
            where: { featureKey: { in: ["city", "region", "country"] } },
            select: { featureKey: true, value: true },
          },
        },
      }),
      prisma.boat.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Get single boat detail with stats
  app.get("/boats/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };

    const [boat, reservationStats, reviewStats] = await Promise.all([
      prisma.boat.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, email: true, fullName: true, phone: true } },
          photos: {
            select: { id: true, publicUrl: true, storagePath: true, isCover: true, sortOrder: true, altText: true },
            orderBy: { sortOrder: "asc" },
          },
          documents: { select: { id: true, documentTypeKey: true, status: true, publicUrl: true } },
          listingModels: { select: { listingModelKey: true } },
          pricing: { select: { listingModelKey: true, price: true, currency: true } },
          featureValues: { select: { featureKey: true, value: true } },
        },
      }),
      prisma.reservation.aggregate({
        where: { boatId: id, status: { in: ["CONFIRMED", "COMPLETED"] } },
        _count: { id: true },
        _sum: { totalPrice: true },
      }),
      prisma.review.aggregate({
        where: { boatId: id },
        _count: { id: true },
        _avg: { rating: true },
      }),
    ]);

    if (!boat) throw new HttpError(404, "Boat not found", "NOT_FOUND");

    const stats = {
      reservationCount: reservationStats._count.id,
      totalRevenue: Number(reservationStats._sum.totalPrice ?? 0),
      reviewCount: reviewStats._count.id,
      averageRating: reviewStats._avg.rating ? Number(reviewStats._avg.rating.toFixed(1)) : null,
    };

    const allDocsApproved = boat.documents.length > 0 && boat.documents.every((d) => d.status === "APPROVED");
    const anyDocPending = boat.documents.some((d) => d.status === "PENDING");

    const checklist = [
      { key: "title",             label: "Başlık girilmiş",              pass: !!boat.title,                                     warn: false },
      { key: "description",       label: "Açıklama girilmiş",            pass: !!boat.description,                               warn: false },
      { key: "photos",            label: "En az 1 fotoğraf yüklendi",    pass: boat.photos.length >= 1,                          warn: false },
      { key: "photoQuality",      label: "En az 3 fotoğraf (kalite)",    pass: boat.photos.length >= 3,                          warn: boat.photos.length >= 1 && boat.photos.length < 3 },
      { key: "coverPhoto",        label: "Kapak fotoğrafı seçilmiş",     pass: boat.photos.some((p) => p.isCover),               warn: false },
      { key: "listingModels",     label: "Listeleme modeli seçilmiş",    pass: boat.listingModels.length > 0,                    warn: false },
      { key: "pricing",           label: "Fiyatlandırma ayarlanmış",     pass: boat.pricing.length > 0,                          warn: false },
      { key: "documents",         label: "Belge yüklendi",               pass: boat.documents.length > 0,                        warn: false },
      { key: "documentsApproved", label: "Tüm belgeler onaylı",          pass: allDocsApproved,                                  warn: anyDocPending && !allDocsApproved },
    ];

    return { boat: { ...boat, stats, checklist } };
  });

  // Edit core boat fields
  app.patch("/boats/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = editBoatSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const boat = await prisma.boat.findUnique({ where: { id } });
    if (!boat) throw new HttpError(404, "Boat not found", "NOT_FOUND");

    const updated = await prisma.boat.update({
      where: { id },
      data: parsed.data,
      select: { id: true, title: true, description: true, boatTypeKey: true, rulesText: true, checkInNotes: true, checkOutNotes: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "BOAT_FIELDS_UPDATED",
      targetType: "Boat",
      targetId: id,
      metadata: { fields: Object.keys(parsed.data) },
      ip: req.ip,
    });

    return { boat: updated };
  });

  // Update single boat status (approve / reject / suspend)
  app.patch("/boats/:id/status", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { status, rejectionReason } = parsed.data;

    const boat = await prisma.boat.findUnique({
      where: { id },
      include: { owner: { select: { email: true, fullName: true } } },
    });
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

    // Owner notification emails — sent via lib/email.ts (nodemailer, opt-in via SMTP env vars).
    // Both return false and skip silently if SMTP_HOST is not configured.
    // See CLAUDE.md pre-launch checklist for wiring instructions.
    let emailSent = false;
    if (status === "REJECTED" && boat.owner.email && rejectionReason) {
      emailSent = await sendBoatRejectionEmail({
        to: boat.owner.email,
        boatTitle: boat.title ?? "İlanınız",
        rejectionReason,
      });
    } else if (status === "ACTIVE" && boat.owner.email) {
      emailSent = await sendBoatApprovalEmail({
        to: boat.owner.email,
        boatTitle: boat.title ?? "İlanınız",
      });
    }

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: `BOAT_STATUS_CHANGED_TO_${status}`,
      targetType: "Boat",
      targetId: id,
      metadata: { previousStatus: boat.status, newStatus: status, rejectionReason, emailSent },
      ip: req.ip,
    });

    return { boat: updated, emailSent };
  });

  // Edit pricing for a specific listing model
  app.patch("/boats/:id/pricing/:listingModelKey", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id, listingModelKey } = req.params as { id: string; listingModelKey: string };
    const parsed = editPricingSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    await prisma.boatPricing.upsert({
      where: { boatId_listingModelKey: { boatId: id, listingModelKey } },
      create: { boatId: id, listingModelKey, price: parsed.data.price, currency: parsed.data.currency },
      update: { price: parsed.data.price, currency: parsed.data.currency },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "BOAT_PRICING_UPDATED",
      targetType: "Boat",
      targetId: id,
      metadata: { listingModelKey, price: parsed.data.price, currency: parsed.data.currency },
      ip: req.ip,
    });

    return { ok: true };
  });

  // Delete a photo
  app.delete("/boats/:id/photos/:photoId", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id, photoId } = req.params as { id: string; photoId: string };

    const photo = await prisma.boatPhoto.findFirst({ where: { id: photoId, boatId: id } });
    if (!photo) throw new HttpError(404, "Photo not found", "NOT_FOUND");

    try {
      await getSupabaseAdmin().storage.from(PHOTOS_BUCKET).remove([photo.storagePath]);
    } catch {
      // Storage deletion failure is non-fatal — remove DB record regardless
    }

    await prisma.boatPhoto.delete({ where: { id: photoId } });

    if (photo.isCover) {
      const next = await prisma.boatPhoto.findFirst({ where: { boatId: id }, orderBy: { sortOrder: "asc" } });
      if (next) await prisma.boatPhoto.update({ where: { id: next.id }, data: { isCover: true } });
    }

    return { deleted: photoId };
  });

  // Reorder photos
  app.patch("/boats/:id/photos/reorder", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = reorderPhotosSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    await prisma.$transaction(
      parsed.data.photos.map((p) =>
        prisma.boatPhoto.updateMany({
          where: { id: p.id, boatId: id },
          data: { sortOrder: p.sortOrder },
        })
      )
    );

    return { ok: true };
  });

  // Set a photo as cover
  app.patch("/boats/:id/photos/:photoId/cover", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id, photoId } = req.params as { id: string; photoId: string };

    const photo = await prisma.boatPhoto.findFirst({ where: { id: photoId, boatId: id } });
    if (!photo) throw new HttpError(404, "Photo not found", "NOT_FOUND");

    await prisma.$transaction([
      prisma.boatPhoto.updateMany({ where: { boatId: id }, data: { isCover: false } }),
      prisma.boatPhoto.update({ where: { id: photoId }, data: { isCover: true } }),
    ]);

    return { ok: true };
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
