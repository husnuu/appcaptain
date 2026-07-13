import type { FastifyInstance } from "fastify";
import { guestMessagingRoutes } from "./controllers/guest-messaging.controller.js";

export async function guestMessagingModule(app: FastifyInstance) {
  await app.register(guestMessagingRoutes);
}
