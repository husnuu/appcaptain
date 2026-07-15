import type { FastifyInstance } from "fastify";
import { adminAuthRoutes } from "./auth/admin-auth.controller.js";
import { adminBoatsRoutes } from "./boats/admin-boats.controller.js";
import { adminUsersRoutes } from "./users/admin-users.controller.js";

export async function adminModule(app: FastifyInstance) {
  await app.register(adminAuthRoutes, { prefix: "/admin" });
  await app.register(adminBoatsRoutes, { prefix: "/admin" });
  await app.register(adminUsersRoutes, { prefix: "/admin" });
}
