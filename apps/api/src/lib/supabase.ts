import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { env } from "../config/env.js";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client for server-side Storage operations
 * (signed upload URLs, public URLs, object deletion). Lazily created so the
 * API can boot without Supabase configured (e.g. during local dev / tests).
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Node < 22 has no global WebSocket; supabase-js needs a transport.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      realtime: { transport: WebSocket as any },
    });
  }
  return client;
}

export const PHOTOS_BUCKET = env.SUPABASE_PHOTOS_BUCKET;
export const DOCUMENTS_BUCKET = env.SUPABASE_DOCUMENTS_BUCKET;

/** Build the public URL for an object in a public bucket. */
export function publicUrl(bucket: string, path: string): string {
  return getSupabaseAdmin().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
