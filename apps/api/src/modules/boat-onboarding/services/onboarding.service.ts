// @ts-nocheck — Zod output types are widened under Vercel's TS 5.9 project check.
import { randomUUID } from "node:crypto";
import { boatRepository, onboardingLookupRepository } from "@getyourboat/database";
import type { LookupModel } from "@getyourboat/database";
import {
  ApprovalType,
  BoatStatus,
  OnboardingStep,
  buildAmenitiesSchema,
  buildBoatTypeFeaturesSchema,
  buildDescriptionRulesSchema,
  buildLocationSchema,
  buildPricingSchema,
  computeProgress,
  getRequiredAmenityKeys,
  getRequiredDescriptionFieldKeys,
  getRequiredFeatureKeysForStep,
  getRequiredLocationKeys,
  getRequiredPricingFieldKeys,
  sanitizeFeatureWrites,
  type AmenitiesInput,
  type BoatDraftPatchInput,
  type BoatTypeFeaturesInput,
  type DescriptionRulesInput,
  type ExtraInput,
  type ListingModelInput,
  type LocationInput,
  type PricingInput,
  type StructuredRulesMap,
  draftAmenitiesSchema,
  draftBoatTypeFeaturesSchema,
  draftDescriptionRulesSchema,
  draftListingModelSchema,
  draftLocationSchema,
  draftPricingSchema,
} from "@getyourboat/shared";
import { badRequest, conflict, notFound } from "../../../lib/errors.js";
import {
  DOCUMENTS_BUCKET,
  PHOTOS_BUCKET,
  getSupabaseAdmin,
  publicUrl,
} from "../../../lib/supabase.js";

/* ----------------------------- Helpers ----------------------------- */

async function assertKeysExist(model: LookupModel, keys: string[]) {
  if (keys.length === 0) return;
  const unique = [...new Set(keys)];
  const found = await onboardingLookupRepository.countByKeys(model, unique);
  if (found !== unique.length) {
    throw badRequest(`Unknown ${model} key(s) supplied`);
  }
}

/** Marks a step complete and recomputes progress (business rule in shared). */
async function applyStepProgress(boatId: string, step: OnboardingStep) {
  const completed = await boatRepository.getCompletedSteps(boatId);
  await boatRepository.updateProgress(boatId, computeProgress(completed, step));
}

export async function getBoatState(boatId: string) {
  const boat = await boatRepository.getState(boatId);
  if (!boat) throw notFound("Boat not found");
  return boat;
}

async function listingModelKeysForBoat(boatId: string): Promise<string[]> {
  const keys = await boatRepository.getListingModelKeys(boatId);
  const boat = await boatRepository.getOwnership(boatId);
  if (!boat) throw notFound("Boat not found");
  return keys;
}

export async function buildBoatTypeFeaturesSchemaForBoat(boatId: string) {
  const modelKeys = await listingModelKeysForBoat(boatId);
  if (modelKeys.length === 0) return buildBoatTypeFeaturesSchema([]);
  const fields = await onboardingLookupRepository.getAllFields();
  const required = getRequiredFeatureKeysForStep(fields, modelKeys);
  return buildBoatTypeFeaturesSchema(required);
}

export async function buildAmenitiesSchemaForBoat(boatId: string) {
  const modelKeys = await listingModelKeysForBoat(boatId);
  if (modelKeys.length === 0) return buildAmenitiesSchema([]);
  const fields = await onboardingLookupRepository.getAllFields();
  const required = getRequiredAmenityKeys(fields, modelKeys);
  return buildAmenitiesSchema(required);
}

export async function buildLocationSchemaForBoat(boatId: string) {
  const modelKeys = await listingModelKeysForBoat(boatId);
  if (modelKeys.length === 0) return buildLocationSchema([]);
  const fields = await onboardingLookupRepository.getAllFields();
  const required = getRequiredLocationKeys(fields, modelKeys);
  return buildLocationSchema(required);
}

export async function buildDescriptionRulesSchemaForBoat(boatId: string) {
  const modelKeys = await listingModelKeysForBoat(boatId);
  if (modelKeys.length === 0) return buildDescriptionRulesSchema(["listing_title"]);
  const fields = await onboardingLookupRepository.getAllFields();
  const required = getRequiredDescriptionFieldKeys(fields, modelKeys);
  // Pet policy selection is no longer required (removed from the Description step).
  return buildDescriptionRulesSchema(required, []);
}

export async function buildPricingSchemaForBoat(boatId: string) {
  const modelKeys = await listingModelKeysForBoat(boatId);
  if (modelKeys.length === 0) return buildPricingSchema([]);
  const fields = await onboardingLookupRepository.getAllFields();
  const required = getRequiredPricingFieldKeys(fields, modelKeys);
  return buildPricingSchema(required);
}

/* ------------------------------ Draft ------------------------------ */

export function createDraft(ownerId: string) {
  return boatRepository.createDraft(ownerId);
}

export function listOwnerBoats(ownerId: string) {
  return boatRepository.listByOwner(ownerId);
}

/* ----------------------- Step 1: Listing model --------------------- */

export async function updateListingModel(boatId: string, input: ListingModelInput) {
  await assertKeysExist("listingModelOption", input.listingModelKeys);
  await boatRepository.replaceListingModels(
    boatId,
    input.listingModelKeys,
    input.approvalType
  );
  await applyStepProgress(boatId, OnboardingStep.LISTING_MODEL);
  return getBoatState(boatId);
}

/* ----------------- Step 2: Boat type & features -------------------- */

export async function updateBoatTypeFeatures(
  boatId: string,
  input: BoatTypeFeaturesInput & { noCrewMembers?: boolean }
) {
  const sanitized = sanitizeFeatureWrites(input.features);
  await assertKeysExist("boatTypeOption", [input.boatTypeKey]);
  await assertKeysExist("featureDefinition", sanitized.map((f) => f.key));

  const features = [...sanitized];
  if (input.noCrewMembers) {
    const existing = features.find((f) => f.key === "number_of_crew_members");
    if (existing) existing.value = "0";
    else features.push({ key: "number_of_crew_members", value: "0" });
  }

  await boatRepository.setBoatTypeAndFeatures(boatId, input.boatTypeKey, features, {
    engineType: input.engineType ?? null,
    cabinConfigurations: input.cabinConfigurations,
  });
  await applyStepProgress(boatId, OnboardingStep.BOAT_TYPE_FEATURES);
  return getBoatState(boatId);
}

/* ----------------------- Step 3: Amenities ------------------------- */

export async function updateAmenities(boatId: string, input: AmenitiesInput) {
  const amenities = input.amenities.map((a) => ({
    amenityKey: a.amenityKey,
    isIncluded: a.isIncluded,
    isExtra: a.isExtra,
    extraPrice: a.extraPrice ?? null,
    currency: a.currency ?? null,
  }));
  await assertKeysExist("amenity", amenities.map((a) => a.amenityKey));
  await boatRepository.replaceAmenities(boatId, amenities);
  await applyStepProgress(boatId, OnboardingStep.AMENITIES);
  return getBoatState(boatId);
}

/* ----------------------- Step 4: Location -------------------------- */

export async function updateLocation(boatId: string, input: LocationInput) {
  await assertKeysExist("featureDefinition", input.features.map((f) => f.key));
  await boatRepository.upsertFeatureValues(boatId, input.features);
  await applyStepProgress(boatId, OnboardingStep.LOCATION);
  return getBoatState(boatId);
}

/* ------------------- Step 5: Description & rules ------------------- */

export async function updateDescriptionRules(boatId: string, input: DescriptionRulesInput) {
  const fieldValues = (input.fieldValues ?? {}) as StructuredRulesMap;
  const structuredRules: StructuredRulesMap = { ...fieldValues };
  delete structuredRules.listing_title;
  delete structuredRules.description;

  await boatRepository.setDescriptionRules(boatId, {
    title: input.title ?? String(fieldValues.listing_title ?? ""),
    description: input.description ?? String(fieldValues.description ?? ""),
    structuredRules,
  });
  await applyStepProgress(boatId, OnboardingStep.DESCRIPTION_RULES);
  return getBoatState(boatId);
}

/* ----------------------- Step 7: Pricing & extras ------------------ */

export async function updatePricing(boatId: string, input: PricingInput) {
  await assertKeysExist("listingModelOption", input.pricing.map((p) => p.listingModelKey));
  await boatRepository.replacePricing(boatId, input.pricing);

  const patch: StructuredRulesMap = { ...(input.bookingFields ?? {}) };
  if (input.contactForFuelCost !== undefined) {
    patch.contactForFuelCost = input.contactForFuelCost;
  }
  if (Object.keys(patch).length > 0) {
    await boatRepository.mergeStructuredRules(boatId, patch);
  }

  await applyStepProgress(boatId, OnboardingStep.PRICING);
  return getBoatState(boatId);
}

export function addExtra(boatId: string, input: ExtraInput) {
  return boatRepository.addExtra(boatId, input);
}

export async function updateExtra(boatId: string, extraId: string, input: ExtraInput) {
  const extra = await boatRepository.updateExtra(boatId, extraId, input);
  if (!extra) throw notFound("Extra not found");
  return extra;
}

export async function deleteExtra(boatId: string, extraId: string) {
  const ok = await boatRepository.deleteExtra(boatId, extraId);
  if (!ok) throw notFound("Extra not found");
  return { deleted: extraId };
}

/* --------------------------- Step 5: Photos ------------------------ */

export async function createPhotoUploadUrl(boatId: string, fileName: string) {
  const path = `${boatId}/${randomUUID()}-${fileName}`;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw badRequest(error.message);
  return { bucket: PHOTOS_BUCKET, path, token: data.token, signedUrl: data.signedUrl };
}

export async function registerPhoto(
  boatId: string,
  storagePath: string,
  altText?: string | null,
  isCover?: boolean
) {
  const count = await boatRepository.countPhotos(boatId);
  const makeCover = isCover ?? count === 0;
  if (makeCover) await boatRepository.clearCoverFlags(boatId);
  const photo = await boatRepository.addPhoto(boatId, {
    storagePath,
    publicUrl: publicUrl(PHOTOS_BUCKET, storagePath),
    altText: altText ?? null,
    isCover: makeCover,
    sortOrder: count,
  });
  await applyStepProgress(boatId, OnboardingStep.PHOTOS);
  return photo;
}

export function reorderPhotos(boatId: string, order: { id: string; sortOrder: number }[]) {
  return boatRepository.reorderPhotos(boatId, order);
}

export async function setCoverPhoto(boatId: string, photoId: string) {
  const photos = await boatRepository.setCover(boatId, photoId);
  if (!photos) throw notFound("Photo not found");
  return photos;
}

export async function deletePhoto(boatId: string, photoId: string) {
  const photo = await boatRepository.findPhoto(boatId, photoId);
  if (!photo) throw notFound("Photo not found");
  await getSupabaseAdmin().storage.from(PHOTOS_BUCKET).remove([photo.storagePath]);
  await boatRepository.deletePhoto(photoId);
  return { deleted: photoId };
}

/* ---------------------- Boat plan (Stay Included) ------------------ */

export async function createBoatPlanUploadUrl(boatId: string, fileName: string) {
  const path = `${boatId}/boat-plan/${randomUUID()}-${fileName}`;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw badRequest(error.message);
  return { bucket: PHOTOS_BUCKET, path, token: data.token, signedUrl: data.signedUrl };
}

export async function registerBoatPlan(boatId: string, storagePath: string) {
  const url = publicUrl(PHOTOS_BUCKET, storagePath);
  await boatRepository.setBoatPlanUrl(boatId, url);
  await applyStepProgress(boatId, OnboardingStep.PHOTOS);
  return getBoatState(boatId);
}

export async function deleteBoatPlan(boatId: string) {
  const boat = await getBoatState(boatId);
  const existing = boat.features.find((f) => f.key === "boat_plan")?.value;
  if (existing) {
    const needle = `/public/${PHOTOS_BUCKET}/`;
    const idx = existing.indexOf(needle);
    if (idx >= 0) {
      const storagePath = decodeURIComponent(existing.slice(idx + needle.length));
      await getSupabaseAdmin().storage.from(PHOTOS_BUCKET).remove([storagePath]);
    }
  }
  await boatRepository.setBoatPlanUrl(boatId, null);
  return getBoatState(boatId);
}

/* --------------------------- Step 7: Documents --------------------- */

export async function createDocumentUploadUrl(
  boatId: string,
  documentTypeKey: string,
  fileName: string
) {
  if (!(await boatRepository.documentTypeExists(documentTypeKey))) {
    throw badRequest("Unknown document type");
  }
  const path = `${boatId}/${documentTypeKey}/${randomUUID()}-${fileName}`;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(DOCUMENTS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw badRequest(error.message);
  return { bucket: DOCUMENTS_BUCKET, path, token: data.token, signedUrl: data.signedUrl };
}

export async function registerDocument(
  boatId: string,
  documentTypeKey: string,
  storagePath: string
) {
  if (!(await boatRepository.documentTypeExists(documentTypeKey))) {
    throw badRequest("Unknown document type");
  }
  const doc = await boatRepository.addDocument(boatId, documentTypeKey, storagePath, null);
  await applyStepProgress(boatId, OnboardingStep.DOCUMENTS);
  return doc;
}

export async function deleteDocument(boatId: string, documentId: string) {
  const doc = await boatRepository.findDocument(boatId, documentId);
  if (!doc) throw notFound("Document not found");
  await getSupabaseAdmin().storage.from(DOCUMENTS_BUCKET).remove([doc.storagePath]);
  await boatRepository.deleteDocument(documentId);
  return { deleted: documentId };
}

/* --------------------------- Submit -------------------------------- */

export async function submitForReview(boatId: string) {
  const boat = await getBoatState(boatId);
  if (boat.status !== BoatStatus.DRAFT && boat.status !== BoatStatus.REJECTED) {
    throw conflict(`Boat cannot be submitted from status ${boat.status}`);
  }
  if (!boat.progress.isReadyForReview) {
    throw badRequest("Onboarding is not complete yet");
  }
  if (boat.photos.length === 0) throw badRequest("At least one photo is required");
  if (boat.pricing.length === 0) throw badRequest("Pricing is required");

  await boatRepository.markSubmitted(boatId);
  return getBoatState(boatId);
}

export async function updateApprovalType(boatId: string, approvalType: ApprovalType) {
  await boatRepository.updateApprovalType(boatId, approvalType);
  return getBoatState(boatId);
}

/* --------------------------- Draft autosave --------------------------- */

export async function saveDraft(boatId: string, input: BoatDraftPatchInput) {
  const { step, data } = input;

  switch (step) {
    case OnboardingStep.LISTING_MODEL: {
      const parsed = draftListingModelSchema.parse(data);
      const boat = await getBoatState(boatId);
      if (parsed.listingModelKeys !== undefined) {
        if (parsed.listingModelKeys.length > 0) {
          await assertKeysExist("listingModelOption", parsed.listingModelKeys);
        }
        await boatRepository.replaceListingModels(
          boatId,
          parsed.listingModelKeys,
          parsed.approvalType ?? boat.approvalType
        );
      } else if (parsed.approvalType) {
        await boatRepository.updateApprovalType(boatId, parsed.approvalType);
      }
      break;
    }
    case OnboardingStep.BOAT_TYPE_FEATURES: {
      const parsed = draftBoatTypeFeaturesSchema.parse(data);
      const features = sanitizeFeatureWrites(parsed.features ?? []);
      if (parsed.noCrewMembers) {
        const existing = features.find((f) => f.key === "number_of_crew_members");
        if (existing) existing.value = "0";
        else features.push({ key: "number_of_crew_members", value: "0" });
      }
      if (features.length > 0) {
        await assertKeysExist("featureDefinition", features.map((f) => f.key));
        await boatRepository.upsertFeatureValues(boatId, features);
      }
      const meta = {
        engineType: parsed.engineType,
        cabinConfigurations: parsed.cabinConfigurations,
      };
      if (parsed.boatTypeKey) {
        await assertKeysExist("boatTypeOption", [parsed.boatTypeKey]);
        await boatRepository.setBoatTypeAndFeatures(
          boatId,
          parsed.boatTypeKey,
          features,
          meta
        );
      } else if (parsed.engineType !== undefined) {
        await boatRepository.updateEngineType(boatId, parsed.engineType ?? null);
      } else if (parsed.cabinConfigurations !== undefined) {
        const boat = await getBoatState(boatId);
        const typeKey = boat.boatType?.key;
        if (typeKey) {
          await boatRepository.setBoatTypeAndFeatures(boatId, typeKey, features, meta);
        }
      }
      break;
    }
    case OnboardingStep.AMENITIES: {
      const parsed = draftAmenitiesSchema.parse(data);
      if (parsed.amenities?.length) {
        const amenities = parsed.amenities.map((a) => ({
          amenityKey: a.amenityKey,
          isIncluded: a.isIncluded ?? true,
          isExtra: a.isExtra ?? false,
          extraPrice: a.extraPrice ?? null,
          currency: a.currency ?? null,
        }));
        await assertKeysExist("amenity", amenities.map((a) => a.amenityKey));
        await boatRepository.replaceAmenities(boatId, amenities);
      }
      break;
    }
    case OnboardingStep.LOCATION: {
      const parsed = draftLocationSchema.parse(data);
      if (parsed.features?.length) {
        await assertKeysExist("featureDefinition", parsed.features.map((f) => f.key));
        await boatRepository.upsertFeatureValues(boatId, parsed.features);
      }
      break;
    }
    case OnboardingStep.DESCRIPTION_RULES: {
      const parsed = draftDescriptionRulesSchema.parse(data);
      const fieldValues = (parsed.fieldValues ?? {}) as StructuredRulesMap;
      const structuredRules: StructuredRulesMap = { ...fieldValues };
      delete structuredRules.listing_title;
      delete structuredRules.description;
      await boatRepository.setDescriptionRules(boatId, {
        title: parsed.title ?? String(fieldValues.listing_title ?? ""),
        description: parsed.description ?? String(fieldValues.description ?? ""),
        structuredRules,
      });
      break;
    }
    case OnboardingStep.PRICING: {
      const parsed = draftPricingSchema.parse(data);
      if (parsed.pricing?.length) {
        await assertKeysExist(
          "listingModelOption",
          parsed.pricing.map((p) => p.listingModelKey)
        );
        await boatRepository.replacePricing(
          boatId,
          parsed.pricing.map((p) => ({
            listingModelKey: p.listingModelKey,
            price: p.price,
            currency: p.currency ?? "EUR",
          }))
        );
      }
      const patch: StructuredRulesMap = { ...(parsed.bookingFields ?? {}) };
      if (parsed.contactForFuelCost !== undefined) {
        patch.contactForFuelCost = parsed.contactForFuelCost;
      }
      if (Object.keys(patch).length > 0) {
        await boatRepository.mergeStructuredRules(boatId, patch);
      }
      break;
    }
    case OnboardingStep.PHOTOS:
    case OnboardingStep.DOCUMENTS:
      break;
    default:
      break;
  }

  await boatRepository.touchDraft(boatId, step);
  return getBoatState(boatId);
}

export async function deleteBoat(boatId: string) {
  await getBoatState(boatId);
  const paths = await boatRepository.listStoragePaths(boatId);
  const admin = getSupabaseAdmin();

  if (paths.photos.length > 0) {
    await admin.storage.from(PHOTOS_BUCKET).remove(paths.photos);
  }
  if (paths.documents.length > 0) {
    await admin.storage.from(DOCUMENTS_BUCKET).remove(paths.documents);
  }
  if (paths.boatPlan) {
    await admin.storage.from(PHOTOS_BUCKET).remove([paths.boatPlan]);
  }

  try {
    await boatRepository.deleteBoat(boatId);
  } catch {
    throw conflict("Tekne silinemedi — aktif rezervasyonlar olabilir.");
  }

  return { deleted: boatId };
}
