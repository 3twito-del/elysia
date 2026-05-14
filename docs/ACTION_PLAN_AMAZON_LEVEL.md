# ACTION_PLAN_AMAZON_LEVEL.md - Aphrodite Enterprise Commerce Plan

## Summary

Goal: turn Aphrodite from a soft-launch commerce system into an enterprise-grade Single Brand ecommerce platform on Vercel Managed infrastructure, with high-quality buying, operations, security, AI, search, payments, observability, and scale.

Default direction: keep Next.js/Vercel as the base, do not build a marketplace, and move through engineering-spec phases that keep the system stable at every step.

## No-Blocker Upgrade Roadmap

This section is the immediate execution track. Every item here can be implemented from the repository alone without new credentials, external provider setup, Vercel production configuration, billing-plan changes, or business-contract decisions.

Use this track for local product quality, UI polish, correctness, and implementation hardening. If an item requires CardCom production access, Vercel WAF/Queues/Observability setup, an SMS vendor, production email domains, or any provider secret that is not already available locally, it belongs in `Deferred / Blocked Work` instead.

### UX and Responsive Polish

- Completed 2026-05-13: Lock the home hero layout to equal visual offsets on both sides and matching top/bottom spacing across desktop widths.
- Completed 2026-05-13: Keep mobile navigation sheets and all popup surfaces opaque, including Sheet, Dialog, AlertDialog, Dropdown, Popover, Select, Tooltip, Command, and HoverCard surfaces.
- Completed 2026-05-13: Close mobile-only sheets automatically when the viewport reaches the desktop breakpoint.
- Completed 2026-05-13: Add or extend visual QA screenshots for the home hero, mobile navigation, category sheets, filter panels, and key popups.
- Completed 2026-05-13: Review responsive layout at mobile, tablet, laptop, and wide desktop widths for text overflow, clipped controls, and inconsistent spacing.
- Completed 2026-05-14: Fixed shared cinematic page-hero viewport height so public route heroes keep their first-viewport presence across desktop and mobile, and revalidated the Playwright hero guard.

### Product Discovery

- Completed 2026-05-13: Improve category pages with clearer loading, empty, no-results, and error states.
- Completed 2026-05-13: Tighten filter UX with stable selected states, reset affordances, disabled states for unavailable filters, and improved mobile sheet behavior.
- Completed 2026-05-13: Improve search page ergonomics with better query persistence, no-results recovery, and clear result counts.
- Completed 2026-05-13: Refine product cards for consistent image ratios, badges, price/availability presentation, favorite controls, and keyboard focus.
- Completed 2026-05-13: Improve product pages with clearer media gallery states, variant/availability feedback, recently viewed, and non-AI catalog-based recommendation rails.

### Checkout, Account, and Admin

- Completed 2026-05-14: Strengthen checkout form states with field-level validation, submission loading, recoverable errors, disabled duplicate submits, and clear pickup/shipping selection.
- Completed 2026-05-14: Improve cart and checkout empty states so users always have a clear next action.
- Completed 2026-05-14: Tighten account pages with loading, empty, forbidden, and error states for orders, addresses, wishlist, appointments, and privacy flows. Added explicit customer-account load error, missing profile, admin-session forbidden state, account loading/error route fallbacks, and field-level validation for address, return, and privacy forms.
- Completed 2026-05-14: Improve admin tables with stable pagination, filters, empty states, mutation loading states, and server-confirmed success/error feedback. Added consistent filter reset actions across order, catalog, customer, appointment, inventory, and audit tables, Outbox search/reset in integrations, admin loading/error route fallbacks, and pending/success/error feedback for catalog, inventory, coupon, order, shipment, refund, and appointment actions.
- Completed 2026-05-14: Audit client/server validation boundaries for forms already present in the repo and align copy with the existing Hebrew RTL interface. Completed checkout/manual order, account address/return/privacy, newsletter/wishlist/admin login, appointment booking, AI gift recommendations, and admin catalog/inventory/order validation helpers with focused unit coverage.

### Reliability Local

- Completed 2026-05-14: Expand smoke coverage for public routes, category/product navigation, checkout entry, account entry, and admin entry using existing local adapters. `pnpm smoke` now covers public informational routes, AI/gift tools, search results/no-results, all primary category pages, product-to-category links, checkout/account entry forms, unauthorized account export, chat bad-request handling, sanitized admin login, and protected admin route entry.
- Completed 2026-05-14: Add focused unit/integration tests for local catalog filtering, coupon validation, cart flow, form validation, and cache/revalidation helpers. Added pure catalog filter/availability coverage, active coupon lookup coverage, cart summary/options/quantity coverage with local DB mocks, stable cache tag tests, catalog revalidation tag dedupe tests, and retained the shared form validation test suite.
- Keep `pnpm lint`, `pnpm typecheck`, and targeted tests passing after each implementation slice.
- Completed 2026-05-14: Add regression checks for hydration-sensitive components that render differently on mobile and desktop. Added Playwright hydration/error-overlay guards for header mobile navigation, search/category filter sheets, and cart-count client hydration across mobile and desktop viewport changes.
- Completed 2026-05-14: Verify development fallbacks fail clearly when production-only provider env vars are absent. Added testable production env validation, documented Vercel runtime guard env in `.env.example`, blocked Typesense local search fallback on production search paths, and made missing production transactional email providers fail with an explicit provider error instead of mock delivery.
- Completed 2026-05-14: Standardized cart-count and analytics rate-limit regression coverage, tightened the local CardCom webhook fallback to provider-scoped payloads, and extended smoke coverage for invalid CardCom webhook signatures.
- Completed 2026-05-14: Added IP-scoped rate limiting to the admin search reindex route before authentication and covered both the authorized reindex path and standardized 429 response with route tests.
- Completed 2026-05-14: Minimized PII in local notification mock logs by redacting email/phone identifiers, suppressing OTP codes and message bodies, and adding adapter regression coverage.
- Completed 2026-05-14: Added CardCom webhook replay-protection regression coverage for timestamped HMAC signatures so stale signed callbacks are rejected.
- Completed 2026-05-14: Hardened customer privacy export/delete flows with per-user rate limits, no-store export download headers, audit-preserving export coverage, and Cloudinary webhook replay/signature regression tests.
- Completed 2026-05-14: Added a static security guardrail that scans source and scripts for common production secret/token patterns before they can land in code.
- Completed 2026-05-14: Added non-PII audit logging for admin customer-list access so customer-data browsing records admin, pagination, result counts, and query presence without storing raw search text.
- Completed 2026-05-14: Added IP-scoped rate limiting and route tests for the outbox job endpoint so repeated job triggers are throttled before processor work.
- Completed 2026-05-14: Minimized PII in outbox email job metadata by redacting email/phone recipients before `JobRun` persistence, with helper coverage.
- Completed 2026-05-14: Minimized PII in manual-order notification `IntegrationJob` payloads by redacting stored recipients while preserving actual delivery messages.
- Completed 2026-05-14: Replaced identifier-scoped rate-limit keys for newsletter, OTP, admin login, appointments, AI order support, checkout, cart checkout, and payment with stable SHA-256 scoped keys so Redis/shared limiter keys do not expose raw email or phone values.
- Completed 2026-05-14: Minimized PII in OTP delivery failure metadata by redacting persisted email/phone identifiers while preserving channel and helper coverage.

### Accessibility and Performance

- Completed 2026-05-14: Improved mobile keyboard/screen-reader flow for header navigation and filter sheets by closing sheets on selection, tightening sheet/dialog close labels, adding explicit cart and gallery live labels, and extending E2E coverage for those interactions.
- Completed 2026-05-14: Tuned product-card and product-gallery image `sizes`/lazy-loading behavior so search/category cards and gallery thumbnails request more appropriate responsive image candidates without layout changes.
- Completed 2026-05-14: Centralized Hebrew date and date-time rendering on an explicit `Asia/Jerusalem` timezone across account, admin, and manual-order notification surfaces to avoid date/locale drift.
- Completed 2026-05-14: Localized AI prompt/message and admin navigation accessibility labels, and marked decorative control icons as hidden from assistive technology.
- Completed 2026-05-14: Extended product-gallery keyboard flow with arrow/Home/End thumbnail activation, added explicit checkout quantity/remove labels and live quantity text, hid additional decorative category/header/AI icons from assistive technology, and covered the gallery/checkout labels in E2E regression checks.
- Completed 2026-05-14: Hardened admin filter/create/action controls with explicit accessible names, hid additional decorative admin/cookie icons, moved customer OTP cart-session hydration to a hydration-safe client snapshot, and added an account hydration regression check.
- Completed 2026-05-14: Closed another accessibility/hydration slice by hiding remaining decorative home/account/admin icons, adding explicit labels for home quick search and admin filters in customers, appointments, integrations, and audit, naming wishlist removal by product, keeping the accessibility widget trigger reachable when floating collision guards are active, moving accessibility preferences to a hydration-safe external-store snapshot, and adding Playwright regression checks for quick-search labels, stored accessibility settings, and widget keyboard operation.
- Completed 2026-05-14: Added a static Next Image `fill`/`sizes` regression guard and hid additional decorative branch, account, footer, search, AI, product, checkout, and loading icons from assistive technology.
- Completed 2026-05-14: Hardened shared AI chat elements with a named polite conversation log, accessible icon-only scroll/download/prompt controls, localized shared defaults, decorative action icons, and static regression coverage for those guardrails.
- Completed 2026-05-14: Removed eager priority loading from hidden account/search/gift/policy/branch/category media panels, hid remaining decorative search/account/cookie/admin/product/checkout/order-detail/about icons from assistive technology, and added static guards that prevent hidden image/media surfaces or hidden aria sections from being marked `priority`.
- Completed 2026-05-14: Made the cart checkout reservation countdown hydration-safe by rendering a stable initial placeholder before the client clock starts, and added a static guard against wall-clock state initializers in client-rendered app/component surfaces.
- Completed 2026-05-14: Hardened shared button behavior by defaulting native buttons to `type="button"`, preserving explicit submit/asChild behavior, and adding a static guard that keeps icon-sized buttons accessible by name.
- Completed 2026-05-14: Hardened shared spinner semantics so standalone loading indicators keep a status label while decorative spinners inside named buttons/loading regions stay hidden from assistive technology, with regression coverage.
- Completed 2026-05-14: Made shared status messages explicitly live and atomic so form errors announce assertively while neutral/success feedback announces politely, with regression coverage.
- Completed 2026-05-14: Tightened dark-mode contrast for shared status messages, checkout field errors, and saved-product affordances by using theme-aware destructive/success text classes.
- Completed 2026-05-14: Reviewed the mobile keyboard flow for header navigation and responsive filter sheets, wired the category filter sheet through the real Radix `SheetTrigger` so Escape/close restores focus to the trigger, and added Playwright coverage for keyboard opening/closing of mobile nav, search filters, and category filters.
- Completed 2026-05-14: Strengthened shared visible-focus contrast tokens across default, dark, and high-contrast modes; made Select and Dropdown highlighted states use full accent contrast instead of low-alpha focus fills; named Select scroll buttons and hid their chevron icons from assistive technology; and added static accessibility guardrails for these primitives.
- Audit image priority, sizes, aspect ratios, and lazy-loading behavior for hero, product cards, galleries, and category media.
- Prevent hydration mismatches by avoiding render-time randomness, date/locale drift, and server/client-only branching in hydrated trees.
- Keep large interactive surfaces responsive without layout shift during hover, focus, loading, and data refresh states.

### No-Blocker Validation Rules

- The work must run locally with the current repository and local environment.
- The work must not require new provider credentials, production webhooks, billing-plan changes, or manual platform configuration.
- The work may use mocks, local adapters, existing DB seed data, and development fallbacks.
- The work should improve code, UX, tests, documentation, or local verification without changing public API contracts unless a separate implementation plan explicitly approves it.

## Deferred / Blocked Work

These items are strategic, but they are not part of the no-blocker execution track because they require external access, provider credentials, production infrastructure, or business decisions.

- Real CardCom production checkout, live payment capture, refund execution, and full signed webhook validation require live CardCom credentials and provider contract details.
- Vercel Firewall/WAF rules, rate limiting at the platform edge, bot/challenge policies, and production security rollout require a deployed Vercel project and the correct Vercel plan/configuration.
- Vercel Queues consumers for durable email delivery, reservation expiry, search reindexing, payment reconciliation, and order-status notifications require production Vercel Queues setup.
- Vercel Observability dashboards, production traces, alerting, log drains, Speed Insights, and Web Analytics require production project access and observability configuration.
- Production email delivery requires verified sender domains and configured provider credentials, such as Resend or Brevo.
- SMS delivery requires a selected SMS vendor, sender setup, message templates, billing approval, and API credentials.
- Any production webhook hardening, provider reconciliation, real customer notification delivery, or external integration health check stays blocked until the relevant provider is configured.

The enterprise plan below remains the long-term strategic direction. Any item in it that depends on the blocked list above should be treated as deferred, not as no-blocker work.

## Current Status - 2026-04-30

Local, unblocked implementation work is complete for this phase.

Completed locally:

- DB-first catalog reads, public catalog cache/revalidation tags, and removal of public static catalog dependency.
- Guest/customer cart, OTP cart merge, coupon validation from DB, and cart checkout orchestration.
- Outbox/job processing for email, search reindex, reservation expiry, retry state, payment reconciliation placeholder, and order-status notifications.
- Search filters, facets, sort options, result analytics, click/view analytics, and production guard for Typesense config.
- Admin catalog CRUD, inventory edits, coupon management, customer summary, order status actions, shipment tracking, appointment management, return/refund approval, audit logs, and customer export/delete privacy flows.
- Customer account order detail, shipment/return visibility, return request form, saved addresses, wishlist management, appointments, and privacy export/delete controls.
- Product recently viewed, similar products, real media gallery flow, variant selector, and branch availability.
- AI gift recommendations with persisted recommendation sessions, style profile builder, order-support helper, and admin product-copy helper.
- Automated local smoke script: `pnpm smoke`.
- Automated agent-browser visual QA script: `pnpm visual:qa`, including CDP repair fallback, annotated home screenshot, and content/error-overlay checks for home, search, no-results search, category, checkout, and product routes.
- Transactional email adapter supports no-card providers via `RESEND_API_KEY` or `BREVO_API_KEY`, with production env validation and Resend idempotency for retry-safe outbox delivery.

Deferred external work is tracked in `Deferred / Blocked Work` so it stays separate from the immediate no-blocker roadmap.

## Key Architecture Changes

### 1. Single Source of Truth for Catalog and Inventory

- Move all catalog, product, search, gifts, stylist, and checkout reads from `src/lib/catalog.ts` to Prisma.
- Keep `src/lib/catalog.ts` only as temporary legacy seed/input, then remove it.
- Add a catalog query service:
  - customer-facing reads return active products only.
  - include variants, prices, media, branch inventory, category, material, and stone.
  - compute availability as `quantity - reserved - safetyStock`.
- Add cache strategy:
  - public catalog reads use cache components / Runtime Cache for stable catalog queries.
  - invalidation tags: `products`, `product:{slug}`, `category:{slug}`, `inventory:{branchId}`.
- Every admin change to catalog, price, or inventory must trigger revalidation and a search reindex event.

### 2. Production Cart, Checkout, and Payments

- Build a real cart:
  - guest cart with cookie session id.
  - customer cart associated with `Customer` after OTP login.
  - multi-item cart, quantity changes, remove item, gift wrap, gift message, coupon.
- Convert manual checkout into checkout orchestration:
  - create `Cart`, `CartItem`, `InventoryReservation`, `Order`, and `Payment`.
  - idempotency key per checkout attempt.
  - reservation TTL, release job, and full ledger.
- CardCom:
  - keep provider name `cardcom`.
  - use the real checkout API when production env is configured.
  - verified webhook signature updates `Payment` and `Order`.
  - duplicate webhook handled through `WebhookEvent(provider, externalId)`.
- Refunds and returns:
  - add refund request, approval, payment refund status, and inventory decision flow.

### 3. Event Backbone, Jobs, and Outbox

- Add `OutboxEvent` and `JobRun` to Prisma.
- Every critical business action writes an event in the same transaction:
  - `order.created`
  - `payment.captured`
  - `inventory.reserved`
  - `inventory.reservation_expired`
  - `email.requested`
  - `search.reindex_requested`
  - `webhook.received`
- Add Vercel Queues consumers:
  - email delivery and retry.
  - reservation expiry.
  - search reindex.
  - payment reconciliation.
  - order status notifications.
- Every consumer must be idempotent, at-least-once safe, and store attempts/error state.
- Use Vercel Queues for durable work. Messages are durable and delivered with at-least-once semantics.

### 4. Advanced Search

- Turn Typesense into the real search engine instead of a local fallback.
- Create index schema:
  - product id, slug, name, category, material, stone, price, tags, branch availability, popularity score.
- Search API:
  - Hebrew/English query text.
  - filters: category, material, stone, branch, price, collection, availability.
  - facets for every filter.
  - sort: relevance, price asc/desc, newest, popular.
- Search events:
  - store query, filters, result count, clicked product.
  - use this for future ranking.
- Local fallback is allowed only in development mode, not production.

### 5. Enterprise Admin

- Expand admin modules:
  - Catalog CRUD: products, variants, prices, media, categories, collections.
  - Inventory: branch stock, reservations, ledger, safety stock.
  - Orders: details, status transitions, payment status, shipment, refund.
  - Customers: profile, orders, addresses, wishlist, appointments.
  - Coupons/promotions.
  - Integrations health.
  - Audit logs.
- Permissions:
  - expand `AdminPermission` to granular permissions: `CATALOG_WRITE`, `INVENTORY_WRITE`, `ORDERS_REFUND`, `CUSTOMER_VIEW`, `SYSTEM_CONFIG`.
  - every DB mutation writes `AuditLog`.
- UX:
  - tables with filters/search/pagination.
  - optimistic admin actions only after server confirmation.
  - clear forbidden/unauthorized states.

### 6. Amazon-Level Customer Experience

- Account:
  - order history, order detail, delivery/pickup status.
  - saved addresses.
  - saved sizes/style profile.
  - wishlist management.
  - appointment booking/history.
- Product page:
  - real gallery from `ProductMedia`.
  - variant selector by size/metal/stone.
  - realtime branch availability.
  - recently viewed.
  - similar products.
- Checkout:
  - guest checkout.
  - basic address validation.
  - coupon validation.
  - shipping/pickup selection.
  - clear reservation countdown.
- Notifications:
  - transactional email/SMS for every order lifecycle.
  - retry through outbox/job system.

### 7. AI Commerce Layer

- Upgrade AI stylist:
  - persistent `RecommendationSession`.
  - tool calls use real catalog/search DB only.
  - structured output for recommended products.
  - never invent products, prices, or inventory.
- Add AI use cases:
  - gift finder.
  - style profile builder.
  - admin product copy assistant.
  - customer support assistant for order status.
- Use AI SDK 6 patterns: agents, tool approval, structured/tool workflows.
- Store prompt/version/model/output for audit and improvement.

### 8. Security, Rate Limiting, and Compliance

- Add server-side rate limits:
  - OTP request.
  - OTP verify.
  - checkout create.
  - chat API.
  - webhooks.
  - admin login.
- Vercel Firewall:
  - WAF rate limiting for `/api/chat`, `/api/auth`, `/api/webhooks/*`, `/checkout`.
  - bot/challenge rules for abnormal traffic.
- Webhooks:
  - production signature verification is mandatory for every provider.
  - raw body hashing.
  - replay protection by timestamp/externalId.
- Secrets:
  - no secrets in code.
  - strict production env validation.
- Privacy:
  - PII minimization in logs.
  - customer deletion/export plan.
  - audit access to customer data.

### 9. Observability, Reliability, and Performance

- Vercel Observability:
  - traces for checkout, payment, search, and admin mutations.
  - dashboards for 5xx, latency, queue retries, conversion funnel.
  - alerts for payment webhook failures, email failures, reservation job failures.
- Business metrics:
  - add-to-cart rate.
  - checkout completion.
  - payment success/failure.
  - search no-results.
  - inventory reservation conflicts.
- Performance:
  - CDN/cache for catalog.
  - Runtime Cache for catalog/facet data that is not user-specific.
  - dynamic pages only where freshness is required.
  - image optimization through Cloudinary/Next Image.
- Runtime Cache is for shared/stable data and DB queries, not per-customer data.

## Public Interfaces / Data Model Changes

- Add Prisma models:
  - `OutboxEvent`
  - `JobRun`
  - `CartSession` or cart session fields for guest cart ownership
  - `SearchIndexJob` optional if not using generic outbox
  - `ProductViewEvent`
  - `ProductClickEvent`
- Extend existing models:
  - `Cart`: add session key / expiresAt / merge metadata.
  - `Payment`: add `providerStatus`, `failureCode`, `capturedAt`, `refundedAt`.
  - `Order`: add lifecycle timestamps.
  - `ProductMedia`: support multiple images/video and primary flag.
  - `AdminPermission`: granular permissions.
- New route/API behavior:
  - `catalog.*` reads from DB only.
  - `cart.*` supports create/read/update/remove/merge.
  - `checkout.*` creates order/payment/reservation transactionally.
  - `admin.*` expands to CRUD and operational workflows.
  - `search.*` uses Typesense in production.
  - webhooks persist and process through outbox/queue.

## Implementation Order

1. Stabilization baseline:
   - Run full checks.
   - Commit current working state.
   - Add this plan as `docs/ACTION_PLAN_AMAZON_LEVEL.md`.
2. DB-first catalog:
   - Replace static catalog reads with Prisma services.
   - Add cache/revalidation.
   - Remove public dependency on `src/lib/catalog.ts`.
3. Cart and checkout:
   - Implement real cart.
   - Convert manual checkout into order orchestration.
   - Preserve current manual-order flow as fallback/admin-assisted mode.
4. Event/outbox/jobs:
   - Add outbox models.
   - Move email/search/reservation expiry to jobs.
   - Add idempotent consumers.
5. Search:
   - Implement Typesense indexing/querying/facets.
   - Add reindex jobs and search analytics.
6. Payments:
   - Complete CardCom create checkout and webhook processing.
   - Add reconciliation and refund primitives.
7. Admin expansion:
   - Catalog CRUD, inventory, order detail, customer profile, coupons.
   - Audit everything.
8. Customer experience:
   - Account details, order detail, addresses, wishlist management.
   - Product recommendations and recently viewed.
9. AI layer:
   - Persistent recommendation sessions.
   - Structured AI outputs.
   - Admin/customer AI tools.
10. Production hardening:
    - Vercel Firewall rules.
    - Observability dashboards.
    - smoke/e2e tests.
    - rollout checklist.

## Test Plan

- Unit tests:
  - pricing, coupons, stock reservation, order transitions.
  - outbox idempotency.
  - payment webhook dedupe.
  - OTP rate limit and verification.
  - search query mapping.
- Integration tests:
  - add product to cart -> checkout -> order created -> reservation created.
  - payment webhook captured -> payment/order updated once.
  - reservation expiry job releases stock.
  - admin status update writes audit log.
  - catalog update triggers cache invalidation and search reindex event.
- E2E tests:
  - browse category, filter, product detail, add to cart, checkout.
  - customer OTP login and order history.
  - admin login, update inventory, verify product availability changes.
  - search no-results and facets.
- Production smoke:
  - `/`, category, product, checkout, account, admin login.
  - webhook endpoint signature failure returns 401.
  - health check for DB/search/email/payment adapters.

## Assumptions and Defaults

- Target is Single Brand, not marketplace.
- Target infrastructure is Vercel Managed.
- Plan format is Engineering Spec.
- Payment provider remains CardCom unless business chooses otherwise.
- Search provider remains Typesense because dependency already exists.
- Email provider remains existing `NotificationProvider` abstraction; production can use Brevo or Resend via env.
- SMS remains provider abstraction until a real SMS vendor/API key is supplied.
- "Amazon level" means enterprise-grade reliability, scale, observability, operations, personalization and checkout quality, not Amazon marketplace seller functionality.
- External provider credentials, Vercel project configuration, WAF publishing and billing-plan upgrades remain operational blockers outside repo-only implementation.

## References

- Next.js 16.2: https://nextjs.org/blog/next-16-2
- React 19.2: https://react.dev/blog/2025/10/01/react-19-2
- Vercel AI SDK 6: https://vercel.com/blog/ai-sdk-6
- Vercel Queues: https://vercel.com/docs/queues
- Vercel Runtime Cache: https://vercel.com/docs/runtime-cache
- Vercel Observability: https://vercel.com/docs/observability
- Vercel Firewall / Rate Limiting: https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting
