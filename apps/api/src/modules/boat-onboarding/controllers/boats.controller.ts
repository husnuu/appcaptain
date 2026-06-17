import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  amenitiesSchema,
  boatTypeFeaturesSchema,
  descriptionRulesSchema,
  extraSchema,
  listingModelSchema,
  pricingSchema,
} from "@getyourboat/shared";
import { parseDetailed } from "../../../lib/validate.js";
import { loadBoatForReview, loadOwnedBoat } from "../authorization.js";
import * as service from "../services/onboarding.service.js";

const idParam = (req: FastifyRequest) => (req.params as { id: string }).id;

/**
 * Owner-facing boat onboarding endpoints. Thin controllers: authorize, validate,
 * delegate to the service, return its result. No business logic or DB access.
 */
export async function boatOnboardingRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  app.post("/boats", async (req, reply) => {
    const boat = await service.createDraft(req.authUser!.id);
    return reply.code(201).send(boat);
  });

  app.get("/boats/mine", async (req) => {
    const items = await service.listOwnerBoats(req.authUser!.id);
    return { items };
  });

  app.get("/boats/:id", async (req) => {
    await loadBoatForReview(idParam(req), req.authUser!);
    return service.getBoatState(idParam(req));
  });

  app.put("/boats/:id/listing-model", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    return service.updateListingModel(idParam(req), parseDetailed(listingModelSchema, req.body));
  });

  app.put("/boats/:id/boat-type-features", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    return service.updateBoatTypeFeatures(
      idParam(req),
      parseDetailed(boatTypeFeaturesSchema, req.body)
    );
  });

  app.put("/boats/:id/amenities", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    return service.updateAmenities(idParam(req), parseDetailed(amenitiesSchema, req.body));
  });

  app.put("/boats/:id/description-rules", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    return service.updateDescriptionRules(
      idParam(req),
      parseDetailed(descriptionRulesSchema, req.body)
    );
  });

  app.put("/boats/:id/pricing", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    return service.updatePricing(idParam(req), parseDetailed(pricingSchema, req.body));
  });

  app.post("/boats/:id/extras", async (req, reply) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const extra = await service.addExtra(idParam(req), parseDetailed(extraSchema, req.body));
    return reply.code(201).send(extra);
  });

  app.put("/boats/:id/extras/:extraId", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { extraId } = req.params as { extraId: string };
    return service.updateExtra(idParam(req), extraId, parseDetailed(extraSchema, req.body));
  });

  app.delete("/boats/:id/extras/:extraId", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    const { extraId } = req.params as { extraId: string };
    return service.deleteExtra(idParam(req), extraId);
  });

  app.post("/boats/:id/submit", async (req) => {
    await loadOwnedBoat(idParam(req), req.authUser!);
    return service.submitForReview(idParam(req));
  });
}
