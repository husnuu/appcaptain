import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type Prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const DEFAULT_COMMISSION = "10";

async function getGlobalCommissionRate(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "commission_rate" } });
  return parseFloat(setting?.value ?? DEFAULT_COMMISSION);
}

const BOOKING_PAYMENT_LIST_SELECT = {
  id: true,
  bookingId: true,
  captainId: true,
  guestName: true,
  guestEmail: true,
  boatName: true,
  amount: true,
  commission: true,
  netAmount: true,
  currency: true,
  status: true,
  method: true,
  paidAt: true,
  payoutAt: true,
  note: true,
  createdAt: true,
  booking: {
    select: {
      id: true,
      startDate: true,
      endDate: true,
      rentalType: true,
      boat: {
        select: {
          id: true,
          title: true,
          ownerId: true,
          owner: { select: { id: true, fullName: true, email: true } },
        },
      },
    },
  },
} as const;

export async function adminFinanceRoutes(app: FastifyInstance) {
  // ── Payments list (BookingPayment model) ─────────────────────────────

  app.get("/finance/payments", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as {
      status?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Prisma.BookingPaymentWhereInput = {};
    if (q.status) where.status = q.status as Prisma.EnumBookingPaymentStatusFilter["equals"];
    if (q.search) {
      where.OR = [
        { guestName: { contains: q.search, mode: "insensitive" } },
        { guestEmail: { contains: q.search, mode: "insensitive" } },
        { boatName: { contains: q.search, mode: "insensitive" } },
      ];
    }
    if (q.dateFrom || q.dateTo) {
      where.createdAt = {};
      if (q.dateFrom) where.createdAt.gte = new Date(q.dateFrom);
      if (q.dateTo) where.createdAt.lte = new Date(q.dateTo);
    }

    const [items, total, revenueAgg, commissionAgg] = await Promise.all([
      prisma.bookingPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: BOOKING_PAYMENT_LIST_SELECT,
      }),
      prisma.bookingPayment.count({ where }),
      prisma.bookingPayment.aggregate({
        where: { status: { in: ["PAID", "PAYOUT_SENT"] } },
        _sum: { amount: true, commission: true, netAmount: true },
      }),
      prisma.bookingPayment.count({ where: { status: "PAYOUT_SENT" } }),
    ]);

    const globalRate = await getGlobalCommissionRate();

    return {
      items,
      total,
      page,
      limit,
      summary: {
        totalRevenue: revenueAgg._sum.amount ?? 0,
        totalCommission: revenueAgg._sum.commission ?? 0,
        totalNetAmount: revenueAgg._sum.netAmount ?? 0,
        globalCommissionRate: globalRate,
        payoutCount: commissionAgg,
      },
    };
  });

  // ── Single payment detail ─────────────────────────────────────────────

  app.get("/finance/payments/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const payment = await prisma.bookingPayment.findUnique({
      where: { id },
      select: { ...BOOKING_PAYMENT_LIST_SELECT, invoiceUrl: true, updatedAt: true },
    });
    if (!payment) throw new HttpError(404, "Payment not found", "NOT_FOUND");
    return { payment };
  });

  // ── Payout approve / delay ────────────────────────────────────────────

  app.patch("/finance/payments/:id/payout", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({
      action: z.enum(["approve", "delay"]),
      note: z.string().max(500).optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const payment = await prisma.bookingPayment.findUnique({ where: { id } });
    if (!payment) throw new HttpError(404, "Payment not found", "NOT_FOUND");

    if (parsed.data.action === "approve") {
      if (payment.status === "PAYOUT_SENT") throw new HttpError(400, "Payout already sent", "BAD_REQUEST");
      if (payment.status !== "PAID") throw new HttpError(400, "Payment must be PAID to approve payout", "BAD_REQUEST");

      const updated = await prisma.bookingPayment.update({
        where: { id },
        data: {
          status: "PAYOUT_SENT",
          payoutAt: new Date(),
          note: parsed.data.note ?? payment.note,
        },
        select: { id: true, status: true, payoutAt: true },
      });

      await createAuditLog({
        adminId: req.adminUser!.id,
        action: "PAYOUT_APPROVED",
        targetType: "BookingPayment",
        targetId: id,
        metadata: { captainId: payment.captainId, amount: payment.netAmount, currency: payment.currency },
        ip: req.ip,
      });

      return { payment: updated };
    } else {
      // delay: keep status as PAID, just add a note
      const updated = await prisma.bookingPayment.update({
        where: { id },
        data: { note: parsed.data.note ?? "Ödeme geciktirildi (admin)" },
        select: { id: true, status: true, note: true },
      });

      await createAuditLog({
        adminId: req.adminUser!.id,
        action: "PAYOUT_DELAYED",
        targetType: "BookingPayment",
        targetId: id,
        metadata: { captainId: payment.captainId, note: parsed.data.note },
        ip: req.ip,
      });

      return { payment: updated };
    }
  });

  // ── Refund from finance ───────────────────────────────────────────────

  app.post("/finance/payments/:id/refund", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ note: z.string().optional() }).safeParse(req.body);
    const note = parsed.success ? (parsed.data.note ?? "Admin tarafından iade edildi") : "Admin tarafından iade edildi";

    const payment = await prisma.bookingPayment.findUnique({
      where: { id },
      include: { booking: true },
    });
    if (!payment) throw new HttpError(404, "Payment not found", "NOT_FOUND");
    if (payment.status === "REFUNDED") throw new HttpError(400, "Already refunded", "BAD_REQUEST");

    const previousStatus = payment.status;

    const [updatedPayment, updatedBooking] = await prisma.$transaction([
      prisma.bookingPayment.update({
        where: { id },
        data: { status: "REFUNDED", note },
        select: { id: true, status: true, amount: true, currency: true },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CANCELLED", rejectionNote: note },
        select: { id: true, status: true },
      }),
    ]);

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "PAYMENT_REFUNDED",
      targetType: "BookingPayment",
      targetId: id,
      metadata: { amount: payment.amount, currency: payment.currency, previousStatus, note },
      ip: req.ip,
    });

    return { payment: updatedPayment, booking: updatedBooking };
  });

  // ── Commission rates ──────────────────────────────────────────────────

  app.get("/finance/commission-rates", { onRequest: [app.requireAdminAuth] }, async () => {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { startsWith: "commission_rate" } },
    });
    const global = settings.find((s) => s.key === "commission_rate");
    const overrides = settings.filter((s) => s.key.startsWith("commission_rate_owner_")).map((s) => ({
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

  // Set global commission rate
  app.patch("/finance/commission-rates/global", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const parsed = z.object({ rate: z.number().min(0).max(100) }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid rate", "BAD_REQUEST");

    await prisma.systemSetting.upsert({
      where: { key: "commission_rate" },
      create: { key: "commission_rate", value: String(parsed.data.rate) },
      update: { value: String(parsed.data.rate) },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "GLOBAL_COMMISSION_RATE_SET",
      targetType: "SystemSetting",
      targetId: "commission_rate",
      metadata: { rate: parsed.data.rate },
      ip: req.ip,
    });

    return { rate: parsed.data.rate };
  });

  // Set per-owner commission rate (kept at /users/:id/commission for backward compat)
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
      metadata: { rate: parsed.data.rate, email: profile.email },
      ip: req.ip,
    });

    return { ownerId: id, rate: parsed.data.rate };
  });

  // Remove per-owner commission override (revert to global rate)
  app.delete("/users/:id/commission", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    await prisma.systemSetting.deleteMany({ where: { key: `commission_rate_owner_${id}` } });
    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "OWNER_COMMISSION_RATE_REMOVED",
      targetType: "Profile",
      targetId: id,
      metadata: {},
      ip: req.ip,
    });
    return { ok: true };
  });

  // ── Reports ───────────────────────────────────────────────────────────

  app.get("/finance/reports", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { period?: string; dateFrom?: string; dateTo?: string };
    const period = (q.period ?? "daily") as "daily" | "weekly" | "monthly";

    const dateFrom = q.dateFrom ? new Date(q.dateFrom) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const dateTo = q.dateTo ? new Date(q.dateTo) : new Date();

    const payments = await prisma.bookingPayment.findMany({
      where: {
        status: { in: ["PAID", "PAYOUT_SENT", "REFUNDED"] },
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: {
        amount: true,
        commission: true,
        netAmount: true,
        currency: true,
        status: true,
        method: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by period in JS
    function periodKey(d: Date): string {
      if (period === "monthly") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (period === "weekly") {
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return monday.toISOString().slice(0, 10);
      }
      return d.toISOString().slice(0, 10);
    }

    const buckets = new Map<string, { revenue: number; commission: number; net: number; count: number; refunds: number }>();
    for (const p of payments) {
      const key = periodKey(p.createdAt);
      const existing = buckets.get(key) ?? { revenue: 0, commission: 0, net: 0, count: 0, refunds: 0 };
      if (p.status === "REFUNDED") {
        existing.refunds += 1;
      } else {
        existing.revenue += p.amount;
        existing.commission += p.commission;
        existing.net += p.netAmount;
        existing.count += 1;
      }
      buckets.set(key, existing);
    }

    const trend = [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    // Payment method distribution
    const methodMap = new Map<string, { count: number; amount: number }>();
    for (const p of payments.filter((p) => p.status !== "REFUNDED")) {
      const key = p.method ?? "unknown";
      const existing = methodMap.get(key) ?? { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += p.amount;
      methodMap.set(key, existing);
    }
    const methodBreakdown = [...methodMap.entries()].map(([method, data]) => ({ method, ...data }));

    // Totals
    const totals = payments
      .filter((p) => p.status !== "REFUNDED")
      .reduce(
        (acc, p) => ({ revenue: acc.revenue + p.amount, commission: acc.commission + p.commission, net: acc.net + p.netAmount, count: acc.count + 1 }),
        { revenue: 0, commission: 0, net: 0, count: 0 }
      );

    return { trend, methodBreakdown, totals, period, dateFrom, dateTo };
  });

  // CSV export of all commission data in date range
  app.get("/finance/reports/export", { onRequest: [app.requireAdminAuth] }, async (req, reply) => {
    const q = req.query as { dateFrom?: string; dateTo?: string };

    const where: Prisma.BookingPaymentWhereInput = {};
    if (q.dateFrom || q.dateTo) {
      where.createdAt = {};
      if (q.dateFrom) where.createdAt.gte = new Date(q.dateFrom);
      if (q.dateTo) where.createdAt.lte = new Date(q.dateTo);
    }

    const payments = await prisma.bookingPayment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        guestName: true,
        guestEmail: true,
        boatName: true,
        amount: true,
        commission: true,
        netAmount: true,
        currency: true,
        status: true,
        method: true,
        paidAt: true,
        payoutAt: true,
        booking: { select: { startDate: true, endDate: true, rentalType: true, boat: { select: { owner: { select: { fullName: true, email: true } } } } } },
      },
    });

    const headers = ["Tarih", "Misafir", "Misafir E-posta", "Tekne", "Sahip", "Sahip E-posta", "Kiralama Türü", "Başlangıç", "Bitiş", "Tutar", "Komisyon", "Net Tutar", "Para Birimi", "Ödeme Durumu", "Ödeme Yöntemi", "Ödeme Tarihi", "Transfer Tarihi"];

    function esc(v: unknown): string {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    }

    const rows = payments.map((p) => [
      esc(p.createdAt.toISOString().slice(0, 10)),
      esc(p.guestName),
      esc(p.guestEmail),
      esc(p.boatName),
      esc(p.booking.boat.owner.fullName),
      esc(p.booking.boat.owner.email),
      esc(p.booking.rentalType),
      esc(p.booking.startDate.toISOString().slice(0, 10)),
      esc(p.booking.endDate?.toISOString().slice(0, 10) ?? ""),
      esc(p.amount.toFixed(2)),
      esc(p.commission.toFixed(2)),
      esc(p.netAmount.toFixed(2)),
      esc(p.currency),
      esc(p.status),
      esc(p.method ?? ""),
      esc(p.paidAt?.toISOString().slice(0, 10) ?? ""),
      esc(p.payoutAt?.toISOString().slice(0, 10) ?? ""),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");

    void reply.header("Content-Type", "text/csv; charset=utf-8");
    void reply.header("Content-Disposition", `attachment; filename="komisyon-raporu-${new Date().toISOString().slice(0, 10)}.csv"`);
    return reply.send("﻿" + csv); // BOM for Excel UTF-8
  });
}
