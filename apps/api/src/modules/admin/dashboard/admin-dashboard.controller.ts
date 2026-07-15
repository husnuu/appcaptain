import type { FastifyInstance } from "fastify";
import { prisma } from "@getyourboat/database";

export async function adminDashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard", { onRequest: [app.requireAdminAuth] }, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const commissionSetting = await prisma.systemSetting.findUnique({
      where: { key: "commission_rate" },
    });
    const commissionRate = parseFloat(commissionSetting?.value ?? "10") / 100;

    const [
      totalProfiles,
      totalOwners,
      activeListings,
      pendingListings,
      suspendedListings,
      totalBookings,
      pendingBookings,
      approvedBookings,
      cancelledBookings,
      completedBookings,
      todayBookings,
      revenueResult,
      recentActivity,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { role: "OWNER" } }),
      prisma.boat.count({ where: { status: "ACTIVE" } }),
      prisma.boat.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.boat.count({ where: { status: "SUSPENDED" } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "APPROVED" } }),
      prisma.booking.count({ where: { status: "CANCELLED" } }),
      prisma.booking.count({ where: { status: "COMPLETED" } }),
      prisma.booking.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.booking.aggregate({
        where: { status: { in: ["APPROVED", "COMPLETED"] } },
        _sum: { totalPrice: true },
      }),
      prisma.auditLog.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { fullName: true, email: true } } },
      }),
    ]);

    const totalRevenue = revenueResult._sum.totalPrice ?? 0;
    const platformCommission = totalRevenue * commissionRate;
    const cancellationRate =
      totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    // Weekly booking trend — last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
    twoWeeksAgo.setHours(0, 0, 0, 0);

    const recentBookings = await prisma.booking.findMany({
      where: { createdAt: { gte: twoWeeksAgo } },
      select: { createdAt: true, totalPrice: true, status: true },
    });

    const trendMap = new Map<string, { count: number; revenue: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { count: 0, revenue: 0 });
    }
    for (const b of recentBookings) {
      const key = b.createdAt.toISOString().slice(0, 10);
      const slot = trendMap.get(key);
      if (slot) {
        slot.count += 1;
        if (b.status === "APPROVED" || b.status === "COMPLETED") {
          slot.revenue += b.totalPrice ?? 0;
        }
      }
    }
    const weeklyTrend = Array.from(trendMap.entries()).map(([date, v]) => ({
      date,
      count: v.count,
      revenue: Math.round(v.revenue),
    }));

    return {
      stats: {
        totalProfiles,
        totalOwners,
        activeListings,
        pendingListings,
        suspendedListings,
        totalBookings,
        pendingBookings,
        approvedBookings,
        cancelledBookings,
        completedBookings,
        todayBookings,
        totalRevenue: Math.round(totalRevenue),
        platformCommission: Math.round(platformCommission),
        cancellationRate,
        commissionRate: commissionRate * 100,
      },
      recentActivity,
      weeklyTrend,
    };
  });
}
