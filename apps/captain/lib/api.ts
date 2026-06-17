import { supabase } from "./supabase";
import type {
  BoatListItem,
  OnboardingConfig,
  SerializedBoat,
  UploadUrlResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const V1 = `${BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};
  // Only set a JSON content-type when we actually send a body; Fastify rejects
  // an empty body with `Content-Type: application/json` (FST_ERR_CTP_EMPTY_JSON_BODY).
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, await authHeader());

  const res = await fetch(`${V1}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data?.details);
  }
  return data as T;
}

export const api = {
  // ---- Public config (no auth) ----
  getConfig: () => request<OnboardingConfig>("/onboarding/config", { auth: false }),

  // ---- Owner boats ----
  myBoats: () => request<{ items: BoatListItem[] }>("/boats/mine"),
  getBoat: (id: string) => request<SerializedBoat>(`/boats/${id}`),
  createBoat: () => request<SerializedBoat>("/boats", { method: "POST" }),

  updateListingModel: (
    id: string,
    body: { listingModelKeys: string[]; approvalType: "INSTANT" | "MANUAL" }
  ) => request<SerializedBoat>(`/boats/${id}/listing-model`, { method: "PUT", body }),

  updateBoatTypeFeatures: (
    id: string,
    body: { boatTypeKey: string; features: { key: string; value?: string | null }[] }
  ) =>
    request<SerializedBoat>(`/boats/${id}/boat-type-features`, {
      method: "PUT",
      body,
    }),

  updateAmenities: (
    id: string,
    body: {
      amenities: {
        amenityKey: string;
        isIncluded?: boolean;
        isExtra?: boolean;
        extraPrice?: number | null;
        currency?: string | null;
      }[];
    }
  ) => request<SerializedBoat>(`/boats/${id}/amenities`, { method: "PUT", body }),

  updateDescriptionRules: (
    id: string,
    body: {
      title: string;
      description?: string;
      rulesText?: string | null;
      checkInNotes?: string | null;
      checkOutNotes?: string | null;
    }
  ) =>
    request<SerializedBoat>(`/boats/${id}/description-rules`, {
      method: "PUT",
      body,
    }),

  updatePricing: (
    id: string,
    body: { pricing: { listingModelKey: string; price: number; currency?: string }[] }
  ) => request<SerializedBoat>(`/boats/${id}/pricing`, { method: "PUT", body }),

  submit: (id: string) => request<SerializedBoat>(`/boats/${id}/submit`, { method: "POST" }),

  // ---- Photos ----
  photoUploadUrl: (id: string, fileName: string) =>
    request<UploadUrlResponse>(`/boats/${id}/photos/upload-url`, {
      method: "POST",
      body: { fileName },
    }),
  registerPhoto: (
    id: string,
    body: { storagePath: string; altText?: string | null; isCover?: boolean }
  ) => request(`/boats/${id}/photos`, { method: "POST", body }),
  setCover: (id: string, photoId: string) =>
    request(`/boats/${id}/photos/cover`, { method: "PATCH", body: { photoId } }),
  deletePhoto: (id: string, photoId: string) =>
    request(`/boats/${id}/photos/${photoId}`, { method: "DELETE" }),

  // ---- Documents ----
  documentUploadUrl: (id: string, documentTypeKey: string, fileName: string) =>
    request<UploadUrlResponse>(`/boats/${id}/documents/upload-url`, {
      method: "POST",
      body: { documentTypeKey, fileName },
    }),
  registerDocument: (
    id: string,
    body: { documentTypeKey: string; storagePath: string }
  ) => request(`/boats/${id}/documents`, { method: "POST", body }),
  deleteDocument: (id: string, documentId: string) =>
    request(`/boats/${id}/documents/${documentId}`, { method: "DELETE" }),
};

/**
 * Two-step upload: ask the API for a signed URL, then push the binary straight
 * to Supabase Storage using the returned token.
 */
export async function uploadToStorage(
  upload: UploadUrlResponse,
  file: File
): Promise<void> {
  const { error } = await supabase.storage
    .from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file);
  if (error) throw new ApiError(500, `Storage upload failed: ${error.message}`);
}
