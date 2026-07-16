import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";
import { sendPasswordResetEmail } from "../../../lib/email.js";

const suspendSchema = z.object({
  suspend: z.boolean(),
});

const guestSuspendSchema = z.object({
  suspend: z.boolean(),
  permanent: z.boolean().optional(),
});

export async function adminUsersRoutes(app: FastifyInstance) {
  // List boat owners
  app.get("/users", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      search?: string;
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
      ];
    }

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
          isVerified: true,
          createdAt: true,
          _count: { select: { boats: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Get single owner profile
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
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        boats: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");
    return { profile };
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
