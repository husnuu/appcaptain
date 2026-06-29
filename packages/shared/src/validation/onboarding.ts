import { z } from "zod";
import { ApprovalType, CabinType, EngineType, ExtraPricingType, OnboardingStep, WcType } from "../enums";
import { getFieldBehavior } from "../onboarding/field-metadata";
import {
  getIncludedFeeGroup,
  readIncludedFeePair,
} from "../onboarding/pricing-fields";
import type { FieldValueMap } from "../onboarding/field-values";

export type StructuredRulesMap = Record<string, string | boolean | number | null>;

const fieldValueSchema = z.union([z.string(), z.boolean(), z.number(), z.null()]);

/* Step 1 — Listing model & approval settings */
export const listingModelSchema = z.object({
  listingModelKeys: z.array(z.string().min(1)).min(1),
  approvalType: z.nativeEnum(ApprovalType),
});
export type ListingModelInput = z.infer<typeof listingModelSchema>;

export const approvalTypeSchema = z.object({
  approvalType: z.nativeEnum(ApprovalType),
});
export type ApprovalTypeInput = z.infer<typeof approvalTypeSchema>;

const featureValueSchema = z.object({
  key: z.string().min(1),
  value: z.string().nullable().optional(),
});

function assertRequiredFieldValues(
  values: Record<string, unknown>,
  requiredKeys: string[],
  ctx: z.RefinementCtx,
  pathPrefix: string
) {
  for (const key of requiredKeys) {
    const behavior = getFieldBehavior(key);
    if (!behavior.ownerInput) continue;
    if (behavior.special === "fuel_contact_flag") {
      const contact = values.contactForFuelCost === true;
      const fuelVal = values[key];
      if (!contact && (fuelVal === undefined || fuelVal === "" || fuelVal === null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Required field missing: ${key}`,
          path: [pathPrefix, key],
        });
      }
      continue;
    }
    const includedFeeGroup = getIncludedFeeGroup(key);
    if (includedFeeGroup) {
      const { mode } = readIncludedFeePair(
        values as FieldValueMap,
        includedFeeGroup.includedKey,
        includedFeeGroup.notIncludedKey
      );
      if (!mode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Required field missing: ${key}`,
          path: [pathPrefix, includedFeeGroup.includedKey],
        });
      }
      continue;
    }
    const val = values[key];
    if (typeof val === "boolean") continue;
    if (val === undefined || val === "" || val === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Required field missing: ${key}`,
        path: [pathPrefix, key],
      });
    }
  }
}

/* Step 2 — Boat type & technical features (dynamic) */
export function buildBoatTypeFeaturesSchema(requiredFeatureKeys: string[]) {
  const required = requiredFeatureKeys.filter((k) => {
    const behavior = getFieldBehavior(k);
    return behavior.ownerInput && behavior.special !== "crew_optional_toggle";
  });

  return z
    .object({
      boatTypeKey: z.string().min(1),
      features: z.array(featureValueSchema).default([]),
      noCrewMembers: z.boolean().optional(),
      engineType: z.nativeEnum(EngineType).optional().nullable(),
      cabinConfigurations: z
        .array(
          z.object({
            cabinType: z.nativeEnum(CabinType),
            wcType: z.nativeEnum(WcType).optional().nullable(),
            quantity: z.number().int().min(1).max(99),
          })
        )
        .optional(),
    })
    .superRefine((data, ctx) => {
      const values = new Map(data.features.map((f) => [f.key, f.value?.trim() ?? ""]));
      for (const key of required) {
        if (!values.get(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Required feature missing: ${key}`,
            path: [key],
          });
        }
      }
      const crewBehavior = getFieldBehavior("number_of_crew_members");
      if (
        crewBehavior.special === "crew_optional_toggle" &&
        requiredFeatureKeys.includes("number_of_crew_members") &&
        !data.noCrewMembers
      ) {
        const crewVal = values.get("number_of_crew_members");
        if (!crewVal) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Number of crew members is required (or mark 'no crew')",
            path: ["number_of_crew_members"],
          });
        }
      }
    });
}

/** Back-compat default schema when listing models are not yet known. */
export const boatTypeFeaturesSchema = buildBoatTypeFeaturesSchema([]);
export type BoatTypeFeaturesInput = z.infer<ReturnType<typeof buildBoatTypeFeaturesSchema>>;

/* Step 3 — Amenities (dynamic) */
export function buildAmenitiesSchema(requiredAmenityKeys: string[]) {
  const amenityEntrySchema = z.object({
    amenityKey: z.string().min(1),
    isIncluded: z.boolean().default(true),
    isExtra: z.boolean().default(false),
    extraPrice: z.number().nonnegative().nullable().optional(),
    currency: z.string().length(3).nullable().optional(),
  });

  return z
    .object({
      amenities: z.array(amenityEntrySchema),
    })
    .superRefine((data, ctx) => {
      const selected = new Set(
        data.amenities.filter((a) => a.isIncluded || a.isExtra).map((a) => a.amenityKey)
      );

      for (const entry of data.amenities) {
        if (entry.isExtra && (entry.extraPrice ?? 0) <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Extra price required for ${entry.amenityKey}`,
            path: [entry.amenityKey],
          });
        }
      }

      for (const key of requiredAmenityKeys) {
        if (!selected.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Required amenity missing: ${key}`,
            path: [key],
          });
        }
      }
    });
}

export const amenitiesSchema = buildAmenitiesSchema([]);
export type AmenitiesInput = z.infer<ReturnType<typeof buildAmenitiesSchema>>;

/* Step — Location (dynamic) */
export function buildLocationSchema(requiredLocationKeys: string[]) {
  return z
    .object({
      features: z.array(featureValueSchema).min(1),
    })
    .superRefine((data, ctx) => {
      const values = new Map(data.features.map((f) => [f.key, f.value?.trim() ?? ""]));
      for (const key of requiredLocationKeys) {
        if (!values.get(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Required location field missing: ${key}`,
            path: [key],
          });
        }
      }
    });
}
export type LocationInput = z.infer<ReturnType<typeof buildLocationSchema>>;

/* Step — Description & rules (dynamic) */
export function buildDescriptionRulesSchema(
  requiredFieldKeys: string[],
  petPolicyKeys: string[] = []
) {
  const needsTitle = requiredFieldKeys.includes("listing_title");

  return z
    .object({
      title: needsTitle ? z.string().min(3).max(120) : z.string().max(120).optional(),
      description: z.string().max(5000).optional(),
      fieldValues: z.record(z.string(), fieldValueSchema).default({}),
    })
    .superRefine((data, ctx) => {
      const merged: Record<string, unknown> = {
        ...data.fieldValues,
        listing_title: data.title,
        description: data.description,
      };
      assertRequiredFieldValues(merged, requiredFieldKeys, ctx, "fieldValues");

      if (petPolicyKeys.length > 0) {
        const selected = petPolicyKeys.some((key) => merged[key] === true);
        if (!selected) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Evcil hayvan politikasını seçin",
            path: ["fieldValues", petPolicyKeys[0]!],
          });
        }
      }
    });
}

export const descriptionRulesSchema = buildDescriptionRulesSchema(["listing_title"]);
export type DescriptionRulesInput = z.infer<ReturnType<typeof buildDescriptionRulesSchema>>;

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

/* Step 6 — Pricing & extras (dynamic booking fields) */
export function buildPricingSchema(requiredBookingKeys: string[]) {
  return z
    .object({
      pricing: z
        .array(
          z.object({
            listingModelKey: z.string().min(1),
            price: z.number().nonnegative(),
            currency: z.string().length(3).default("EUR"),
          })
        )
        .min(1),
      bookingFields: z.record(z.string(), fieldValueSchema).default({}),
      contactForFuelCost: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      const merged: Record<string, unknown> = {
        ...data.bookingFields,
        contactForFuelCost: data.contactForFuelCost,
      };
      assertRequiredFieldValues(merged, requiredBookingKeys, ctx, "bookingFields");

      for (const entry of data.pricing) {
        if (entry.price <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Required field missing: ${entry.listingModelKey}`,
            path: ["pricing", entry.listingModelKey],
          });
        }
      }
    });
}

export const pricingSchema = buildPricingSchema([]);
export type PricingInput = z.infer<ReturnType<typeof buildPricingSchema>>;

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

/* Draft autosave — permissive partial schemas (no required-field checks). */

const draftFeatureValueSchema = z.object({
  key: z.string().min(1),
  value: z.string().nullable().optional(),
});

export const draftListingModelSchema = z.object({
  listingModelKeys: z.array(z.string().min(1)).optional(),
  approvalType: z.nativeEnum(ApprovalType).optional(),
});

export const draftBoatTypeFeaturesSchema = z.object({
  boatTypeKey: z.string().optional(),
  features: z.array(draftFeatureValueSchema).optional(),
  noCrewMembers: z.boolean().optional(),
  engineType: z.nativeEnum(EngineType).optional().nullable(),
  cabinConfigurations: z
    .array(
      z.object({
        cabinType: z.nativeEnum(CabinType),
        wcType: z.nativeEnum(WcType).optional().nullable(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .optional(),
});

export const draftAmenitiesSchema = z.object({
  amenities: z
    .array(
      z.object({
        amenityKey: z.string().min(1),
        isIncluded: z.boolean().optional(),
        isExtra: z.boolean().optional(),
        extraPrice: z.number().nonnegative().nullable().optional(),
        currency: z.string().length(3).nullable().optional(),
      })
    )
    .optional(),
});

export const draftLocationSchema = z.object({
  features: z.array(draftFeatureValueSchema).optional(),
});

export const draftDescriptionRulesSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(5000).optional(),
  fieldValues: z.record(z.string(), fieldValueSchema).optional(),
});

export const draftPricingSchema = z.object({
  pricing: z
    .array(
      z.object({
        listingModelKey: z.string().min(1),
        price: z.number().nonnegative(),
        currency: z.string().length(3).optional(),
      })
    )
    .optional(),
  bookingFields: z.record(z.string(), fieldValueSchema).optional(),
  contactForFuelCost: z.boolean().optional(),
});

export const boatDraftPatchSchema = z.object({
  step: z.nativeEnum(OnboardingStep),
  data: z.record(z.string(), z.unknown()),
});

export type BoatDraftPatchInput = z.infer<typeof boatDraftPatchSchema>;
export type DraftListingModelInput = z.infer<typeof draftListingModelSchema>;
export type DraftBoatTypeFeaturesInput = z.infer<typeof draftBoatTypeFeaturesSchema>;
export type DraftAmenitiesInput = z.infer<typeof draftAmenitiesSchema>;
export type DraftLocationInput = z.infer<typeof draftLocationSchema>;
export type DraftDescriptionRulesInput = z.infer<typeof draftDescriptionRulesSchema>;
export type DraftPricingInput = z.infer<typeof draftPricingSchema>;
