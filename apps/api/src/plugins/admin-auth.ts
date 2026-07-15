import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AdminRole } from "@getyourboat/shared";
import { env } from "../config/env.js";
import { prisma } from "@getyourboat/database";

export interface AdminAuthUser {
  id: string;
  email: string;
  role: AdminRole;
}

declare module "fastify" {
  interface FastifyRequest {
    adminUser?: AdminAuthUser;
  }
  interface FastifyInstance {
    requireAdminAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireSuperAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const ADMIN_TOKEN_COOKIE = "admin_token";
export const ADMIN_TOKEN_MAX_AGE = 60 * 60; // 1 hour, matches JWT expiry

function extractBearer(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
}

function extractCookie(req: FastifyRequest): string | null {
  return req.cookies?.[ADMIN_TOKEN_COOKIE] ?? null;
}

export async function verifyAdminToken(token: string): Promise<AdminAuthUser | null> {
  let payload: { sub: string; email: string; role: AdminRole; jti?: string };
  try {
    payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as typeof payload;
  } catch {
    return null;
  }
  if (!payload.sub) return null;

  // Check JTI revocation — O(1) PK lookup in system_settings
  if (payload.jti) {
    const revoked = await prisma.systemSetting.findUnique({
      where: { key: `revoked_jti_${payload.jti}` },
    });
    if (revoked) return null;
  }

  return { id: payload.sub, email: payload.email, role: payload.role };
}

/** Decode a token (without verifying) and store its JTI in the revocation list. */
export async function revokeAdminToken(token: string): Promise<void> {
  try {
    const payload = jwt.decode(token) as { jti?: string; exp?: number } | null;
    if (!payload?.jti) return;
    const expiresAt = payload.exp
      ? new Date(payload.exp * 1000)
      : new Date(Date.now() + ADMIN_TOKEN_MAX_AGE * 1000);
    await prisma.systemSetting.upsert({
      where: { key: `revoked_jti_${payload.jti}` },
      create: { key: `revoked_jti_${payload.jti}`, value: expiresAt.toISOString() },
      update: { value: expiresAt.toISOString() },
    });
  } catch {
    // Silently ignore — revocation is best-effort on decode failure
  }
}

export const adminAuthPlugin = fp(async (app) => {
  app.decorate("requireAdminAuth", async (req: FastifyRequest, reply: FastifyReply) => {
    const token = extractCookie(req) ?? extractBearer(req);
    const user = token ? await verifyAdminToken(token) : null;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });
    req.adminUser = user;
  });

  app.decorate("requireSuperAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    const token = extractCookie(req) ?? extractBearer(req);
    const user = token ? await verifyAdminToken(token) : null;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });
    if (user.role !== "SUPER_ADMIN") {
      return reply.code(403).send({ message: "Forbidden: super admin only" });
    }
    req.adminUser = user;
  });
});

export function signAdminToken(user: AdminAuthUser): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, jti },
    env.ADMIN_JWT_SECRET,
    { expiresIn: "1h" },
  );
}
