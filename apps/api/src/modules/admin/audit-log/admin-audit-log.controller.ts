import type { FastifyInstance } from "fastify";
import { prisma } from "@getyourboat/database";

export async function adminAuditLogRoutes(app: FastifyInstance) {
  app.get("/audit-log", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const q = req.query as {
      action?: string;
      adminId?: string;
      targetType?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 50)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q.action) where.action = q.action;
    if (q.adminId) where.adminId = q.adminId;
    if (q.targetType) where.targetType = q.targetType;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { id: true, fullName: true, email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit };
  });
}
