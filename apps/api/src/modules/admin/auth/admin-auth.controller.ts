import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import {
  signAdminToken,
  revokeAdminToken,
  ADMIN_TOKEN_COOKIE,
  ADMIN_TOKEN_MAX_AGE,
} from "../../../plugins/admin-auth.js";
import { HttpError } from "../../../lib/errors.js";
import { env } from "../../../config/env.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RL_WINDOW_MS = 15 * 60 * 1000;
const RL_MAX = 5;

function rlKey(email: string) {
  return `rl_admin_${email.toLowerCase()}`;
}

async function assertNotLocked(email: string) {
  const row = await prisma.systemSetting.findUnique({ where: { key: rlKey(email) } });
  if (!row) return;
  const data = JSON.parse(row.value) as { count: number; resetAt: string };
  if (new Date(data.resetAt) > new Date() && data.count >= RL_MAX) {
    throw new HttpError(429, "Çok fazla deneme. 15 dakika sonra tekrar dene.", "RATE_LIMITED");
  }
}

async function recordFailed(email: string) {
  const key = rlKey(email);
  const now = Date.now();
  const row = await prisma.systemSetting.findUnique({ where: { key } });

  let count = 1;
  let resetAt = new Date(now + RL_WINDOW_MS).toISOString();

  if (row) {
    const prev = JSON.parse(row.value) as { count: number; resetAt: string };
    if (new Date(prev.resetAt) > new Date()) {
      count = prev.count + 1;
      resetAt = prev.resetAt;
    }
  }

  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify({ count, resetAt }) },
    update: { value: JSON.stringify({ count, resetAt }) },
  });
}

async function clearFailed(email: string) {
  await prisma.systemSetting.deleteMany({ where: { key: rlKey(email) } });
}

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const { email, password } = parsed.data;

    await assertNotLocked(email);

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      await recordFailed(email);
      throw new HttpError(401, "E-posta veya şifre hatalı", "UNAUTHORIZED");
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      await recordFailed(email);
      throw new HttpError(401, "E-posta veya şifre hatalı", "UNAUTHORIZED");
    }

    await clearFailed(email);

    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role as import("@getyourboat/shared").AdminRole,
    });

    reply.setCookie(ADMIN_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: ADMIN_TOKEN_MAX_AGE,
    });

    return reply.send({
      token, // kept in body for external API clients / testing
      admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role },
    });
  });

  app.post("/auth/logout", { onRequest: [app.requireAdminAuth] }, async (req, reply) => {
    const token = req.cookies?.[ADMIN_TOKEN_COOKIE]
      ?? req.headers.authorization?.replace("Bearer ", "");
    if (token) await revokeAdminToken(token);
    reply.clearCookie(ADMIN_TOKEN_COOKIE, { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/auth/me", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.adminUser!.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    if (!admin || !admin.isActive) throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
    return { admin };
  });
}
