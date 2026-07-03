import type { AuthResponseDTO, AuthUserDTO } from "@getyourboat/shared";
import { setAccessToken } from "./token-store";

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let inflightRefresh: Promise<AuthResponseDTO | null> | null = null;

/** Reads the `exp` claim (ms epoch) from a JWT without verifying it. */
function decodeJwtExpMs(token: string): number | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function clearProactiveRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

/**
 * Silently refresh the access token ~90s before it expires so an active
 * captain is never bounced to the login screen mid-session. Rescheduled after
 * every successful refresh.
 */
function scheduleProactiveRefresh(token: string): void {
  clearProactiveRefresh();
  const expMs = decodeJwtExpMs(token);
  if (expMs === null) return;
  const leadMs = 90_000;
  const delay = Math.max(15_000, expMs - Date.now() - leadMs);
  refreshTimer = setTimeout(() => {
    void refreshSession();
  }, delay);
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function authFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new AuthError(
      res.status,
      (data && (data.message as string)) || "İstek başarısız"
    );
  }
  return data as T;
}

export async function signup(body: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResponseDTO> {
  const data = await authFetch<AuthResponseDTO>("/api/auth/signup", {
    method: "POST",
    body,
  });
  setAccessToken(data.accessToken);
  scheduleProactiveRefresh(data.accessToken);
  return data;
}

export async function login(body: {
  email: string;
  password: string;
  rememberMe?: boolean;
}): Promise<AuthResponseDTO> {
  const data = await authFetch<AuthResponseDTO>("/api/auth/login", {
    method: "POST",
    body,
  });
  setAccessToken(data.accessToken);
  scheduleProactiveRefresh(data.accessToken);
  return data;
}

export function refreshSession(): Promise<AuthResponseDTO | null> {
  // Dedupe concurrent refreshes: each refresh rotates (revokes) the previous
  // refresh token, so parallel calls (Strict Mode double-mount, multiple 401s,
  // proactive timer + reactive retry) would otherwise invalidate each other.
  if (inflightRefresh) return inflightRefresh;
  inflightRefresh = (async () => {
    try {
      const data = await authFetch<AuthResponseDTO & { authenticated?: boolean }>(
        "/api/auth/session"
      );
      if (data.authenticated === false || !data.accessToken) {
        setAccessToken(null);
        clearProactiveRefresh();
        return null;
      }
      setAccessToken(data.accessToken);
      scheduleProactiveRefresh(data.accessToken);
      return data;
    } catch {
      setAccessToken(null);
      clearProactiveRefresh();
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

export async function logoutSession(): Promise<void> {
  try {
    await authFetch("/api/auth/logout", { method: "POST", body: {} });
  } finally {
    clearProactiveRefresh();
    setAccessToken(null);
  }
}

export async function fetchMe(accessToken: string): Promise<AuthUserDTO | null> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const res = await fetch(`${base}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: AuthUserDTO };
  return data.user;
}
