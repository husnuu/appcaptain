# GetYourBoat — Design System

GetYourGuide-inspired. This is the foundation of the `@getyourboat/ui` component
library. **When a new component is needed: update this doc first, then write code.**
Tokens live in `packages/config/tailwind/index.js` (shared Tailwind preset).

## 1. Brand identity

Clean, trustworthy, energetic. Turquoise/navy base with a warm orange accent.

- **Sadelik** — no decoration; every screen focuses on one primary action.
- **Güven** — critical info (booking, payment) uses high contrast + strong type.
- **Sıcaklık** — the orange accent is used only on action points (button, active tab,
  notification), never spread across the page.

## 2. Color palette

| Token | Hex | Usage |
|---|---|---|
| `brand` (Orange) | `#FF5533` | Primary button, active state, emphasis, link hover |
| `ink` (Navy) | `#1A1A2E` | Headings, body text, sidebar background |
| white | `#FFFFFF` | Page background, card background |
| `gray-900` | `#1F2937` | Primary text |
| `gray-600` | `#4B5563` | Secondary text |
| `gray-300` | `#D1D5DB` | Borders, dividers |
| `gray-100` | `#F3F4F6` | Alt page background, disabled |
| `success` | `#10B981` | Approved, active, success |
| `warning` | `#F59E0B` | Pending, attention |
| `danger` | `#EF4444` | Error, destructive, form error |

(`slate-*` is aliased to the gray scale, so legacy classes follow the system.)

## 3. Typography

**Inter** (Google Fonts). Scale exposed as Tailwind `text-*` tokens:

| Style | Class | Size / Line / Weight |
|---|---|---|
| Display | `text-display` | 32 / 40 / 700 |
| Heading | `text-heading` | 24 / 32 / 700 |
| Subheading | `text-subheading` | 18 / 28 / 600 |
| Body | `text-body` | 16 / 24 / 400 |
| Body Small | `text-body-sm` | 14 / 20 / 400 |
| Caption | `text-caption` | 12 / 16 / 500 |

## 4. Spacing & grid

8px base scale (Tailwind default): `1`=4 (xs), `2`=8 (sm), `4`=16 (md), `6`=24 (lg),
`8`=32 (xl), `12`=48 (xxl). Desktop: 12-col grid, max content width `max-w-content`
(1280px), 24px gutters. Tablet: 8-col. Mobile: 1-col, 16px gutters.

## 5. Components (`packages/ui`)

- **Button** — variants: `primary` (orange), `secondary` (ink), `outline`, `ghost`,
  `danger`, `link`; sizes `sm|md|lg|icon`; `loading` prop.
- **Card** — radius 12px (`rounded-card`), white, `border-gray-300` + `shadow-card`,
  padding 16 (mobile) / 24 (desktop); `interactive` for clickable cards.
- **Badge** — pill, 12px/600; variants `neutral|model|brand|success|warning|danger|info`.
- **Form** — `Input|Textarea|Select|Label|Field|FieldError|Checkbox`. Border
  gray-300, focus ring brand, `error` prop → danger border + 12px red message.
  Forms validate with shared Zod schemas; errors render via `Field error=...`.
- **Feedback** — `Spinner`, `Alert` (`info|success|warning|danger`).
- **Modal** — desktop centered max 560px, mobile bottom-sheet, overlay
  rgba(26,26,46,0.5), closes on ESC / overlay / X.
- **Sidebar / NavItem** — navy 240px sidebar; active item = filled brand background, white text.
- **Tabs** — horizontal tab bar; active tab brand fill, others light gray; arrow-key nav.
- **StatCard** — dashboard metric: label + big value + bottom accent line
  (`accent: brand|info|success|warning|ink|danger`); `loading` skeleton.
- **ProgressBar** — brand fill, clamped 0–100, optional label + value.
- **EmptyState** — icon + title + description + action, for no-data sections.
- **Skeleton / SkeletonText** — loading placeholders.
- **Checklist** — completed = filled success tick, incomplete = gray circle; selectable.
- **Banner / Carousel** — dismissible tip banner; carousel adds dot pagination.
- **Stepper** — numbered horizontal stepper (done = tick, active = brand).

## 6. Iconography

**Lucide** (`lucide-react`), stroke 1.5–2px, sizes 20 / 24 / 32. Default `gray-600`,
active `brand`. Icon-only buttons require `aria-label`.

## 7. Accessibility

Focus-visible rings on all interactive elements. Never use color as the sole
signal — pair status color with text/icon.

## 8. Breakpoints

`sm` <640 (mobile) · `md` 640–1024 (tablet) · `lg` 1024–1440 (laptop) ·
`xl` >1440. Desktop-first but fully responsive (mobile-friendly).
