import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const ADMIN_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { auditLogs: true } },
} as const;

const createSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"]).default("MODERATOR"),
});

const updateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "SUPPORT"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(100).optional(),
});

export async function adminAdminsRoutes(app: FastifyInstance) {
  // ── List all admin users ─────────────────────────────────────────────
  app.get("/admins", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const q = req.query as { role?: string; active?: string; page?: string; limit?: string };
    const page = Math.max(1, Number(q.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(q.limit ?? 50)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q.role) where.role = q.role;
    if (q.active !== undefined) where.isActive = q.active === "true";

    const [items, total] = await Promise.all([
      prisma.adminUser.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: ADMIN_SELECT }),
      prisma.adminUser.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // ── Get single admin ─────────────────────────────────────────────────
  app.get("/admins/:id", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const admin = await prisma.adminUser.findUnique({ where: { id }, select: ADMIN_SELECT });
    if (!admin) throw new HttpError(404, "Admin not found", "NOT_FOUND");
    return { admin };
  });

  // ── Create new admin user ────────────────────────────────────────────
  app.post("/admins", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const existing = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
    if (existing) throw new HttpError(409, "Bu e-posta zaten kullanımda", "CONFLICT");

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const admin = await prisma.adminUser.create({
      data: {
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        passwordHash,
        role: parsed.data.role,
      },
      select: ADMIN_SELECT,
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "ADMIN_CREATED",
      targetType: "AdminUser",
      targetId: admin.id,
      metadata: { email: admin.email, role: admin.role },
      ip: req.ip,
    });

    return { admin };
  });

  // ── Update admin user (role, name, password, isActive) ───────────────
  app.patch("/admins/:id", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const existing = await prisma.adminUser.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Admin not found", "NOT_FOUND");

    // Prevent super-admin from demoting themselves
    if (id === req.adminUser!.id && parsed.data.role && parsed.data.role !== "SUPER_ADMIN") {
      throw new HttpError(400, "Kendi rolünüzü değiştiremezsiniz", "BAD_REQUEST");
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.fullName) data.fullName = parsed.data.fullName;
    if (parsed.data.role) data.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const admin = await prisma.adminUser.update({ where: { id }, data, select: ADMIN_SELECT });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "ADMIN_UPDATED",
      targetType: "AdminUser",
      targetId: id,
      metadata: { changes: Object.keys(data).filter((k) => k !== "passwordHash") },
      ip: req.ip,
    });

    return { admin };
  });

  // ── Deactivate admin (soft delete) ───────────────────────────────────
  app.delete("/admins/:id", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    if (id === req.adminUser!.id) {
      throw new HttpError(400, "Kendi hesabınızı devre dışı bırakamazsınız", "BAD_REQUEST");
    }
    const existing = await prisma.adminUser.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Admin not found", "NOT_FOUND");

    await prisma.adminUser.update({ where: { id }, data: { isActive: false } });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "ADMIN_DEACTIVATED",
      targetType: "AdminUser",
      targetId: id,
      metadata: { email: existing.email },
      ip: req.ip,
    });

    return { deactivated: true };
  });
}
