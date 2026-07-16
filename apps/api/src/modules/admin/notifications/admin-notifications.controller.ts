import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const broadcastSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  targetRole: z.enum(["ALL", "OWNER", "CUSTOMER"]).default("ALL"),
  userIds: z.array(z.string().uuid()).optional(),
});

export async function adminNotificationsRoutes(app: FastifyInstance) {
  // List recent broadcasts (stored in audit log as BROADCAST_SENT actions)
  app.get("/notifications/broadcasts", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { action: "BROADCAST_SENT" },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { admin: { select: { fullName: true, email: true } } },
      }),
      prisma.auditLog.count({ where: { action: "BROADCAST_SENT" } }),
    ]);

    return { items, total, page, limit };
  });

  // Send broadcast notification.
  // WIRING STATUS (2026-07-16): this endpoint ONLY writes to AuditLog — no emails or push
  // messages are actually delivered. recipientCount is calculated but not acted on.
  // To wire real delivery: import sendEmail() from lib/email.ts, query the target profiles,
  // and call sendEmail() per recipient (or batch via your email provider's bulk API).
  // For push notifications: a Notification model + captain-side polling/websocket is needed.
  app.post("/notifications/broadcast", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const parsed = broadcastSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { subject, message, targetRole, userIds } = parsed.data;

    let recipientCount = 0;
    if (userIds && userIds.length > 0) {
      recipientCount = userIds.length;
    } else if (targetRole === "ALL") {
      recipientCount = await prisma.profile.count();
    } else {
      recipientCount = await prisma.profile.count({
        where: { role: targetRole as "OWNER" | "CUSTOMER" },
      });
    }

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "BROADCAST_SENT",
      metadata: { subject, message, targetRole, userIds, recipientCount },
      ip: req.ip,
    });

    return { sent: true, recipientCount, subject };
  });
}
