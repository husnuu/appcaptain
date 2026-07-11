import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  BookingStatus,
  type BookingListQuery,
  type CreateBookingInput,
  approveBookingSchema,
  createBookingSchema,
  rejectBookingSchema,
} from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import * as service from "../services/booking.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;

function listQuery(req: FastifyRequest): BookingListQuery {
  const q = req.query as { status?: string; page?: string; limit?: string };
  const status =
    q.status && Object.values(BookingStatus).includes(q.status as BookingStatus)
      ? (q.status as BookingStatus)
      : undefined;
  return {
    status,
    page: q.page ? Number(q.page) : undefined,
    limit: q.limit ? Number(q.limit) : undefined,
  };
}

/** Public endpoints — no authentication required (guest booking requests). */
export async function publicBookingRoutes(app: FastifyInstance) {
  app.post("/bookings", async (req, reply) => {
    const body = parseDetailed(createBookingSchema, req.body) as CreateBookingInput;
    const booking = await service.createBooking(body);
    return reply.code(201).send({ booking });
  });

  app.get("/bookings/boat/:boatId/availability", async (req) => {
    const boatId = (req.params as { boatId: string }).boatId;
    const blockedRanges = await service.getAvailability(boatId);
    return { blockedRanges };
  });
}

/** Captain endpoints — require auth; scoped to the captain's own boats. */
export async function captainBookingRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  app.get("/bookings/captain", async (req) => {
    return service.listCaptainBookings(req.authUser!.id, listQuery(req));
  });

  app.patch("/bookings/:id/approve", async (req) => {
    const { totalPrice } = parseDetailed(approveBookingSchema, req.body ?? {});
    const booking = await service.approveBooking(
      idParam(req),
      req.authUser!.id,
      totalPrice
    );
    return { booking };
  });

  app.patch("/bookings/:id/reject", async (req) => {
    const { rejectionNote } = parseDetailed(rejectBookingSchema, req.body ?? {});
    const booking = await service.rejectBooking(
      idParam(req),
      req.authUser!.id,
      rejectionNote
    );
    return { booking };
  });
}
