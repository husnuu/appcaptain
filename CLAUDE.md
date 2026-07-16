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
