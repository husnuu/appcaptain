import { randomUUID } from "node:crypto";
import { experienceRepository } from "@getyourboat/database";
import {
  ExperienceStatus,
  ExperienceStep,
  computeExperienceProgress,
  experienceSchema,
} from "@getyourboat/shared";
import { badRequest, forbidden, notFound } from "../../../lib/errors.js";
import { sanitizeStorageFileName } from "../../../lib/sanitize.js";
import {
  EXPERIENCE_PHOTOS_BUCKET,
  getSupabaseAdmin,
  publicUrl,
} from "../../../lib/supabase.js";
import { assertEditableStatus, assertStatusToggle } from "../authorization.js";

const REVIEW_RESET_STATUSES = new Set<string>([
  ExperienceStatus.APPROVED,
  ExperienceStatus.ACTIVE,
  ExperienceStatus.PAUSED,
]);

async function getOwnedOrThrow(id: string, captainId: string) {
  const exp = await experienceRepository.getOwned(id, captainId);
  if (!exp) throw notFound("Deneyim bulunamadı");
  return exp;
}

async function markStepComplete(id: string, step: ExperienceStep, currentCompleted: ExperienceStep[]) {
  const progress = computeExperienceProgress(currentCompleted, step);
  await experienceRepository.updateProgress(id, progress);
  return progress;
}

async function maybeResetReview(id: string, status: ExperienceStatus) {
  if (REVIEW_RESET_STATUSES.has(status)) {
    await experienceRepository.updateStatus(id, ExperienceStatus.PENDING_REVIEW);
  }
}

export function createDraft(captainId: string) {
  return experienceRepository.createDraft(captainId);
}

export function listMine(captainId: string) {
  return experienceRepository.listByCaptain(captainId);
}

export async function getState(id: string, captainId: string) {
  return getOwnedOrThrow(id, captainId);
}

export async function updateStep(
  id: string,
  captainId: string,
  step: ExperienceStep,
  data: Record<string, unknown>
) {
  const exp = await getOwnedOrThrow(id, captainId);
  assertEditableStatus(exp.status);

  await experienceRepository.updateFields(id, data as import("@getyourboat/database").ExperienceWriteBase);
  await markStepComplete(id, step, exp.progress.completedSteps);
  await maybeResetReview(id, exp.status);
  const next = await experienceRepository.getOwned(id, captainId);
  if (!next) throw notFound("Deneyim bulunamadı");
  return next;
}

export async function submit(id: string, captainId: string) {
  const exp = await getOwnedOrThrow(id, captainId);
  assertEditableStatus(exp.status);

  const result = experienceSchema.safeParse({
    category: exp.category,
    title: exp.title,
    shortDescription: exp.shortDescription,
    fullDescription: exp.fullDescription,
    highlights: exp.highlights,
    keywords: exp.keywords,
    included: exp.included,
    notIncluded: exp.notIncluded,
    notAllowed: exp.notAllowed,
    knowBeforeYouGo: exp.knowBeforeYouGo,
    emergencyContactPhone: exp.emergencyContactPhone,
    durationMinutes: exp.durationMinutes,
    meetingPoint: exp.meetingPoint,
    meetingPointLat: exp.meetingPointLat,
    meetingPointLng: exp.meetingPointLng,
    meetingTime: exp.meetingTime,
    languages: exp.languages,
    minParticipants: exp.minParticipants,
    maxParticipants: exp.maxParticipants,
    requiredEquipment: exp.requiredEquipment,
    accessibilityInfo: exp.accessibilityInfo,
    basePrice: exp.basePrice,
    currency: exp.currency,
    pricingType: exp.pricingType,
    childDiscountPercent: exp.childDiscountPercent,
    cancellationPolicy: exp.cancellationPolicy,
    cancellationPolicyText: exp.cancellationPolicyText,
    coverPhotoUrl: exp.coverPhotoUrl,
    photoUrls: exp.photoUrls,
    videoUrl: exp.videoUrl,
  });

  if (!result.success) {
    throw badRequest("Tüm adımları tamamlayıp zorunlu alanları doldurun");
  }

  if (!exp.coverPhotoUrl) {
    throw badRequest("Kapak fotoğrafı zorunlu");
  }

  return experienceRepository.updateStatus(id, ExperienceStatus.PENDING_REVIEW);
}

export async function toggleStatus(
  id: string,
  captainId: string,
  status: typeof ExperienceStatus.ACTIVE | typeof ExperienceStatus.PAUSED
) {
  const exp = await getOwnedOrThrow(id, captainId);
  assertStatusToggle(exp.status);
  return experienceRepository.updateStatus(id, status);
}

export async function deleteExperience(id: string, captainId: string) {
  const exp = await getOwnedOrThrow(id, captainId);
  if (exp.status === ExperienceStatus.ACTIVE) {
    throw forbidden("Yayındaki deneyim silinemez — önce duraklatın");
  }
  await experienceRepository.delete(id);
  return { deleted: id };
}

export async function createPhotoUploadUrl(id: string, captainId: string, fileName: string) {
  await getOwnedOrThrow(id, captainId);
  const path = `${captainId}/${id}/${randomUUID()}-${sanitizeStorageFileName(fileName)}`;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(EXPERIENCE_PHOTOS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw badRequest(error.message);
  return {
    bucket: EXPERIENCE_PHOTOS_BUCKET,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
  };
}

export async function registerPhoto(
  id: string,
  captainId: string,
  storagePath: string,
  asCover?: boolean
) {
  const exp = await getOwnedOrThrow(id, captainId);
  assertEditableStatus(exp.status);
  const url = publicUrl(EXPERIENCE_PHOTOS_BUCKET, storagePath);
  const photoUrls = exp.photoUrls.includes(url) ? exp.photoUrls : [...exp.photoUrls, url];
  const data: { photoUrls: string[]; coverPhotoUrl?: string } = { photoUrls };
  if (asCover || !exp.coverPhotoUrl) {
    data.coverPhotoUrl = url;
  }
  const updated = await experienceRepository.updateFields(id, data);
  await maybeResetReview(id, exp.status);
  return updated;
}

export async function removePhoto(id: string, captainId: string, photoUrl: string) {
  const exp = await getOwnedOrThrow(id, captainId);
  assertEditableStatus(exp.status);
  const photoUrls = exp.photoUrls.filter((p) => p !== photoUrl);
  const coverPhotoUrl = exp.coverPhotoUrl === photoUrl ? "" : exp.coverPhotoUrl;
  return experienceRepository.updateFields(id, { photoUrls, coverPhotoUrl });
}
