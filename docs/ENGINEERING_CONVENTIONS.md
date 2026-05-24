# Engineering Conventions

## Boundaries

- `src/server/services`: business logic, transactions, DB reads/writes, and
  domain invariants.
- `src/server/adapters`: external providers and SDKs. Initialize SDK clients
  lazily inside getter functions.
- `src/server/api/routers` and `src/app/api`: I/O boundaries. Validate input,
  call services, and return standardized JSON.
- `src/lib`: pure reusable utilities with no request state or provider clients.
- `src/components/ui`: reusable visual primitives and state surfaces.
- Route `_components`: page-specific UI that should not leak across routes until
  it has at least two consumers.

## UI State

- Use shared empty/error/loading state components before building ad-hoc panels.
- Use `StatusMessage` for form, mutation, and tool-call feedback instead of
  one-off red/green paragraphs.
- Use `LoadingState` for inline loading feedback instead of loose spinner/text
  pairs.
- Use `TableEmptyRow` for empty table bodies before creating route-local empty
  rows.
- Empty states must include one clear next action when a user can recover.
- Product media should use stable aspect ratios and explicit `sizes`.
- Popups, sheets, dialogs, menus, selects, tooltips, commands, and hover cards
  must use opaque popup surfaces.
- Focus states must remain visible on links, icon buttons, filter chips, and
  mobile navigation.

## Commerce Labels

- Use `formatPrice` from `src/lib/format.ts`.
- Use commerce label helpers for order status, fulfillment method, stock count,
  product availability, and filter/result counts.
- Do not render raw enum values in user-facing customer/admin surfaces unless
  the enum is intentionally operational text.

## API Responses

- Preserve public response shapes, but use shared response helpers for status,
  errors, and rate limits.
- Route handlers should not call `Response.json` or `NextResponse.json`
  directly outside `src/server/http/api-response.ts`.
- `src/server/http/api-response-boundary.test.ts` enforces the route response
  boundary in `pnpm test`.
- Rate-limited responses should include `Retry-After`.
- Development fallbacks should fail clearly in production and remain documented
  in health checks.

## QA Commands

- `pnpm check`: lint, typecheck, and unit/integration tests.
- `pnpm build`: production build and environment validation.
- `pnpm smoke`: HTTP smoke check against `SMOKE_BASE_URL`.
- `pnpm e2e`: Playwright desktop and mobile flows. The local suite runs with a
  single worker to avoid shared dev-server and browser-state flakiness.
- `pnpm visual:qa`: agent-browser visual and overlay check for core routes.
- `pnpm format:check`: formatting drift check.

## Manual Quality Gates

Quality gates are manual `pnpm gate:*` commands. They do not run in watch mode,
do not install pre-commit hooks, and should be invoked only when the operator
chooses the matching depth.

- `pnpm gate:list`: prints the gate catalog.
- `pnpm gate:fix`: applies deterministic repairs: Prisma format/generate,
  public AVIF conversion/reference updates, ESLint fixes, and Prettier writes.
- `pnpm gate:quick`: runs `gate:fix`, then format check, lint, typecheck,
  Prisma validate, and AVIF check mode.
- `pnpm gate:test`: runs `gate:fix`, then Vitest.
- `pnpm gate:db`: runs `gate:fix`, then Prisma validate/generate, migration
  deploy, seed, and migration status.
- `pnpm gate:build`: runs `gate:fix`, then `next build`.
- `pnpm gate:smoke`, `pnpm gate:e2e`, and `pnpm gate:visual`: run `gate:fix`,
  build once, start a managed `next start` preview server, then run the named
  runtime check.
- `pnpm gate:runtime`: runs `gate:fix`, builds once, starts preview, then runs
  smoke, Playwright, and agent-browser visual QA.
- `pnpm gate:public:local`: runs all public benchmark parts with
  `--skip-external`.
- `pnpm gate:public:live`: runs all public benchmark parts against live
  reference sites with blocked-site replacement enabled.
- `pnpm gate:security`: checks frozen lockfile install integrity and
  `pnpm audit --prod`.
- `pnpm gate:prod`: forces production-readiness env validation locally.
- `pnpm gate:full`: runs fix once, then quick, test, db, build/runtime,
  security, and live public benchmarks.
- `pnpm gate:release`: runs `gate:full` plus `gate:prod`.

Prerequisites: DB gates need a reachable `DATABASE_URL`; runtime gates need a
successful production build and available preview port; e2e needs Playwright
browsers; visual QA needs `agent-browser` and PowerShell; live benchmarks and
security audit need network access; production readiness needs real provider
secrets in the environment.
