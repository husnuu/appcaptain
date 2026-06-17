import type { OnboardingConfigDTO } from "@getyourboat/shared";

/**
 * The ONLY way this frontend talks to the backend: a thin HTTP client.
 * No Prisma, no DB access — strictly the separate frontend layer calling the API.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000") + "/api/v1";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  /** Public onboarding config served by the API (DB -> repository -> service). */
  getConfig: () => get<OnboardingConfigDTO>("/onboarding/config"),
};
