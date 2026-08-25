import type { FastifyInstance } from "fastify";
import {
  captainBookingRoutes,
  customerBookingRoutes,
  publicBookingRoutes,
} from "./controllers/bookings.controller.js";

export async function bookingsModule(app: FastifyInstance) {
  await app.register(publicBookingRoutes);
  await app.register(captainBookingRoutes);
  await app.register(customerBookingRoutes);
}
