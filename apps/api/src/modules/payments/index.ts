import type { FastifyInstance } from "fastify";
import {
  adminPaymentRoutes,
  captainPaymentRoutes,
} from "./controllers/payment.controller.js";

export async function paymentsModule(app: FastifyInstance) {
  await app.register(captainPaymentRoutes);
  await app.register(adminPaymentRoutes);
}
