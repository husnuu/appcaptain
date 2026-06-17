import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { prisma } from "@getyourboat/database";
import { loginSchema, registerSchema } from "@getyourboat/shared";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid input", details: parsed.error.flatten() });
    }
    const { email, password, name, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        ...(role === "CAPTAIN" ? { captainProfile: { create: {} } } : {}),
      },
    });

    const token = app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return reply.code(201).send({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid input" });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    const token = app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    return { token, user: { id: user.id, email: user.email, role: user.role, name: user.name } };
  });

  app.get("/auth/me", { onRequest: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });
    return { user };
  });
}
