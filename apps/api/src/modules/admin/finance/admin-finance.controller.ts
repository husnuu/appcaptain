import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const DEFAULT_COMMISSION = "10";

async function getCommissionRate(ownerId?: string): Promise<number> {
  if (ownerId) {
    const override = await prisma.systemSetting.findUnique({
      where: { key: `commission_rate_owner_${ownerId}` },
    });
    if (override) return parseFloat(override.value) / 100;
  }
  const global = await prisma.systemSetting.findUnique({ where: { key: "commission_rate" } });
  return parseFloat(global?.value ?? DEFAULT_COMMISSION) / 100;
}

export async function adminFinanceRoutes(app: FastifyInstance) {
  app.get("/finance/payments", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { status?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q.status) where.status = q.status;

    const globalRate = await getCommissionRate();

    const [bookings, total, revenueAgg] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          guestName: true,
          totalPrice: true,
          currency: true,
          status: true,
          rentalType: true,
          startDate: true,
          createdAt: true,
          boat: {
            select: {
              id: true,
              title: true,
              ownerId: true,
              owner: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
      }),
      prisma.booking.count({ where }),
      prisma.booking.aggregate({
        where: { status: { in: ["APPROVED", "COMPLETED"] } },
        _sum: { totalPrice: true },
      }),
    ]);

    const ownerIds = [...new Set(bookings.map((b) => b.boat.ownerId))];
    const overrides = await prisma.systemSetting.findMany({
      where: { key: { in: ownerIds.map((id) => `commission_rate_owner_${id}`) } },
    });
    const overrideMap = new Map(
      overrides.map((o) => [o.key.replace("commission_rate_owner_", ""), parseFloat(o.value)])
    );

    const items = bookings.map((b) => {
      const rate = (overrideMap.get(b.boat.ownerId) ?? globalRate * 100) / 100;
      const commission = b.totalPrice ? Math.round(b.totalPrice * rate * 100) / 100 : null;
      return { ...b, commissionRate: rate * 100, commission };
    });

    const totalRevenue = revenueAgg._sum.totalPrice ?? 0;

    return {
      items,
      total,
      page,
      limit,
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalCommission: Math.round(totalRevenue * globalRate),
        globalCommissionRate: globalRate * 100,
      },
    };
  });

  // Get commission rates (global + all owner overrides)
  app.get("/finance/commission-rates", { onRequest: [app.requireAdminAuth] }, async () => {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: "commission_rate" } },
    });
    const global = settings.find((s) => s.key === "commission_rate");
    const overrides = settings
      .filter((s) => s.key.startsWith("commission_rate_owner_"))
      .map((s) => ({
        ownerId: s.key.replace("commission_rate_owner_", ""),
        rate: parseFloat(s.value),
      }));

    const ownerIds = overrides.map((o) => o.ownerId);
    const owners = ownerIds.length
      ? await prisma.profile.findMany({
          where: { id: { in: ownerIds } },
          select: { id: true, fullName: true, email: true },
        })
      : [];
    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    return {
      globalRate: parseFloat(global?.value ?? DEFAULT_COMMISSION),
      overrides: overrides.map((o) => ({ ...o, owner: ownerMap.get(o.ownerId) })),
    };
  });

  // Set per-owner commission rate
  app.patch("/users/:id/commission", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ rate: z.number().min(0).max(100) }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid rate", "BAD_REQUEST");

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");

    await prisma.systemSetting.upsert({
      where: { key: `commission_rate_owner_${id}` },
      create: { key: `commission_rate_owner_${id}`, value: String(parsed.data.rate) },
      update: { value: String(parsed.data.rate) },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "OWNER_COMMISSION_RATE_SET",
      targetType: "Profile",
      targetId: id,
      metadata: { rate: parsed.data.rate },
      ip: req.ip,
    });

    return { ownerId: id, rate: parsed.data.rate };
  });
}
