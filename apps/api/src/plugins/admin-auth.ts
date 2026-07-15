import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { AdminRole } from "@getyourboat/shared";
import { env } from "../config/env.js";

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

function extractBearer(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export function verifyAdminToken(token: string): AdminAuthUser | null {
  try {
    const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as {
      sub: string;
      email: string;
      role: AdminRole;
    };
    if (!payload.sub) return null;
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export const adminAuthPlugin = fp(async (app) => {
  app.decorate("requireAdminAuth", async (req: FastifyRequest, reply: FastifyReply) => {
    const token = extractBearer(req);
    const user = token ? verifyAdminToken(token) : null;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });
    if (!user.role) return reply.code(403).send({ message: "Forbidden" });
    req.adminUser = user;
  });

  app.decorate("requireSuperAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    const token = extractBearer(req);
    const user = token ? verifyAdminToken(token) : null;
    if (!user) return reply.code(401).send({ message: "Unauthorized" });
    if (user.role !== "SUPER_ADMIN") {
      return reply.code(403).send({ message: "Forbidden: super admin only" });
    }
    req.adminUser = user;
  });
});

export function signAdminToken(user: AdminAuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.ADMIN_JWT_SECRET,
    { expiresIn: "12h" }
  );
}
