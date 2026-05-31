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

## Candidate Improvements

Candidate items are not implementable by default. Public-facing candidates must
pass `docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before
product code is edited.

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
