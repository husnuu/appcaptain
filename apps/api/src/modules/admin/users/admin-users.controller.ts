import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";
import { sendPasswordResetEmail, sendOwnerWarningEmail } from "../../../lib/email.js";

const suspendSchema = z.object({
  suspend: z.boolean(),
});

const guestSuspendSchema = z.object({
  suspend: z.boolean(),
  permanent: z.boolean().optional(),
});

export async function adminUsersRoutes(app: FastifyInstance) {
  // List boat owners with search + status filter
  app.get("/users", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      search?: string;
      status?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { fullName: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
        { companyName: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.status === "active") where.isVerified = true;
    if (query.status === "suspended") where.isVerified = false;

    const [items, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          companyName: true,
          address: true,
          role: true,
          badge: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { boats: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Get full owner profile: boats with per-boat stats, earnings, commission, avg rating
  app.get("/users/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };

    const profile = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        companyName: true,
        address: true,
        role: true,
        badge: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        boats: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            boatTypeKey: true,
            createdAt: true,
            _count: { select: { bookings: true } },
            reviews: { select: { rating: true } },
          },
        },
      },
    });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");

    // Aggregate earnings from BookingPayment (captainId is a UUID string)
    const [earningsAgg, recentPayments] = await Promise.all([
      prisma.bookingPayment.aggregate({
        where: { captainId: id },
        _sum: { amount: true, commission: true, netAmount: true },
        _count: { id: true },
      }),
      prisma.bookingPayment.findMany({
        where: { captainId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          boatName: true,
          amount: true,
          commission: true,
          netAmount: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    // Flatten ratings from all boats for avg
    const allRatings = profile.boats.flatMap((b) => b.reviews.map((r) => r.rating));
    const avgRating = allRatings.length > 0
      ? allRatings.reduce((s, r) => s + r, 0) / allRatings.length
      : null;

    const boats = profile.boats.map((b) => {
      const ratings = b.reviews.map((r) => r.rating);
      const boatAvgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
      return {
        id: b.id,
        title: b.title,
        status: b.status,
        boatTypeKey: b.boatTypeKey,
        createdAt: b.createdAt,
        bookingCount: b._count.bookings,
        reviewCount: ratings.length,
        avgRating: boatAvgRating,
      };
    });

    return {
      profile: {
        ...profile,
        boats,
        stats: {
          boatCount: profile.boats.length,
          totalRevenue: earningsAgg._sum.amount ?? 0,
          totalCommission: earningsAgg._sum.commission ?? 0,
          totalNetAmount: earningsAgg._sum.netAmount ?? 0,
          bookingCount: earningsAgg._count.id,
          avgRating,
        },
        recentPayments,
      },
    };
  });

  // Set or clear a badge on a boat owner profile
  app.patch("/users/:id/badge", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ badge: z.string().max(64).nullable() }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");

    const updated = await prisma.profile.update({
      where: { id },
      data: { badge: parsed.data.badge },
      select: { id: true, email: true, badge: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: parsed.data.badge ? "OWNER_BADGE_SET" : "OWNER_BADGE_REMOVED",
      targetType: "Profile",
      targetId: id,
      metadata: { email: profile.email, badge: parsed.data.badge },
      ip: req.ip,
    });

    return { profile: updated };
  });

  // Send a warning email to a boat owner
  app.post("/users/:id/warn", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ message: z.string().min(1).max(2000) }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");
    if (!profile.email) throw new HttpError(400, "Owner has no email address", "BAD_REQUEST");

    const emailSent = await sendOwnerWarningEmail({
      to: profile.email,
      name: profile.fullName ?? profile.email,
      message: parsed.data.message,
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "OWNER_WARNING_SENT",
      targetType: "Profile",
      targetId: id,
      metadata: { email: profile.email, message: parsed.data.message, emailSent },
      ip: req.ip,
    });

    return { emailSent };
  });

  // ── Guest user (User model) endpoints ────────────────────────────────

  // List guest users with filters: search, status, dateFrom, dateTo, country
  app.get("/users/guests", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      search?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      country?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    type WhereClause = {
      OR?: { email?: { contains: string; mode: "insensitive" }; name?: { contains: string; mode: "insensitive" }; phone?: { contains: string; mode: "insensitive" } }[];
      isSuspended?: boolean;
      bannedAt?: { not: null } | null;
      createdAt?: { gte?: Date; lte?: Date };
      country?: { contains: string; mode: "insensitive" };
    };

    const where: WhereClause = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.status === "active") {
      where.isSuspended = false;
    } else if (query.status === "suspended") {
      where.isSuspended = true;
      where.bannedAt = null;
    } else if (query.status === "banned") {
      where.bannedAt = { not: null };
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }

    if (query.country) {
      where.country = { contains: query.country, mode: "insensitive" };
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          country: true,
          role: true,
          isSuspended: true,
          bannedAt: true,
          createdAt: true,
          _count: { select: { reservations: true, reviews: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Get single guest user detail with reservations, spending stats, and reviews
  app.get("/users/guests/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        country: true,
        role: true,
        isSuspended: true,
        bannedAt: true,
        createdAt: true,
        reservations: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            guests: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            boat: { select: { id: true, title: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            boat: { select: { id: true, title: true } },
          },
        },
        _count: { select: { reservations: true, reviews: true } },
      },
    });

    if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");

    const spending = await prisma.reservation.aggregate({
      where: { customerId: id, status: { in: ["COMPLETED", "CONFIRMED"] } },
      _sum: { totalPrice: true },
    });

    return {
      user: {
        ...user,
        stats: {
          reservationCount: user._count.reservations,
          reviewCount: user._count.reviews,
          totalSpending: Number(spending._sum?.totalPrice ?? 0),
        },
      },
    };
  });

  // Suspend / permanently ban / unsuspend a guest user
  app.patch("/users/guests/:id/suspend", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = guestSuspendSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data.suspend
        ? { isSuspended: true, bannedAt: parsed.data.permanent ? new Date() : undefined }
        : { isSuspended: false, bannedAt: null },
      select: { id: true, email: true, isSuspended: true, bannedAt: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: parsed.data.suspend
        ? parsed.data.permanent ? "GUEST_BANNED" : "GUEST_SUSPENDED"
        : "GUEST_UNSUSPENDED",
      targetType: "User",
      targetId: id,
      metadata: { email: user.email },
      ip: req.ip,
    });

    return { user: updated };
  });

  // Trigger password reset email for a guest user
  app.post("/users/guests/:id/reset-password", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.user.update({
      where: { id },
      data: { passwordResetToken: token, passwordResetTokenExpiresAt: expiresAt },
    });

    const emailSent = await sendPasswordResetEmail({ to: user.email, name: user.name, token });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "GUEST_PASSWORD_RESET_TRIGGERED",
      targetType: "User",
      targetId: id,
      metadata: { email: user.email, emailSent },
      ip: req.ip,
    });

    return { emailSent };
  });

  // ── Captain (Profile) endpoints ───────────────────────────────────────

  // Suspend / unsuspend a captain (toggle isVerified as suspension flag)
  app.patch("/users/:id/suspend", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = suspendSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");

    const updated = await prisma.profile.update({
      where: { id },
      data: { isVerified: !parsed.data.suspend },
      select: { id: true, email: true, isVerified: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: parsed.data.suspend ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
      targetType: "Profile",
      targetId: id,
      metadata: { email: profile.email },
      ip: req.ip,
    });

    return { profile: updated };
  });
}
