import type { AuthResponseDTO, AuthUserDTO } from "@getyourboat/shared";
import { setAccessToken } from "./token-store";

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
  return data;
}

export async function refreshSession(): Promise<AuthResponseDTO | null> {
  try {
    const data = await authFetch<AuthResponseDTO & { authenticated?: boolean }>("/api/auth/session");
    if (data.authenticated === false || !data.accessToken) {
      setAccessToken(null);
      return null;
    }
    setAccessToken(data.accessToken);
    return data;
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await authFetch("/api/auth/logout", { method: "POST", body: {} });
  } finally {
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
