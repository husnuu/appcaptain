# GetYourBoat / SeaHub — Project Instructions

## Stack
- Monorepo: pnpm workspaces + Turborepo
- API: Fastify (port 4000, ESM), Next.js captain app (port 3002), Next.js admin app (port 3001)
- Database: Prisma 6 + Supabase PostgreSQL. Use `prisma db push` (not migrate dev). Kill API server first (holds Prisma DLL).
- packages/database MUST build to CJS (`format: "cjs"`, `outfile: "dist/index.cjs"`). Never change this to ESM — Node.js v24 breaks.

## Auth Systems (three, completely separate)
- Legacy JWT: `JWT_SECRET`, `@fastify/jwt`, decorates `req.user`
- Captain JWT: same `JWT_SECRET`, Bearer header, decorates `req.authUser`
- Admin JWT: `ADMIN_JWT_SECRET` (min 32 chars, required), httpOnly cookie `admin_token`, decorates `req.adminUser`

## Admin Panel
- Branch: super-admin-panel
- Login: admin@getyourboat.com / Admin1234!
- Token stored as httpOnly cookie — never localStorage
- All admin fetch calls use `credentials: "include"`
- FontAwesome: `autoAddCss = false` in packages/ui — every app layout MUST import `@fortawesome/fontawesome-svg-core/styles.css`

## Rules
- Do NOT change anything a coworker wrote without asking first and explaining why
- Ask before making changes to files outside the current task scope
- Always check `noUnusedLocals` and `noUnusedParameters` (both true in tsconfig) before committing
- Run typecheck (`npx tsc --noEmit`) on both affected apps before committing

## Start commands
- API: `pnpm --filter @getyourboat/api dev`
- Admin: `pnpm --filter @getyourboat/admin dev`
- Captain: `pnpm --filter @getyourboat/captain dev`
- DB build: `pnpm --filter @getyourboat/database build`

## Pre-launch wiring checklist (incomplete as of 2026-07-16)

### Email (rejection notifications)
- Infrastructure: `apps/api/src/lib/email.ts` — nodemailer utility, graceful no-op if SMTP not set
- Triggered by: `PATCH /admin/boats/:id/status` when status = REJECTED and rejectionReason is provided
- To enable: add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` to `.env`
- NOT implemented: in-app/push notifications to captains — no Notification model exists in the schema

### Captain-facing notifications
- No notification system exists for captain users (no Notification table, no push, no in-app bell)
- The admin broadcast endpoint (`POST /admin/notifications/broadcast`) only logs to AuditLog — it does NOT deliver emails or push messages
- To wire: add a Notification model to schema.prisma, create a captain notifications route, and call it from admin status-change endpoints

### Admin photo management
- Admin can delete, reorder, and set cover photos on existing boats (`apps/admin/app/boats/[id]/page.tsx`)
- Admin CANNOT upload new photos — no file upload UI or signed-URL endpoint in the admin panel
- Photo uploads happen via the captain onboarding flow only (`apps/api/src/modules/boat-onboarding/`)

### Required production env vars (will crash on startup if missing)
- `ADMIN_JWT_SECRET` — min 32 chars, required (no default). Vercel: Settings → Environment Variables
- `ADMIN_ORIGIN` — URL of deployed admin Next.js app (default: localhost:3001, fine for local dev)
- `DATABASE_URL` — Supabase transaction pooler URL
- For local dev: `apps/admin/.env.local` must set `NEXT_PUBLIC_API_URL=http://localhost:4000` so admin app talks to local API instead of Vercel

### Admin user seed
- Run `pnpm --filter @getyourboat/database exec tsx seeds/seed-admin-user.ts` to create admin@getyourboat.com
- Script is idempotent (safe to re-run)

### Vercel build pipeline
- API is bundled as a single CJS serverless function via `apps/api/scripts/build-vercel.mjs`
- Uses esbuild aliases: `@getyourboat/database` → `dist/index.cjs` (NOT .js — will break if changed)
- Prisma engine must be copied: script handles this via `copyPrismaEngines()`
