import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

// Load env from the monorepo root .env (cwd is the app dir when run via pnpm),
// then any app-local .env. Existing process.env values take precedence.
config({ path: resolve(process.cwd(), "../../.env") });
config();

export function parseCaptainOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(8).default("change-me-in-production"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  REFRESH_COOKIE_NAME: z.string().default("gyb_refresh"),
  /** Comma-separated browser origins allowed by CORS (Captain, Admin, …). */
  CAPTAIN_ORIGIN: z
    .string()
    .default("http://localhost:3002")
    .superRefine((value, ctx) => {
      for (const origin of parseCaptainOrigins(value)) {
        try {
          new URL(origin);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid CAPTAIN_ORIGIN entry: ${origin}`,
          });
        }
      }
    }),
  ADMIN_ORIGIN: z.string().default("http://localhost:3001"),
  ADMIN_JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  SUPABASE_PHOTOS_BUCKET: z.string().default("boat-photos"),
  SUPABASE_DOCUMENTS_BUCKET: z.string().default("boat-documents"),
  SUPABASE_EXPERIENCE_PHOTOS_BUCKET: z.string().default("experience-photos"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

/** Parsed list from CAPTAIN_ORIGIN (comma-separated). */
export const captainOrigins = parseCaptainOrigins(env.CAPTAIN_ORIGIN);

/** Parsed list from ADMIN_ORIGIN (comma-separated). */
export const adminOrigins = parseCaptainOrigins(env.ADMIN_ORIGIN);
