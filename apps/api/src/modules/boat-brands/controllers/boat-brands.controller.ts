import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  BoatBrandCategory,
  BrandModelRequestStatus,
  type AdminCreateBrandInput,
  type AdminCreateModelInput,
  type CreateBrandModelRequestInput,
  adminCreateBrandSchema,
  adminCreateModelSchema,
  adminReviewRequestSchema,
  createBrandModelRequestSchema,
} from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/boat-brand.service.js";

function categoryQuery(req: FastifyRequest): BoatBrandCategory | undefined {
  const raw = (req.query as { category?: string }).category;
  if (!raw) return undefined;
  if (!Object.values(BoatBrandCategory).includes(raw as BoatBrandCategory)) {
    return undefined;
  }
  return raw as BoatBrandCategory;
}

/** Captain-facing brand catalog lookups. */
export async function captainBoatBrandRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  app.get("/boat-brands", async (req) => {
    const items = await service.listBrands(categoryQuery(req), true);
    return { items };
  });

  app.get("/boat-brands/:id/models", async (req) => {
    const { id } = req.params as { id: string };
    const items = await service.listModels(id, true);
    return { items };
  });

  app.post("/brand-model-requests", async (req, reply) => {
    const body = parseDetailed(
      createBrandModelRequestSchema,
      req.body
    ) as CreateBrandModelRequestInput;
    const item = await service.createBrandModelRequest(req.authUser!.id, body);
    return reply.code(201).send(item);
  });
}

/** Admin brand catalog + pending request moderation. */
export async function adminBoatBrandRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAdminAuth);

  app.get("/admin/boat-brands", async (req) => {
    const items = await service.listBrands(categoryQuery(req), false);
    return { items };
  });

  app.post("/admin/boat-brands", async (req, reply) => {
    const body = parseDetailed(adminCreateBrandSchema, req.body) as AdminCreateBrandInput;
    const item = await service.adminCreateBrand(body);
    return reply.code(201).send(item);
  });

  app.get("/admin/boat-brands/:id/models", async (req) => {
    const { id } = req.params as { id: string };
    const items = await service.listModels(id, false);
    return { items };
  });

  app.post("/admin/boat-models", async (req, reply) => {
    const body = parseDetailed(adminCreateModelSchema, req.body) as AdminCreateModelInput;
    const item = await service.adminCreateModel(body);
    return reply.code(201).send(item);
  });

  app.get("/admin/brand-model-requests", async (req) => {
    const statusRaw = (req.query as { status?: string }).status;
    const status =
      statusRaw && Object.values(BrandModelRequestStatus).includes(statusRaw as BrandModelRequestStatus)
        ? (statusRaw as BrandModelRequestStatus)
        : BrandModelRequestStatus.PENDING;
    const items = await service.listBrandModelRequests(status);
    return { items };
  });

  app.post("/admin/brand-model-requests/:id/approve", async (req) => {
    const { id } = req.params as { id: string };
    const body = parseDetailed(adminReviewRequestSchema, req.body ?? {});
    return service.approveBrandModelRequest(id, body.category);
  });

  app.post("/admin/brand-model-requests/:id/reject", async (req) => {
    const { id } = req.params as { id: string };
    return service.rejectBrandModelRequest(id);
  });
}
