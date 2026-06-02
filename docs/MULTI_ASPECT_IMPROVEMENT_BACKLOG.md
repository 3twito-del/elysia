# Multi-Aspect Improvement Backlog

Status: active cross-product improvement tracker.

Last reviewed: 2026-06-01.

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

Deep review basis: `docs/FULL_PRODUCT_BENCHMARK.md`,
`docs/PUBLIC_CHANGE_GATE.md`, `scripts/qa-route-inventory.ts`,
`scripts/qa-site-audit.ts`, `docs/qa/*`, `src/app`, `src/components`,
`src/lib`, and `src/server`.

Completed items are intentionally removed from this active backlog. The
following active items are visible user-facing site improvements. For every item,
`Target Surface` states where a shopper sees the work, and `Improvement` states
how the change becomes visible in the interface. Public-facing implementation
work must still follow `docs/PUBLIC_CHANGE_GATE.md` before product code changes.

| ID    | Aspect                            | Status         | Priority | Effort | Source/Evidence                                                                         | Target Surface                   | Improvement                                                                     | Acceptance Checks                                                           | Verification                    |
| ----- | --------------------------------- | -------------- | -------- | ------ | --------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------- |
| I-328 | Commerce and Checkout             | Actionable Now | P2       | S      | `src/components/product-card.tsx`                                                       | Product cards in category grids  | Visible as sale, source, and availability badges with a clear hierarchy.        | Badges do not cover product faces, title, or price.                         | Product-card overlay test.      |
| I-330 | Commerce and Checkout             | Actionable Now | P2       | M      | `src/app/category/[slug]/page.tsx`                                                      | Category pagination or load more | Visible as a loading state on the next-page control.                            | Button cannot be double-triggered and current grid remains stable.          | Browser interaction smoke.      |
| I-332 | Commerce and Checkout             | Actionable Now | P2       | M      | `src/app/category/[slug]/page.tsx`, `src/components/product-card.tsx`                   | Product material cues            | Visible as small material or color swatches on product cards where data exists. | Swatches are labeled for screen readers and do not replace product names.   | Accessibility and visual smoke. |
| I-337 | Commerce and Checkout             | Actionable Now | P2       | M      | `src/app/search/page.tsx`, `src/lib/search-history.ts`                                  | Search history                   | Visible as recent queries below the search input for returning shoppers.        | Local history is capped and can be cleared.                                 | Storage test.                   |
| I-340 | Performance, PWA, and Reliability | Actionable Now | P2       | S      | `src/app/search/page.tsx`, `src/components/product-card.tsx`                            | Search loading state             | Visible as product-card skeletons while search results resolve.                 | Skeleton count roughly matches the final grid and prevents layout shift.    | Visual smoke.                   |
| I-345 | Commerce and Checkout             | Actionable Now | P2       | M      | `src/app/gifts/page.tsx`, `src/components/product-card.tsx`                             | Gift bundles                     | Visible as paired product recommendations when gift data supports a set.        | Bundle card shows combined context without pretending to be a single SKU.   | Visual and data smoke.          |
| I-346 | Commerce and Checkout             | Actionable Now | P2       | S      | `src/app/gifts/page.tsx`                                                                | Gift under-budget callout        | Visible as a small under-budget note on matching products.                      | Callout appears only when price data supports it.                           | Product-card test.              |
| I-347 | Public UX and Brand               | Actionable Now | P2       | S      | `src/app/gifts/page.tsx`, `src/components/ui/empty-state.tsx`                           | Gifts empty state                | Visible as a return-to-all-gifts button when filters remove all products.       | Empty state never dead-ends.                                                | Gifts no-results smoke.         |
| I-349 | Commerce and Checkout             | Actionable Now | P2       | M      | `src/app/product/[slug]/_components/product-gallery.tsx`                                | Product gallery zoom             | Visible as a zoom affordance or label on the primary image.                     | Zoom control is keyboard reachable and reversible.                          | PDP interaction smoke.          |
| I-356 | Commerce and Checkout             | Actionable Now | P2       | S      | `src/components/product-card-favorite-button.tsx`, `src/app/product/[slug]/page.tsx`    | Wishlist feedback                | Visible as saved and removed feedback near the favorite button.                 | Feedback is brief, announced, and does not shift card layout.               | Accessibility test.             |
| I-361 | Commerce and Checkout             | Actionable Now | P2       | M      | `src/components/product-card.tsx`                                                       | Product card hover media         | Visible as a secondary image on hover or focus where alternate media exists.    | Motion is disabled or simplified for reduced-motion users.                  | Card interaction smoke.         |
| I-362 | Commerce and Checkout             | Actionable Now | P1       | M      | `src/components/product-card.tsx`, `src/server/services/cart.ts`                        | Product card quick add           | Visible as a compact quick-add button for simple in-stock products.             | Button is hidden when variant choice is required.                           | Cart and card tests.            |
| I-364 | Commerce and Checkout             | Actionable Now | P2       | S      | `src/components/product-card.tsx`, `src/lib/format.ts`                                  | Product card sale price          | Visible as current price and previous price styling when sale data exists.      | Sale price remains readable and previous price is not mistaken for current. | Product-card test.              |
| I-365 | Public UX and Brand               | Actionable Now | P2       | S      | `src/components/product-card.tsx`                                                       | Product card material badge      | Visible as a small material badge such as gold, silver, or pearl.               | Badge is optional and never replaces title or price.                        | Visual source test.             |
| I-367 | Commerce and Checkout             | Actionable Now | P2       | S      | `src/components/product-card.tsx`, `src/server/services/inventory.ts`                   | Product stock cue                | Visible as a restrained low-stock badge only when inventory is genuinely low.   | Badge does not create false urgency.                                        | Inventory display test.         |
| I-374 | Commerce and Checkout             | Actionable Now | P1       | S      | `src/app/checkout/_components/cart-checkout-form.tsx`, `src/server/services/coupons.ts` | Coupon field                     | Visible as success, expired, ineligible, or unknown coupon messages.            | Coupon messages are specific and translated.                                | Coupon tests.                   |
| I-382 | Commerce and Checkout             | Actionable Now | P2       | M      | `src/app/account/page.tsx`, `src/lib/guest-wishlist.ts`                                 | Wishlist merge notice            | Visible as a short notice after sign-in when guest wishlist items are merged.   | Notice names count merged and avoids duplicate product cards.               | Wishlist merge test.            |

## Candidate Improvements

Candidate items are not implementable by default. Public-facing candidates must
pass `docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before
product code is edited.

No candidate improvements remain. New public-facing candidates must pass
`docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before product
code is edited.

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

- Remove completed items from this active backlog after the acceptance checks
  and verification are recorded in commit, PR, release, or QA evidence.
- Move an item from `Needs Benchmark` to `Actionable Now` only after benchmark
  evidence is recorded.
- Keep blocker language concrete: name the missing credential, provider action,
  operational proof, or environment condition.
- Add new items conservatively. Prefer evidence from repository docs, route
  inventory, tests, provider checks, QA artifacts, or explicit product decisions.
