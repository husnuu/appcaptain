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

/**
 * GET a public endpoint without ever throwing — a stale/unreachable API
 * deploy shouldn't crash a whole page. Logs server-side so failures are
 * still visible, but callers always get a safe fallback value.
 */
async function safeGet<T>(path: string, revalidate: number, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
    if (!res.ok) {
      console.error(`GET ${path} failed: ${res.status} ${res.statusText}`);
      return fallback;
    }
    return await res.json();
  } catch (err) {
    console.error(`GET ${path} threw:`, err);
    return fallback;
  }
}

export async function fetchBoats(
  params?: PublicBoatListParams
): Promise<Paginated<PublicBoatSummary>> {
  const qs = toQueryString(params as Record<string, string | number | undefined> | undefined);
  return safeGet(`/public/boats${qs}`, 60, { items: [], total: 0 });
}

export async function fetchBoat(id: string): Promise<SerializedBoatDTO | null> {
  return safeGet(`/public/boats/${id}`, 60, null);
}

export async function fetchExperiences(
  params?: PublicExperienceListParams
): Promise<Paginated<ExperienceListItemDTO>> {
  const qs = toQueryString(params as Record<string, string | number | undefined> | undefined);
  return safeGet(`/public/experiences${qs}`, 60, { items: [], total: 0 });
}

export async function fetchExperience(id: string): Promise<ExperienceDTO | null> {
  return safeGet(`/public/experiences/${id}`, 60, null);
}

export interface PublicLocation {
  city: string;
  boatCount: number;
}

export async function fetchLocations(): Promise<PublicLocation[]> {
  return safeGet("/public/locations", 300, []);
}

// --- Booking ---

export interface BlockedRange {
  startDate: string;
  endDate: string;
}

export async function fetchAvailability(boatId: string): Promise<BlockedRange[]> {
  const data = await safeGet<{ blockedRanges?: BlockedRange[] }>(
    `/bookings/boat/${boatId}/availability`,
    0,
    {}
  );
  return data.blockedRanges ?? [];
}

export async function submitBooking(input: CreateBookingInput): Promise<{ bookingId: string }> {
  const res = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Rezervasyon oluşturulamadı");
  }
  const data = await res.json();
  return { bookingId: (data.booking as { id: string }).id };
}
