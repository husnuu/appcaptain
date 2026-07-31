import { prisma, boatRepository, experienceRepository, toExperienceListItem, type Prisma } from "@getyourboat/database";

/**
 * Public (unauthenticated) read models. These intentionally re-shape data for
 * anonymous consumption — never return raw internal DTOs (documents,
 * rejectionReason, owner info, etc.) from the list endpoints.
 */

const BOAT_LIST_FEATURE_KEYS = [
  "city",
  "country",
  "marina",
  "capacity",
  "length_ft_m",
  "year_of_manufacture",
  "number_of_cabins_for_customer_without_crew",
] as const;

type FeatureValueRow = { featureKey: string; value: string | null };

function textFeature(features: FeatureValueRow[], key: string): string | null {
  return features.find((f) => f.featureKey === key)?.value ?? null;
}

function numericFeature(features: FeatureValueRow[], key: string): number | null {
  const raw = textFeature(features, key);
  if (raw == null || raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export interface PublicBoatListQuery {
  city?: string;
  boatType?: string;
  listingModel?: string;
  limit?: number;
  offset?: number;
}

export async function listPublicBoats(query: PublicBoatListQuery) {
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const offset = Math.max(0, query.offset ?? 0);

  const where: Prisma.BoatWhereInput = { status: "ACTIVE" };
  if (query.boatType) where.boatTypeKey = query.boatType;
  if (query.listingModel) {
    where.listingModels = { some: { listingModelKey: query.listingModel } };
  }
  if (query.city) {
    where.featureValues = {
      some: { featureKey: "city", value: { contains: query.city, mode: "insensitive" } },
    };
  }

  const [rows, total] = await Promise.all([
    prisma.boat.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        boatType: { select: { key: true, label: true } },
        listingModels: { select: { listingModel: { select: { key: true, label: true } } } },
        pricing: { select: { listingModelKey: true, price: true, currency: true } },
        photos: { where: { isCover: true }, take: 1, select: { publicUrl: true } },
        featureValues: {
          where: { featureKey: { in: [...BOAT_LIST_FEATURE_KEYS] } },
          select: { featureKey: true, value: true },
        },
        amenities: {
          where: { isIncluded: true },
          select: { amenity: { select: { key: true, label: true } } },
        },
      },
    }),
    prisma.boat.count({ where }),
  ]);

  const items = rows.map((boat) => ({
    id: boat.id,
    title: boat.title,
    description: boat.description,
    coverPhotoUrl: boat.photos[0]?.publicUrl ?? null,
    city: textFeature(boat.featureValues, "city"),
    country: textFeature(boat.featureValues, "country"),
    marina: textFeature(boat.featureValues, "marina"),
    boatType: boat.boatType ? { key: boat.boatType.key, label: boat.boatType.label } : null,
    listingModels: boat.listingModels.map((l) => ({ key: l.listingModel.key, label: l.listingModel.label })),
    pricing: boat.pricing.map((p) => ({
      listingModelKey: p.listingModelKey,
      price: Number(p.price),
      currency: p.currency,
    })),
    capacity: numericFeature(boat.featureValues, "capacity"),
    length: numericFeature(boat.featureValues, "length_ft_m"),
    cabinCount: numericFeature(boat.featureValues, "number_of_cabins_for_customer_without_crew"),
    productionYear: numericFeature(boat.featureValues, "year_of_manufacture"),
    amenities: boat.amenities.map((a) => ({ key: a.amenity.key, label: a.amenity.label })),
    rating: null as number | null,
  }));

  return { items, total };
}

export async function getPublicBoat(id: string) {
  const boat = await boatRepository.getState(id);
  if (!boat || boat.status !== "ACTIVE") return null;
  return boat;
}

export interface PublicExperienceListQuery {
  category?: string;
  limit?: number;
  offset?: number;
}

export async function listPublicExperiences(query: PublicExperienceListQuery) {
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const offset = Math.max(0, query.offset ?? 0);

  const where: Prisma.ExperienceWhereInput = { status: "ACTIVE" };
  if (query.category) where.category = query.category as Prisma.EnumExperienceCategoryNullableFilter["equals"];

  const [rows, total] = await Promise.all([
    prisma.experience.findMany({ where, skip: offset, take: limit, orderBy: { updatedAt: "desc" } }),
    prisma.experience.count({ where }),
  ]);

  return { items: rows.map(toExperienceListItem), total };
}

export async function getPublicExperience(id: string) {
  const experience = await experienceRepository.getById(id);
  if (!experience || experience.status !== "ACTIVE") return null;
  return experience;
}
