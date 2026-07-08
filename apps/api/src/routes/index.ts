import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { captainAuthModule } from "../modules/auth-captain/index.js";
import { boatOnboardingModule } from "../modules/boat-onboarding/index.js";
import { profileModule } from "../modules/profile/index.js";
import { messagingModule } from "../modules/messaging/index.js";
import { experiencesModule } from "../modules/experiences/index.js";
import { boatBrandsModule } from "../modules/boat-brands/index.js";
import { discountsModule } from "../modules/discounts/index.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(captainAuthModule, { prefix: "/api/v1" });
  await app.register(profileModule, { prefix: "/api/v1" });
  await app.register(boatOnboardingModule, { prefix: "/api/v1" });
  await app.register(messagingModule, { prefix: "/api/v1" });
  await app.register(experiencesModule, { prefix: "/api/v1" });
  await app.register(boatBrandsModule, { prefix: "/api/v1" });
  await app.register(discountsModule, { prefix: "/api/v1" });
  // TODO: reservations, payments, reviews, payouts
}
