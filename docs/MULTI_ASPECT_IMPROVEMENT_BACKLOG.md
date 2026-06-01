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

## Actionable Now

## Candidate Improvements

Candidate items are not implementable by default. Public-facing candidates must
pass `docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before
product code is edited.

### I-034 Product Gallery Media Fallback and Thumbnail Clarity

- `ID`: I-034
- `Aspect`: Public UX and Brand
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `/product/[slug]`, product gallery behavior, PDP media
  guidance in `docs/FULL_PRODUCT_BENCHMARK.md`, and public visual guardrails
- `Target Surface`: Product gallery, thumbnail controls, missing-image fallback,
  image alt and selected-state copy
- `Improvement`: Consider improving gallery thumbnail clarity, selected-image
  state, and missing-media fallback without changing gallery-first PDP layout or
  adding decorative media.
- `Acceptance Checks`: Benchmark confirms the gallery remains product-led,
  thumbnails are accessible and stable, and fallback states do not obscure the
  purchase panel.
- `Verification`: Run benchmark workflow first; implementation verification
  would require gallery structure tests and product media guardrail tests.

### I-035 Checkout Validation Summary and Payment Confidence Placement

- `ID`: I-035
- `Aspect`: Commerce and Checkout
- `Status`: Needs Benchmark
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `/checkout`, checkout validation recovery, delivery
  confidence benchmark, payment provider guardrails, and public checkout
  guidance in `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Checkout form validation summary, payment confidence copy,
  submit-state recovery, delivery confidence summary
- `Improvement`: Consider clearer checkout validation and payment-confidence
  placement near submit actions without adding optimistic payment success or
  unsupported provider promises.
- `Acceptance Checks`: Benchmark confirms clarity improves checkout recovery,
  keeps payment correctness strict, and does not add provider claims that are
  not backed by live integrations.
- `Verification`: Run benchmark workflow first; implementation verification
  would require checkout form tests, payment boundary tests, and service trust
  placement tests.

### I-036 Account Dashboard Data Recovery and Privacy Shortcut Clarity

- `ID`: I-036
- `Aspect`: Accessibility, Privacy, and Security
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `/account`, `/account/orders/[id]`, privacy export route,
  account recovery shortcut benchmark, and account guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Account dashboard recovery shortcuts, protected empty
  states, privacy export recovery, order service links
- `Improvement`: Consider whether account recovery and privacy actions need
  clearer grouping or status copy without exposing protected data or adding
  unsupported self-service actions.
- `Acceptance Checks`: Benchmark confirms account recovery remains protected,
  privacy actions are clear, and service links route to existing supported
  flows only.
- `Verification`: Run benchmark workflow first; implementation verification
  would require account recovery tests, privacy export tests, and auth boundary
  checks.

### I-037 Offline Page Install and PWA Recovery Priority

- `ID`: I-037
- `Aspect`: Performance, PWA, and Reliability
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `/offline`, manifest shortcuts, service worker allowlist,
  PWA offline recovery tests, and PWA guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Offline page actions, PWA shortcut ordering, install
  prompt copy, cached public routes
- `Improvement`: Consider whether offline recovery should better prioritize
  cached product discovery, size guide, service, and retry actions without
  promising offline checkout completion.
- `Acceptance Checks`: Benchmark confirms offline recovery remains realistic,
  cached routes are route-backed, and install/retry copy does not imply
  unsupported offline commerce.
- `Verification`: Run benchmark workflow first; implementation verification
  would require manifest tests, service worker route tests, and offline recovery
  tests.

## Completed Work

### I-033 Category No-Result Recovery Depth

- `ID`: I-033
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `/category/[slug]` filtered empty state, PLP guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, and
  `docs/qa/category-no-result-recovery-depth-benchmark.md`
- `Target Surface`: Category filtered empty states, reset links, adjacent
  category continuation, active refinement recovery
- `Improvement`: Added compact no-result recovery inside the existing category
  empty state with route-backed adjacent category continuations, reset, and
  search continuation. Category continuations appear only when the current
  filter selection returns products in another category.
- `Acceptance Checks`: Benchmark decision confirms category recovery can deepen
  product discovery while preserving listing density, active filter clarity,
  and route-backed actions only.
- `Verification`: Benchmark passed with weighted support of `16.5` against the
  `11.25` threshold. Covered by
  `src/app/category/[slug]/_lib/category-filter-state.test.ts`,
  `src/styles/category-no-result-recovery-depth.test.ts`,
  `src/styles/category-active-filter-sort-clarity.test.ts`,
  `src/styles/discovery-filter-density.test.ts`, and
  `src/styles/public-structure-enforcement.test.ts`; verified with
  `pnpm test -- src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/category-no-result-recovery-depth.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts src/styles/public-structure-enforcement.test.ts`.

### I-028 Production Deployment Evidence Ledger

- `ID`: I-028
- `Aspect`: QA, Release, and Observability
- `Status`: Done
- `Priority`: P1
- `Effort`: S
- `Source/Evidence`: Recent production deploy flow, `scripts/smoke.mjs`,
  Vercel deployment inspection output, and release-readiness guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Production deploy notes, smoke evidence, release checklist
  documentation
- `Improvement`: Added `docs/qa/production-deployment-evidence-ledger.md` to
  record the latest production deployment URL, production alias, smoke command,
  smoke result, repeatable verification commands, and remaining production
  risks without storing secrets or raw dashboard data.
- `Acceptance Checks`: The ledger is repeatable, does not include secrets, names
  the production alias explicitly, and links each deploy decision to concrete
  local and production checks.
- `Verification`: Verified with `vercel ls --yes`,
  `vercel inspect https://elysia-j8xnjw9iq-ariel-twitos-projects.vercel.app`,
  `vercel logs https://elysia-j8xnjw9iq-ariel-twitos-projects.vercel.app --level error --since 1h --json`,
  `SMOKE_BASE_URL=https://elysia-jewellery.com pnpm smoke`,
  `pnpm exec prettier --check docs/qa/production-deployment-evidence-ledger.md docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md`,
  and `git diff --check`.

### I-018 Production Smoke Coverage for Recent Public Decisions

- `ID`: I-018
- `Aspect`: QA, Release, and Observability
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `scripts/smoke.mjs`, recent public-decision smoke needs,
  production release checks, and current route inventory
- `Target Surface`: `scripts/smoke.mjs`, production smoke coverage, route checks
- `Improvement`: Added smoke checks that cover homepage shortcuts, account
  logged-out state, checkout availability, and public health without requiring
  authenticated data.
- `Acceptance Checks`: Smoke coverage validates recent public UI decisions
  through stable public markers or route responses, avoids authenticated-only
  assumptions, and does not require seed-specific private data.
- `Verification`: Covered by `scripts/smoke.test.mjs`; verified with
  `pnpm test -- scripts/smoke.test.mjs`,
  `SMOKE_BASE_URL=https://elysia-jewellery.com pnpm smoke`, `pnpm lint`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md scripts/smoke.mjs scripts/smoke.test.mjs`.

### I-019 Route-Level Error Boundary Recovery Audit

- `ID`: I-019
- `Aspect`: Performance, PWA, and Reliability
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: Existing route `error.tsx` files, public/admin recovery
  patterns, and `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Route `error.tsx` files, public/admin error states
- `Improvement`: Added route-backed recovery actions to account/admin error
  boundaries and locked all route error boundaries behind a recovery contract.
- `Acceptance Checks`: Error boundaries use consistent retry and safe-route
  recovery actions, preserve accessible headings/copy, avoid provider/raw error
  details, and route users back to a real safe task.
- `Verification`: Covered by `src/styles/route-error-boundary-recovery.test.ts`;
  verified with
  `pnpm test -- src/styles/route-error-boundary-recovery.test.ts`,
  `pnpm lint`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/app/account/error.tsx src/app/admin/error.tsx src/app/category/[slug]/error.tsx src/styles/route-error-boundary-recovery.test.ts`.

### I-020 Admin Audit and Outbox Empty-State Review

- `ID`: I-020
- `Aspect`: Admin and Operations
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: Admin route patterns, audit/outbox operational needs, and
  existing admin empty-state guardrails
- `Target Surface`: `/admin/audit`, outbox/job/admin operational views
- `Improvement`: Added filtered/unfiltered empty-state recovery to audit,
  aligned outbox status filtering with supported backend inputs, and added
  recoverable job-run filters without adding unsupported automation.
- `Acceptance Checks`: Operators can distinguish no data, filtered-out data,
  unavailable data, and unsupported actions; reset/recovery paths are explicit.
- `Verification`: Covered by `src/styles/admin-empty-state-contract.test.ts`;
  verified with `pnpm test -- src/styles/admin-empty-state-contract.test.ts`,
  `pnpm lint`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/app/admin/audit/page.tsx src/app/admin/integrations/page.tsx src/styles/admin-empty-state-contract.test.ts`.

### I-021 API Response Boundary Consistency Audit

- `ID`: I-021
- `Aspect`: Backend, API, and Data
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: API route handlers, shared response helpers, validation
  tests, and backend benchmark guidance in `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: API route handlers, shared response helpers, validation
  failures
- `Improvement`: Replaced a cart-count error path that returned a success
  helper with a 4xx status, and expanded the API boundary contract so error
  status responses cannot be sent through `okJson`.
- `Acceptance Checks`: Public and protected API routes return consistent JSON
  envelopes, fail closed on auth/validation errors, and avoid divergent ad hoc
  error responses.
- `Verification`: Covered by
  `src/server/http/api-response-boundary.test.ts`,
  `src/server/http/api-response.test.ts`, and
  `src/app/api/cart/count/route.test.ts`; verified with
  `pnpm test -- src/app/api/cart/count/route.test.ts src/server/http/api-response-boundary.test.ts src/server/http/api-response.test.ts`,
  `pnpm lint`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/app/api/cart/count/route.ts src/app/api/cart/count/route.test.ts src/server/http/api-response-boundary.test.ts src/server/http/api-response.test.ts`.

### I-022 PWA Cache and Manifest Shortcut Drift Audit

- `ID`: I-022
- `Aspect`: Performance, PWA, and Reliability
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: Service worker route allowlist, manifest shortcuts,
  offline recovery, and current public navigation
- `Target Surface`: Service worker route allowlist, manifest shortcuts, offline
  recovery
- `Improvement`: Aligned PWA shortcuts with the current public navigation by
  replacing the live-only checkout shortcut with `/gifts`, added `/gifts` to
  offline recovery actions, and locked shortcut/cache drift with manifest and
  offline recovery contract tests.
- `Acceptance Checks`: Manifest shortcuts point to real current routes, service
  worker allowlists cover supported offline recovery paths, and offline copy does
  not promise unsupported commerce behavior.
- `Verification`: Covered by `src/app/manifest.test.ts`,
  `src/app/serwist-route.test.ts`, and
  `src/styles/pwa-offline-recovery.test.ts`; verified with
  `pnpm test -- src/app/manifest.test.ts src/app/serwist-route.test.ts src/styles/pwa-offline-recovery.test.ts`,
  `pnpm lint`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/app/manifest.ts src/app/manifest.test.ts src/app/offline/page.tsx src/styles/pwa-offline-recovery.test.ts src/app/serwist-route.test.ts`.

### I-023 Search Empty-State Guided Recovery

- `ID`: I-023
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: Search route behavior, empty-state recovery patterns,
  `docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, and
  `docs/qa/search-empty-state-guided-recovery-benchmark.md`
- `Target Surface`: `/search` empty state, query persistence, recovery links
- `Improvement`: Added compact visible guidance for existing count-backed
  search recovery actions, replacing hidden `title`-only explanation while
  keeping `/search` task-first and not adding content sections or unsupported
  destinations.
- `Acceptance Checks`: Benchmark decision confirms the recovery pattern improves
  search continuation while preserving PLP/search structure and scan speed.
- `Verification`: Benchmark passed with weighted support of `16.5` against the
  `11.25` threshold. Covered by `src/styles/search-empty-recovery.test.ts` and
  `src/app/search/_lib/search-state.test.ts`; verified with
  `pnpm test -- src/app/search/_lib/search-state.test.ts src/styles/search-empty-recovery.test.ts src/styles/discovery-filter-density.test.ts src/styles/cta-hierarchy.test.ts`,
  `pnpm lint`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md docs/qa/search-empty-state-guided-recovery-benchmark.md src/app/search/page.tsx src/styles/search-empty-recovery.test.ts src/app/search/_lib/search-state.test.ts`.

### I-024 Category Active Filter and Sort Clarity

- `ID`: I-024
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: Category filter behavior, PLP guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, and
  `docs/qa/category-active-filter-sort-clarity-benchmark.md`
- `Target Surface`: `/category/[slug]`, filter sheet, sort, active refinements
- `Improvement`: Added explicit sort context to mobile and desktop active
  refinement summaries and changed active reset actions to clear `איפוס הכל`
  copy without adding extra PLP controls or changing product-grid density.
- `Acceptance Checks`: Benchmark decision confirms active refinement clarity is
  supported and does not push category pages beyond reference density.
- `Verification`: Benchmark passed with weighted support of `16.5` against the
  `11.25` threshold. Covered by
  `src/styles/category-active-filter-sort-clarity.test.ts`,
  `src/styles/discovery-filter-density.test.ts`, and
  `src/app/category/[slug]/_lib/category-filter-state.test.ts`; verified with
  `pnpm test -- src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts src/styles/cta-hierarchy.test.ts src/styles/mobile-commerce-density.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md docs/qa/category-active-filter-sort-clarity-benchmark.md src/app/category/[slug]/page.tsx src/app/category/[slug]/_components/deferred-category-filter-panel.tsx src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts src/app/category/[slug]/_lib/category-filter-state.test.ts`.

### I-025 PDP Size, Care, and Fit Fact Placement

- `ID`: I-025
- `Aspect`: Commerce and Checkout
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: PDP purchase-confidence guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, current
  product purchase panel behavior, and
  `docs/qa/pdp-size-care-fit-fact-placement-benchmark.md`
- `Target Surface`: `/product/[slug]`, purchase panel, size guide,
  care/warranty facts
- `Improvement`: Passed existing care and warranty facts into the PDP purchase
  panel and surfaced them inside the existing service confidence item near the
  purchase action, while keeping gallery, options, CTA order, product detail
  rows, and recommendation rails unchanged.
- `Acceptance Checks`: Benchmark decision confirms the placement improves
  purchase confidence without displacing gallery, options, price, availability,
  or primary purchase actions.
- `Verification`: Benchmark passed with weighted support of `16.5` against the
  `11.25` threshold. Covered by
  `src/app/product/[slug]/_components/product-purchase-utils.test.ts`,
  `src/styles/product-purchase-facts-placement.test.ts`, and
  `src/styles/service-trust-placement.test.ts`; verified with
  `pnpm test -- src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/product-purchase-facts-placement.test.ts src/styles/service-trust-placement.test.ts src/app/product/[slug]/_lib/product-recommendation-rails.test.ts src/styles/cta-hierarchy.test.ts src/styles/mobile-commerce-density.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md docs/qa/pdp-size-care-fit-fact-placement-benchmark.md src/app/product/[slug]/page.tsx src/app/product/[slug]/_components/product-purchase-panel.tsx src/app/product/[slug]/_components/product-purchase-utils.ts src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/product-purchase-facts-placement.test.ts`.

### I-026 Service Response Expectations and Contact Clarity

- `ID`: I-026
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: Service route behavior, service request form recovery,
  `docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, and
  `docs/qa/service-response-contact-clarity-benchmark.md`
- `Target Surface`: `/service`, service request form, confirmation/recovery copy
- `Improvement`: Added compact response expectations to the service route,
  surfaced selected-topic guidance inside the form, and updated online/offline
  confirmation copy to reference the chosen contact preference without adding
  unsupported contact channels or hard response-time SLAs.
- `Acceptance Checks`: Benchmark decision confirms service clarity improves
  trust while keeping the service route compact, task-first, and route-backed.
- `Verification`: Benchmark passed with weighted support of `16.5` against the
  `11.25` threshold. Covered by
  `src/styles/service-response-contact-clarity.test.ts`,
  `src/styles/service-trust-placement.test.ts`,
  `src/styles/service-attachment-ux.test.ts`, and
  `src/styles/form-error-recovery-contract.test.ts`; verified with
  `pnpm test -- src/styles/service-response-contact-clarity.test.ts src/styles/service-trust-placement.test.ts src/styles/service-attachment-ux.test.ts src/styles/form-error-recovery-contract.test.ts src/styles/cta-hierarchy.test.ts src/styles/mobile-commerce-density.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md docs/qa/service-response-contact-clarity-benchmark.md src/app/service/page.tsx src/app/service/_components/service-request-form.tsx src/app/service/actions.ts src/styles/service-response-contact-clarity.test.ts src/styles/service-trust-placement.test.ts src/styles/service-attachment-ux.test.ts src/styles/form-error-recovery-contract.test.ts`.

### I-027 FAQ and Content Route Service Recovery Links

- `ID`: I-027
- `Aspect`: Accessibility, Privacy, and Security
- `Status`: Done
- `Priority`: P2
- `Effort`: S
- `Source/Evidence`: FAQ/content/legal route behavior,
  `docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, and
  `docs/qa/faq-content-service-recovery-links-benchmark.md`
- `Target Surface`: `/faq`, legal/content routes, service recovery links
- `Improvement`: Added compact route-backed service recovery links from FAQ,
  terms, privacy, and accessibility pages to existing `/service` topics for
  general questions, orders, privacy, and accessibility without adding new
  channels or content sections.
- `Acceptance Checks`: Benchmark decision confirms recovery links improve task
  completion without crowding readable content or adding unsupported flows.
- `Verification`: Benchmark passed with weighted support of `16.5` against the
  `11.25` threshold. Covered by
  `src/styles/content-route-service-recovery.test.ts`,
  `src/styles/service-trust-placement.test.ts`, and
  `src/styles/public-structure-enforcement.test.ts`; verified with
  `pnpm test -- src/styles/content-route-service-recovery.test.ts src/styles/service-trust-placement.test.ts src/styles/public-structure-enforcement.test.ts src/styles/cta-hierarchy.test.ts src/styles/mobile-commerce-density.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md docs/qa/faq-content-service-recovery-links-benchmark.md src/app/faq/page.tsx src/app/privacy/page.tsx src/app/terms/page.tsx src/app/accessibility/page.tsx src/styles/content-route-service-recovery.test.ts`.

### I-029 Admin Service Queue Empty and Filter-State Audit

- `ID`: I-029
- `Aspect`: Admin and Operations
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `/admin/service`, existing admin empty-state contract
  tests, service request lifecycle, and admin operations guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: `/admin/service`, service request filters, service request
  empty/loading/error states
- `Improvement`: Hardened the admin service queue by normalizing invalid
  `page` and `status` query params before backend calls, adding visible active
  filter labels, distinguishing filtered-empty from globally empty states, and
  keeping status copy tied to shared lifecycle labels.
- `Acceptance Checks`: Service filters have explicit reset/recovery paths,
  empty states do not imply automation that does not exist, and request status
  terminology stays aligned with backend lifecycle labels.
- `Verification`: Covered by
  `src/styles/admin-service-queue-filter-state.test.ts` and
  `src/styles/admin-empty-state-contract.test.ts`; verified with
  `pnpm test -- src/styles/admin-service-queue-filter-state.test.ts src/styles/admin-empty-state-contract.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/app/admin/service/page.tsx src/styles/admin-service-queue-filter-state.test.ts src/styles/admin-empty-state-contract.test.ts`.

### I-030 Offline Sync Response and Retry Contract Audit

- `ID`: I-030
- `Aspect`: Performance, PWA, and Reliability
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `/api/pwa/sync`, `/api/pwa/sync/service-request`,
  `src/lib/pwa-offline`, offline smoke needs, and existing PWA tests
- `Target Surface`: Offline sync API responses, queued service requests,
  queued cart actions, retry feedback
- `Improvement`: Added a stable offline sync response envelope with
  `ok`, `summary`, and `results`, preserved partial-failure retry details
  without marking the whole request as transport-failed, and sanitized queued
  action error copy before it reaches the PWA client.
- `Acceptance Checks`: Offline sync responses use stable success/error shapes,
  service-request retry failures preserve user recovery guidance, and cart sync
  failures avoid raw provider or network detail.
- `Verification`: Covered by
  `src/app/api/pwa/sync/route.test.ts`,
  `src/app/api/pwa/sync/service-request/route.test.ts`,
  `src/server/http/api-response-boundary.test.ts`,
  `src/styles/pwa-offline-recovery.test.ts`, and
  `src/styles/offline-sync-response-contract.test.ts`; verified with
  `pnpm test -- src/server/http/api-response-boundary.test.ts src/app/api/pwa/sync/route.test.ts src/app/api/pwa/sync/service-request/route.test.ts src/styles/pwa-offline-recovery.test.ts src/styles/offline-sync-response-contract.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/app/api/pwa/sync/route.ts src/app/api/pwa/sync/route.test.ts src/app/api/pwa/sync/service-request/route.ts src/app/api/pwa/sync/service-request/route.test.ts src/lib/pwa-offline.ts src/server/services/offline-sync.ts src/server/http/api-response-boundary.test.ts src/styles/pwa-offline-recovery.test.ts src/styles/offline-sync-response-contract.test.ts`.

### I-031 Search Reindex and Job Failure Contract Review

- `ID`: I-031
- `Aspect`: Backend, API, and Data
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `/api/search/reindex`, `/api/jobs/outbox`, outbox job
  runner tests, provider negative-path review, and API response boundary rules
- `Target Surface`: Search reindex route, outbox job route, provider failure
  handling, admin-visible job failure copy
- `Improvement`: Added audit-event metadata to successful search reindex
  responses, added a stable outbox job summary with completed/skipped/failed
  and retryable counts, sanitized provider-backed outbox job failures before
  persistence, and added admin recovery copy that distinguishes skipped,
  retryable, failed, running, and completed work.
- `Acceptance Checks`: Provider exceptions do not leak secrets, failure status
  codes use shared response helpers, admin copy distinguishes skipped,
  retryable, and failed work, and existing job semantics stay unchanged.
- `Verification`: Covered by `src/app/api/search/reindex/route.test.ts`,
  `src/app/api/jobs/outbox/route.test.ts`,
  `src/server/services/jobs.test.ts`,
  `src/server/http/api-response-boundary.test.ts`,
  `src/styles/admin-empty-state-contract.test.ts`, and
  `src/styles/search-outbox-job-failure-contract.test.ts`; verified with
  `pnpm test -- src/app/api/search/reindex/route.test.ts src/app/api/jobs/outbox/route.test.ts src/server/services/jobs.test.ts src/server/http/api-response-boundary.test.ts src/styles/admin-empty-state-contract.test.ts src/styles/search-outbox-job-failure-contract.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/app/api/search/reindex/route.ts src/app/api/search/reindex/route.test.ts src/app/api/jobs/outbox/route.ts src/app/api/jobs/outbox/route.test.ts src/server/services/jobs.ts src/server/services/jobs.test.ts src/app/admin/integrations/page.tsx src/styles/admin-empty-state-contract.test.ts src/styles/search-outbox-job-failure-contract.test.ts`.

### I-032 Cookie Consent and Privacy Control Contract Audit

- `ID`: I-032
- `Aspect`: Accessibility, Privacy, and Security
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: Cookie banner/control behavior, privacy route,
  accessibility route, privacy policy obligations, and public chrome collision
  guardrails
- `Target Surface`: Cookie preferences panel, cookie banner, privacy page,
  floating controls, accessibility interactions
- `Improvement`: Linked the cookie banner to explicit descriptive text, added
  floating collision participation to the banner, made the privacy cookie
  preference panel expose a live status region, and reflected persisted
  essential/all choices with `aria-pressed` controls.
- `Acceptance Checks`: Cookie actions are keyboard reachable, status feedback is
  field-linked or region-linked, choices persist clearly, and controls do not
  obscure critical public actions.
- `Verification`: Covered by
  `src/styles/cookie-privacy-controls-contract.test.ts`,
  `src/styles/floating-chrome-contract.test.ts`,
  `src/styles/content-route-service-recovery.test.ts`, and
  `src/lib/accessibility-guardrails.test.ts`; verified with
  `pnpm test -- src/styles/cookie-privacy-controls-contract.test.ts src/styles/floating-chrome-contract.test.ts src/styles/content-route-service-recovery.test.ts src/lib/accessibility-guardrails.test.ts`,
  `pnpm lint`, `pnpm typecheck`, and
  `pnpm exec prettier --check docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md src/components/cookie-consent-banner.tsx src/components/cookie-preferences-panel.tsx src/styles/cookie-privacy-controls-contract.test.ts src/styles/floating-chrome-contract.test.ts`.

### I-001 Public Metadata and Share Preview Audit

- `ID`: I-001
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/FULL_PRODUCT_BENCHMARK.md`, public route metadata,
  product/category/search/content route definitions
- `Target Surface`: Public routes, product/category/search/content metadata,
  canonical URLs, Open Graph, and Twitter share previews
- `Improvement`: Audit title, description, canonical, and share-preview
  consistency across public routes without changing product UI.
- `Acceptance Checks`: Key public routes have route-appropriate metadata, no
  stale or duplicated share copy, and no missing canonical/share-preview fields
  where the route already supports them.
- `Verification`: Implemented canonical, Open Graph, and Twitter metadata on
  root, home, product, category, and search routes. Covered by
  `src/styles/public-metadata-contract.test.ts`; verified with
  `pnpm test -- src/styles/public-metadata-contract.test.ts
src/styles/service-attachment-ux.test.ts
src/styles/pwa-offline-recovery.test.ts
src/styles/admin-empty-state-contract.test.ts`.

### I-002 Public Form Error and Recovery Copy Audit

- `ID`: I-002
- `Aspect`: Accessibility, Privacy, and Security
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `docs/FULL_PRODUCT_BENCHMARK.md`,
  `docs/PUBLIC_CHANGE_GATE.md`, existing form validation and recovery patterns
- `Target Surface`: Checkout, service, account login, newsletter, admin login,
  and public form error states
- `Improvement`: Standardize validation, recovery copy, and focus behavior for
  forms so users can recover from errors without ambiguous provider or system
  language.
- `Acceptance Checks`: Form errors identify the field or recovery path, focus
  behavior remains accessible, and public copy avoids leaking internal provider
  detail.
- `Verification`: Implemented field-linked error descriptions, invalid-state
  flags, and first-error focus recovery across service, checkout, newsletter,
  account OTP, and admin login forms. Sanitized account OTP fallback copy so raw
  provider errors are not surfaced to users. Covered by
  `src/styles/form-error-recovery-contract.test.ts`; verified with
  `pnpm test -- src/styles/form-error-recovery-contract.test.ts
src/styles/service-attachment-ux.test.ts
src/components/ui/status-message.test.tsx src/lib/public-action-validation.test.ts
src/lib/account-validation.test.ts src/app/checkout/_components/checkout-display.test.ts
src/app/account/actions.test.ts`.

### I-003 Service Request Attachment UX Review

- `ID`: I-003
- `Aspect`: Admin and Operations
- `Status`: Done
- `Priority`: P2
- `Effort`: S
- `Source/Evidence`: Service request validation, service form copy, offline
  service-sync behavior
- `Target Surface`: `/service` attachment input, size/type guidance, upload
  failure copy, and offline service request recovery
- `Improvement`: Make attachment constraints and failure recovery clearer so
  customers know what can be attached and what to do when an upload cannot be
  completed.
- `Acceptance Checks`: Attachment size/type limits are visible before submit,
  failure copy gives a clear recovery path, and offline/service-sync messaging
  stays consistent with the service request flow.
- `Verification`: Implemented accessible attachment guidance, supported file
  type copy, and offline retry copy in `/service`. Covered by
  `src/styles/service-attachment-ux.test.ts`; verified with the focused
  backlog test command listed under I-001.

### I-004 PWA Offline Recovery and Retry Audit

- `ID`: I-004
- `Aspect`: Performance, PWA, and Reliability
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: PWA service worker behavior, offline page, cart sync and
  service sync routes
- `Target Surface`: Offline page, service sync, cart sync, manifest, service
  worker, and retry states
- `Improvement`: Ensure offline states have clear next steps, retry behavior,
  and no dead-end flows for cart or service request recovery.
- `Acceptance Checks`: Offline and sync states explain what is saved, what must
  be retried, and where the user can continue browsing or contacting service.
- `Verification`: Implemented offline retry guidance and recovery links for
  home, search, service, and size guide. Covered by
  `src/styles/pwa-offline-recovery.test.ts`; verified with the focused backlog
  test command listed under I-001.

### I-005 Admin Empty-State and Bulk-Action Clarity Review

- `ID`: I-005
- `Aspect`: Admin and Operations
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: Admin route patterns, operations guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`, existing admin tests
- `Target Surface`: Admin orders, catalog, inventory, service, customers,
  empty states, loading states, error states, and supported bulk actions
- `Improvement`: Review admin empty/loading/error states and bulk-action copy so
  operators can distinguish unavailable data from unsupported actions.
- `Acceptance Checks`: Admin surfaces clearly label empty data, disabled or
  unsupported actions, and bulk-action availability without implying hidden
  automation.
- `Verification`: Implemented a reusable empty-state action slot and filter
  reset recovery actions for admin orders, catalog, service, and inventory.
  Covered by `src/styles/admin-empty-state-contract.test.ts`; verified with the
  focused backlog test command listed under I-001.

### I-008 Checkout Delivery Confidence Summary

- `ID`: I-008
- `Aspect`: Commerce and Checkout
- `Status`: Done
- `Priority`: P1
- `Effort`: M
- `Source/Evidence`: `docs/qa/checkout-delivery-confidence-benchmark.md`,
  checkout source grouping, `docs/FULL_PRODUCT_BENCHMARK.md`, and
  `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Checkout delivery, fulfillment, local order, Shopify-only,
  mixed cart, and offline checkout states
- `Improvement`: Added a compact, source-aware delivery and fulfillment summary
  to checkout using only currently supported data.
- `Acceptance Checks`: Local checkout explains delivery and verification before
  submit; Shopify-only checkout routes delivery/payment expectations to
  Shopify Checkout without local-order promises; mixed checkout keeps local and
  supplier paths separate without implying one combined delivery or payment.
- `Verification`: Benchmark passed with weighted support of `19.5` against the
  `11.25` threshold. Covered by
  `src/app/checkout/_components/checkout-display.test.ts` and
  `src/styles/service-trust-placement.test.ts`; verified with
  `pnpm test -- src/app/checkout/_components/checkout-display.test.ts
src/styles/service-trust-placement.test.ts`.

### I-006 Wishlist and Shortlist Decision Support

- `ID`: I-006
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/qa/wishlist-shortlist-decision-support-benchmark.md`,
  wishlist, account, sizing, and service guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Account wishlist card, shortlist recovery, saved product
  decision states, category continuation, sizing help, and service escalation
- `Improvement`: Added compact saved-item decision support above the account
  wishlist list without changing product cards, cart, or checkout.
- `Acceptance Checks`: Benchmark passed with weighted support of `12.0`
  against the `11.25` threshold. Wishlist support appears only for saved items,
  keeps existing product/remove controls, routes to category/search,
  `/size-guide`, and `/service?topic=sizing`, and does not add checkout or
  urgency actions.
- `Verification`: Covered by
  `src/app/account/_lib/wishlist-shortlist.test.ts` and
  `src/styles/account-wishlist-decision-support.test.ts`; focused verification
  command is
  `pnpm test -- src/app/account/_lib/wishlist-shortlist.test.ts src/styles/account-wishlist-decision-support.test.ts`.

### I-007 Product Card Quick Facts Density

- `ID`: I-007
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/qa/product-card-quick-facts-density-benchmark.md`,
  PLP, search, gifts, and product-card guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Product cards on category, search, gifts, home featured,
  recommendations, and related-product surfaces
- `Improvement`: Extended the existing quiet product-card metadata line with
  public availability and supplier source context while preserving scan speed.
- `Acceptance Checks`: Benchmark passed with weighted support of `12.0`
  against the `11.25` threshold. Cards still use one text metadata line, no
  extra badges or overlays, no checkout link, and supplier source appears only
  for `DROPSHIP_SHOPIFY`.
- `Verification`: Covered by `src/styles/product-card-overlays.test.ts` and
  existing mobile density guardrails; focused verification command is
  `pnpm test -- src/styles/product-card-overlays.test.ts src/styles/mobile-commerce-density.test.ts`.

### I-009 Account Order Timeline Clarity

- `ID`: I-009
- `Aspect`: Commerce and Checkout
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/qa/account-order-timeline-clarity-benchmark.md`,
  account, order, service, checkout, and returns guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`
- `Target Surface`: Account order list, local order detail, status labels,
  return request context, and read-only Shopify mirror presentation
- `Improvement`: Added compact local-order status sequencing on account order
  cards and full local-order timeline clarity on order detail.
- `Acceptance Checks`: Benchmark passed with weighted support of `12.0`
  against the `11.25` threshold. Local orders use existing timestamp/status
  fields, Shopify mirror orders remain read-only and service-routed, and no
  new supplier or carrier actions are introduced.
- `Verification`: Covered by `src/app/account/_lib/order-timeline.test.ts` and
  `src/styles/account-order-timeline.test.ts`; focused verification command is
  `pnpm test -- src/app/account/_lib/order-timeline.test.ts src/styles/account-order-timeline.test.ts`.

### I-010 Homepage Discovery-to-Commerce Balance

- `ID`: I-010
- `Aspect`: Public UX and Brand
- `Status`: Done
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/qa/homepage-discovery-commerce-balance-benchmark.md`,
  homepage, public route, PLP/search/gifts, and service guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md` and `docs/PUBLIC_CHANGE_GATE.md`
- `Target Surface`: Homepage, category entry points, search entry, featured
  products, gifts entry, service entry, and primary discovery paths
- `Improvement`: Added a compact commerce shortcut rail after category discovery
  so search, gifts, sizing, and service paths are easier to reach without
  changing the hero or editorial sections.
- `Acceptance Checks`: Benchmark passed with weighted support of `12.0`
  against the `11.25` threshold. Shortcuts use real public routes, avoid
  same-page anchors, cards, pills, and extra hero CTAs, and leave quick search
  before featured products.
- `Verification`: Covered by
  `src/styles/homepage-discovery-commerce-balance.test.ts` and existing mobile
  density guardrails; focused verification command is
  `pnpm test -- src/styles/homepage-discovery-commerce-balance.test.ts src/styles/mobile-commerce-density.test.ts`.

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
