import fp from "fastify-plugin";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import type { JWTPayload } from "jose";
import type { FastifyReply, FastifyRequest } from "fastify";
import { profileRepository } from "@getyourboat/database";
import type { ProfileRole } from "@getyourboat/shared";
import { env } from "../config/env.js";

export interface AuthUser {
  id: string;
  email: string | null;
  role: ProfileRole;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

function extractBearer(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

// Modern Supabase signs access tokens with asymmetric keys (ES256/RS256) served
// from the project JWKS. Older/self-minted tokens use HS256 with the legacy JWT
// secret. We support both so the API keeps working across key rotations.
const jwks = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);
const hsSecret = env.SUPABASE_JWT_SECRET
  ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET)
  : null;

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { alg } = decodeProtectedHeader(token);
    if (alg === "HS256") {
      if (!hsSecret) return null;
      const { payload } = await jwtVerify(token, hsSecret);
      return payload;
    }
    const { payload } = await jwtVerify(token, jwks);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifies a Supabase-issued access token, ensures a mirrored `profiles` row
 * exists, and attaches the authenticated user (with its DB role) to the request.
 */
async function resolveUser(req: FastifyRequest): Promise<AuthUser | null> {
  const token = extractBearer(req);
  if (!token) return null;

  const claims = await verifyToken(token);
  if (!claims?.sub) return null;

  const email = typeof claims.email === "string" ? claims.email : null;
  const profile = await profileRepository.upsertFromAuth(claims.sub, email);
  return { id: profile.id, email: profile.email, role: profile.role };
}

export const supabaseAuthPlugin = fp(async (app) => {
  app.decorate(
    "requireAuth",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = await resolveUser(req);
      if (!user) {
        return reply.code(401).send({ message: "Unauthorized" });
      }
      req.authUser = user;
    }
  );

  app.decorate(
    "requireAdmin",
    async (req: FastifyRequest, reply: FastifyReply) => {
      const user = await resolveUser(req);
      if (!user) {
        return reply.code(401).send({ message: "Unauthorized" });
      }
      if (user.role !== "ADMIN") {
        return reply.code(403).send({ message: "Forbidden: admin only" });
      }
      req.authUser = user;
    }
  );
});
