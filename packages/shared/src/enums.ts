/**
 * Domain enums shared across every layer (DB, API, frontends).
 *
 * These are framework-agnostic string unions. The database (Prisma) defines its
 * own enums with identical string values, so the two are interchangeable at the
 * wire/string level without the frontend ever importing Prisma.
 */

/* ----------------------------- Legacy (phase 0) ----------------------------- */

export const UserRole = {
  CUSTOMER: "CUSTOMER",
  CAPTAIN: "CAPTAIN",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type ReservationStatus =
  (typeof ReservationStatus)[keyof typeof ReservationStatus];

export const PaymentStatus = {
  PENDING: "PENDING",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  FAILED: "FAILED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PayoutStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  FAILED: "FAILED",
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

/* --------------------------- Boat onboarding --------------------------- */

export const ProfileRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
} as const;
export type ProfileRole = (typeof ProfileRole)[keyof typeof ProfileRole];

export const BoatStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;
export type BoatStatus = (typeof BoatStatus)[keyof typeof BoatStatus];

export const ApprovalType = {
  INSTANT: "INSTANT",
  MANUAL: "MANUAL",
} as const;
export type ApprovalType = (typeof ApprovalType)[keyof typeof ApprovalType];

export const OnboardingStep = {
  LISTING_MODEL: "LISTING_MODEL",
  BOAT_TYPE_FEATURES: "BOAT_TYPE_FEATURES",
  AMENITIES: "AMENITIES",
  DESCRIPTION_RULES: "DESCRIPTION_RULES",
  PHOTOS: "PHOTOS",
  PRICING: "PRICING",
  DOCUMENTS: "DOCUMENTS",
} as const;
export type OnboardingStep = (typeof OnboardingStep)[keyof typeof OnboardingStep];

export const DocumentStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const ExtraPricingType = {
  PER_BOOKING: "PER_BOOKING",
  PER_PERSON: "PER_PERSON",
  PER_DAY: "PER_DAY",
  PER_HOUR: "PER_HOUR",
} as const;
export type ExtraPricingType =
  (typeof ExtraPricingType)[keyof typeof ExtraPricingType];
