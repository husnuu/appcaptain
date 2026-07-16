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
  LOCATION: "LOCATION",
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

/* ------------------------------ Messaging ------------------------------ */

export const MessageSenderType = {
  CUSTOMER: "CUSTOMER",
  CAPTAIN: "CAPTAIN",
} as const;
export type MessageSenderType =
  (typeof MessageSenderType)[keyof typeof MessageSenderType];

/* ----------------------------- Experiences ----------------------------- */

export const ExperienceStatus = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  CHANGES_REQUESTED: "CHANGES_REQUESTED",
  APPROVED: "APPROVED",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  REJECTED: "REJECTED",
} as const;
export type ExperienceStatus = (typeof ExperienceStatus)[keyof typeof ExperienceStatus];

export const ExperienceCategory = {
  BOAT_TOUR: "BOAT_TOUR",
  WATER_SPORTS: "WATER_SPORTS",
  FISHING: "FISHING",
  DIVING_SNORKELING: "DIVING_SNORKELING",
  SUNSET_CRUISE: "SUNSET_CRUISE",
  PRIVATE_CHARTER_EXPERIENCE: "PRIVATE_CHARTER_EXPERIENCE",
  WORKSHOP_CLASS: "WORKSHOP_CLASS",
  OTHER: "OTHER",
} as const;
export type ExperienceCategory =
  (typeof ExperienceCategory)[keyof typeof ExperienceCategory];

export const ExperienceStep = {
  CATEGORY: "CATEGORY",
  TITLE_DESCRIPTION: "TITLE_DESCRIPTION",
  INCLUDED_INFO: "INCLUDED_INFO",
  LOGISTICS: "LOGISTICS",
  PRICING: "PRICING",
  CANCELLATION: "CANCELLATION",
  MEDIA: "MEDIA",
} as const;
export type ExperienceStep = (typeof ExperienceStep)[keyof typeof ExperienceStep];

export const ExperiencePricingType = {
  PER_PERSON: "PER_PERSON",
  PER_GROUP: "PER_GROUP",
} as const;
export type ExperiencePricingType =
  (typeof ExperiencePricingType)[keyof typeof ExperiencePricingType];

export const CancellationPolicyType = {
  FREE_24H: "FREE_24H",
  FREE_48H: "FREE_48H",
  NON_REFUNDABLE: "NON_REFUNDABLE",
  CUSTOM: "CUSTOM",
} as const;
export type CancellationPolicyType =
  (typeof CancellationPolicyType)[keyof typeof CancellationPolicyType];

/* --------------------------- Boat brand catalog --------------------------- */

export const DataSource = {
  MANUAL: "MANUAL",
  EXTERNAL_API: "EXTERNAL_API",
} as const;
export type DataSource = (typeof DataSource)[keyof typeof DataSource];

export const BrandModelRequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type BrandModelRequestStatus =
  (typeof BrandModelRequestStatus)[keyof typeof BrandModelRequestStatus];

export const BoatBrandCategory = {
  MOTORYACHT: "MOTORYACHT",
  SAILBOAT_CATAMARAN: "SAILBOAT_CATAMARAN",
  GULET: "GULET",
  RIB: "RIB",
} as const;
export type BoatBrandCategory =
  (typeof BoatBrandCategory)[keyof typeof BoatBrandCategory];

/* --------------------------- Cabin & engine --------------------------- */

export const CabinType = {
  SINGLE_CABIN: "SINGLE_CABIN",
  DOUBLE_CABIN: "DOUBLE_CABIN",
  TWIN_CABIN: "TWIN_CABIN",
  BUNK_BED: "BUNK_BED",
  THREE_PLUS_BERTHS: "THREE_PLUS_BERTHS",
  SALOON: "SALOON",
  SHARED_BATHROOM: "SHARED_BATHROOM",
} as const;
export type CabinType = (typeof CabinType)[keyof typeof CabinType];

export const WcType = {
  EXTERNAL: "EXTERNAL",
  EN_SUITE: "EN_SUITE",
} as const;
export type WcType = (typeof WcType)[keyof typeof WcType];

export const EngineType = {
  INBOARD: "INBOARD",
  OUTBOARD: "OUTBOARD",
  STERN_DRIVE: "STERN_DRIVE",
  JET_DRIVE: "JET_DRIVE",
  ELECTRIC: "ELECTRIC",
  SAIL_NO_ENGINE: "SAIL_NO_ENGINE",
} as const;
export type EngineType = (typeof EngineType)[keyof typeof EngineType];

/* ------------------------------ Discounts ----------------------------- */

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const DiscountTarget = {
  BOAT: "BOAT",
  EXPERIENCE: "EXPERIENCE",
  ALL_BOATS: "ALL_BOATS",
  ALL_EXPERIENCES: "ALL_EXPERIENCES",
} as const;
export type DiscountTarget =
  (typeof DiscountTarget)[keyof typeof DiscountTarget];

export const DiscountDayFilter = {
  ALL: "ALL",
  WEEKDAY: "WEEKDAY",
  WEEKEND: "WEEKEND",
} as const;
export type DiscountDayFilter =
  (typeof DiscountDayFilter)[keyof typeof DiscountDayFilter];

/* ------------------------------ Admin ------------------------------ */

export const AdminRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  SUPPORT: "SUPPORT",
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

/* ------------------------------ Bookings ------------------------------ */

export const BookingStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const RentalType = {
  HOURLY: "HOURLY",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  STAY: "STAY",
} as const;
export type RentalType = (typeof RentalType)[keyof typeof RentalType];
