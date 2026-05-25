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

## Coherence Contract

`pnpm gate:coherence` enforces the repository's short architectural contract
without running long live benchmarks.

- Services must remain domain/server code. They may use persistence, cache, and
  provider-facing service dependencies, but must not import route UI,
  `_components`, public component primitives, icon packages, or animation UI.
- Adapters wrap external providers and SDK clients. They must not open Prisma
  transactions or import `~/server/db`; business transactions belong in
  services.
- API route handlers and tRPC routers validate I/O, rate-limit, call services,
  and return the existing public response shape. They must not import
  `~/server/db`, `@prisma/client`, or open transactions directly.
- Source files over 700 lines fail unless they are listed in
  `scripts/coherence-contract.mjs` with a reason. The current allowed
  orchestration exceptions are:
  `src/server/services/admin-operations.ts`,
  `src/server/adapters/search.ts`, `src/app/search/page.tsx`,
  `src/app/checkout/_components/cart-checkout-form.tsx`, and
  `scripts/benchmarks/core.ts`.
- New or moved code must not introduce unapproved `TODO`, `FIXME`, `HACK`, or
  `@ts-ignore` markers.
- Stable public import paths may remain as facades, but the implementation
  weight should move into sibling `*-inputs`, `*-contract`, `*-assets`,
  `*-types`, `_lib`, or leaf `_components` modules.

## QA Commands

- `pnpm dev`: stable webpack local development server without Turbopack or
  development service-worker compilation.
- `pnpm dev:turbo`: opt-in Turbopack development server for explicit
  compatibility checks.
- `pnpm verify:fast`: lint, typecheck, and unit/integration tests. Use this for
  ordinary local changes and PR feedback.
- `pnpm check`: legacy alias for lint, typecheck, and unit/integration tests.
- `pnpm build`: Next.js build, environment validation, and AVIF drift check. It
  uses catalog fixtures/fallbacks outside Vercel production so local and preview
  builds do not depend on a reachable catalog database. It does not repair
  assets; run `pnpm gate:fix` or `pnpm images:avif` for writes.
- `pnpm verify:full`: explicit full release verification alias for
  `pnpm gate:release`. It needs a reachable DB, Playwright browsers, network
  access, and production-readiness provider secrets.
- `pnpm smoke`: HTTP smoke check against `SMOKE_BASE_URL`.
- `pnpm e2e`: Playwright desktop and mobile flows. The local suite runs with a
  single worker to avoid shared dev-server and browser-state flakiness.
- `pnpm visual:qa`: agent-browser visual and overlay check for core routes.
- `pnpm format:check`: formatting drift check.

## Manual Quality Gates

Quality gates are manual `pnpm gate:*` commands. They do not run in watch mode,
do not install pre-commit hooks, and should be invoked only when the operator
chooses the matching depth. `pnpm gate:fix` is the only gate stage that writes
repo-tracked source or asset files; other gates validate the current tree.

- `pnpm gate:list`: prints the gate catalog.
- `pnpm gate:fix`: applies deterministic repairs: Prisma format/generate,
  public AVIF conversion/reference updates, ESLint fixes, and Prettier writes.
- `pnpm gate:quick`: runs format check, lint, typecheck, Prisma validate, and
  AVIF check mode without writing files.
- `pnpm gate:test`: runs Vitest without writing files.
- `pnpm gate:db`: validates Prisma, deploys migrations, seeds, and checks
  migration status.
- `pnpm gate:build`: runs `next build` without writing source assets.
- `pnpm gate:smoke`, `pnpm gate:e2e`, and `pnpm gate:visual`: build once,
  start a managed `next start` preview server, then run the named runtime check.
- `pnpm gate:runtime`: builds once, starts preview, then runs
  smoke, Playwright, and agent-browser visual QA.
- `pnpm gate:coherence`: runs the coherence contract, lint, typecheck, and
  focused static/Vitest coverage for the gate catalog, AI element accessibility,
  admin commerce, AI model/planner, search, and search state.
- `pnpm gate:public:local`: builds preview and runs all public benchmark parts
  with `--skip-external`.
- `pnpm gate:public:live`: builds preview and runs all public benchmark parts
  against live reference sites with blocked-site replacement enabled.
- `pnpm gate:security`: checks frozen lockfile install integrity and
  `pnpm audit --prod`.
- `pnpm gate:prod`: forces production-readiness env validation locally.
- `pnpm gate:full`: explicitly runs `gate:fix` once, then quick, test, db,
  build/runtime, QA, security, and live public benchmarks.
- `pnpm gate:ship`: explicitly runs `gate:fix` once, then the deploy gate for
  routine production releases: coherence, quick, test, DB, build, runtime, and
  security. It intentionally excludes `gate:public:live`.
- `pnpm gate:release`: runs `gate:full` plus `gate:prod`.

Prerequisites: DB gates need a reachable `DATABASE_URL`; runtime gates need a
successful production build and available preview port; e2e needs Playwright
browsers; visual QA needs `agent-browser` and PowerShell; live benchmarks and
security audit need network access; production readiness needs real provider
secrets in the environment.

## Autonomous Gate Escalation

When a user reports a problem, or an operator notices a problem while working,
run the relevant gate without waiting for an explicit request. Choose the
smallest high-signal check first, then escalate only when the evidence or touched
surface justifies the time cost.

- High confidence or high blast radius: run the specific gate immediately
  (`gate:build` for build/config/PWA, `gate:db` for schema or migration work,
  `gate:runtime` for preview-only failures, `gate:coherence` for architectural
  boundary changes).
- Medium confidence: run the cheapest focused check first, usually
  `pnpm verify:fast`, a targeted Vitest command, or a browser/dev-server
  verification. Escalate to the matching gate if the focused check fails or the
  issue remains plausible.
- Low confidence: gather runtime logs, browser evidence, or static references
  first; do not start broad gates until there is a concrete signal.
- Mutating repair remains explicit to `pnpm gate:fix`. If a deterministic repair
  is needed, run `gate:fix`, inspect the resulting diff, then rerun the smallest
  validation gate that covers the changed surface.
- Use `pnpm verify:full` only for deliberate full release verification or when
  multiple independent risk areas changed and provider/DB/network prerequisites
  are available.

## Production Deploy

Use `verify:fast` while iterating locally, `gate:coherence` before opening or
updating a PR, and `gate:ship` as the standing pre-deploy gate. Use
`verify:full` only for explicit full release verification where DB, provider
secrets, network access, and live benchmark duration are acceptable.

1. Run `pnpm verify:fast`.
2. Run `pnpm gate:coherence`.
3. Run `pnpm gate:ship`.
4. Run `git diff --check` and inspect `git status --short`.
5. If generated QA markdown has trailing blank lines, clean only
   `docs/qa/*.md`.
6. Deploy the linked Vercel project with:
   `vercel pull --yes --environment=production`,
   `vercel build --prod`, and
   `vercel deploy --prebuilt --prod`.
7. Smoke the production URL with the same route coverage as `scripts/smoke.mjs`.
