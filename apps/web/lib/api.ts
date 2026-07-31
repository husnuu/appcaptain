import type {
  CreateBookingInput,
  ExperienceDTO,
  ExperienceListItemDTO,
  SerializedBoatDTO,
} from "@getyourboat/shared";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://appcaptain-api.vercel.app/api/v1";

export interface PublicBoatSummary {
  id: string;
  title: string | null;
  description: string | null;
  coverPhotoUrl: string | null;
  city: string | null;
  country: string | null;
  marina: string | null;
  boatType: { key: string; label: string } | null;
  listingModels: { key: string; label: string }[];
  pricing: { listingModelKey: string; price: number; currency: string }[];
  capacity: number | null;
  length: number | null;
  cabinCount: number | null;
  productionYear: number | null;
  amenities: { key: string; label: string }[];
  rating: number | null;
}

export interface PublicBoatListParams {
  city?: string;
  boatType?: string;
  listingModel?: string;
  limit?: number;
  offset?: number;
}

export interface PublicExperienceListParams {
  category?: string;
  limit?: number;
  offset?: number;
}

interface Paginated<T> {
  items: T[];
  total: number;
}

function toQueryString(params?: Record<string, string | number | undefined>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] !== undefined
  );
  if (entries.length === 0) return "";
  const qs = new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
  return `?${qs}`;
}

export async function fetchBoats(
  params?: PublicBoatListParams
): Promise<Paginated<PublicBoatSummary>> {
  const qs = toQueryString(params as Record<string, string | number | undefined> | undefined);
  const res = await fetch(`${BASE}/public/boats${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch boats");
  return res.json();
}

export async function fetchBoat(id: string): Promise<SerializedBoatDTO | null> {
  const res = await fetch(`${BASE}/public/boats/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchExperiences(
  params?: PublicExperienceListParams
): Promise<Paginated<ExperienceListItemDTO>> {
  const qs = toQueryString(params as Record<string, string | number | undefined> | undefined);
  const res = await fetch(`${BASE}/public/experiences${qs}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch experiences");
  return res.json();
}

export async function fetchExperience(id: string): Promise<ExperienceDTO | null> {
  const res = await fetch(`${BASE}/public/experiences/${id}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return res.json();
}

// --- Booking ---

export interface BlockedRange {
  startDate: string;
  endDate: string;
}

export async function fetchAvailability(boatId: string): Promise<BlockedRange[]> {
  const res = await fetch(`${BASE}/bookings/boat/${boatId}/availability`, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.blockedRanges ?? [];
}

export async function submitBooking(
  input: CreateBookingInput
): Promise<{ ok: boolean; bookingId?: string; error?: string }> {
  const res = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { ok: false, error: (err as { message?: string }).message ?? "Rezervasyon oluşturulamadı" };
  }
  const data = await res.json();
  return { ok: true, bookingId: (data.booking as { id: string }).id };
}
