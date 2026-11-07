import fp from "fastify-plugin";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import type { JWTPayload } from "jose";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config/env.js";

/**
 * Müşteri (apps/web) oturumu — Supabase'in verdiği erişim anahtarını doğrular.
 *
 * Kaptan uç noktaları API'nin kendi JWT'sini kullanır (captain-auth); web'deki
 * müşteriler ise Supabase ile giriş yapar ve anahtarları ES256 ile imzalanır.
 * Bu eklenti yalnızca anahtarı doğrular: müşteri için `profiles` satırı
 * oluşturmaz (o tablo kaptanlar içindir).
 */
export interface CustomerUser {
  id: string;
  email: string | null;
  name: string | null;
}

declare module "fastify" {
  interface FastifyRequest {
    customer?: CustomerUser;
  }
  interface FastifyInstance {
    requireCustomer: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!env.SUPABASE_URL) return null;
  jwks ??= createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
  return jwks;
}

const hsSecret = env.SUPABASE_JWT_SECRET ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET) : null;

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { alg } = decodeProtectedHeader(token);
    if (alg === "HS256") {
      if (!hsSecret) return null;
      return (await jwtVerify(token, hsSecret)).payload;
    }
    const keys = getJwks();
    if (!keys) return null;
    return (await jwtVerify(token, keys, { issuer: `${env.SUPABASE_URL}/auth/v1` })).payload;
  } catch {
    return null;
  }
}

function extractBearer(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export const customerAuthPlugin = fp(async (app) => {
  app.decorate("requireCustomer", async (req: FastifyRequest, reply: FastifyReply) => {
    const token = extractBearer(req);
    const claims = token ? await verifyToken(token) : null;
    if (!claims?.sub) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
    const name =
      typeof meta.full_name === "string" && meta.full_name.trim()
        ? meta.full_name.trim()
        : typeof meta.name === "string" && meta.name.trim()
          ? meta.name.trim()
          : null;
    req.customer = {
      id: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      name,
    };
  });
});
