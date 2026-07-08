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

/** Admin discount management. Guarded by `requireAdmin` (profile.role === ADMIN). */
export async function adminDiscountRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAdmin);

  app.get("/admin/discounts", async (req) => {
    return service.listDiscounts(listQuery(req));
  });

  app.get("/admin/discounts/boat-options", async (req) => {
    const items = await service.listBoatOptions(searchQuery(req));
    return { items };
  });

  app.get("/admin/discounts/experience-options", async (req) => {
    const items = await service.listExperienceOptions(searchQuery(req));
    return { items };
  });

  app.get("/admin/discounts/:id", async (req) => {
    const discount = await service.getDiscount(idParam(req));
    return { discount };
  });

  app.post("/admin/discounts", async (req, reply) => {
    const body = parseDetailed(createDiscountSchema, req.body) as CreateDiscountInput;
    const discount = await service.createDiscount(body, req.authUser!.id);
    return reply.code(201).send({ discount });
  });

  app.patch("/admin/discounts/:id", async (req) => {
    const body = parseDetailed(updateDiscountSchema, req.body) as UpdateDiscountInput;
    const discount = await service.updateDiscount(idParam(req), body);
    return { discount };
  });

  app.patch("/admin/discounts/:id/toggle", async (req) => {
    const discount = await service.toggleDiscount(idParam(req));
    return { discount };
  });

  app.delete("/admin/discounts/:id", async (req) => {
    await service.deleteDiscount(idParam(req));
    return { success: true };
  });
}
