import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

// Only these keys may be written through the settings endpoint.
// Per-owner commission overrides are managed via PATCH /users/:id/commission.
// Internal rate-limit and JTI revocation keys are managed internally and never exposed.
const ALLOWED_SETTING_KEYS = new Set([
  "commission_rate",
  "maintenance_mode",
  "max_booking_days",
  "min_booking_hours",
]);

const settingSchema = z.object({
  value: z.string().min(0).max(2000),
});

const bulkSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

export async function adminSettingsRoutes(app: FastifyInstance) {
  app.get("/settings", { onRequest: [app.requireAdminAuth] }, async () => {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          notIn: await prisma.systemSetting
            .findMany({ where: { key: { startsWith: "commission_rate_owner_" } }, select: { key: true } })
            .then((r) => r.map((s) => s.key)),
        },
      },
      orderBy: { key: "asc" },
    });
    return { settings };
  });

  app.get("/settings/:key", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { key } = req.params as { key: string };
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) throw new HttpError(404, "Setting not found", "NOT_FOUND");
    return { setting };
  });

  app.put("/settings/:key", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { key } = req.params as { key: string };
    if (!ALLOWED_SETTING_KEYS.has(key)) throw new HttpError(400, "Unknown setting key", "BAD_REQUEST");
    const parsed = settingSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid value", "BAD_REQUEST");

    const previous = await prisma.systemSetting.findUnique({ where: { key } });

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: parsed.data.value },
      update: { value: parsed.data.value },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "SETTING_UPDATED",
      targetType: "SystemSetting",
      targetId: key,
      metadata: { key, oldValue: previous?.value, newValue: parsed.data.value },
      ip: req.ip,
    });

    return { setting };
  });

  // Bulk update settings (e.g. save settings page form)
  app.patch("/settings", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const parsed = bulkSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const entries = Object.entries(parsed.data.settings).filter(([k]) => ALLOWED_SETTING_KEYS.has(k));
    if (entries.length === 0) throw new HttpError(400, "No valid setting keys provided", "BAD_REQUEST");
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        })
      )
    );

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "SETTINGS_BULK_UPDATED",
      metadata: { keys: entries.map(([k]) => k) },
      ip: req.ip,
    });

    return { updated: entries.length };
  });
}
