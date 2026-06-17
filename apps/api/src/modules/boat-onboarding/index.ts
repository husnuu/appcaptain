import type { FastifyInstance } from "fastify";
import { boatAdminRoutes } from "./controllers/admin.controller.js";
import { boatOnboardingRoutes } from "./controllers/boats.controller.js";
import { onboardingConfigRoutes } from "./controllers/config.controller.js";
import { boatMediaRoutes } from "./controllers/media.controller.js";

/** Registers the full boat-onboarding module under the given prefix. */
export async function boatOnboardingModule(app: FastifyInstance) {
  await app.register(onboardingConfigRoutes);
  await app.register(boatOnboardingRoutes);
  await app.register(boatMediaRoutes);
  await app.register(boatAdminRoutes);
}
