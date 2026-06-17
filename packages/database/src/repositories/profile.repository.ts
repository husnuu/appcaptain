import type { ProfileRole } from "@getyourboat/shared";

export interface AuthProfile {
  id: string;
  email: string | null;
  role: ProfileRole;
}

/** Persistence port for the auth-mirrored profiles table. */
export interface ProfileRepository {
  upsertFromAuth(id: string, email: string | null): Promise<AuthProfile>;
}
