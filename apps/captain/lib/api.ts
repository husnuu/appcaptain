import { getAccessToken } from "./auth/token-store";
import { refreshSession } from "./auth/client";
import { notifySessionExpired } from "./auth/session-events";
import { supabase } from "./supabase";
import { boatTypeToBrandCategory } from "@getyourboat/shared";
import type {
  BoatListItem,
  OnboardingConfig,
  ResolvedOnboardingConfig,
  SerializedBoat,
  UploadUrlResponse,
} from "./types";

import type { ValidationFieldError } from "@getyourboat/shared";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const V1 = `${BASE}/api/v1`;

export class ApiError extends Error {
  status: number;
  code?: string;
  fields?: ValidationFieldError[];
  details?: unknown;
  constructor(
    status: number,
    message: string,
    opts?: { code?: string; fields?: ValidationFieldError[]; details?: unknown }
  ) {
    super(message);
    this.status = status;
    this.code = opts?.code;
    this.fields = opts?.fields;
    this.details = opts?.details;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; retry?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true, retry = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) Object.assign(headers, await authHeader());

  const res = await fetch(`${V1}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (res.status === 401 && auth && retry) {
    const hadToken = !!getAccessToken();
    if (hadToken) {
      const refreshed = await refreshSession();
      if (refreshed) {
        return request<T>(path, { ...options, retry: false });
      }
      notifySessionExpired();
      throw new ApiError(401, "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.", {
        code: "SESSION_EXPIRED",
      });
    }
    throw new ApiError(401, "Bu işlem için giriş yapmanız gerekiyor.", {
      code: "UNAUTHORIZED",
    });
  }

  if (res.status === 401 && auth) {
    throw new ApiError(401, "Bu işlem için giriş yapmanız gerekiyor.", {
      code: "UNAUTHORIZED",
    });
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `Request failed (${res.status})`;
    const fields = Array.isArray(data?.fields)
      ? (data.fields as ValidationFieldError[])
      : undefined;
    throw new ApiError(res.status, message, {
      code: data?.code,
      fields,
      details: data?.details,
    });
  }
  return data as T;
}

export const api = {
  // ---- Public config (no auth) ----
  getConfig: (listingModelKeys?: string[]) => {
    const qs =
      listingModelKeys && listingModelKeys.length > 0
        ? `?listingModelKeys=${encodeURIComponent(listingModelKeys.join(","))}`
        : "";
    return request<OnboardingConfig | ResolvedOnboardingConfig>(
      `/onboarding/config${qs}`,
      { auth: false }
    );
  },

  // ---- Owner boats ----
  myBoats: () => request<{ items: BoatListItem[] }>("/boats/mine"),
  getBoat: (id: string) => request<SerializedBoat>(`/boats/${id}`),
  createBoat: () => request<SerializedBoat>("/boats", { method: "POST" }),

  updateListingModel: (
    id: string,
    body: { listingModelKeys: string[]; approvalType: "INSTANT" | "MANUAL" }
  ) => request<SerializedBoat>(`/boats/${id}/listing-model`, { method: "PUT", body }),

  patchBoatDraft: (
    id: string,
    body: { step: import("@getyourboat/shared").OnboardingStep; data: Record<string, unknown> }
  ) => request<SerializedBoat>(`/boats/${id}/draft`, { method: "PATCH", body }),

  updateBoatTypeFeatures: (
    id: string,
    body: {
      boatTypeKey: string;
      features: { key: string; value?: string | null }[];
      noCrewMembers?: boolean;
      engineType?: import("@getyourboat/shared").EngineType | null;
      cabinConfigurations?: import("@getyourboat/shared").CabinConfigurationInput[];
    }
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

  updateLocation: (
    id: string,
    body: { features: { key: string; value?: string | null }[] }
  ) => request<SerializedBoat>(`/boats/${id}/location`, { method: "PUT", body }),

  updateDescriptionRules: (
    id: string,
    body: {
      title: string;
      description?: string;
      fieldValues?: Record<string, string | boolean | number | null>;
    }
  ) =>
    request<SerializedBoat>(`/boats/${id}/description-rules`, {
      method: "PUT",
      body,
    }),

  updatePricing: (
    id: string,
    body: {
      pricing: { listingModelKey: string; price: number; currency?: string }[];
      bookingFields?: Record<string, string | boolean | number | null>;
      contactForFuelCost?: boolean;
    }
  ) => request<SerializedBoat>(`/boats/${id}/pricing`, { method: "PUT", body }),

  submit: (id: string) => request<SerializedBoat>(`/boats/${id}/submit`, { method: "POST" }),

  updateApprovalType: (id: string, approvalType: "INSTANT" | "MANUAL") =>
    request<SerializedBoat>(`/boats/${id}/approval-type`, {
      method: "PATCH",
      body: { approvalType },
    }),

  deleteBoat: (id: string) =>
    request<{ deleted: string }>(`/boats/${id}`, { method: "DELETE" }),

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

  // ---- Profile ----
  getProfile: () => request<{ profile: import("@getyourboat/shared").OwnerProfileDTO | null }>("/profile/me"),
  updateProfile: (body: import("@getyourboat/shared").ProfileSetupInput) =>
    request<{ profile: import("@getyourboat/shared").OwnerProfileDTO }>("/profile/me", {
      method: "PATCH",
      body,
    }),
  profileAvatarUploadUrl: (fileName: string) =>
    request<UploadUrlResponse & { publicUrl: string }>("/profile/me/avatar/upload-url", {
      method: "POST",
      body: { fileName },
    }),

  // ---- Boat plan ----
  boatPlanUploadUrl: (id: string, fileName: string) =>
    request<UploadUrlResponse>(`/boats/${id}/boat-plan/upload-url`, {
      method: "POST",
      body: { fileName },
    }),
  registerBoatPlan: (id: string, body: { storagePath: string }) =>
    request<SerializedBoat>(`/boats/${id}/boat-plan`, { method: "POST", body }),
  deleteBoatPlan: (id: string) =>
    request<SerializedBoat>(`/boats/${id}/boat-plan`, { method: "DELETE" }),

  // ---- Messaging ----
  listConversations: () =>
    request<{ items: import("@getyourboat/shared").ConversationDTO[] }>("/conversations"),
  getConversation: (id: string) =>
    request<{ conversation: import("@getyourboat/shared").ConversationDetailDTO }>(
      `/conversations/${id}`
    ),
  getMessages: (id: string, cursor?: string) => {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return request<{ items: import("@getyourboat/shared").MessageDTO[]; nextCursor: string | null }>(
      `/conversations/${id}/messages${qs}`
    );
  },
  sendMessage: (id: string, body: string) =>
    request<{ message: import("@getyourboat/shared").MessageDTO }>(
      `/conversations/${id}/messages`,
      { method: "POST", body: { body } }
    ),

  // ---- Experiences ----
  myExperiences: () =>
    request<{ items: import("@getyourboat/shared").ExperienceListItemDTO[] }>(
      "/experiences/mine"
    ),
  createExperience: () =>
    request<import("@getyourboat/shared").ExperienceDTO>("/experiences", { method: "POST" }),
  getExperience: (id: string) =>
    request<import("@getyourboat/shared").ExperienceDTO>(`/experiences/${id}`),
  updateExperienceStep: (
    id: string,
    step: import("@getyourboat/shared").ExperienceStep,
    body: unknown
  ) =>
    request<import("@getyourboat/shared").ExperienceDTO>(`/experiences/${id}/steps/${step}`, {
      method: "PUT",
      body,
    }),
  submitExperience: (id: string) =>
    request<import("@getyourboat/shared").ExperienceDTO>(`/experiences/${id}/submit`, {
      method: "POST",
    }),
  toggleExperienceStatus: (id: string, status: "ACTIVE" | "PAUSED") =>
    request<import("@getyourboat/shared").ExperienceDTO>(`/experiences/${id}/status`, {
      method: "PATCH",
      body: { status },
    }),
  deleteExperience: (id: string) =>
    request<{ deleted: string }>(`/experiences/${id}`, { method: "DELETE" }),
  experiencePhotoUploadUrl: (id: string, fileName: string) =>
    request<UploadUrlResponse>(`/experiences/${id}/photos/upload-url`, {
      method: "POST",
      body: { fileName },
    }),
  registerExperiencePhoto: (
    id: string,
    body: { storagePath: string; asCover?: boolean }
  ) =>
    request<import("@getyourboat/shared").ExperienceDTO>(`/experiences/${id}/photos`, {
      method: "POST",
      body,
    }),
  deleteExperiencePhoto: (id: string, url: string) =>
    request<import("@getyourboat/shared").ExperienceDTO>(`/experiences/${id}/photos`, {
      method: "DELETE",
      body: { url },
    }),

  // ---- Booking calendar ----
  getAvailability: (
    boatId: string,
    model: string,
    rangeStart: string,
    rangeEnd: string
  ) =>
    request<import("@getyourboat/shared").AvailabilityMap>(
      `/boats/${boatId}/calendar/availability?model=${encodeURIComponent(model)}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`,
      { auth: false }
    ),

  listBlocks: (boatId: string) =>
    request<import("@getyourboat/shared").BlockResponseDTO[]>(
      `/boats/${boatId}/calendar/blocks`
    ),

  createBlock: (boatId: string, body: import("@getyourboat/shared").CreateBlockRequestDTO) =>
    request<import("@getyourboat/shared").BlockResponseDTO>(
      `/boats/${boatId}/calendar/blocks`,
      { method: "POST", body }
    ),

  updateBlock: (id: string, body: import("@getyourboat/shared").UpdateBlockRequestDTO) =>
    request<import("@getyourboat/shared").BlockResponseDTO>(
      `/calendar/blocks/${id}`,
      { method: "PATCH", body }
    ),

  deleteBlock: (id: string) =>
    request<void>(`/calendar/blocks/${id}`, { method: "DELETE" }),

  listMockReservations: (boatId: string) =>
    request<import("@getyourboat/shared").MockReservationDTO[]>(
      `/boats/${boatId}/calendar/mock-reservations`
    ),

  createMockReservation: (
    boatId: string,
    body: { startDate: string; endDate: string; guestName?: string; note?: string }
  ) =>
    request<import("@getyourboat/shared").MockReservationDTO>(
      `/boats/${boatId}/calendar/mock-reservations`,
      { method: "POST", body }
    ),

  deleteMockReservation: (id: string) =>
    request<void>(`/calendar/mock-reservations/${id}`, { method: "DELETE" }),

  // ---- Boat brands ----
  listBoatBrands: (boatTypeKey: string) => {
    const category = boatTypeToBrandCategory(boatTypeKey);
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<{ items: import("@getyourboat/shared").BoatBrandDTO[] }>(
      `/boat-brands${qs}`
    );
  },
  listAllBoatBrands: () =>
    request<{ items: import("@getyourboat/shared").BoatBrandDTO[] }>("/boat-brands"),
  listBoatModels: (brandId: string) =>
    request<{ items: import("@getyourboat/shared").BoatModelDTO[] }>(
      `/boat-brands/${brandId}/models`
    ),
  createBrandModelRequest: (
    body: import("@getyourboat/shared").CreateBrandModelRequestInput
  ) =>
    request<import("@getyourboat/shared").BrandModelRequestDTO>("/brand-model-requests", {
      method: "POST",
      body,
    }),
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
