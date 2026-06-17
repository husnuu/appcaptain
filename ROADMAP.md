# GetYourBoat — Implementation Roadmap

A yacht/boat rental **marketplace**. Customers search & book boats; captains list &
manage boats, track reservations and earnings; admins moderate. Real-time
messaging and online payments (full + partial) with captain payouts.

## Architecture

Turborepo monorepo managed with **pnpm workspaces**.

```
apps/
  api/        Fastify backend (REST + WebSocket)        — the source of truth
  admin/      Next.js admin panel (moderation, users)
  web/        Next.js customer frontend (Phase 2)
  captain/    Next.js captain panel (Phase 2)
  studio/     Sanity Studio (marketing/CMS content)
packages/
  database/   Prisma schema + generated client (Postgres)
  types/      Shared TypeScript types / Zod schemas
  ui/         Shared shadcn/ui React components
  config/     Shared ESLint, TypeScript & Tailwind config
```

- **Domains**: `web` on apex domain, `captain` on a subdomain, `admin` on a separate
  subdomain. All talk to `api`.
- **Backend**: Fastify + Prisma (Postgres). Auth via JWT. Real-time messaging via
  WebSockets. Payments via Stripe (PaymentIntents, partial capture, Connect payouts).
- **Shared code** lives in `packages/*` and is consumed by every app.

## Core Domain Entities

User (CUSTOMER / CAPTAIN / ADMIN), CaptainProfile, Boat, BoatPhoto, Amenity,
Reservation, Payment, Payout, Conversation, Message, Review.

## Phases

### Phase 0 — Foundations (this scaffold)
- [x] Monorepo + pnpm + Turborepo pipeline
- [x] `packages/config`, `packages/types`, `packages/ui`
- [x] `packages/database` — full Prisma schema + client
- [x] `apps/api` Fastify skeleton (health, auth stubs, plugin structure)
- [x] `apps/admin`, `apps/web`, `apps/captain` Next.js skeletons
- [x] `apps/studio` Sanity Studio skeleton

### Phase 1 — Customer + Captain MVP (api + admin)
- Auth (register/login, JWT, role guards)
- Captain: boat CRUD, photo upload, availability
- Admin: boat approval/rejection, user management, moderation queue
- Customer: boat search/filter, boat detail page, reservation flow
- Payments: Stripe PaymentIntent, full + partial payment
- Reviews & ratings

### Phase 2 — Customer & Captain frontends
- `apps/web` full customer experience
- `apps/captain` full captain dashboard (earnings, reservations, payouts)
- Real-time messaging (WebSocket) between customer & captain

### Phase 3 — Hardening
- Payout automation (Stripe Connect)
- Notifications (email/push), search infra, observability, CI/CD

## Local Dev

```bash
pnpm install
pnpm db:generate          # generate Prisma client
pnpm dev                  # run all apps via turbo
```
