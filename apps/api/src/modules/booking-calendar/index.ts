import type { FastifyInstance } from "fastify";
import { bookingCalendarRoutes } from "./booking-calendar.controller.js";

export async function bookingCalendarModule(app: FastifyInstance) {
  await app.register(bookingCalendarRoutes);
}
