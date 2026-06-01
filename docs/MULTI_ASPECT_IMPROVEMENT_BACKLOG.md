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

Deep review basis: `docs/FULL_PRODUCT_BENCHMARK.md`,
`docs/PUBLIC_CHANGE_GATE.md`, `scripts/qa-route-inventory.ts`,
`scripts/qa-site-audit.ts`, `docs/qa/*`, `src/app`, `src/components`,
`src/lib`, and `src/server`.

The following 100 items are new, non-blocked, and can be started without new
provider credentials, paid checkout evidence, supplier dashboard access, or
external manual approval. Public-facing implementation work must still follow
`docs/PUBLIC_CHANGE_GATE.md`; these items are actionable because their first
step is either already supported by local benchmark policy or is an audit,
test, documentation, or evidence improvement that does not change public UI.

| ID | Aspect | Status | Priority | Effort | Source/Evidence | Target Surface | Improvement | Acceptance Checks | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| I-201 | Public UX and Brand | Done | P2 | S | `src/components/site-header.tsx`, `src/components/mobile-nav.tsx`, `src/lib/public-structure-policy.test.ts` | Header route labels | Mobile catalog links now exclude the duplicated gifts route, while source guardrails verify unique route-backed labels. | Header and mobile nav labels are unique, route-backed, and current. | Done: `pnpm test -- src/lib/public-structure-policy.test.ts`. |
| I-202 | Public UX and Brand | Actionable Now | P2 | S | `src/components/mobile-nav.tsx`, `src/components/ui/sheet.tsx` | Mobile nav scroll lock | Add a regression check that mobile nav close restores focus and page scroll behavior. | Sheet close works across keyboard and touch flows. | Pending: focused source test and mobile smoke. |
| I-203 | Public UX and Brand | Done | P2 | S | `src/components/site-footer.tsx`, `scripts/qa-route-inventory.test.ts` | Footer grouping | Footer grouping now has a route-inventory assertion for catalog, commerce, information, and policy links. | Footer groups expose known routes with clear purpose. | Done: `pnpm test -- scripts/qa-route-inventory.test.ts`; `pnpm qa:routes`. |
| I-204 | Public UX and Brand | Actionable Now | P2 | M | `src/app/page.tsx`, `src/components/cinematic-hero-sequence.tsx` | Home hero media fallback | Add fallback evidence for missing hero media so first viewport keeps product context. | Home hero remains branded and readable when primary media fails. | Pending: source guardrail and visual smoke. |
| I-205 | Public UX and Brand | Actionable Now | P2 | M | `src/app/category/[slug]/page.tsx`, `src/components/commerce-section-header.tsx` | Category intro density | Audit category intro spacing so commerce controls stay visible without long editorial delay. | Product count, filters, and sort stay early in the page. | Pending: style source test. |
| I-206 | Public UX and Brand | Actionable Now | P2 | S | `src/components/product-card.tsx`, `src/styles/product-card-overlays.test.ts` | Product-card status hierarchy | Add coverage for sale, source, and availability badges so they do not compete with price. | Badges do not obscure image, title, or price. | Pending: `pnpm test -- src/styles/product-card-overlays.test.ts`. |
| I-207 | Public UX and Brand | Actionable Now | P2 | M | `src/app/gifts/page.tsx`, `src/server/services/catalog.ts` | Gifts recipient discovery | Benchmark whether gift browsing needs recipient or budget grouping before adding public UI. | Proposed grouping has benchmark evidence and keeps the product grid visible. | Pending: benchmark note under `docs/qa`. |
| I-208 | Public UX and Brand | Actionable Now | P2 | S | `src/app/about/page.tsx`, `docs/qa/about-page-redesign.md` | About trust proof freshness | Add dated evidence for claims on the about page so stale trust copy is easy to catch. | About claims are backed by local copy or marked as positioning. | Pending: docs audit. |
| I-209 | Public UX and Brand | Actionable Now | P2 | S | `src/app/branches/page.tsx`, `src/styles/branches-online-service-continuity.test.ts` | Branches online-only wording | Add coverage that branch copy never implies walk-ins or physical support if unavailable. | Online-only service paths stay explicit and route-backed. | Pending: focused style test. |
| I-210 | Public UX and Brand | Actionable Now | P2 | M | `src/app/faq/page.tsx`, `src/styles/content-route-service-recovery.test.ts` | FAQ anchor map | Add route-backed anchors for major FAQ themes and verify recovery links. | FAQ sections are deep-linkable and unresolved cases link to service. | Pending: source test and route inventory check. |
| I-211 | Public UX and Brand | Actionable Now | P2 | S | `src/components/site-header.tsx`, `src/components/public-motion-provider.tsx` | Sticky header reduced motion | Audit sticky header and reveal motion for reduced-motion users. | Header state changes do not rely on animation alone. | Pending: source guardrail. |
| I-212 | Public UX and Brand | Actionable Now | P2 | S | `src/components/product-card.tsx`, `src/app/product/[slug]/page.tsx` | Mixed-script rail titles | Extend mixed-script title wrapping evidence to product rails and mini cards. | Hebrew, English, and numeric titles wrap without clipping. | Pending: layout source test. |
| I-213 | Public UX and Brand | Actionable Now | P2 | S | `src/components/ui/empty-state.tsx`, `src/app` | Public empty states | Audit public empty states for route-backed recovery instead of dead-end copy. | Every empty public route has at least one valid next action. | Pending: source scan test. |
| I-214 | Public UX and Brand | Actionable Now | P2 | M | `src/styles/cta-hierarchy.test.ts`, `src/app` | Public CTA hierarchy | Refresh CTA hierarchy guardrails after recent admin and commerce changes. | Primary, secondary, and destructive actions remain distinct. | Pending: `pnpm test -- src/styles/cta-hierarchy.test.ts`. |
| I-215 | Commerce and Checkout | Actionable Now | P1 | M | `src/app/checkout/_components/cart-checkout-form.tsx`, `src/server/services/cart.ts` | Cart line-item source clarity | Add source-aware line-item labels for local versus supplier items. | Cart rows identify delivery constraints without unsupported promises. | Pending: checkout display tests. |
| I-216 | Commerce and Checkout | Actionable Now | P1 | S | `src/lib/checkout-validation.ts`, `src/app/checkout/_components/cart-checkout-form.tsx` | Checkout contact validation copy | Align client and server contact validation copy for phone and email errors. | Errors are specific, translated, and schema-safe. | Pending: validation unit tests. |
| I-217 | Commerce and Checkout | Actionable Now | P1 | M | `src/app/checkout/_components/checkout-status.tsx`, `src/server/services/payment-checkout.ts` | Payment retry state | Add recoverable payment retry state that distinguishes retry from duplicate charge risk. | Failed payment flow gives a safe retry path and preserves cart context. | Pending: payment checkout tests. |
| I-218 | Commerce and Checkout | Actionable Now | P2 | S | `src/app/product/[slug]/_components/product-purchase-panel.tsx` | PDP variant default selection | Audit default variant selection for unavailable or mixed supplier variants. | Default selection never targets an unavailable variant without explanation. | Pending: purchase utility tests. |
| I-219 | Commerce and Checkout | Actionable Now | P2 | S | `src/app/product/[slug]/_components/product-purchase-panel.tsx` | Quantity disabled reasons | Add copy and tests for disabled quantity increase or add-to-cart controls. | Users can tell whether the limit is stock, selection, or validation related. | Pending: focused component tests. |
| I-220 | Commerce and Checkout | Actionable Now | P1 | M | `src/lib/guest-wishlist.ts`, `src/app/account/actions.ts` | Wishlist account merge | Document and test how guest wishlist state merges after sign-in. | Merge avoids duplicates and preserves newest user intent. | Pending: wishlist storage tests. |
| I-221 | Commerce and Checkout | Actionable Now | P2 | S | `src/app/product/[slug]/_components/recently-viewed-products.tsx`, `src/lib` | Recently viewed retention cap | Add cap and ordering contract for recently viewed product storage. | Recently viewed lists stay bounded and newest-first. | Pending: unit test for storage helper. |
| I-222 | Commerce and Checkout | Done | P2 | S | `src/app/search/_lib/search-state.ts`, `src/app/search/page.tsx` | Search sort canonicalization | Extended search URL cleanup to canonicalize default sort and invalid sort values. | Shared search URLs are stable and reject unsupported sort values. | Done: `pnpm test -- src/app/search/_lib/search-state.test.ts`. |
| I-223 | Commerce and Checkout | Done | P2 | S | `src/app/category/[slug]/_lib/category-filter-state.ts` | Category filter reset cleanup | Verified reset links do not preserve stale tracking, page, or empty filter values. | Reset returns to the category route with only meaningful parameters. | Done: `pnpm test -- src/app/category/[slug]/_lib/category-filter-state.test.ts`. |
| I-224 | Commerce and Checkout | Actionable Now | P1 | M | `src/server/services/coupons.ts`, `src/server/services/pricing.ts` | Coupon error normalization | Normalize coupon failure reasons for expired, unknown, minimum spend, and ineligible carts. | Checkout receives customer-safe coupon errors with machine-readable reasons. | Pending: coupon and pricing tests. |
| I-225 | Commerce and Checkout | Actionable Now | P2 | M | `src/app/ai/_components/ai-gift-panel.tsx`, `src/server/ai` | Gift recommendation fallback | Ensure gift recommendation failures route to catalog and budget filters. | AI failures keep a deterministic product discovery path. | Pending: AI fallback tests. |
| I-226 | Commerce and Checkout | Done | P2 | S | `src/lib/price-filter.ts`, `src/app/category/[slug]/_lib/category-filter-state.ts`, `src/app/search/_lib/search-state.ts` | Price range bounds | Shared positive price-bound normalization between category and search filters. | Invalid and negative ranges normalize consistently. | Done: `pnpm test -- src/app/search/_lib/search-state.test.ts src/app/category/[slug]/_lib/category-filter-state.test.ts`. |
| I-227 | Commerce and Checkout | Actionable Now | P1 | M | `src/components/cart-count-link.tsx`, `src/server/services/cart.ts` | Cart optimistic rollback | Add evidence that optimistic cart UI rolls back after failed mutations. | Failed mutations do not leave stale counts or line items. | Pending: cart service and UI source tests. |
| I-228 | Commerce and Checkout | Actionable Now | P2 | S | `src/app/product/[slug]/page.tsx`, `src/components/product-card.tsx` | Out-of-stock recovery | Audit unavailable product states for alternatives, category returns, and service links. | Unavailable products keep users in a safe discovery path. | Pending: source guardrail. |
| I-229 | Commerce and Checkout | Actionable Now | P2 | M | `src/app/checkout/_components/cart-checkout-form.tsx` | Address autocomplete fallback | Verify checkout remains usable when autocomplete is absent or partial. | Manual address entry remains first-class and recoverable. | Pending: checkout form tests. |
| I-230 | Admin and Operations | Actionable Now | P1 | M | `src/app/admin/page.tsx`, `src/server/services/admin-commerce-read.ts` | Admin metric freshness | Add freshness labels to admin dashboard metrics for cached, live, and fallback data. | Operators can see when each metric was calculated. | Pending: admin source test. |
| I-231 | Admin and Operations | Actionable Now | P1 | M | `src/app/admin/orders/[id]/page.tsx`, `src/server/services/admin-commerce.ts` | Order timeline diff | Add timeline evidence for status, refund, shipment, and note changes. | Order detail tells what changed, who changed it, and when. | Pending: admin commerce tests. |
| I-232 | Admin and Operations | Actionable Now | P1 | S | `src/app/admin/_components/admin-order-actions.tsx` | Refund reason taxonomy | Standardize refund reason options and require confirmation copy. | Refund actions carry a reason and target order context. | Pending: source and action tests. |
| I-233 | Admin and Operations | Actionable Now | P1 | M | `src/app/admin/appointments/page.tsx`, `src/server/services/admin-commerce.ts` | Appointment reschedule audit | Add audit metadata for appointment reschedule and cancellation flows. | Operations are traceable and reject invalid transitions. | Pending: appointment workflow tests. |
| I-234 | Admin and Operations | Actionable Now | P2 | M | `src/app/admin/catalog/page.tsx`, `src/app/admin/_components/admin-catalog-actions.tsx` | Catalog bulk confirmations | Add explicit confirmation states for sync, cache clear, and media validation actions. | Bulk actions name scope, risk, and expected wait time. | Pending: admin empty-state contract tests. |
| I-235 | Admin and Operations | Actionable Now | P2 | M | `src/server/adapters/media.ts`, `src/server/services/catalog-assets.ts` | Media duplicate handling | Detect duplicate media URLs or filenames before upload or sync. | Admin media flow reports duplicates without deleting automatically. | Pending: media adapter tests. |
| I-236 | Admin and Operations | Actionable Now | P1 | M | `src/app/admin/inventory/page.tsx`, `src/server/services/inventory.ts` | Inventory threshold batch | Add a review path for products repeatedly entering low-stock state. | Operators can identify chronic low-stock SKUs quickly. | Pending: inventory service tests. |
| I-237 | Admin and Operations | Actionable Now | P1 | S | `src/app/admin/customers/page.tsx`, `src/server/services/admin-operations.ts` | Customer PII masking | Audit customer table cells for unnecessary full PII exposure. | Customer list shows only fields needed for support triage. | Pending: admin source test. |
| I-238 | Admin and Operations | Actionable Now | P2 | S | `src/app/admin/audit/page.tsx`, `src/server/services/admin-operations.ts` | Audit filter permalinks | Verify audit filters preserve query parameters and shareable URLs. | Audit reviewers can share a filtered state without losing context. | Pending: admin audit tests. |
| I-239 | Admin and Operations | Actionable Now | P1 | M | `src/app/admin/service/page.tsx`, `src/server/services/service.ts` | Service SLA aging buckets | Add aging buckets by topic, status, and last customer reply. | Operators can identify overdue cases without opening each row. | Pending: service validation and admin tests. |
| I-240 | Admin and Operations | Actionable Now | P2 | S | `src/app/admin/integrations/page.tsx`, `src/server/services/admin-integrations.ts` | Integration health empty state | Improve integration health empty and partial-failure states. | Missing credentials, disabled providers, and API failures render distinct states. | Pending: admin integrations tests. |
| I-241 | Admin and Operations | Actionable Now | P1 | M | `src/app/admin/notifications/page.tsx`, `src/server/services/push.ts` | Notification segment audit log | Record audience segment, dry-run estimate, and target URL for push send attempts. | Push sends are traceable without raw subscriber payloads. | Pending: push service tests. |
| I-242 | Admin and Operations | Actionable Now | P1 | S | `src/app/admin/login/page.tsx`, `src/server/auth/password.ts` | Admin login lockout clarity | Audit login copy and rate-limit behavior for lockout and invalid credentials. | Login stays generic while giving safe retry timing. | Pending: admin auth tests. |
| I-243 | Admin and Operations | Actionable Now | P1 | M | `src/app/admin/customers/page.tsx`, `src/server/services/admin-operations.ts` | Admin export permission gate | Add explicit permission checks and audit evidence before export actions. | Export actions are unavailable without permission and audited when used. | Pending: admin operations tests. |
| I-244 | Admin and Operations | Actionable Now | P2 | S | `src/app/admin/_components/admin-mutation-status.tsx`, `src/app/admin/actions.ts` | Mutation telemetry labels | Standardize success and failure labels for admin mutations. | Status messages include operation context without duplicate errors. | Pending: admin source contract test. |
| I-245 | Backend, API, and Data | Actionable Now | P1 | S | `src/server/api/trpc.ts`, `src/server/http/api-response.ts` | API error code mapping | Audit tRPC and REST errors for consistent customer-safe code mapping. | Public APIs expose stable codes and avoid raw exceptions. | Pending: API response tests. |
| I-246 | Backend, API, and Data | Done | P1 | M | `src/server/http/safe-json.ts`, `src/server/http/api-response.ts` | Safe JSON edge cases | Extended safe JSON coverage and response serialization for Date, BigInt, undefined, circular, and nested unknown values. | Responses serialize predictably without leaking internals. | Done: `pnpm test -- src/server/http/api-response.test.ts src/server/http/safe-json.test.ts`. |
| I-247 | Backend, API, and Data | Actionable Now | P1 | M | `src/server/db.ts`, `src/server/services/admin-commerce.ts` | Transaction retry policy | Document and test which admin operations can be retried safely after conflicts. | Retriable operations are idempotent or rejected from retry. | Pending: admin commerce transaction tests. |
| I-248 | Backend, API, and Data | Actionable Now | P1 | M | `src/server/services/outbox.ts`, `src/server/services/jobs.ts` | Outbox idempotency keys | Add idempotency checks for outbox job creation and processing. | Duplicate submissions do not duplicate side effects. | Pending: jobs and outbox tests. |
| I-249 | Backend, API, and Data | Actionable Now | P2 | S | `src/app/api/search/reindex/route.ts`, `src/server/services/search-embeddings.ts` | Search reindex dry-run | Add dry-run output for counts, skipped products, and provider availability. | Reindex can be inspected without mutating search data. | Pending: reindex route tests. |
| I-250 | Backend, API, and Data | Actionable Now | P1 | S | `src/app/api/health/route.ts`, `src/server/services/health.ts` | Health dependency detail | Add optional dependency detail gated for admin or internal checks. | Public health remains simple while internal health isolates dependency failures. | Pending: health tests. |
| I-251 | Backend, API, and Data | Actionable Now | P1 | M | `src/app/api/webhooks/*/route.ts`, `src/server/services/webhook-events.ts` | Webhook replay detection | Add replay detection evidence for event IDs and timestamp windows. | Replayed webhook events are rejected or idempotently ignored. | Pending: webhook route tests. |
| I-252 | Backend, API, and Data | Actionable Now | P2 | M | `src/lib/cart-session.ts`, `src/server/services/cart.ts` | Cart session cleanup | Define cleanup behavior for abandoned guest carts and expired sessions. | Cart retention is bounded without removing active sessions. | Pending: cart service tests. |
| I-253 | Backend, API, and Data | Actionable Now | P1 | M | `src/server/services/catalog-cache.ts`, `src/server/services/catalog-revalidation.ts` | Catalog cache tag invalidation | Verify cache tags cover product, category, and supplier updates. | Catalog mutations invalidate the minimum required stale surfaces. | Pending: catalog cache tests. |
| I-254 | Backend, API, and Data | Actionable Now | P1 | S | `src/server/adapters/shopify.ts`, `src/server/services/shopify-order-mirror.ts` | Shopify payload redaction | Add redaction checks for Shopify request and response logs. | Logs keep trace IDs and remove customer or payment payloads. | Pending: Shopify adapter tests. |
| I-255 | Backend, API, and Data | Actionable Now | P1 | M | `src/server/services/manual-order.ts`, `src/server/services/manual-order-contract.ts` | Manual order schema coverage | Extend manual-order input tests for supplier items, discounts, notes, and quantities. | Manual orders reject inconsistent totals and unsupported item mixes. | Pending: manual order tests. |
| I-256 | Backend, API, and Data | Actionable Now | P2 | S | `src/app/api/push/preferences/route.ts`, `src/server/services/push.ts` | Push preferences migration guard | Add compatibility guard for missing or legacy push preference fields. | Preference routes handle old records without throwing. | Pending: push route tests. |
| I-257 | Backend, API, and Data | Actionable Now | P1 | S | `src/server/services/customer-otp.ts`, `src/app/account/actions.ts` | OTP resend window | Verify OTP resend, expiry, and invalid-attempt messaging. | OTP behavior is rate-limited, generic, and recoverable. | Pending: customer OTP tests. |
| I-258 | Backend, API, and Data | Done | P1 | S | `src/server/api/rate-limit.ts`, `src/server/services/rate-limit.ts` | Rate-limit namespace collisions | Added tests that protected endpoint namespaces cannot accidentally share counters. | Rate limits stay scoped by operation and identity. | Done: `pnpm test -- src/server/services/rate-limit.test.ts`. |
| I-259 | Performance, PWA, and Reliability | Actionable Now | P2 | S | `package.json`, `next.config.js`, `src/lib/ai-bundle-boundary.test.ts` | Bundle budget documentation | Add documented bundle budgets for AI, admin, and public catalog routes. | Route budgets are measurable and tied to a local command. | Pending: docs update and bundle-boundary test. |
| I-260 | Performance, PWA, and Reliability | Actionable Now | P2 | S | `src/app`, `src/components` | Dynamic import audit | Scan route-level client components for heavy imports that should be deferred. | Heavy optional UI does not load on unrelated public routes. | Pending: source scan test. |
| I-261 | Performance, PWA, and Reliability | Actionable Now | P2 | S | `src/components/product-card.tsx`, `src/app/product/[slug]/page.tsx` | Image priority map | Define when product, hero, and rail images may use priority loading. | Only first-viewport critical media gets priority. | Pending: image-performance tests. |
| I-262 | Performance, PWA, and Reliability | Actionable Now | P2 | M | `src/app/search/_components/search-controls.tsx` | Search controls hydration cost | Audit search controls for unnecessary client state and repeated render work. | Search filters stay responsive on mobile. | Pending: source test and browser smoke. |
| I-263 | Performance, PWA, and Reliability | Done | P1 | S | `src/app/sw.ts`, `src/app/serwist-route.test.ts` | Service worker route drift | Serwist route tests now assert runtime route patterns against representative QA route inventory. | Removed routes are not precached and critical routes remain covered. | Done: `pnpm test -- src/app/serwist-route.test.ts`. |
| I-264 | Performance, PWA, and Reliability | Actionable Now | P1 | M | `src/lib/pwa-offline.ts`, `src/app/api/pwa/sync/route.ts` | Offline queue backoff | Add retry backoff and terminal failure evidence for offline sync jobs. | Offline retries do not loop indefinitely. | Pending: PWA sync tests. |
| I-265 | Performance, PWA, and Reliability | Done | P2 | S | `src/app/manifest.ts`, `public/*` | Manifest icon sizes | Audited manifest icons for required sizes, maskable purpose, and availability. | Install surfaces have complete icons without broken references. | Done: `pnpm test -- src/app/manifest.test.ts`. |
| I-266 | Performance, PWA, and Reliability | Actionable Now | P1 | S | `scripts/qa-route-inventory.ts`, `src/app` | Cache-control route inventory | Add cache expectations to route inventory for static, dynamic, and authenticated routes. | Route cache policy is explicit and reviewable. | Pending: route inventory tests. |
| I-267 | Performance, PWA, and Reliability | Done | P2 | S | `src/app/layout.tsx`, `next.config.js`, `src/lib/image-performance.test.ts` | Preconnect whitelist | Image-performance guardrail now locks the absence of manual preconnects and the active remote media hostname whitelist. | Only current, useful origins are preconnected. | Done: `pnpm test -- src/lib/image-performance.test.ts`. |
| I-268 | Performance, PWA, and Reliability | Actionable Now | P1 | M | `src/app/category/[slug]/page.tsx`, `src/server/services/catalog.ts` | Category freshness | Add evidence for category data freshness after catalog sync or revalidation. | Category pages update within expected revalidation windows. | Pending: catalog revalidation tests. |
| I-269 | Performance, PWA, and Reliability | Actionable Now | P2 | M | `src/app/admin`, `src/server/services/admin-commerce-read.ts` | Admin pagination payload budget | Audit admin list queries for page size, selected columns, and stable ordering. | Admin pages avoid loading full datasets for paginated tables. | Pending: admin read tests. |
| I-270 | Performance, PWA, and Reliability | Actionable Now | P2 | M | `src/styles/layout-stability.test.ts`, agent-browser workflow | Mobile CLS audit | Add mobile viewport checks for header, cookie banner, product grid, and checkout. | Critical mobile routes avoid avoidable layout shift after hydration. | Pending: visual smoke evidence. |
| I-271 | Performance, PWA, and Reliability | Actionable Now | P2 | S | `src/components/pwa-lifecycle.tsx`, `src/components/pwa-runtime.tsx` | PWA update prompt quiet hours | Review update prompt timing so it does not interrupt checkout or forms. | Update prompts defer during critical commerce flows. | Pending: PWA provider tests. |
| I-272 | Performance, PWA, and Reliability | Done | P2 | S | `scripts/convert-public-images-to-avif.mjs`, `public` | AVIF repair dry-run diff | Added dry-run output listing stale images and expected savings. | Image repair commands are reviewable before modifying assets. | Done: `pnpm test -- scripts/convert-public-images-to-avif.test.mjs`. |
| I-273 | Accessibility, Privacy, and Security | Done | P1 | S | `src/app/layout.tsx`, `src/lib/accessibility-guardrails.test.ts` | Skip link keyboard smoke | Accessibility guardrail now verifies the skip link is before `#main-content` and uses visible focus styling. | Keyboard users can reach main content quickly on every shell. | Done: `pnpm test -- src/lib/accessibility-guardrails.test.ts`. |
| I-274 | Accessibility, Privacy, and Security | Done | P2 | S | `src/styles/globals.css`, `src/components/ui/button.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/sheet.tsx` | Focus-visible token inventory | Dialogs and sheets now expose shared focus-visible rings, with source coverage for core controls and nav links. | Interactive elements have visible focus without color-only cues. | Done: `pnpm test -- src/lib/accessibility-guardrails.test.ts`. |
| I-275 | Accessibility, Privacy, and Security | Actionable Now | P1 | S | `src/app/admin/_components/admin-order-actions.tsx`, `src/components/ui/alert-dialog.tsx` | Destructive action descriptions | Add aria description coverage for refund, cancel, delete, and revoke flows. | Destructive dialogs name target and irreversible effect. | Pending: admin contract tests. |
| I-276 | Accessibility, Privacy, and Security | Actionable Now | P1 | S | `src/app/account/privacy/export/route.ts`, `src/app/privacy/page.tsx` | Privacy export rate-limit copy | Align privacy export copy with rate-limit and authentication behavior. | Users get safe recovery paths without account-existence leaks. | Pending: privacy export tests. |
| I-277 | Accessibility, Privacy, and Security | Done | P1 | S | `src/components/cookie-consent-banner.tsx`, `src/lib/cookie-consent.ts`, `src/styles/cookie-privacy-controls-contract.test.ts` | Cookie audit redaction | Cookie privacy contract now asserts consent audit records stay minimal and exclude IP, user agent, and free-form identifiers. | Consent state remains auditable with minimal data. | Done: `pnpm test -- src/styles/cookie-privacy-controls-contract.test.ts`. |
| I-278 | Accessibility, Privacy, and Security | Actionable Now | P1 | M | `src/lib/service-validation.ts`, `src/app/service/_components/service-request-form.tsx` | Attachment filename sanitization | Add validation and copy for unsafe or misleading attachment filenames. | Upload metadata rejects risky names and accepted-file copy stays aligned. | Pending: service validation tests. |
| I-279 | Accessibility, Privacy, and Security | Actionable Now | P2 | S | `src/components/push-opt-in-button.tsx`, `src/lib/push-client.ts` | Push permission pre-prompt | Audit push opt-in copy so permission prompts follow clear user action. | Browser prompts are not triggered without explicit intent. | Pending: push client tests. |
| I-280 | Accessibility, Privacy, and Security | Done | P2 | S | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/accessibility/page.tsx`, `src/styles/globals.css` | Legal print readability | Added a print stylesheet that removes interactive chrome and preserves readable black-on-white legal content. | Legal content stays readable without decorative chrome. | Done: `pnpm test -- src/lib/accessibility-guardrails.test.ts`. |
| I-281 | Accessibility, Privacy, and Security | Actionable Now | P2 | S | `docs/SITE_COPY_MAP.md`, `src/app/account/page.tsx` | Account retention copy map | Add copy-map evidence for account retention, export, and deletion wording. | Privacy-sensitive copy has traceable source and route. | Pending: `pnpm copy:check`. |
| I-282 | Accessibility, Privacy, and Security | Actionable Now | P1 | S | `src/server/auth`, `src/app/account/actions.ts` | Generic recovery responses | Audit account and admin recovery responses for enumeration risk. | Recovery messages stay generic while preserving next steps. | Pending: auth tests. |
| I-283 | Accessibility, Privacy, and Security | Actionable Now | P1 | M | `next.config.js`, `src/app` | CSP route policy inventory | Document route groups that need scripts, images, frames, or connect sources. | CSP changes are tied to routes before relaxation. | Pending: security guardrail test. |
| I-284 | Accessibility, Privacy, and Security | Actionable Now | P2 | S | `src/components/product-card.tsx`, `src/app/product/[slug]/_components/product-gallery.tsx` | Duplicate alt text guard | Add guardrails that product media alt text is useful and not repeated as UI chrome. | Product cards and galleries avoid redundant screen-reader noise. | Pending: accessibility guardrail test. |
| I-285 | Accessibility, Privacy, and Security | Actionable Now | P2 | S | `src/lib/format.ts`, `src/app` | RTL numeric isolation scan | Scan labels for unisolated price, SKU, phone, and order-number fragments. | Mixed-direction numeric fragments preserve reading order. | Pending: format tests and source scan. |
| I-286 | Accessibility, Privacy, and Security | Actionable Now | P1 | M | `src/app/admin/customers/page.tsx`, `src/app/admin/orders/[id]/page.tsx` | Admin PII clipboard prevention | Review whether sensitive identifiers should render with deliberate copy affordances only. | PII is not accidentally exposed through broad copy controls or exports. | Pending: admin privacy source test. |
| I-287 | QA, Release, and Observability | Done | P2 | S | `scripts/qa-route-inventory.ts`, `scripts/qa-route-inventory.test.ts` | Production smoke roster refresh | Route inventory tests now lock representative public, admin, API, dynamic, account, and PWA smoke coverage. | Smoke coverage includes representative public, admin, API, and PWA routes. | Done: `pnpm test -- scripts/qa-route-inventory.test.ts`; `pnpm qa:routes`. |
| I-288 | QA, Release, and Observability | Done | P2 | S | `docs/qa/production-deployment-evidence-ledger.md` | Release evidence template | Added fields for branch, commit, deployment ID, alias, health result, and log window. | Every release ties commit to live alias and health check. | Done: `pnpm test -- src/styles/qa-benchmark-traceability.test.ts` and `git diff --check`. |
| I-289 | QA, Release, and Observability | Actionable Now | P2 | M | `scripts/qa-site-audit.ts`, `scripts/qa-site-audit.test.ts` | INP scenario expansion | Add interaction probes for admin filters, PDP variants, and checkout quantity changes. | QA audit reports interaction coverage for critical controls. | Pending: QA site audit tests. |
| I-290 | QA, Release, and Observability | Actionable Now | P1 | S | `.vercel/project.json`, `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md` | Vercel env drift checklist | Document production, preview, and local env drift checks without secret values. | Release notes confirm required env presence safely. | Pending: docs audit. |
| I-291 | QA, Release, and Observability | Done | P1 | S | `docs/qa/production-deployment-evidence-ledger.md`, Vercel CLI workflow | Rollback playbook | Added a short rollback and promote decision tree for failed production deploys. | Operators know whether to rollback, promote, or redeploy. | Done: `git diff --check`. |
| I-292 | QA, Release, and Observability | Actionable Now | P2 | S | `scripts/visual-qa-agent-browser.ps1`, `artifacts/qa` | Screenshot naming canonical | Standardize screenshot names by route, viewport, timestamp, and deployment ID. | Visual evidence can be compared across releases. | Pending: visual QA script test or docs audit. |
| I-293 | QA, Release, and Observability | Done | P2 | S | `docs/ENGINEERING_CONVENTIONS.md`, `vitest.config.ts` | Flaky test policy | Clarified how to handle flaky tests without hiding real regressions. | Any retry or isolation decision has an owner, reason, and follow-up. | Done: `git diff --check`. |
| I-294 | QA, Release, and Observability | Actionable Now | P2 | M | `docs/FULL_PRODUCT_BENCHMARK.md`, `docs/qa/*` | Benchmark freshness review | Review benchmark docs for stale routes, old deployment IDs, and outdated screenshots. | Benchmark evidence points at current routes or is explicitly historical. | Pending: traceability test. |
| I-295 | QA, Release, and Observability | Done | P2 | S | `scripts/site-copy.ts`, `docs/SITE_COPY_MAP.md` | Copy map orphan detection | Added a check for copy-map entries whose source path no longer exists. | Copy map fails when stale source paths remain after refactors. | Done: `pnpm test -- scripts/site-copy.test.ts` and `pnpm copy:check`. |
| I-296 | QA, Release, and Observability | Actionable Now | P2 | M | `src/lib/accessibility-guardrails.test.ts`, agent-browser workflow | Accessibility smoke matrix | Define route and viewport matrix for keyboard, focus, and landmark smoke checks. | Accessibility smoke coverage is repeatable across releases. | Pending: docs and focused tests. |
| I-297 | QA, Release, and Observability | Actionable Now | P1 | M | `src/app/admin`, `src/app/admin/_components/admin-states.tsx` | Admin no-DB fallback smoke | Add fallback smoke evidence for admin pages when database reads fail. | Admin pages fail safely with recoverable states. | Pending: admin state contract tests. |
| I-298 | QA, Release, and Observability | Done | P2 | S | `docs/ENGINEERING_CONVENTIONS.md`, `scripts/gates.test.mjs` | Test wall-clock regression budget | Engineering conventions now document local wall-clock budgets and the gate test locks those expectations. | Runtime changes are visible during release preparation. | Done: `pnpm test -- scripts/gates.test.mjs`. |
| I-299 | QA, Release, and Observability | Done | P2 | S | `docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md`, `src/styles/qa-benchmark-traceability.test.ts` | Backlog rotation traceability | Updated traceability rules for the `I-201` through `I-300` active rotation. | Historical IDs remain intentional and new active IDs are discoverable. | Done: `pnpm test -- src/styles/qa-benchmark-traceability.test.ts`. |
| I-300 | QA, Release, and Observability | Done | P1 | M | Vercel CLI workflow, `docs/qa/production-deployment-evidence-ledger.md` | Post-deploy log scan automation | Added a repeatable command for post-deploy production error-log scans. | Release evidence records a clean log window or linked remediation. | Done: `git diff --check`. |

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

- Move an item to `Done` only when its acceptance checks and verification are
  recorded.
- Move an item from `Needs Benchmark` to `Actionable Now` only after benchmark
  evidence is recorded.
- Keep blocker language concrete: name the missing credential, provider action,
  operational proof, or environment condition.
- Add new items conservatively. Prefer evidence from repository docs, route
  inventory, tests, provider checks, QA artifacts, or explicit product decisions.
