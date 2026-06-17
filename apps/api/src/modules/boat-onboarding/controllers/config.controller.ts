import type { FastifyInstance } from "fastify";
import { onboardingLookupRepository as lookup } from "@getyourboat/database";

/**
 * Read-only onboarding configuration, served from the seeded lookup tables via
 * the lookup repository. The wizard consumes these to render each step. Public.
 */
export async function onboardingConfigRoutes(app: FastifyInstance) {
  app.get("/onboarding/boat-types", () => lookup.getBoatTypes());
  app.get("/onboarding/listing-models", () => lookup.getListingModels());
  app.get("/onboarding/feature-groups", () => lookup.getFeatureGroups());
  app.get("/onboarding/amenities", () => lookup.getAmenityCategories());
  app.get("/onboarding/document-types", () => lookup.getDocumentTypes());

  app.get("/onboarding/fields", (req) => {
    const { type, section, package: pkg } = req.query as {
      type?: string;
      section?: string;
      package?: string;
    };
    return lookup.getFields({ type, section, package: pkg });
  });

  app.get("/onboarding/config", () => lookup.getConfig());
}
