import { STEP_ORDER, stepIndex } from "@getyourboat/shared";
import type { BoatStatus, OnboardingStep } from "./types";

// Canonical order + helpers live in the shared package; re-exported for local use.
export { STEP_ORDER, stepIndex };

export const STEP_LABELS: Record<OnboardingStep, string> = {
  LISTING_MODEL: "Kiralama Modeli",
  BOAT_TYPE_FEATURES: "Özellikler",
  AMENITIES: "Donanımlar",
  LOCATION: "Konum",
  DESCRIPTION_RULES: "Açıklama ve Politikalar",
  PHOTOS: "Fotoğraflar",
  PRICING: "Fiyatlar ve Ek Hizmetler",
  DOCUMENTS: "Dokümanlar",
};

export const STATUS_LABELS: Record<BoatStatus, string> = {
  DRAFT: "Taslak",
  PENDING_REVIEW: "İncelemede",
  ACTIVE: "Yayında",
  REJECTED: "Reddedildi",
  SUSPENDED: "Askıda",
};

export const STATUS_STYLES: Record<BoatStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-orange-100 text-orange-800",
};

