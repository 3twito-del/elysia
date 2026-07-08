# Elysia Engineering

Status: single source of truth for engineering conventions, the product
benchmark method, and the release procedure. This document merges the former
`ENGINEERING_CONVENTIONS.md`, `FULL_PRODUCT_BENCHMARK.md`, and
`COHERENCE_FINAL_PROMPT.md`.

---

## Part I — Engineering Conventions

### Boundaries

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

### UI State

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

### Public Design Work

- Before changing public UI, UX, content density, commerce controls, media, or
  copy, apply the public gate in `docs/DESIGN.md` (Part I), then read the
  manifesto layer (Part II) of the same document.
- Treat the manifesto as orientative and non-blocking: it chooses the default
  taste direction, but it does not replace `HIGH_JEWELRY_REFERENCE_GATE` or
  mandatory legal, accessibility, payment, security, SEO, privacy, and backend
  correctness requirements.
- If implementation intentionally diverges from the manifesto, record the reason
  in the work summary or follow-up change note.

### Commerce Labels

- Use `formatPrice` from `src/lib/format.ts`.
- Use commerce label helpers for order status, fulfillment method, stock count,
  product availability, and filter/result counts.
- Do not render raw enum values in user-facing customer/admin surfaces unless
  the enum is intentionally operational text.

### API Responses

- Preserve public response shapes, but use shared response helpers for status,
  errors, and rate limits.
- Route handlers should not call `Response.json` or `NextResponse.json`
  directly outside `src/server/http/api-response.ts`.
- `src/server/http/api-response-boundary.test.ts` enforces the route response
  boundary in `pnpm test`.
- Rate-limited responses should include `Retry-After`.
- Development fallbacks should fail clearly in production and remain documented
  in health checks.

### Coherence Contract

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
  `src/app/account/page.tsx`, `src/app/admin/service/page.tsx`, and
  `src/app/checkout/_components/cart-checkout-form.tsx`,
  `src/server/services/catalog.ts`, and `scripts/qa-site-audit.ts`.
- New or moved code must not introduce unapproved `TODO`, `FIXME`, `HACK`, or
  `@ts-ignore` markers.
- Stable public import paths may remain as facades, but the implementation
  weight should move into sibling `*-inputs`, `*-contract`, `*-assets`,
  `*-types`, `_lib`, or leaf `_components` modules.

### QA Commands

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

### Test Wall-Clock Budgets

Use these budgets as release-prep regression signals, not hard CI timeouts.
Record the machine, command, and before/after duration when a run is more than
2x the budget or more than 60 seconds slower than the last clean local run.

- `pnpm test -- <path>`: focused Vitest files should usually finish within
  15 seconds.
- `pnpm test`: default unit and integration tests should usually finish within
  60 seconds.
- `pnpm verify:fast`: lint, typecheck, and tests should usually finish within
  180 seconds on the local Windows workspace.
- `pnpm qa:routes`: route-inventory checks should usually finish within
  20 seconds.

### Source-Scan Test Diagnostics

Some guardrail tests inspect broad source trees. Treat a timeout in these tests
as a performance signal, not as a reason to weaken the guardrail.

1. Rerun the failing file directly with `pnpm test -- <path>` to separate real
   assertion failures from suite-wide contention.
2. If the focused test passes but the full suite times out, cache repeated file
   discovery or reads inside the test before increasing timeouts.
3. Keep the guardrail assertion intact; do not replace it with a snapshot that
   stops checking the forbidden pattern.
4. If a timeout increase is still needed, keep it local to the expensive setup
   or test and document the source-scan size that justifies it.
5. Rerun both the focused test and the broader command that originally exposed
   the timeout.

### Flaky Test Policy

Do not hide flaky tests by deleting assertions, weakening source scans, or
moving failures out of the default Vitest suite. A flaky-test change must record
the owner, observed failure mode, affected command, and follow-up condition in
the PR or release note.

Allowed responses:

- Isolate shared mutable state with per-test setup/teardown.
- Add deterministic waits only around real asynchronous boundaries.
- Cache expensive file discovery in broad source-scan tests when timeouts are
  caused by repeated reads.
- Increase a timeout only for the narrow test that needs it, with the source
  size or runtime evidence that justified the increase.

Disallowed responses:

- Skipping a test without a dated owner and remediation condition.
- Replacing behavioral assertions with snapshots that no longer check the
  regression.
- Retrying a failing test in CI without also keeping a local command that can
  reproduce and diagnose the failure.

### Manual Quality Gates

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
- `pnpm gate:qa`: builds preview, checks route inventory, and runs the full
  route QA site audit.
- `pnpm gate:security`: checks frozen lockfile install integrity and
  `pnpm audit --prod`.
- `pnpm gate:prod`: forces production-readiness env validation locally.
- `pnpm gate:full`: explicitly runs `gate:fix` once, then quick, test, db,
  build/runtime, QA, and security gates.
- `pnpm gate:ship`: explicitly runs `gate:fix` once, then the deploy gate for
  routine production releases: coherence, quick, test, DB, build, runtime, and
  security.
- `pnpm gate:release`: runs `gate:full` plus `gate:prod`.

Prerequisites: DB gates need a reachable `DATABASE_URL`; runtime gates need a
successful production build and available preview port; e2e needs Playwright
browsers; visual QA needs `agent-browser` and PowerShell; live benchmarks and
security audit need network access; production readiness needs real provider
secrets in the environment.

### Autonomous Gate Escalation

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

---

## Part II — Product Benchmark Method

This part consolidates public UX, commerce, performance, backend, admin,
security, accessibility, SEO, QA, and release-readiness evaluation into one
repeatable benchmark workflow. It augments, but does not replace, the blocking
gate and manifesto in `docs/DESIGN.md` and the conventions in Part I.

### Purpose and Decision Rules

Use this method before implementing any customer-facing, admin-facing, or
platform-significant change that could affect product quality, user trust,
commerce conversion, operational reliability, accessibility, security, or
release confidence.

Core rules:

- Benchmark first, implement second. Do not edit product code until the relevant
  benchmark class has been selected and the evidence requirement is clear.
- Public design, UX, content, route structure, and commerce-control changes must
  pass the High Jewelry Reference Gate from `docs/DESIGN.md`, unless
  a mandatory or explicit user-approved exception is recorded.
- Public design, UX, and copy changes should also be checked against the design
  manifesto in `docs/DESIGN.md` as an orientative, non-blocking quality
  layer. It does not add a threshold and does not override the gate.
- `PUBLIC_STRUCTURE_BENCHMARK_V4` remains the route-structure marker for public
  structural decisions.
- The 30-site public benchmark corpus is secondary evidence for public commerce
  usability. It does not overrule the 15-site High Jewelry Reference Gate for
  luxury tone, public UX, content density, visual hierarchy, or brand decisions.
- Mandatory legal, accessibility, payment, SEO, cookie, and backend-correctness
  changes may proceed as mandatory exceptions, but the exception must be named
  and recorded.
- Technical changes that do not touch the public UI still need benchmark review
  against internal product quality parameters: correctness, latency, failure
  behavior, observability, auth, data integrity, and release gates.

### Benchmark Sources and Evidence Hierarchy

Evidence must be cited from the strongest applicable source. When sources
conflict, use the higher-ranked source unless the change is a mandatory
exception.

1. Mandatory requirements: legal compliance, accessibility, payment correctness,
   security, privacy, SEO correctness, backend correctness, and data integrity.
2. High Jewelry Reference Gate: the 15 Tier A high jewelry sites listed in
   `docs/DESIGN.md`, each weighted `1.5`, total `22.5`, threshold `11.25`.
3. Public structure policy: `PUBLIC_STRUCTURE_BENCHMARK_V4` and the route
   archetypes enforced in `src/lib/public-structure-policy.ts`.
4. Public commerce benchmark corpus: the 30-site corpus defined in
   `src/lib/public-design-policy.ts`, total weight `37.5`, threshold `18.75`.
5. Elysia design manifesto: the orientative, non-blocking design authority in
   `docs/DESIGN.md` (Part II), used to choose the quieter and more
   product-led implementation when supported options remain.
6. Repository QA truth: route inventory, performance QA, visual QA, smoke tests,
   e2e coverage, build checks, coherence checks, and production-readiness gates.
7. Product-specific operational evidence: current code behavior, database
   schema, provider contracts, logs, artifacts, support risks, and documented
   business rules.

Every benchmark record should identify source type, evidence URL or local file,
route or subsystem, observed pattern, score contribution, and final decision.

### Public Luxury and Commerce Comparison Model

Public-facing changes are evaluated through two overlapping lenses:

- Luxury authority: brand restraint, typographic hierarchy, visual polish,
  content density, navigation tone, media treatment, and purchase confidence.
- Commerce utility: product discovery, filters, sorting, cart flow, checkout
  clarity, recovery states, availability language, and service access.

Use the High Jewelry Reference Gate for:

- First viewport composition and hero behavior.
- Header, mobile navigation, footer, and global chrome.
- PLP, search, gifts, PDP, checkout, account, service, content, legal, AI, and
  stylist public structure.
- Whether an element is allowed, demoted, removed, or mandatory.
- Copy density, visual tone, button prominence, motion level, and brand
  restraint.

Use the 30-site public benchmark corpus for:

- Common commerce controls and their placement.
- Result counts, active refinements, sort behavior, wishlist, sale badges,
  service links, related products, and checkout reassurance.
- Secondary confirmation when the luxury gate allows more than one acceptable
  implementation.

### Route Benchmark Matrix

Use this matrix to select the required benchmark lens for a route or feature.

| Route or subsystem     | Primary benchmark lens                    | Required comparison focus                                                 |
| ---------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `/`                    | High Jewelry Reference Gate               | Brand-led first viewport, immediate commerce entry, restrained actions    |
| `/search`              | Public structure and commerce corpus      | Search controls, result summary, recovery states, filters, product grid   |
| `/gifts`               | Public structure and commerce corpus      | Product-listing behavior, gift discovery, no scroll-gated landing pattern |
| `/category/[slug]`     | Public structure and commerce corpus      | Title, count, filters, sort, active filters, grid density                 |
| `/product/[slug]`      | High Jewelry and commerce corpus          | Gallery, purchase panel, facts, availability, service, related products   |
| `/checkout`            | Mandatory correctness and commerce corpus | Cart, form clarity, payment confidence, validation, submit recovery       |
| `/account`             | Task-first product benchmark              | Auth, dashboard recovery, privacy, order access, protected states         |
| `/account/orders/[id]` | Task-first product benchmark              | Order facts, support actions, auth boundaries, data correctness           |
| `/service`             | High Jewelry and task-first benchmark     | Contact channels, service form, recovery paths, compact hero              |
| `/ai` and `/stylist`   | Demoted service benchmark                 | Tool-first layout, non-primary public placement, clear failure states     |
| `/about` and `/faq`    | High Jewelry content benchmark            | Readability, restrained content density, service recovery links           |
| Legal routes           | Mandatory and accessibility benchmark     | Compact readable content, compliance, privacy, cookie access              |
| `/offline` and PWA     | Reliability benchmark                     | Offline copy, recovery, caching behavior, no broken commerce promise      |
| Admin routes           | Operational benchmark                     | Auth, data integrity, auditability, workflow speed, error recovery        |
| API routes             | Backend benchmark                         | Response shape, validation, rate limits, auth, provider failure handling  |

### Full Product Comparison Parameters

Apply only the parameters relevant to the change, but do not ignore a category
when the touched surface clearly affects it.

#### Public UX and Brand

- Brand tone: restrained, jewelry-specific, premium, clear, and not generic SaaS.
- First viewport: the route's primary task or brand signal appears without
  decorative obstruction.
- Navigation: compact, typographic, accessible, route-backed, and consistent
  across desktop and mobile.
- Header and footer: utility-led, service-aware, not boxed or pill-heavy, and
  not overloaded with unsupported routes.
- Mobile behavior: stable tap targets, readable labels, no occluded controls,
  safe-area awareness, Escape and focus-return behavior where applicable.
- Motion: purposeful, not continuous outside approved hero contexts, and safe
  under reduced-motion preferences.
- Content density: concise enough for luxury tone while preserving task clarity.

#### Commerce Discovery

- PLP, search, and gifts: title, result count or range, filters, sort, active
  chips, recovery state, and grid appear before storytelling.
- Filters: understandable labels, no misleading option counts, keyboard access,
  reset behavior, and mobile sheet behavior.
- Product cards: stable aspect ratio, responsive image sizes, price formatting,
  wishlist state, sale state only when backed by data, and no invented stock
  precision.
- Search: query persistence, empty-state recovery, route shareability, and no
  hidden critical controls.
- Category and gift routes: behave as commerce listings, not local anchor-driven
  landing pages.

#### Product Detail and Purchase Confidence

- PDP first screen: gallery and purchase panel lead; service and related content
  follow.
- Product facts: name, price, material, availability, configurable options,
  sizing, and care/service information are clear.
- Availability: generic confidence language is allowed; exact public inventory
  counts are not allowed unless a future approved policy changes this.
- Trust: delivery, returns, support, and secure payment copy stays near purchase
  or submit context.
- Related products: secondary rail after purchase context, not a replacement
  for product facts.

#### Checkout, Account, and Service

- Checkout: cart state, form fields, validation, payment state, submit progress,
  and error recovery are explicit and testable.
- Payment: no optimistic success without provider confirmation; webhooks and
  callbacks must fail closed.
- Account: protected states, sign-in recovery, order access, privacy export, and
  empty states are clear.
- Service: contact options, service request flow, response expectations, and
  failure states are visible.
- AI and stylist: tool-first service surfaces, not primary public navigation or
  commerce CTAs.

#### Performance and Frontend Reliability

- Web Vitals: LCP, CLS, INP, long tasks, navigation timing, and route-level
  budgets are considered for public routes.
- Images: `next/image` fill usage includes explicit `sizes`; only initial
  above-the-fold media is prioritized; hidden media is not prioritized.
- Layout stability: boards, grids, galleries, cards, controls, and dynamic text
  have stable dimensions and responsive constraints.
- Loading states: user-visible async states use consistent loading, empty, and
  error surfaces.
- Route latency: performance QA route subset must stay representative of home,
  search, category, PDP, checkout, account, AI, and service.
- Asset drift: production build must preserve AVIF conversion expectations.

#### Backend, API, and Data Integrity

- API response shape: preserve public contracts and use shared response helpers.
- Validation: all I/O boundaries validate input before calling services.
- Rate limits: protected and expensive endpoints include correct rate-limit
  behavior and `Retry-After` where applicable.
- Service boundaries: business logic stays in services; adapters wrap external
  providers; route handlers do not own transactions.
- Provider failure: failures are explicit, logged where useful, and do not leak
  secrets or corrupt state.
- Database dependency: local and preview behavior must be documented when using
  fixtures or fallbacks; production must fail clearly if required providers are
  missing.
- Idempotency: webhooks, jobs, and payment flows avoid duplicate side effects.

#### Admin, Security, SEO, and Observability

- Admin workflows: authenticated, task-dense, auditable, and recoverable.
- Auditability: high-impact admin actions produce traceable state or logs.
- Auth: protected routes fail closed and preserve safe redirects.
- Security: no secret exposure, no unsafe redirects, no unauthenticated mutation,
  no public admin data leakage.
- SEO: public metadata, canonical behavior, indexability, structured content,
  and route status behavior remain intentional.
- Accessibility: landmarks, focus states, names, keyboard paths, contrast,
  reduced motion, and collision rules are verified for touched surfaces.
- Observability: smoke, health, logs, and artifact outputs support debugging
  without exposing sensitive data.

### Scoring and Pass/Fail Rules

Use explicit scoring only where a weighted benchmark exists.

| Benchmark class             |  Total | Threshold | Pass rule                                                            |
| --------------------------- | -----: | --------: | -------------------------------------------------------------------- |
| High Jewelry Reference Gate | `22.5` |   `11.25` | Support from at least 8 of 15 Tier A sites                           |
| Public benchmark corpus     | `37.5` |   `18.75` | Weighted score meets or exceeds threshold                            |
| Public structure policy     | `37.5` |   `18.75` | Decision is `allow` or `mandatory`                                   |
| Mandatory correctness       |    N/A |       N/A | Passes when the requirement is real, named, and implemented narrowly |
| Technical QA                |    N/A |       N/A | Passes when required checks for touched surface pass                 |

Decision statuses:

- `allow`: implement as requested or with minor adaptation.
- `demote`: keep only as secondary, non-primary, or lower-prominence behavior.
- `remove`: do not implement; remove or avoid the element unless an explicit
  exception is approved.
- `mandatory`: implement narrowly because legal, accessibility, payment, SEO,
  cookie, security, privacy, or backend correctness requires it.

When scoring is not available, document qualitative evidence, affected risk,
required checks, and the reason the decision is still safe.

### Required Evidence Format

Use this row format when collecting external or repository evidence:

| Field                | Required content                                                       |
| -------------------- | ---------------------------------------------------------------------- |
| Benchmark date       | ISO date of review                                                     |
| Route or subsystem   | Route, API, admin area, service, or component family                   |
| Change request       | One-sentence description                                               |
| Source               | Site name, local file, command, artifact, or provider contract         |
| Source type          | High Jewelry, corpus, public structure, QA, code, legal, security, ops |
| Evidence URL or path | URL, file path, command output artifact, or test name                  |
| Observed pattern     | What the source actually supports                                      |
| Weight or confidence | Weighted score, mandatory flag, or qualitative confidence              |
| Decision             | `allow`, `demote`, `remove`, or `mandatory`                            |
| Notes                | Caveats, conflicts, missing evidence, or implementation constraints    |

Feature decision record template:

```md
## Benchmark Decision: <feature/change>

- Date:
- Owner:
- Route/subsystem:
- Request:
- Benchmark class:
- Evidence:
- Score:
- Decision:
- Mandatory exception, if any:
- Implementation constraints:
- Required verification:
- Final notes:
```

Exception record template:

```md
## Benchmark Exception: <feature/change>

- Date:
- Exception type:
- Approver:
- Reason the benchmark did not pass:
- Reason implementation is still required:
- Narrowest acceptable implementation:
- Follow-up verification:
```

### Future Implementation Workflow

1. Classify the change as public UX, commerce, performance, backend/API, admin,
   security, accessibility, SEO, QA, release, or mixed.
2. Identify the route or subsystem and select the benchmark lens from the route
   matrix.
3. Collect evidence using the hierarchy above. For public UX, start with the
   High Jewelry Reference Gate.
4. Score weighted benchmarks when available. Record qualitative evidence when
   weighted scoring is not available.
5. Choose `allow`, `demote`, `remove`, or `mandatory`.
6. If the decision is `remove`, stop before editing files unless the user
   explicitly approves an exception.
7. If the decision is `demote`, implement only the lower-prominence version.
8. If the decision is `mandatory`, keep the change narrow and record the
   mandatory reason.
9. Implement using existing repo boundaries and UI conventions.
10. Run the smallest verification set that covers the touched surface.
11. Record benchmark score, exceptions, checks, and artifacts in the work
    summary or follow-up change note.

Implementation readiness checklist:

- [ ] The change class and route/subsystem are identified.
- [ ] The relevant benchmark source is selected.
- [ ] Evidence is recorded with URLs, paths, or command artifacts.
- [ ] Weighted score or mandatory reason is documented.
- [ ] Public structure policy is checked for public route changes.
- [ ] Accessibility and collision risks are considered.
- [ ] Security, auth, privacy, and provider failure risks are considered.
- [ ] Required verification commands are selected.
- [ ] Exception, if any, is explicit and narrow.

Route benchmark checklist:

- [ ] First viewport supports the route's primary job.
- [ ] Header, navigation, footer, and global chrome remain consistent.
- [ ] Primary commerce controls are visible before decorative content.
- [ ] Mobile controls fit, remain tappable, and do not overlap.
- [ ] Loading, empty, error, and recovery states are covered.
- [ ] Focus, keyboard, reduced motion, and accessible names are covered.
- [ ] Images, layout dimensions, and text fit are stable.
- [ ] Auth, data, provider, and payment behavior fail safely.

### QA and Verification Commands

Choose the smallest command set that covers the change. Escalate only when the
surface area or failure signal justifies it.

| Command               | Use when                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`   | Documentation, formatting, or Markdown drift                                                               |
| `pnpm verify:fast`    | Ordinary local changes needing lint, typecheck, and tests                                                  |
| `pnpm check`          | Legacy alias for lint, typecheck, and tests                                                                |
| `pnpm test`           | Focused unit or integration behavior changed                                                               |
| `pnpm qa:routes`      | Route inventory or app route coverage changed                                                              |
| `pnpm qa:performance` | Public performance, images, layout, or route timing changed                                                |
| `pnpm smoke`          | API health, core HTTP behavior, or preview smoke coverage changed                                          |
| `pnpm e2e`            | Public UI, commerce flow, responsive, auth, or route structure changed                                     |
| `pnpm visual:qa`      | Visual polish, overlays, mobile layout, or collision risk changed                                          |
| `pnpm build`          | Next.js config, assets, production behavior, or route rendering changed                                    |
| `pnpm gate:coherence` | Architecture boundaries, services, adapters, APIs, or shared contracts changed                             |
| `pnpm gate:runtime`   | Preview-only runtime behavior, smoke, e2e, and visual risk changed                                         |
| `pnpm gate:ship`      | Routine pre-deploy release validation                                                                      |
| `pnpm verify:full`    | Deliberate full release verification with DB, provider secrets, network, and live benchmark time available |

Doc-only benchmark updates normally require only `pnpm format:check`. They do
not require browser, DB, build, or live benchmark execution unless the document
change also updates code, tests, gates, or generated artifacts.

### Exception Handling and Change Notes

Exceptions are allowed only when they are mandatory or explicitly approved.
Record them in the work summary or follow-up change note.

Required exception fields:

- Benchmark that failed or was bypassed.
- Score or qualitative reason.
- Exception type: accessibility, legal, payment, SEO, cookie, security,
  privacy, backend-correctness, or explicit user-approved exception.
- Narrowest implementation that satisfies the exception.
- Verification commands or artifacts.
- Remaining risk.

Change note template:

```md
Benchmark summary:

- Class:
- Route/subsystem:
- Decision:
- Score:
- Evidence:
- Exception:
- Verification:
- Residual risk:
```

If future benchmark evidence conflicts with this document, update this document
and the enforcing code or tests together. Do not silently drift the docs, policy
constants, and implementation behavior apart.

---

## Part III — Release Procedure

### Coherence-preserving release

Finish a coherence-preserving production release without changing public URLs,
API shapes, tRPC contracts, Prisma schema, environment variable names, or
public UX text. Follow Part I as the contract:

- Keep business logic in `src/server/services`.
- Keep external provider and SDK wrapping in `src/server/adapters`.
- Keep route handlers and tRPC routers as I/O coordinators that validate, rate
  limit, call services, and return the existing public shape.
- Keep public import paths stable through facades or re-exports when code is
  split.
- Move implementation weight into focused sibling modules such as
  `*-inputs`, `*-contract`, `*-assets`, `*-types`, `_lib`, and leaf
  `_components`.
- Do not introduce unapproved debt markers, direct DB imports in routes, UI
  imports in services, adapter transactions, or new files above the coherence
  size threshold unless the exception is explicit in
  `scripts/coherence-contract.mjs`.

Execution order:

1. Inspect `git status --short` and preserve unrelated user changes.
2. Run `node scripts/coherence-contract.mjs`.
3. If the contract fails, fix boundaries with internal refactors only. Do not
   change public behavior unless a regression test proves an existing bug.
4. Run focused tests for changed modules.
5. Run `pnpm gate:coherence`.
6. Run `pnpm gate:ship`. Do not substitute `gate:full`; it is reserved for
   manual high-risk releases because it includes live public benchmarks.
7. Run `git diff --check` and inspect `git status --short`.
8. If a gate rewrites generated QA markdown with trailing blank lines, clean
   only `docs/QA_EVIDENCE.md`.
9. Confirm the linked Vercel project is `elysia`. If the Vercel CLI is not
   authenticated, stop and request authentication or a token.

### Production Deploy

Use `verify:fast` while iterating locally, `gate:coherence` before opening or
updating a PR, and `gate:ship` as the standing pre-deploy gate. Use
`verify:full` only for explicit full release verification where DB, provider
secrets, network access, and live benchmark duration are acceptable.

1. Run `pnpm verify:fast`.
2. Run `pnpm gate:coherence`.
3. Run `pnpm gate:ship`.
4. Run `git diff --check` and inspect `git status --short`.
5. If generated QA markdown has trailing blank lines, clean only
   `docs/QA_EVIDENCE.md`.
6. Deploy the linked Vercel project with:
   `vercel pull --yes --environment=production`,
   `vercel build --prod`, and
   `vercel deploy --prebuilt --prod`.
7. Smoke the production URL with the same route coverage as `scripts/smoke.mjs`.
8. Record the deploy URL, smoke result, and any remaining documented coherence
   exceptions, and log the deployment in `docs/QA_EVIDENCE.md`
   (production deployment evidence ledger).
