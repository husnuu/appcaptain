import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

// Keys that can be read/written through the settings endpoint.
const ALLOWED_SETTING_KEYS = new Set([
  // Platform
  "platform_name",
  "platform_support_email",
  "commission_rate",
  "max_booking_days",
  "min_booking_hours",
  "maintenance_mode",
  // Currencies & languages
  "supported_currencies",
  "supported_languages",
  // Payment methods
  "supported_payment_methods",
  // Stripe
  "stripe_public_key",
  "stripe_secret_key",
  // iyzico
  "iyzico_merchant_id",
  "iyzico_api_key",
  "iyzico_secret_key",
  // Google Maps
  "google_maps_api_key",
]);

// These keys have their value masked in list/get responses. Only the bool "isSet" is returned.
const SENSITIVE_KEYS = new Set([
  "stripe_secret_key",
  "iyzico_api_key",
  "iyzico_secret_key",
  "google_maps_api_key",
]);

const FEATURE_FLAG_PREFIX = "feature_flag_";

// Canonical list of feature flags with labels and descriptions
const KNOWN_FEATURE_FLAGS: { name: string; label: string; description: string; defaultEnabled: boolean }[] = [
  { name: "discounts", label: "İndirim Yönetimi", description: "Kupon ve indirim sistemi", defaultEnabled: true },
  { name: "reviews", label: "Yorum Sistemi", description: "Kullanıcı değerlendirme ve yorum modülü", defaultEnabled: true },
  { name: "support", label: "Destek Sistemi", description: "Ticket tabanlı destek yönetimi", defaultEnabled: true },
  { name: "experiences", label: "Deneyimler", description: "Kaptan deneyimleri ve aktiviteleri", defaultEnabled: true },
  { name: "sms_notifications", label: "SMS Bildirimleri", description: "Kullanıcılara SMS gönderimi", defaultEnabled: false },
  { name: "push_notifications", label: "Push Bildirimleri", description: "Mobil uygulama push bildirimleri", defaultEnabled: false },
  { name: "kyc", label: "KYC Doğrulama", description: "Kaptan kimlik doğrulama modülü", defaultEnabled: false },
  { name: "map_view", label: "Harita Görünümü", description: "Admin paneli ilan haritası", defaultEnabled: true },
  { name: "instant_booking", label: "Anlık Rezervasyon", description: "Onay beklemeden anında rezervasyon", defaultEnabled: true },
];

const settingSchema = z.object({ value: z.string().min(0).max(5000) });
const bulkSchema = z.object({ settings: z.record(z.string(), z.string()) });

function maskSetting(key: string, value: string) {
  if (SENSITIVE_KEYS.has(key)) {
    return { key, value: value ? "••••••••" : "", isSet: value !== "", isSensitive: true };
  }
  return { key, value, isSet: true, isSensitive: false };
}

export async function adminSettingsRoutes(app: FastifyInstance) {
  // ── Read all settings (sensitive keys masked) ───────────────────────────
  app.get("/settings", { onRequest: [app.requireAdminAuth] }, async () => {
    const rawAll = await prisma.systemSetting.findMany({
      where: { key: { in: [...ALLOWED_SETTING_KEYS] } },
      orderBy: { key: "asc" },
    });
    const existing = new Map(rawAll.map((s) => [s.key, s]));

    const settings = [...ALLOWED_SETTING_KEYS].map((key) => {
      const row = existing.get(key);
      const raw = maskSetting(key, row?.value ?? "");
      return { ...raw, updatedAt: row?.updatedAt ?? null };
    });

    return { settings };
  });

  // ── Write a single setting ──────────────────────────────────────────────
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
      metadata: SENSITIVE_KEYS.has(key)
        ? { key, changed: true }
        : { key, oldValue: previous?.value, newValue: parsed.data.value },
      ip: req.ip,
    });

    return { setting: maskSetting(setting.key, setting.value) };
  });

  // ── Bulk update settings ────────────────────────────────────────────────
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

  // ── Feature flags ─────────────────────────────────────────────────────
  app.get("/feature-flags", { onRequest: [app.requireAdminAuth] }, async () => {
    const rows = await prisma.systemSetting.findMany({
      where: { key: { startsWith: FEATURE_FLAG_PREFIX } },
    });
    const stored = new Map(rows.map((r) => [r.key.replace(FEATURE_FLAG_PREFIX, ""), r.value]));

    const flags = KNOWN_FEATURE_FLAGS.map((f) => ({
      name: f.name,
      label: f.label,
      description: f.description,
      enabled: stored.has(f.name)
        ? stored.get(f.name) === "true"
        : f.defaultEnabled,
      isDefault: !stored.has(f.name),
    }));

    return { flags };
  });

  app.patch("/feature-flags/:name", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { name } = req.params as { name: string };
    if (!KNOWN_FEATURE_FLAGS.find((f) => f.name === name)) {
      throw new HttpError(400, "Unknown feature flag", "BAD_REQUEST");
    }
    const parsed = z.object({ enabled: z.boolean() }).safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const key = `${FEATURE_FLAG_PREFIX}${name}`;
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: String(parsed.data.enabled) },
      update: { value: String(parsed.data.enabled) },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: "FEATURE_FLAG_TOGGLED",
      targetType: "FeatureFlag",
      targetId: name,
      metadata: { name, enabled: parsed.data.enabled },
      ip: req.ip,
    });

    return { name, enabled: parsed.data.enabled };
  });
}
