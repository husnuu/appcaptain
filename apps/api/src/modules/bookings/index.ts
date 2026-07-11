import type { FastifyInstance } from "fastify";
import {
  captainBookingRoutes,
  publicBookingRoutes,
} from "./controllers/bookings.controller.js";

export async function bookingsModule(app: FastifyInstance) {
  await app.register(publicBookingRoutes);
  await app.register(captainBookingRoutes);
}
