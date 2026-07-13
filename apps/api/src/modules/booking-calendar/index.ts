import type { FastifyInstance } from "fastify";
import {
  captainCalendarRoutes,
  publicCalendarRoutes,
} from "./controllers/calendar.controller.js";

export async function bookingCalendarModule(app: FastifyInstance) {
  await app.register(publicCalendarRoutes);
  await app.register(captainCalendarRoutes);
}
