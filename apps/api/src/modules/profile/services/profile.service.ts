import { randomUUID } from "node:crypto";
import { profileRepository } from "@getyourboat/database";
import type { ProfileSetupInput } from "@getyourboat/shared";
import { badRequest } from "../../../lib/errors.js";
import { sanitizeStorageFileName } from "../../../lib/sanitize.js";
import { PHOTOS_BUCKET, getSupabaseAdmin, publicUrl } from "../../../lib/supabase.js";

export function getProfile(userId: string) {
  return profileRepository.getOwnerProfile(userId);
}

export function updateProfile(userId: string, input: ProfileSetupInput) {
  return profileRepository.updateOwnerProfile(userId, input);
}

export async function createAvatarUploadUrl(userId: string, fileName: string) {
  const path = `profiles/${userId}/${randomUUID()}-${sanitizeStorageFileName(fileName)}`;
  const { data, error } = await getSupabaseAdmin()
    .storage.from(PHOTOS_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw badRequest(error.message);
  return {
    bucket: PHOTOS_BUCKET,
    path,
    token: data.token,
    signedUrl: data.signedUrl,
    publicUrl: publicUrl(PHOTOS_BUCKET, path),
  };
}
