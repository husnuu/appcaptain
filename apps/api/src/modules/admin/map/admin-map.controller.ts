import type { FastifyInstance } from "fastify";
import { prisma } from "@getyourboat/database";

const LOCATION_FEATURE_KEYS = ["city", "region", "country", "marina"] as const;

export async function adminMapRoutes(app: FastifyInstance) {
  // ── Active boats with coordinates + location metadata ────────────────
  app.get("/map/boats", { onRequest: [app.requireAdminAuth] }, async () => {
    const boats = await prisma.boat.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        boatTypeKey: true,
        latitude: true,
        longitude: true,
        owner: { select: { id: true, fullName: true, email: true } },
        featureValues: {
          where: { featureKey: { in: [...LOCATION_FEATURE_KEYS] } },
          select: { featureKey: true, value: true },
        },
        _count: { select: { reviews: true, bookings: true } },
      },
    });

    // Build location label from feature values
    const enriched = boats.map((b) => {
      const fvMap = Object.fromEntries(b.featureValues.map((f) => [f.featureKey, f.value]));
      const city = fvMap["city"] ?? fvMap["marina"] ?? fvMap["region"] ?? null;
      const country = fvMap["country"] ?? null;
      const locationLabel = [city, country].filter(Boolean).join(", ") || null;

      return {
        id: b.id,
        title: b.title,
        boatTypeKey: b.boatTypeKey,
        latitude: b.latitude,
        longitude: b.longitude,
        city,
        country,
        locationLabel,
        owner: b.owner,
        reviewCount: b._count.reviews,
        bookingCount: b._count.bookings,
      };
    });

    // Country distribution summary
    const countryMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    for (const b of enriched) {
      if (b.country) countryMap.set(b.country, (countryMap.get(b.country) ?? 0) + 1);
      if (b.city) cityMap.set(b.city, (cityMap.get(b.city) ?? 0) + 1);
    }

    const byCountry = [...countryMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count }));

    const byCity = [...cityMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([city, count]) => ({ city, count }));

    const withCoords = enriched.filter((b) => b.latitude !== null && b.longitude !== null);

    return {
      boats: enriched,
      total: enriched.length,
      withCoords: withCoords.length,
      byCountry,
      byCity,
    };
  });
}
