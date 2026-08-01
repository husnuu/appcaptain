import type { FastifyInstance } from "fastify";
import { HttpError } from "../../lib/errors.js";
import * as service from "./services/public.service.js";

/**
 * Public (unauthenticated) marketplace endpoints — consumed by apps/web.
 * No auth hooks here on purpose: this plugin must be reachable without any
 * Authorization header or cookie. Only ACTIVE boats/experiences are exposed.
 */
export async function publicRoutes(app: FastifyInstance) {
  app.get("/boats", async (req) => {
    const q = req.query as {
      city?: string;
      boatType?: string;
      listingModel?: string;
      limit?: string;
      offset?: string;
    };
    return service.listPublicBoats({
      city: q.city,
      boatType: q.boatType,
      listingModel: q.listingModel,
      limit: q.limit !== undefined ? Number(q.limit) : undefined,
      offset: q.offset !== undefined ? Number(q.offset) : undefined,
    });
  });

  app.get("/locations", async () => {
    return service.listPublicLocations();
  });

  app.get("/boats/:id", async (req) => {
    const { id } = req.params as { id: string };
    const boat = await service.getPublicBoat(id);
    if (!boat) throw new HttpError(404, "Boat not found", "NOT_FOUND");
    return boat;
  });

  app.get("/experiences", async (req) => {
    const q = req.query as { category?: string; limit?: string; offset?: string };
    return service.listPublicExperiences({
      category: q.category,
      limit: q.limit !== undefined ? Number(q.limit) : undefined,
      offset: q.offset !== undefined ? Number(q.offset) : undefined,
    });
  });

  app.get("/experiences/:id", async (req) => {
    const { id } = req.params as { id: string };
    const experience = await service.getPublicExperience(id);
    if (!experience) throw new HttpError(404, "Experience not found", "NOT_FOUND");
    return experience;
  });
}
