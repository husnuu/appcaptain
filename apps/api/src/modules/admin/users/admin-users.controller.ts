import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "@getyourboat/database";
import { createAuditLog } from "../audit.js";
import { HttpError } from "../../../lib/errors.js";

const suspendSchema = z.object({
  suspend: z.boolean(),
});

export async function adminUsersRoutes(app: FastifyInstance) {
  // List boat owners
  app.get("/users", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const query = req.query as {
      search?: string;
      page?: string;
      limit?: string;
    };

    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { fullName: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          companyName: true,
          address: true,
          role: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { boats: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return { items, total, page, limit };
  });

  // Get single owner profile
  app.get("/users/:id", { onRequest: [app.requireAdminAuth] }, async (req) => {
    const { id } = req.params as { id: string };
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        companyName: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        boats: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");
    return { profile };
  });

  // Suspend / unsuspend a captain (toggle isVerified as suspension flag)
  app.patch("/users/:id/suspend", { onRequest: [app.requireSuperAdmin] }, async (req) => {
    const { id } = req.params as { id: string };
    const parsed = suspendSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, "Invalid input", "BAD_REQUEST");

    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) throw new HttpError(404, "User not found", "NOT_FOUND");

    const updated = await prisma.profile.update({
      where: { id },
      data: { isVerified: !parsed.data.suspend },
      select: { id: true, email: true, isVerified: true },
    });

    await createAuditLog({
      adminId: req.adminUser!.id,
      action: parsed.data.suspend ? "USER_SUSPENDED" : "USER_UNSUSPENDED",
      targetType: "Profile",
      targetId: id,
      metadata: { email: profile.email },
      ip: req.ip,
    });

    return { profile: updated };
  });
}
