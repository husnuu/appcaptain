import type { FastifyInstance } from "fastify";
import { adminAuthRoutes } from "./auth/admin-auth.controller.js";
import { adminBoatsRoutes } from "./boats/admin-boats.controller.js";
import { adminUsersRoutes } from "./users/admin-users.controller.js";
import { adminDashboardRoutes } from "./dashboard/admin-dashboard.controller.js";
import { adminReservationsRoutes } from "./reservations/admin-reservations.controller.js";
import { adminFinanceRoutes } from "./finance/admin-finance.controller.js";
import { adminNotificationsRoutes } from "./notifications/admin-notifications.controller.js";
import { adminSettingsRoutes } from "./settings/admin-settings.controller.js";
import { adminReviewsRoutes } from "./reviews/admin-reviews.controller.js";
import { adminAuditLogRoutes } from "./audit-log/admin-audit-log.controller.js";

export async function adminModule(app: FastifyInstance) {
  await app.register(adminAuthRoutes, { prefix: "/admin" });
  await app.register(adminDashboardRoutes, { prefix: "/admin" });
  await app.register(adminBoatsRoutes, { prefix: "/admin" });
  await app.register(adminUsersRoutes, { prefix: "/admin" });
  await app.register(adminReservationsRoutes, { prefix: "/admin" });
  await app.register(adminFinanceRoutes, { prefix: "/admin" });
  await app.register(adminNotificationsRoutes, { prefix: "/admin" });
  await app.register(adminSettingsRoutes, { prefix: "/admin" });
  await app.register(adminReviewsRoutes, { prefix: "/admin" });
  await app.register(adminAuditLogRoutes, { prefix: "/admin" });
}
