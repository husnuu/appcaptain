import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  createBlockSchema,
  getAvailabilitySchema,
  updateBlockSchema,
} from "@getyourboat/shared";
import { parseDetailed } from "../../lib/validate.js";
import { loadBoatForCalendar } from "./authorization.js";
import * as service from "./booking-calendar.service.js";
import { BookingModel } from "@getyourboat/shared";
import { badRequest } from "../../lib/errors.js";

const boatId = (req: FastifyRequest) => (req.params as { boatId: string }).boatId;
const blockId = (req: FastifyRequest) => (req.params as { id: string }).id;

export async function bookingCalendarRoutes(app: FastifyInstance) {
  // ------------------------------------------------------------------
  // GET /boats/:boatId/calendar/availability  — public
  // ------------------------------------------------------------------
  app.get("/boats/:boatId/calendar/availability", async (req) => {
    const bid = boatId(req);
    const query = parseDetailed(getAvailabilitySchema, req.query);

    if (query.rangeStart > query.rangeEnd) {
      throw badRequest("rangeStart must be on or before rangeEnd");
    }

    return service.computeAvailability(bid, query.model as BookingModel, query.rangeStart, query.rangeEnd);
  });

  // ------------------------------------------------------------------
  // GET /boats/:boatId/calendar/blocks  — captain/admin only
  // ------------------------------------------------------------------
  app.get(
    "/boats/:boatId/calendar/blocks",
    { onRequest: [app.requireAuth] },
    async (req) => {
      await loadBoatForCalendar(boatId(req), req.authUser!);
      return service.listBlocks(boatId(req));
    },
  );

  // ------------------------------------------------------------------
  // POST /boats/:boatId/calendar/blocks  — captain/admin only
  // ------------------------------------------------------------------
  app.post(
    "/boats/:boatId/calendar/blocks",
    { onRequest: [app.requireAuth] },
    async (req, reply) => {
      await loadBoatForCalendar(boatId(req), req.authUser!);
      const body = parseDetailed(createBlockSchema, {
        ...(req.body as object),
        boatId: boatId(req),
      });
      const block = await service.createBlock(body, req.authUser!);
      return reply.code(201).send(block);
    },
  );

  // ------------------------------------------------------------------
  // PATCH /calendar/blocks/:id  — captain/admin only
  // ------------------------------------------------------------------
  app.patch(
    "/calendar/blocks/:id",
    { onRequest: [app.requireAuth] },
    async (req) => {
      const body = parseDetailed(updateBlockSchema, req.body);
      return service.updateBlock(blockId(req), body, req.authUser!);
    },
  );

  // ------------------------------------------------------------------
  // DELETE /calendar/blocks/:id  — captain/admin only
  // ------------------------------------------------------------------
  app.delete(
    "/calendar/blocks/:id",
    { onRequest: [app.requireAuth] },
    async (req, reply) => {
      await service.deleteBlock(blockId(req), req.authUser!);
      return reply.code(204).send();
    },
  );
}
