import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/", async () => ({ status: "ok", service: "getyourboat-api" }));
  app.get("/health", async () => ({ status: "ok", uptime: process.uptime() }));
}
