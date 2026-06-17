import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaced at runtime in the browser console if env is missing.
  // eslint-disable-next-line no-console
  console.warn(
    "[captain] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Browser-side Supabase client. Persists the session in localStorage so the
 * captain stays logged in across reloads. Used only for auth — all data goes
 * through our own API with the resulting access token.
 */
export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
