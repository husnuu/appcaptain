import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { signAdminToken } from "../../../plugins/admin-auth.js";
import { HttpError } from "../../../lib/errors.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** In-memory brute-force guard per email (max 5 attempts / 15 min). */
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function assertNotLocked(email: string) {
  const row = loginAttempts.get(email.toLowerCase());
  if (row && row.lockedUntil > Date.now()) {
    throw new HttpError(429, "Çok fazla deneme. 15 dakika sonra tekrar dene.", "RATE_LIMITED");
  }
}

function recordFailed(email: string) {
  const key = email.toLowerCase();
  const row = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  row.count += 1;
  if (row.count >= 5) {
    row.lockedUntil = Date.now() + 15 * 60 * 1000;
    row.count = 0;
  }
  loginAttempts.set(key, row);
}

function clearFailed(email: string) {
  loginAttempts.delete(email.toLowerCase());
}

export async function adminAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid input" });
    }
    const { email, password } = parsed.data;

    assertNotLocked(email);

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      recordFailed(email);
      throw new HttpError(401, "E-posta veya şifre hatalı", "UNAUTHORIZED");
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      recordFailed(email);
      throw new HttpError(401, "E-posta veya şifre hatalı", "UNAUTHORIZED");
    }

    clearFailed(email);

    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role as import("@getyourboat/shared").AdminRole,
    });

    return reply.send({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  });

  app.get("/auth/me", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.adminUser!.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true },
    });
    if (!admin) throw new HttpError(401, "Unauthorized", "UNAUTHORIZED");
    return { admin };
  });
}
