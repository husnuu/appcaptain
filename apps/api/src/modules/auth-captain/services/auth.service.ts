import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { authRepository, toAuthUser } from "@getyourboat/database";
import type { AuthSessionDTO, CaptainLoginInput, SignupInput } from "@getyourboat/shared";
import { conflict, HttpError } from "../../../lib/errors.js";
import { env } from "../../../config/env.js";

function unauthorized(message: string) {
  return new HttpError(401, message, "UNAUTHORIZED");
}

const REFRESH_DAYS_DEFAULT = 30;
const REFRESH_DAYS_REMEMBER = 30;
const ACCESS_EXPIRES = "30m";

/** In-memory brute-force guard (per email). */
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken(): string {
  return randomBytes(32).toString("base64url");
}

function refreshExpiry(rememberMe?: boolean): Date {
  const days = rememberMe ? REFRESH_DAYS_REMEMBER : REFRESH_DAYS_DEFAULT;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function assertNotLocked(email: string) {
  const row = loginAttempts.get(email.toLowerCase());
  if (row && row.lockedUntil > Date.now()) {
    throw unauthorized("Çok fazla deneme. 15 dakika sonra tekrar dene.");
  }
}

function recordFailedLogin(email: string) {
  const key = email.toLowerCase();
  const row = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  row.count += 1;
  if (row.count >= 5) {
    row.lockedUntil = Date.now() + 15 * 60 * 1000;
    row.count = 0;
  }
  loginAttempts.set(key, row);
}

function clearLoginAttempts(email: string) {
  loginAttempts.delete(email.toLowerCase());
}

async function issueSession(
  app: FastifyInstance,
  user: { id: string; email: string; fullName: string | null; role: import("@getyourboat/shared").ProfileRole },
  rememberMe?: boolean
): Promise<AuthSessionDTO> {
  const accessToken = app.jwt.sign(
    { sub: user.id, role: user.role },
    { expiresIn: ACCESS_EXPIRES }
  );
  const refreshToken = generateRefreshToken();
  await authRepository.saveRefreshToken(
    user.id,
    hashRefreshToken(refreshToken),
    refreshExpiry(rememberMe)
  );
  return {
    accessToken,
    refreshToken,
    user: toAuthUser(user),
  };
}

export async function signup(app: FastifyInstance, input: SignupInput) {
  const existing = await authRepository.findByEmail(input.email);
  if (existing) {
    throw conflict("Bu e-posta zaten kayıtlı");
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const profile = await authRepository.createCaptain({
    email: input.email,
    passwordHash,
    fullName: input.fullName,
  });
  return issueSession(app, profile);
}

export async function login(app: FastifyInstance, input: CaptainLoginInput) {
  assertNotLocked(input.email);
  const profile = await authRepository.findByEmail(input.email);
  if (!profile?.passwordHash) {
    recordFailedLogin(input.email);
    throw unauthorized("E-posta veya şifre hatalı");
  }
  const ok = await bcrypt.compare(input.password, profile.passwordHash);
  if (!ok) {
    recordFailedLogin(input.email);
    throw unauthorized("E-posta veya şifre hatalı");
  }
  clearLoginAttempts(input.email);
  return issueSession(app, profile, input.rememberMe);
}

export async function refresh(app: FastifyInstance, refreshToken: string) {
  const hash = hashRefreshToken(refreshToken);
  const row = await authRepository.findRefreshToken(hash);
  if (!row || row.revoked || row.expiresAt < new Date()) {
    throw unauthorized("Oturum süresi doldu");
  }
  await authRepository.revokeRefreshToken(hash);
  const profile = await authRepository.findById(row.userId);
  if (!profile) throw unauthorized("Oturum süresi doldu");
  return issueSession(app, profile);
}

export async function logout(refreshToken: string) {
  await authRepository.revokeRefreshToken(hashRefreshToken(refreshToken));
  return { ok: true };
}

export async function me(userId: string) {
  const profile = await authRepository.findById(userId);
  if (!profile) throw unauthorized("Unauthorized");
  return { user: toAuthUser(profile) };
}

export const REFRESH_COOKIE = env.REFRESH_COOKIE_NAME;
