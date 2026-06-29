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
    const { type, section, package: pkg, packages } = req.query as {
      type?: string;
      section?: string;
      package?: string;
      packages?: string;
    };
    const packageList = packages
      ? packages.split(",").map((p) => p.trim()).filter(Boolean)
      : undefined;
    return lookup.getFields({ type, section, package: pkg, packages: packageList });
  });

  app.get("/onboarding/config", async (req, reply) => {
    reply.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    const { listingModelKeys } = req.query as { listingModelKeys?: string };
    if (listingModelKeys) {
      const keys = listingModelKeys
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      if (keys.length > 0) return lookup.getResolvedConfig(keys);
    }
    return lookup.getConfig();
  });
}
