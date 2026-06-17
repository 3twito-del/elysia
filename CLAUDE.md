# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start dev server (webpack)
pnpm dev:turbo        # Start dev server (Turbopack, experimental)

# Build & verification
pnpm build            # Production build
pnpm verify:fast      # Lint + typecheck + unit tests + build
pnpm verify:full      # Full release checklist (includes e2e)
pnpm check            # Quick lint + type check

# Testing
pnpm test             # Run unit tests (Vitest)
pnpm test src/lib/foo.test.ts   # Run a single test file
pnpm e2e              # Run Playwright e2e tests

# Database
pnpm db:migrate:dev   # Apply migrations (dev)
pnpm db:push          # Push schema without migration (dev)
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio

# Code quality
pnpm lint             # ESLint
pnpm format           # Prettier
```

**Package manager:** pnpm only — frozen lockfile is enforced in CI.

**Path alias:** `~/*` maps to `./src/*`.

## Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| API | tRPC 11 + React Query |
| Database | PostgreSQL via Prisma 6 |
| Auth | NextAuth 5 beta (JWT sessions) |
| Styling | Tailwind CSS 4 + shadcn/ui (radix-nova) |
| Search | Typesense + vector embeddings |
| AI | Vercel AI SDK, multi-provider (Google, Groq, Cerebras, Cloudflare) |
| Storage | Cloudinary (media), Upstash Redis (rate-limiting/cache) |
| PWA | Serwist service worker + Web Push |
| Payment | CardCom (Israeli processor) |
| Dropship | Shopify integration |
| Email | Resend or Brevo (switchable via env) |

### Request flow

**Server Components** fetch directly via Prisma or the tRPC server-side caller (`src/trpc/server.ts`). **Client components** use tRPC hooks (`src/trpc/react.tsx`) which are backed by React Query. **Mutations** use either tRPC mutations or Server Actions (`"use server"`) depending on the surface.

tRPC is the only place where access control lives on the API surface — procedures are wrapped with:
- `publicProcedure` — no auth
- `protectedProcedure` — requires a session
- `adminProcedure(permission)` — requires a specific `AdminPermission` enum value

Routers live in `src/server/api/routers/`. Business logic they call lives in `src/server/services/`.

### Authentication

Two separate auth flows share one NextAuth config (`src/server/auth/config.ts`):
1. **Customers** — OTP via email or SMS (`customer-otp.ts` service)
2. **Admins** — Email + password (`/admin/login`), session includes `adminUserId` and `permissions[]`

The first admin account is bootstrapped via `ADMIN_BOOTSTRAP_*` env vars on first run.

### Data model highlights

- `InventoryItem` tracks branch-level stock. `InventoryReservation` holds stock for 24 h on checkout; `InventoryLedger` is the immutable transaction log.
- Orders move through: `PENDING_PAYMENT → PAID → PREPARING → READY_FOR_PICKUP | SHIPPED → COMPLETED`. Every status change writes an `AuditLog`.
- `OutboxEvent` is the event-sourcing outbox, processed by the `/api/jobs/outbox` cron (daily 3 AM UTC via `vercel.json`).
- `ProductSearchEmbedding` holds vectors for semantic search. `AI_SEMANTIC_SEARCH_ENABLED` gates this at runtime.

### Styling conventions

The design system lives entirely in `src/styles/globals.css` as CSS variables — brand colors (`--brand-*`), glass morphism (`--glass-*`), motion timing (`--motion-fast/medium/slow`), and layout (`--ui-page-x`, `--ui-section-y`, etc.). Use these variables rather than arbitrary Tailwind values.

Components use `cn()` for class merging and CVA for variants. The app is Hebrew-first — `dir="rtl"` is on the root `<html>` and RTL must be preserved in any layout work.

### Environment setup

`src/env.js` (T3 Env + Zod) validates all env vars at startup. Variables are only required in production (`VERCEL === "1"`). See `.env.example` for the full list. Minimum local setup:

```
DATABASE_URL=
AUTH_SECRET=
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_PASSWORD=   # 12+ characters
ADMIN_BOOTSTRAP_NAME=
```

### ESLint exceptions

`src/components/ai-elements/` and `src/server/db.ts` have relaxed ESLint rules (see `eslint.config.js`) — avoid using them as a style reference.
