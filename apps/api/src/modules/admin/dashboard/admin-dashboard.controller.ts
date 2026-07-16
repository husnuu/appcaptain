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
      totalCaptains,
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
      pendingVerifications,
      recentActivity,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { role: "OWNER" } }),
      prisma.user.count({ where: { role: "CAPTAIN" } }),
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
      prisma.boatDocument.count({ where: { status: "PENDING" } }),
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

    // Booking trend — last 30 days (frontend slices to 7 or 30 for weekly/monthly toggle)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentBookings = await prisma.booking.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, totalPrice: true, status: true },
    });

    const trendMap = new Map<string, { count: number; revenue: number; commission: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { count: 0, revenue: 0, commission: 0 });
    }
    for (const b of recentBookings) {
      const key = b.createdAt.toISOString().slice(0, 10);
      const slot = trendMap.get(key);
      if (slot) {
        slot.count += 1;
        if (b.status === "APPROVED" || b.status === "COMPLETED") {
          const rev = b.totalPrice ?? 0;
          slot.revenue += rev;
          slot.commission += rev * commissionRate;
        }
      }
    }
    const weeklyTrend = Array.from(trendMap.entries()).map(([date, v]) => ({
      date,
      count: v.count,
      revenue: Math.round(v.revenue),
      commission: Math.round(v.commission),
    }));

    return {
      stats: {
        totalProfiles,
        totalOwners,
        totalCaptains,
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
        pendingVerifications,
      },
      recentActivity,
      weeklyTrend,
    };
  });
}
