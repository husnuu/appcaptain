import type { FastifyInstance } from "fastify";
import { adminDiscountRoutes } from "./controllers/discounts.controller.js";

export async function discountsModule(app: FastifyInstance) {
  await app.register(adminDiscountRoutes);
}
