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
const mockId = (req: FastifyRequest) => (req.params as { id: string }).id;

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
    const diffDays =
      (new Date(`${query.rangeEnd}T00:00:00Z`).getTime() -
        new Date(`${query.rangeStart}T00:00:00Z`).getTime()) /
      86_400_000;
    if (diffDays > 62) {
      throw badRequest("Range cannot exceed 62 days");
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
      const rawBody =
        req.body !== null && typeof req.body === "object"
          ? (req.body as Record<string, unknown>)
          : {};
      const body = parseDetailed(createBlockSchema, {
        ...rawBody,
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

  // ------------------------------------------------------------------
  // GET /boats/:boatId/calendar/mock-reservations  — captain/admin only
  // ------------------------------------------------------------------
  app.get(
    "/boats/:boatId/calendar/mock-reservations",
    { onRequest: [app.requireAuth] },
    async (req) => {
      return service.listMockReservations(boatId(req), req.authUser!);
    },
  );

  // ------------------------------------------------------------------
  // POST /boats/:boatId/calendar/mock-reservations  — captain/admin only
  // ------------------------------------------------------------------
  app.post(
    "/boats/:boatId/calendar/mock-reservations",
    { onRequest: [app.requireAuth] },
    async (req, reply) => {
      const rawBody =
        req.body !== null && typeof req.body === "object"
          ? (req.body as Record<string, unknown>)
          : {};
      const model = rawBody["model"];
      if (
        typeof model !== "string" ||
        !Object.values(BookingModel).includes(model as BookingModel)
      ) {
        throw badRequest("model is required and must be a valid BookingModel");
      }
      const res = await service.createMockReservation(
        boatId(req),
        rawBody as { model: BookingModel; startDate: string; endDate: string; guestName: string; note?: string },
        req.authUser!,
      );
      return reply.code(201).send(res);
    },
  );

  // ------------------------------------------------------------------
  // DELETE /calendar/mock-reservations/:id  — captain/admin only
  // ------------------------------------------------------------------
  app.delete(
    "/calendar/mock-reservations/:id",
    { onRequest: [app.requireAuth] },
    async (req, reply) => {
      await service.deleteMockReservation(mockId(req), req.authUser!);
      return reply.code(204).send();
    },
  );
}
