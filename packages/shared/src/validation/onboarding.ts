import { z } from "zod";
import { ApprovalType, ExtraPricingType } from "../enums";

/**
 * Onboarding input schemas — the single source of truth for request validation.
 * The API validates with these; the frontend can reuse them for client-side
 * checks and to derive input types. They depend only on shared enums (no DB).
 */

/* Step 1 — Listing model & approval settings */
export const listingModelSchema = z.object({
  listingModelKeys: z.array(z.string().min(1)).min(1),
  approvalType: z.nativeEnum(ApprovalType),
});
export type ListingModelInput = z.infer<typeof listingModelSchema>;

/* Step 2 — Boat type & technical features */
export const boatTypeFeaturesSchema = z.object({
  boatTypeKey: z.string().min(1),
  features: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().nullable().optional(),
      })
    )
    .default([]),
});
export type BoatTypeFeaturesInput = z.infer<typeof boatTypeFeaturesSchema>;

/* Step 3 — Amenities */
export const amenitiesSchema = z.object({
  amenities: z.array(
    z
      .object({
        amenityKey: z.string().min(1),
        isIncluded: z.boolean().default(true),
        isExtra: z.boolean().default(false),
        extraPrice: z.number().nonnegative().nullable().optional(),
        currency: z.string().length(3).nullable().optional(),
      })
      .refine((a) => !a.isExtra || (a.extraPrice ?? 0) > 0, {
        message: "extraPrice is required when isExtra is true",
        path: ["extraPrice"],
      })
  ),
});
export type AmenitiesInput = z.infer<typeof amenitiesSchema>;

/* Step 4 — Description & rules */
export const descriptionRulesSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(5000).optional(),
  rulesText: z.string().max(5000).nullable().optional(),
  checkInNotes: z.string().max(1000).nullable().optional(),
  checkOutNotes: z.string().max(1000).nullable().optional(),
  structuredRules: z.record(z.string(), z.boolean()).optional(),
});
export type DescriptionRulesInput = z.infer<typeof descriptionRulesSchema>;

/* Step 5 — Photos */
export const photoUploadUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1).optional(),
});

export const registerPhotoSchema = z.object({
  storagePath: z.string().min(1),
  altText: z.string().max(300).nullable().optional(),
  isCover: z.boolean().optional(),
});

export const reorderPhotosSchema = z.object({
  order: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0) }))
    .min(1),
});

export const setCoverSchema = z.object({ photoId: z.string().min(1) });

/* Step 6 — Pricing & extras */
export const pricingSchema = z.object({
  pricing: z
    .array(
      z.object({
        listingModelKey: z.string().min(1),
        price: z.number().nonnegative(),
        currency: z.string().length(3).default("EUR"),
      })
    )
    .min(1),
});
export type PricingInput = z.infer<typeof pricingSchema>;

export const extraSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default("EUR"),
  pricingType: z.nativeEnum(ExtraPricingType).default(ExtraPricingType.PER_BOOKING),
});
export type ExtraInput = z.infer<typeof extraSchema>;

/* Step 7 — Documents */
export const documentUploadUrlSchema = z.object({
  documentTypeKey: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1).optional(),
});

export const registerDocumentSchema = z.object({
  documentTypeKey: z.string().min(1),
  storagePath: z.string().min(1),
});

/* Admin review */
export const rejectSchema = z.object({
  reason: z.string().min(3).max(1000),
});

export const rejectDocumentSchema = z.object({
  reason: z.string().min(3).max(1000),
});
