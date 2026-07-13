import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  createBlockSchema,
  priceOverrideSchema,
  type CreateBlockInput,
  type SetPriceOverrideInput,
} from "@getyourboat/shared";
import { badRequest } from "../../../lib/errors.js";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/calendar.service.js";

const boatIdParam = (req: FastifyRequest) =>
  (req.params as { boatId: string }).boatId;
const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;

/** Public — customer + preview pages read availability without auth. */
export async function publicCalendarRoutes(app: FastifyInstance) {
  app.get("/boats/:boatId/calendar/availability", async (req) => {
    const boatId = boatIdParam(req);
    const { rangeStart, rangeEnd, model } = req.query as {
      rangeStart?: string;
      rangeEnd?: string;
      model?: string;
    };
    if (!rangeStart || !rangeEnd || !model) {
      throw badRequest("rangeStart, rangeEnd ve model zorunludur.");
    }
    return service.computeAvailability(boatId, model, rangeStart, rangeEnd);
  });
}

/** Captain/admin — manage blocks and price overrides on owned boats. */
export async function captainCalendarRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  app.post("/boats/:boatId/calendar/blocks", async (req, reply) => {
    const body = parseDetailed(createBlockSchema, {
      ...(req.body as object),
      boatId: boatIdParam(req),
    }) as CreateBlockInput;
    const isAdmin = req.authUser!.role === "ADMIN";
    const block = await service.createBlock(body, req.authUser!.id, isAdmin);
    return reply.code(201).send({ block });
  });

  app.delete("/calendar/blocks/:id", async (req, reply) => {
    const isAdmin = req.authUser!.role === "ADMIN";
    await service.deleteBlock(idParam(req), req.authUser!.id, isAdmin);
    return reply.code(204).send();
  });

  app.get("/boats/:boatId/calendar/blocks", async (req) => {
    const q = req.query as { page?: string; limit?: string };
    const isAdmin = req.authUser!.role === "ADMIN";
    const blocks = await service.listBlocks(
      boatIdParam(req),
      q.page ? Number(q.page) : 1,
      q.limit ? Number(q.limit) : 50,
      req.authUser!.id,
      isAdmin
    );
    return { blocks };
  });

  app.post("/boats/:boatId/calendar/price-override", async (req) => {
    const body = parseDetailed(priceOverrideSchema, {
      ...(req.body as object),
      boatId: boatIdParam(req),
    }) as SetPriceOverrideInput;
    const isAdmin = req.authUser!.role === "ADMIN";
    const override = await service.setPriceOverride(
      body,
      req.authUser!.id,
      isAdmin
    );
    return { override };
  });
}
