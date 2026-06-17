import { randomUUID } from "node:crypto";
import { boatRepository, onboardingLookupRepository } from "@getyourboat/database";
import type { LookupModel } from "@getyourboat/database";
import {
  BoatStatus,
  OnboardingStep,
  computeProgress,
  type AmenitiesInput,
  type BoatTypeFeaturesInput,
  type DescriptionRulesInput,
  type ExtraInput,
  type ListingModelInput,
  type PricingInput,
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

export async function updateBoatTypeFeatures(boatId: string, input: BoatTypeFeaturesInput) {
  await assertKeysExist("boatTypeOption", [input.boatTypeKey]);
  await assertKeysExist("featureDefinition", input.features.map((f) => f.key));
  await boatRepository.setBoatTypeAndFeatures(boatId, input.boatTypeKey, input.features);
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

/* ------------------- Step 4: Description & rules ------------------- */

export async function updateDescriptionRules(boatId: string, input: DescriptionRulesInput) {
  await boatRepository.setDescriptionRules(boatId, input);
  await applyStepProgress(boatId, OnboardingStep.DESCRIPTION_RULES);
  return getBoatState(boatId);
}

/* ----------------------- Step 6: Pricing & extras ------------------ */

export async function updatePricing(boatId: string, input: PricingInput) {
  await assertKeysExist("listingModelOption", input.pricing.map((p) => p.listingModelKey));
  await boatRepository.replacePricing(boatId, input.pricing);
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
