import type { FastifyInstance } from "fastify";
import { healthRoutes } from "./health.js";
import { authRoutes } from "./auth.js";
import { boatOnboardingModule } from "../modules/boat-onboarding/index.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/api/v1" });
  await app.register(boatOnboardingModule, { prefix: "/api/v1" });
  // TODO: reservations, payments, messaging (ws), reviews, payouts
}
