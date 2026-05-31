# Multi-Aspect Improvement Backlog

Status: active cross-product improvement tracker.

Last reviewed: 2026-05-31.

This document tracks practical Elysia improvements across product, commerce,
operations, reliability, accessibility, privacy, security, QA, and release
readiness. It complements, but does not replace:

- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/PUBLIC_CHANGE_GATE.md`
- `docs/ENGINEERING_CONVENTIONS.md`
- `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`

Use this backlog to choose work that is safe to start, to separate candidate
ideas from benchmark-approved work, and to keep external blockers explicit.
Update it when an item is started, completed, superseded, blocked, or unblocked.

## Item Schema

Every backlog item must include:

- `ID`
- `Aspect`
- `Status`
- `Priority`
- `Effort`
- `Source/Evidence`
- `Target Surface`
- `Improvement`
- `Acceptance Checks`
- `Verification`

Blocked items must also state the blocker and the exact unblock condition inside
the `Improvement` field.

Allowed statuses:

- `Actionable Now`
- `Needs Benchmark`
- `Blocked`
- `Deferred`
- `Done`

Allowed aspects:

- Public UX and Brand
- Commerce and Checkout
- Admin and Operations
- Backend, API, and Data
- Performance, PWA, and Reliability
- Accessibility, Privacy, and Security
- QA, Release, and Observability

Priority scale:

- `P0`: release-critical or data/payment/security correctness.
- `P1`: important product quality or operational confidence.
- `P2`: useful polish, evidence quality, or resilience improvement.

Effort scale:

- `S`: documentation, small audit, or narrow test.
- `M`: one focused subsystem or cross-route review.
- `L`: multi-subsystem work, provider coordination, or live rollout validation.

## Done

### I-001 Route Evidence Ledger

- `ID`: I-001
- `Aspect`: QA, Release, and Observability
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `docs/FULL_PRODUCT_BENCHMARK.md`,
  `scripts/qa-route-inventory.ts`, `scripts/qa-site-audit.ts`,
  `docs/qa/route-evidence-ledger.md`
- `Target Surface`: Public routes, account routes, admin routes, and documented
  API routes
- `Improvement`: Created a lightweight route evidence ledger that records the
  latest meaningful verification signal for each significant route or route
  group before product-changing work is accepted.
- `Acceptance Checks`: Each tracked route group has an owner-facing evidence
  entry with route, change class, last checked date, command or artifact, and
  remaining risk.
- `Verification`: `pnpm qa:routes` passed on 2026-05-31 and covered 58 app route
  templates. A full seeded inventory artifact was generated at
  `artifacts/qa/2026-05-31-route-evidence-ledger`.

### I-002 Floating Chrome Collision Audit

- `ID`: I-002
- `Aspect`: Accessibility, Privacy, and Security
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `docs/PUBLIC_CHANGE_GATE.md`,
  `src/styles/floating-chrome-contract.test.ts`,
  `src/components/public-motion-provider.tsx`,
  `docs/qa/floating-chrome-collision-audit.md`
- `Target Surface`: Cookie banner, accessibility widget, mobile navigation,
  sheets, dialogs, sticky checkout controls, and floating public controls
- `Improvement`: Audited overlap and focus behavior for global floating chrome so
  it does not cover purchase controls, form controls, or recovery actions across
  desktop and mobile viewports.
- `Acceptance Checks`: Core public pages show no incoherent overlap at mobile,
  tablet, or desktop sizes; focus remains visible; Escape and close behavior
  remain predictable for modal surfaces.
- `Verification`: `pnpm test -- src/styles/floating-chrome-contract.test.ts`
  passed with 7 tests. Focused agent-browser visual QA passed for `/`,
  `/product/venus-line-ring`, `/checkout`, and `/category/earrings` across
  desktop, tablet, and mobile. Manual mobile interaction checks passed for
  cookie/accessibility spacing, mobile nav sheet, category filter sheet, and
  accessibility dialog.

## Actionable Now

### I-003 Split Checkout UX and Copy Review

- `ID`: I-003
- `Aspect`: Commerce and Checkout
- `Status`: Actionable Now
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`,
  checkout service tests, checkout UI behavior
- `Target Surface`: `/checkout`, cart grouping, Shopify checkout redirect, local
  checkout form, offline and disabled-provider states
- `Improvement`: Review the UX and copy for `OWN`, Shopify-only, mixed cart,
  offline, missing Shopify config, and missing local payment config states so
  the split checkout model is clear without exposing confusing provider detail.
- `Acceptance Checks`: Each source combination has distinct user-facing copy,
  a valid action or recovery path, no fake combined payment promise, and no path
  that routes Shopify products through local payment or local products through
  Shopify checkout.
- `Verification`: Run `pnpm test` for the cart checkout and Shopify dropship
  checkout service tests, then include one manual checkout UI pass.

### I-004 Order Source Label Audit

- `ID`: I-004
- `Aspect`: Admin and Operations
- `Status`: Actionable Now
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`,
  account order pages, admin order pages, Shopify order mirror service tests
- `Target Surface`: Account orders, admin order list, admin order detail,
  customer summaries, operational support views
- `Improvement`: Audit source labels and available actions for local orders and
  Shopify mirror orders so operators cannot confuse read-only supplier-backed
  mirrors with local orders that can be captured, refunded, fulfilled, or
  adjusted.
- `Acceptance Checks`: Local and Shopify-backed orders have clear labels;
  Shopify mirror records expose only supported read-oriented actions; customer
  and admin wording stays consistent.
- `Verification`: Run `pnpm test` for the Shopify order mirror and admin
  operations service tests, then manually inspect the account and admin order
  surfaces with representative local and Shopify records.

### I-005 Public Performance Sweep

- `ID`: I-005
- `Aspect`: Performance, PWA, and Reliability
- `Status`: Actionable Now
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `scripts/qa-site-audit.ts`,
  `scripts/qa-route-inventory.ts`, `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: High-traffic public pages, dynamic category/product pages,
  search, gifts, checkout, service, content pages, offline page
- `Improvement`: Run a performance-focused sweep against the existing QA route
  matrix and record routes that exceed navigation, CLS, TBT, image, or console
  error budgets.
- `Acceptance Checks`: Each finding has route, viewport, browser, metric,
  artifact path, likely cause, and recommended remediation class.
- `Verification`: Run `pnpm qa:performance` against a stable local or preview
  base URL and archive the generated QA artifacts.

### I-006 Provider Negative-Path Review

- `ID`: I-006
- `Aspect`: Backend, API, and Data
- `Status`: Actionable Now
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `docs/ENGINEERING_CONVENTIONS.md`, API response boundary
  policy, provider service tests, webhook route tests
- `Target Surface`: Shopify, CardCom, Cloudinary, search, AI providers,
  webhooks, rate-limited API routes, job runner routes
- `Improvement`: Review provider failure paths for consistent validation,
  rate-limit responses, retry hints, webhook signature failures, production-only
  config failures, and redacted operational detail.
- `Acceptance Checks`: Negative paths return stable public response shapes,
  include `Retry-After` where rate-limited, do not leak secrets, and fail
  clearly in production when required provider configuration is missing.
- `Verification`: Run relevant provider and route tests plus `pnpm test`; use
  `pnpm production:readiness` when validating production configuration behavior.

## Candidate Improvements

Candidate items are not implementable by default. Public-facing candidates must
pass `docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before
product code is edited.

### I-007 Search and Category Filter Density

- `ID`: I-007
- `Aspect`: Public UX and Brand
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: New candidate idea; benchmark required against search,
  PLP, gifts, and category guidance in `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: `/search`, `/category/[slug]`, `/gifts`, filter sheets,
  active refinement summaries, sort controls
- `Improvement`: Consider tightening filter density and active filter summaries
  so shoppers can scan applied choices, counts, and recovery actions faster on
  mobile and desktop.
- `Acceptance Checks`: Benchmark decision records whether the change is
  supported; if supported, active refinements remain tappable, readable, and do
  not crowd product discovery controls.
- `Verification`: Run the benchmark workflow first; implementation verification
  would require route tests, visual QA, and filter utility tests.

### I-008 PDP Purchase Confidence Pass

- `ID`: I-008
- `Aspect`: Public UX and Brand
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: New candidate idea; benchmark required against the PDP
  route guidance in `docs/FULL_PRODUCT_BENCHMARK.md` and
  `docs/PUBLIC_CHANGE_GATE.md`
- `Target Surface`: `/product/[slug]`, purchase panel, availability language,
  service entry, recommendations, media facts
- `Improvement`: Consider improving purchase confidence around availability,
  sizing, service support, delivery/recovery copy, and source-specific checkout
  expectations.
- `Acceptance Checks`: Benchmark decision confirms supported placement and copy
  density; the purchase panel remains the primary task area and does not become
  marketing-heavy.
- `Verification`: Run benchmark workflow first; implementation verification
  would require PDP tests, product purchase utility tests, and visual QA.

### I-009 Account Recovery and Service Shortcuts

- `ID`: I-009
- `Aspect`: Commerce and Checkout
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: New candidate idea; account and service route guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: `/account`, `/account/orders/[id]`, service links, return
  request states, privacy export
- `Improvement`: Consider adding clearer recovery or service shortcuts for
  customers who need order help, returns, privacy export help, or supplier-backed
  order support.
- `Acceptance Checks`: Benchmark decision confirms the shortcuts improve
  task-first account behavior without cluttering protected account content.
- `Verification`: Run benchmark workflow first; implementation verification
  would require account route tests and manual auth-state checks.

### I-010 AI and Stylist Fallback UX

- `ID`: I-010
- `Aspect`: Performance, PWA, and Reliability
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: New candidate idea; AI and stylist route guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`, AI quota routing behavior
- `Target Surface`: `/ai`, `/stylist`, chat route, AI provider quota and
  readiness states
- `Improvement`: Consider clearer fallback UX when AI providers are unavailable,
  quota-blocked, or missing configuration, including product discovery recovery
  paths that do not depend on generated output.
- `Acceptance Checks`: Benchmark decision confirms the fallback remains a
  demoted service/tool experience and does not overpromote AI on public routes.
- `Verification`: Run benchmark workflow first; implementation verification
  would require AI route tests, quota-router tests, and manual degraded-state
  checks.

## Blocked / Deferred

### I-011 Real Shopify Supplier Connection

- `ID`: I-011
- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Shopify supplier channel, product sourcing, fulfillment
- `Improvement`: Blocker: no real supplier connection has been confirmed inside
  Shopify. Unblock condition: the supplier is connected through its supported
  Shopify workflow and exposes confirmable product, inventory, and fulfillment
  behavior.
- `Acceptance Checks`: Supplier products can be identified in Shopify with
  real handles, product IDs, variant IDs, SKUs, inventory behavior, and supplier
  metadata.
- `Verification`: Run `pnpm shopify:dropship:doctor -- --first 5` and record
  supplier-side evidence outside the repository.

### I-012 Paid Shopify Checkout Test

- `ID`: I-012
- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Shopify Checkout, production checkout redirect, order
  completion
- `Improvement`: Blocker: a real paid Shopify Checkout test has not been
  completed. Unblock condition: a paid test product can complete Shopify
  Checkout end to end without breaking local Elysia commerce behavior.
- `Acceptance Checks`: Checkout creates a Shopify order, customer-facing
  completion behavior is valid, and local account/admin mirror behavior is
  observed if webhooks are enabled.
- `Verification`: Run `pnpm shopify:dropship:doctor` with `--first 5`,
  `--register-orders-webhook`, and
  `--site-url https://elysia-jewellery.com` before and after the paid test, then
  confirm the order in Shopify.

### I-013 Supplier Fulfillment Confirmation

- `ID`: I-013
- `Aspect`: Admin and Operations
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Supplier fulfillment workflow, Shopify order handoff,
  support operations
- `Improvement`: Blocker: supplier fulfillment behavior has not been confirmed
  for Shopify-created orders. Unblock condition: the supplier receives and can
  fulfill a Shopify-created test order through its normal integration.
- `Acceptance Checks`: Supplier receipt, fulfillment status, cancellation or
  failure path, and customer support handoff are documented.
- `Verification`: Confirm in Shopify Admin and supplier tooling; record
  operational evidence in the Shopify roadmap or a linked release note.

### I-014 CardCom Production Credentials

- `ID`: I-014
- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`,
  production readiness checks
- `Target Surface`: Local `OWN` product online payment, production readiness,
  provider health
- `Improvement`: Blocker: `CARD_COM_TERMINAL`, `CARD_COM_API_NAME`, and
  `CARD_COM_API_PASSWORD` are not available. Unblock condition: production and
  preview environments have valid CardCom credentials for local Elysia checkout.
- `Acceptance Checks`: Local `OWN` checkout can be treated as production-ready
  without relying on fallback or disabled payment behavior.
- `Verification`: Run `pnpm production:readiness` and any CardCom-specific
  smoke or webhook checks available at the time of credential setup.

### I-015 SMS Provider Credentials

- `ID`: I-015
- `Aspect`: Backend, API, and Data
- `Status`: Deferred
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`,
  production readiness checks
- `Target Surface`: SMS notifications, customer service notifications,
  provider readiness
- `Improvement`: Blocker: `SMS_PROVIDER_API_KEY` is not available and SMS is
  deferred. Unblock condition: SMS delivery is re-enabled as a product
  requirement and valid provider credentials are available in the relevant
  environments.
- `Acceptance Checks`: SMS-dependent flows either remain explicitly unavailable
  or pass provider readiness and delivery validation once re-enabled.
- `Verification`: Run `pnpm production:readiness` and provider-specific smoke
  checks once SMS credentials exist.

### I-016 Shopify Dashboard UI Automation

- `ID`: I-016
- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Shopify Dashboard UI verification through agent browser
- `Improvement`: Blocker: Shopify login and Cloudflare verification block
  dashboard UI automation in the agent browser. Unblock condition: a reliable,
  permitted dashboard automation path exists, or dashboard checks are replaced
  with API-backed verification.
- `Acceptance Checks`: Required Shopify operational facts can be verified
  repeatably without manual browser login friction.
- `Verification`: Prefer `pnpm shopify:dropship:doctor` and Shopify API checks;
  use dashboard evidence only when a human operator can complete login safely.

### I-017 Local Vercel Prebuilt Packaging

- `ID`: I-017
- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Local Windows prebuilt Vercel packaging,
  `.vercel/output/functions`
- `Improvement`: Blocker: local `vercel build --prod` prebuilt packaging fails
  on this Windows machine with an `EPERM` symlink permission error. Unblock
  condition: a Windows-safe packaging path, permissions fix, WSL path, or Vercel
  CLI workaround is confirmed.
- `Acceptance Checks`: Local prebuilt packaging can complete, or the release
  process explicitly documents remote Vercel build as the supported path for
  this environment.
- `Verification`: Retry local prebuilt packaging only after the environment or
  workflow changes; otherwise continue using direct Vercel remote builds.

## Interfaces and Compatibility

- This backlog introduces no runtime, API, schema, type, or product behavior
  change.
- The only new interface is the documentation schema defined above.
- `Needs Benchmark` is not implementable status for public product changes.
  Those items must first pass `docs/PUBLIC_CHANGE_GATE.md` or
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Blocked` and `Deferred` items must not be treated as active implementation
  work until their unblock conditions are met.

## Maintenance Rules

- Move an item to `Done` only when its acceptance checks and verification are
  recorded.
- Move an item from `Needs Benchmark` to `Actionable Now` only after benchmark
  evidence is recorded.
- Keep blocker language concrete: name the missing credential, provider action,
  operational proof, or environment condition.
- Add new items conservatively. Prefer evidence from repository docs, route
  inventory, tests, provider checks, QA artifacts, or explicit product decisions.
