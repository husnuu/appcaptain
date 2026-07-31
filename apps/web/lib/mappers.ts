import type { PublicBoatSummary } from "./api";
import type { Boat } from "../components/marketplace/BoatCard";
import type { ExperienceCategory, ExperienceListItemDTO } from "@getyourboat/shared";
import type { Experience } from "../components/marketplace/ExperienceCard";

export function publicBoatToCard(b: PublicBoatSummary): Boat {
  const lowestPrice = b.pricing.reduce(
    (min, p) => (p.price < min ? p.price : min),
    b.pricing[0]?.price ?? 0
  );

  const tags: Boat["tags"] = [];
  if (b.listingModels.some((m) => m.key === "bareboat"))
    tags.push({ icon: "⛵", label: "Bareboat" });
  if (b.listingModels.some((m) => m.key === "captain_included"))
    tags.push({ icon: "⛵", label: "Kaptan sunulur" });
  if (b.amenities.some((a) => a.key === "fuel_included"))
    tags.push({ icon: "⛽", label: "Yakıt dahil" });

  return {
    id: b.id,
    slug: b.id, // use ID as slug for routing
    images: b.coverPhotoUrl ? [b.coverPhotoUrl] : [],
    name: b.title ?? "İsimsiz tekne",
    year: b.productionYear ?? 0,
    location: [b.city, b.country].filter(Boolean).join(", ") || "Konum belirtilmemiş",
    rating: b.rating ?? 0,
    reviewCount: 0,
    badges: [],
    tags,
    specs: {
      accommodation: b.capacity ?? 0,
      cabins: b.cabinCount ?? 0,
      sailing: b.capacity ?? 0,
      length: b.length ?? 0,
      wc: 0,
    },
    pricePerNight: lowestPrice,
  };
}

const EXPERIENCE_CATEGORY_LABELS: Record<ExperienceCategory, string> = {
  BOAT_TOUR: "Tekne Turu",
  WATER_SPORTS: "Su Sporları",
  FISHING: "Balık Tutma",
  DIVING_SNORKELING: "Dalış & Şnorkel",
  SUNSET_CRUISE: "Gün Batımı Turu",
  PRIVATE_CHARTER_EXPERIENCE: "Özel Kiralama",
  WORKSHOP_CLASS: "Atölye & Ders",
  OTHER: "Diğer",
};

export function experienceCategoryLabel(category: ExperienceCategory | null): string {
  return category ? EXPERIENCE_CATEGORY_LABELS[category] : "Diğer";
}

export const EXPERIENCE_CATEGORIES: string[] = [
  "Tümü",
  ...Object.values(EXPERIENCE_CATEGORY_LABELS),
];

/**
 * Loosened source type so this mapper works for both the list DTO
 * (GET /public/experiences) and the full detail DTO (GET /public/experiences/:id) —
 * it only ever reads the fields below, which both shapes share.
 */
type ExperienceCardSource = Pick<
  ExperienceListItemDTO,
  "id" | "coverPhotoUrl" | "category" | "title" | "durationMinutes" | "basePrice"
>;

export function experienceToCard(e: ExperienceCardSource): Experience {
  return {
    id: e.id,
    slug: e.id,
    images: e.coverPhotoUrl ? [e.coverPhotoUrl] : [],
    category: experienceCategoryLabel(e.category),
    title: e.title,
    location: "",
    duration: `${Math.round(e.durationMinutes / 60)} saat`,
    rating: 0,
    reviewCount: 0,
    startingPrice: e.basePrice,
  };
}
