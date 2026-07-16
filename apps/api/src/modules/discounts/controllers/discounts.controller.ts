import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  DiscountTarget,
  type CreateDiscountInput,
  type DiscountListQuery,
  type UpdateDiscountInput,
  createDiscountSchema,
  updateDiscountSchema,
} from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/discount.service.js";
import type { DiscountActor } from "../services/discount.service.js";
import { verifyAdminToken, ADMIN_TOKEN_COOKIE } from "../../../plugins/admin-auth.js";

function listQuery(req: FastifyRequest): DiscountListQuery {
  const q = req.query as {
    target?: string;
    isActive?: string;
    page?: string;
    limit?: string;
  };
  const target =
    q.target && Object.values(DiscountTarget).includes(q.target as DiscountTarget)
      ? (q.target as DiscountTarget)
      : undefined;
  return {
    target,
    isActive:
      q.isActive === undefined ? undefined : q.isActive === "true",
    page: q.page ? Number(q.page) : undefined,
    limit: q.limit ? Number(q.limit) : undefined,
  };
}

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;
const searchQuery = (req: FastifyRequest) =>
  (req.query as { search?: string }).search?.trim() || undefined;

const actorOf = (req: FastifyRequest): DiscountActor => {
  if (req.adminUser) return { userId: req.adminUser.id, isAdmin: true };
  return { userId: req.authUser!.id, isAdmin: req.authUser!.role === "ADMIN" };
};

/**
 * Discount management. Any authenticated captain manages their own discounts
 * (scoped to their boats/experiences); admins manage everything platform-wide.
 * Paths stay under `/admin` for API compatibility with the admin panel.
 */
export async function adminDiscountRoutes(app: FastifyInstance) {
  // Accept either admin JWT (httpOnly cookie from admin panel) or captain JWT (Bearer header).
  app.addHook("onRequest", async (req, reply) => {
    const cookieToken = req.cookies?.[ADMIN_TOKEN_COOKIE] ?? null;
    if (cookieToken) {
      const adminUser = await verifyAdminToken(cookieToken);
      if (adminUser) { req.adminUser = adminUser; return; }
      // Cookie present but invalid — reject rather than falling through to captain auth
      return reply.code(401).send({ message: "Unauthorized" });
    }
    // No admin cookie — try captain Bearer token
    await app.requireAuth(req, reply);
  });

  app.get("/admin/discounts", async (req) => {
    return service.listDiscounts(listQuery(req), actorOf(req));
  });

  app.get("/admin/discounts/boat-options", async (req) => {
    const items = await service.listBoatOptions(actorOf(req), searchQuery(req));
    return { items };
  });

  app.get("/admin/discounts/experience-options", async (req) => {
    const items = await service.listExperienceOptions(actorOf(req), searchQuery(req));
    return { items };
  });

  app.get("/admin/discounts/:id", async (req) => {
    const discount = await service.getDiscount(idParam(req), actorOf(req));
    return { discount };
  });

  app.post("/admin/discounts", async (req, reply) => {
    const body = parseDetailed(createDiscountSchema, req.body) as CreateDiscountInput;
    const discount = await service.createDiscount(body, actorOf(req));
    return reply.code(201).send({ discount });
  });

  app.patch("/admin/discounts/:id", async (req) => {
    const body = parseDetailed(updateDiscountSchema, req.body) as UpdateDiscountInput;
    const discount = await service.updateDiscount(idParam(req), body, actorOf(req));
    return { discount };
  });

  app.patch("/admin/discounts/:id/toggle", async (req) => {
    const discount = await service.toggleDiscount(idParam(req), actorOf(req));
    return { discount };
  });

  app.delete("/admin/discounts/:id", async (req) => {
    await service.deleteDiscount(idParam(req), actorOf(req));
    return { success: true };
  });
}
