import type { FastifyInstance } from "fastify";
import { publicRoutes } from "./public.controller.js";

export async function publicModule(app: FastifyInstance) {
  await app.register(publicRoutes, { prefix: "/public" });
}
