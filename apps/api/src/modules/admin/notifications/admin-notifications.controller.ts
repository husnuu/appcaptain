import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";
import { sendBroadcastEmail } from "../../../lib/email.js";
import { env } from "../../../config/env.js";

// ── Notification templates ───────────────────────────────────────────────────

const templateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["CUSTOM", "APPROVAL", "REJECTION", "REMINDER", "CAMPAIGN"]).default("CUSTOM"),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
});

// ── Target group helpers ─────────────────────────────────────────────────────

type Recipient = { email: string; name: string | null; id: string };

async function resolveRecipients(targetGroup: string, userIds?: string[]): Promise<Recipient[]> {
  if (userIds && userIds.length > 0) {
    const profiles = await prisma.profile.findMany({
      where: { id: { in: userIds }, email: { not: null } },
      select: { id: true, email: true, fullName: true },
    });
    return profiles.filter((p) => p.email).map((p) => ({ email: p.email!, name: p.fullName, id: p.id }));
  }

  switch (targetGroup) {
    case "ALL": {
      const [profiles, users] = await Promise.all([
        prisma.profile.findMany({ where: { email: { not: null } }, select: { id: true, email: true, fullName: true } }),
        prisma.user.findMany({ where: { isSuspended: false }, select: { id: true, email: true, name: true } }),
      ]);
      const profileRecipients = profiles.filter((p) => p.email).map((p) => ({ email: p.email!, name: p.fullName, id: p.id }));
      const userRecipients = users.map((u) => ({ email: u.email, name: u.name, id: u.id }));
      // Deduplicate by email
      const seen = new Set(profileRecipients.map((r) => r.email));
      return [...profileRecipients, ...userRecipients.filter((r) => !seen.has(r.email))];
    }
    case "OWNER": {
      const profiles = await prisma.profile.findMany({
        where: { role: "OWNER", email: { not: null } },
        select: { id: true, email: true, fullName: true },
      });
      return profiles.filter((p) => p.email).map((p) => ({ email: p.email!, name: p.fullName, id: p.id }));
    }
    case "CAPTAIN": {
      const profiles = await prisma.profile.findMany({
        where: { email: { not: null } },
        select: { id: true, email: true, fullName: true },
      });
      return profiles.filter((p) => p.email).map((p) => ({ email: p.email!, name: p.fullName, id: p.id }));
    }
    case "GUEST": {
      const users = await prisma.user.findMany({
        where: { isSuspended: false },
        select: { id: true, email: true, name: true },
      });
      return users.map((u) => ({ email: u.email, name: u.name, id: u.id }));
    }
    default:
      return [];
  }
}

async function deliverCampaign(campaignId: string, recipients: Recipient[], subject: string, body: string): Promise<void> {
  for (const r of recipients) {
    try {
      const delivery = await prisma.broadcastDelivery.create({
        data: { campaignId, recipientEmail: r.email, recipientName: r.name, recipientId: r.id },
        select: { id: true },
      });
      const trackingUrl = `${env.API_URL}/api/v1/notifications/track/${delivery.id}`;
      await sendBroadcastEmail({ to: r.email, name: r.name, subject, body, trackingUrl });
    } catch {
      // skip failed recipient, continue delivery
    }
  }
}

export async function adminNotificationsRoutes(app: FastifyInstance) {
  // ── Notification templates ───────────────────────────────────────────

  app.get("/notifications/templates", { onRequest: [app.requireAdminAuth] }, async () => {
    const templates = await prisma.notificationTemplate.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] });
    return { templates };
  });

  app.post("/notifications/templates", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const parsed = templateSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");
    const template = await prisma.notificationTemplate.create({ data: parsed.data });
    return { template };
  });

  app.patch("/notifications/templates/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = templateSchema.partial().safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Template not found", "NOT_FOUND");
    const template = await prisma.notificationTemplate.update({ where: { id }, data: parsed.data });
    return { template };
  });

  app.delete("/notifications/templates/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.notificationTemplate.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Template not found", "NOT_FOUND");
    await prisma.notificationTemplate.delete({ where: { id } });
    return { deleted: true };
  });

  // ── Campaign broadcast ───────────────────────────────────────────────

  app.post("/notifications/broadcast", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const parsed = z.object({
      subject: z.string().min(1).max(200),
      message: z.string().min(1).max(10000),
      targetGroup: z.enum(["ALL", "OWNER", "CAPTAIN", "GUEST"]).default("CAPTAIN"),
      channel: z.enum(["EMAIL", "PUSH", "SMS"]).default("EMAIL"),
      userIds: z.array(z.string()).optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { subject, message, targetGroup, channel, userIds } = parsed.data;

    const recipients = await resolveRecipients(targetGroup, userIds);

    const campaign = await prisma.broadcastCampaign.create({
      data: {
        subject,
        body: message,
        channel,
        targetGroup,
        recipientCount: recipients.length,
        sentBy: req.adminUser!.id,
      },
      select: { id: true, subject: true, recipientCount: true },
    });

    // Fire delivery asynchronously — return immediately
    if (channel === "EMAIL") {
      void deliverCampaign(campaign.id, recipients, subject, message);
    }

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "BROADCAST_SENT",
      targetType: "BroadcastCampaign",
      targetId: campaign.id,
      metadata: { subject, targetGroup, channel, recipientCount: recipients.length },
      ip: req.ip,
    });

    return { campaignId: campaign.id, recipientCount: recipients.length, subject };
  });

  // ── Campaign history ─────────────────────────────────────────────────

  app.get("/notifications/campaigns", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 20)));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.broadcastCampaign.findMany({
        skip,
        take: limit,
        orderBy: { sentAt: "desc" },
        select: {
          id: true,
          subject: true,
          channel: true,
          targetGroup: true,
          recipientCount: true,
          sentAt: true,
          admin: { select: { id: true, fullName: true, email: true } },
          _count: { select: { deliveries: true } },
        },
      }),
      prisma.broadcastCampaign.count(),
    ]);

    // Attach open counts in one extra query
    const campaignIds = items.map((c) => c.id);
    const openCounts = campaignIds.length
      ? await prisma.broadcastDelivery.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: campaignIds }, openedAt: { not: null } },
          _count: { _all: true },
        })
      : [];
    const openMap = new Map(openCounts.map((o) => [o.campaignId, o._count._all]));

    const enriched = items.map((c) => ({
      ...c,
      openCount: openMap.get(c.id) ?? 0,
      openRate: c._count.deliveries > 0 ? Math.round(((openMap.get(c.id) ?? 0) / c._count.deliveries) * 100) : null,
    }));

    return { items: enriched, total, page, limit };
  });

  app.get("/notifications/campaigns/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const campaign = await prisma.broadcastCampaign.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        body: true,
        channel: true,
        targetGroup: true,
        recipientCount: true,
        sentAt: true,
        admin: { select: { id: true, fullName: true, email: true } },
        deliveries: {
          orderBy: { createdAt: "asc" },
          select: { id: true, recipientEmail: true, recipientName: true, openedAt: true, createdAt: true },
        },
      },
    });
    if (!campaign) throw new HttpError(404, "Campaign not found", "NOT_FOUND");

    const openCount = campaign.deliveries.filter((d) => d.openedAt).length;
    const deliveryCount = campaign.deliveries.length;

    return {
      campaign: {
        ...campaign,
        openCount,
        openRate: deliveryCount > 0 ? Math.round((openCount / deliveryCount) * 100) : null,
      },
    };
  });

  // Legacy endpoint for backward compat (list broadcasts from audit log)
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

  // ── Open tracking pixel ──────────────────────────────────────────────
  // Public — no auth. Returns 1×1 transparent GIF and records openedAt.

  app.get("/notifications/track/:deliveryId", async (req, reply) => {
    const { deliveryId } = req.params as { deliveryId: string };
    // Fire-and-forget the DB update so we return the pixel instantly
    void prisma.broadcastDelivery.updateMany({
      where: { id: deliveryId, openedAt: null },
      data: { openedAt: new Date() },
    });

    const gif = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    );
    void reply.header("Content-Type", "image/gif");
    void reply.header("Cache-Control", "no-store, no-cache, must-revalidate");
    return reply.send(gif);
  });

  // ── Recipient preview (count before sending) ─────────────────────────

  app.get("/notifications/recipient-count", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { targetGroup?: string };
    const targetGroup = q.targetGroup ?? "CAPTAIN";
    const recipients = await resolveRecipients(targetGroup);
    return { count: recipients.length, targetGroup };
  });
}
