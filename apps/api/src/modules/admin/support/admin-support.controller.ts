import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma, type Prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";
import { sendTicketReplyEmail, sendTicketConfirmationEmail } from "../../../lib/email.js";

const TICKET_LIST_SELECT = {
  id: true,
  subject: true,
  status: true,
  priority: true,
  guestEmail: true,
  guestName: true,
  guestPhone: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  assignedTo: { select: { id: true, fullName: true, email: true } },
  user: { select: { id: true, name: true, email: true } },
  _count: { select: { messages: true, notes: true } },
} as const;

const TICKET_DETAIL_SELECT = {
  ...TICKET_LIST_SELECT,
  messages: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      fromAdmin: true,
      body: true,
      createdAt: true,
      admin: { select: { id: true, fullName: true } },
    },
  },
  notes: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      body: true,
      createdAt: true,
      admin: { select: { id: true, fullName: true } },
    },
  },
} as const;

export async function adminSupportRoutes(app: FastifyInstance) {
  // ── Public: submit a ticket ───────────────────────────────────────────
  // Called from captain/guest app — no auth required.

  app.post("/support/tickets", async (req) => {
    const parsed = z.object({
      subject: z.string().min(3).max(200),
      body: z.string().min(10).max(5000),
      guestEmail: z.string().email(),
      guestName: z.string().min(1).max(200),
      guestPhone: z.string().optional(),
      userId: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { subject, body, guestEmail, guestName, guestPhone, userId } = parsed.data;

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        guestEmail,
        guestName,
        guestPhone,
        userId,
        messages: {
          create: { fromAdmin: false, body },
        },
      },
      select: { id: true, subject: true, guestEmail: true, guestName: true, createdAt: true },
    });

    void sendTicketConfirmationEmail({ to: guestEmail, name: guestName, subject, ticketId: ticket.id });

    return { ticket };
  });

  // ── List tickets ──────────────────────────────────────────────────────

  app.get("/support/tickets", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as {
      status?: string;
      priority?: string;
      search?: string;
      assignedTo?: string;
      page?: string;
      limit?: string;
    };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 25)));
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};
    if (q.status) where.status = q.status as Prisma.EnumTicketStatusFilter["equals"];
    if (q.priority) where.priority = q.priority as Prisma.EnumTicketPriorityFilter["equals"];
    if (q.assignedTo === "me") where.assignedToId = req.adminUser!.id;
    if (q.assignedTo === "unassigned") where.assignedToId = null;
    if (q.search) {
      where.OR = [
        { subject: { contains: q.search, mode: "insensitive" } },
        { guestEmail: { contains: q.search, mode: "insensitive" } },
        { guestName: { contains: q.search, mode: "insensitive" } },
      ];
    }

    const [items, total, statusCounts] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
        select: TICKET_LIST_SELECT,
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);

    const counts = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

    return { items, total, page, limit, counts };
  });

  // ── Single ticket ─────────────────────────────────────────────────────

  app.get("/support/tickets/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: TICKET_DETAIL_SELECT,
    });
    if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");
    return { ticket };
  });

  // ── Update status / priority / assignment ─────────────────────────────

  app.patch("/support/tickets/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({
      status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
      assignedToId: z.string().uuid().nullable().optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");

    const data: Prisma.SupportTicketUpdateInput = {};
    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status;
      if (parsed.data.status === "RESOLVED" && !ticket.resolvedAt) data.resolvedAt = new Date();
      if (parsed.data.status !== "RESOLVED") data.resolvedAt = null;
    }
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
    if (parsed.data.assignedToId !== undefined) {
      data.assignedTo = parsed.data.assignedToId
        ? { connect: { id: parsed.data.assignedToId } }
        : { disconnect: true };
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data,
      select: TICKET_LIST_SELECT,
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "TICKET_UPDATED",
      targetType: "SupportTicket",
      targetId: id,
      metadata: { changes: parsed.data },
      ip: req.ip,
    });

    return { ticket: updated };
  });

  // Assign to self shortcut
  app.post("/support/tickets/:id/assign-me", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        assignedToId: req.adminUser!.id,
        status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
      },
      select: TICKET_LIST_SELECT,
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "TICKET_ASSIGNED",
      targetType: "SupportTicket",
      targetId: id,
      metadata: { assignedToId: req.adminUser!.id },
      ip: req.ip,
    });

    return { ticket: updated };
  });

  // ── Reply (admin → guest) ─────────────────────────────────────────────

  app.post("/support/tickets/:id/reply", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({
      body: z.string().min(1).max(5000),
      sendEmail: z.boolean().default(true),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");
    if (ticket.status === "CLOSED") throw new HttpError(400, "Cannot reply to a closed ticket", "BAD_REQUEST");

    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        fromAdmin: true,
        adminId: req.adminUser!.id,
        body: parsed.data.body,
      },
      select: { id: true, fromAdmin: true, body: true, createdAt: true, admin: { select: { id: true, fullName: true } } },
    });

    // Auto-progress status when admin replies
    if (ticket.status === "OPEN") {
      await prisma.supportTicket.update({ where: { id }, data: { status: "IN_PROGRESS" } });
    }

    let emailSent = false;
    if (parsed.data.sendEmail) {
      emailSent = await sendTicketReplyEmail({
        to: ticket.guestEmail,
        name: ticket.guestName,
        subject: ticket.subject,
        ticketId: id,
        body: parsed.data.body,
      });
    }

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "TICKET_REPLIED",
      targetType: "SupportTicket",
      targetId: id,
      metadata: { emailSent },
      ip: req.ip,
    });

    return { message, emailSent };
  });

  // ── Internal note ─────────────────────────────────────────────────────

  app.post("/support/tickets/:id/notes", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({ body: z.string().min(1).max(2000) }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "body is required", "BAD_REQUEST");

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");

    const note = await prisma.ticketNote.create({
      data: { ticketId: id, adminId: req.adminUser!.id, body: parsed.data.body },
      select: { id: true, body: true, createdAt: true, admin: { select: { id: true, fullName: true } } },
    });

    return { note };
  });

  app.delete("/support/tickets/:ticketId/notes/:noteId", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { ticketId, noteId } = req.params as { ticketId: string; noteId: string };
    const note = await prisma.ticketNote.findFirst({ where: { id: noteId, ticketId } });
    if (!note) throw new HttpError(404, "Note not found", "NOT_FOUND");

    // Only the author can delete their note (or super admin)
    if (note.adminId !== req.adminUser!.id && req.adminUser!.role !== "SUPER_ADMIN") {
      throw new HttpError(403, "Not authorized to delete this note", "FORBIDDEN");
    }

    await prisma.ticketNote.delete({ where: { id: noteId } });
    return { deleted: true };
  });

  // ── Create ticket (admin manual) ──────────────────────────────────────

  app.post("/support/tickets/admin-create", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const parsed = z.object({
      subject: z.string().min(3).max(200),
      body: z.string().min(1).max(5000),
      guestEmail: z.string().email(),
      guestName: z.string().min(1).max(200),
      guestPhone: z.string().optional(),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
      userId: z.string().optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { body, ...rest } = parsed.data;
    const ticket = await prisma.supportTicket.create({
      data: {
        ...rest,
        assignedToId: req.adminUser!.id,
        status: "IN_PROGRESS",
        messages: { create: { fromAdmin: false, body } },
      },
      select: TICKET_LIST_SELECT,
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "TICKET_CREATED",
      targetType: "SupportTicket",
      targetId: ticket.id,
      metadata: { subject: ticket.subject, guestEmail: ticket.guestEmail },
      ip: req.ip,
    });

    return { ticket };
  });

  // ── Response templates ────────────────────────────────────────────────

  app.get("/support/templates", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const q = req.query as { category?: string };
    const where: Prisma.ResponseTemplateWhereInput = {};
    if (q.category) where.category = q.category;
    const templates = await prisma.responseTemplate.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return { templates };
  });

  app.post("/support/templates", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const parsed = z.object({
      name: z.string().min(1).max(100),
      body: z.string().min(1).max(5000),
      category: z.string().max(50).optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const template = await prisma.responseTemplate.create({ data: parsed.data });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "TEMPLATE_CREATED",
      targetType: "ResponseTemplate",
      targetId: template.id,
      metadata: { name: template.name },
      ip: req.ip,
    });

    return { template };
  });

  app.patch("/support/templates/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = z.object({
      name: z.string().min(1).max(100).optional(),
      body: z.string().min(1).max(5000).optional(),
      category: z.string().max(50).nullable().optional(),
    }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const existing = await prisma.responseTemplate.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Template not found", "NOT_FOUND");

    const template = await prisma.responseTemplate.update({ where: { id }, data: parsed.data });
    return { template };
  });

  app.delete("/support/templates/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const existing = await prisma.responseTemplate.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Template not found", "NOT_FOUND");

    await prisma.responseTemplate.delete({ where: { id } });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "TEMPLATE_DELETED",
      targetType: "ResponseTemplate",
      targetId: id,
      metadata: { name: existing.name },
      ip: req.ip,
    });

    return { deleted: true };
  });
}
