# ACTION_PLAN_AMAZON_LEVEL.md - Aphrodite Enterprise Commerce Plan

## Summary

Goal: turn Aphrodite from a soft-launch commerce system into an enterprise-grade Single Brand ecommerce platform on Vercel Managed infrastructure, with high-quality buying, operations, security, AI, search, payments, observability, and scale.

Default direction: keep Next.js/Vercel as the base, do not build a marketplace, and move through engineering-spec phases that keep the system stable at every step.

## No-Blocker Upgrade Roadmap

This section is the immediate execution track. Every item here can be implemented from the repository alone without new credentials, external provider setup, Vercel production configuration, billing-plan changes, or business-contract decisions.

Use this track for local product quality, UI polish, correctness, and implementation hardening. If an item requires CardCom production access, Vercel WAF/Queues/Observability setup, an SMS vendor, production email domains, or any provider secret that is not already available locally, it belongs in `Deferred / Blocked Work` instead.

### UX and Responsive Polish

- Lock the home hero layout to equal visual offsets on both sides and matching top/bottom spacing across desktop widths.
- Keep mobile navigation sheets and all popup surfaces opaque, including Sheet, Dialog, AlertDialog, Dropdown, Popover, Select, Tooltip, Command, and HoverCard surfaces.
- Close mobile-only sheets automatically when the viewport reaches the desktop breakpoint.
- Add or extend visual QA screenshots for the home hero, mobile navigation, category sheets, filter panels, and key popups.
- Review responsive layout at mobile, tablet, laptop, and wide desktop widths for text overflow, clipped controls, and inconsistent spacing.

### Product Discovery

- Improve category pages with clearer loading, empty, no-results, and error states.
- Tighten filter UX: stable selected states, reset affordances, disabled states for unavailable filters, and mobile sheet behavior.
- Improve search page ergonomics with better query persistence, no-results recovery, and clear result counts.
- Refine product cards for consistent image ratios, badges, price/availability presentation, favorite controls, and keyboard focus.
- Improve product pages with clearer media gallery states, variant/availability feedback, recently viewed, and non-AI catalog-based recommendation rails.

### Checkout, Account, and Admin

- Strengthen checkout form states: field-level validation, submission loading, recoverable errors, disabled duplicate submits, and clear pickup/shipping selection.
- Improve cart and checkout empty states so users always have a clear next action.
- Tighten account pages with loading, empty, forbidden, and error states for orders, addresses, wishlist, appointments, and privacy flows.
- Improve admin tables with stable pagination, filters, empty states, mutation loading states, and server-confirmed success/error feedback.
- Audit client/server validation boundaries for forms already present in the repo and align copy with the existing Hebrew RTL interface.

### Reliability Local

- Expand smoke coverage for public routes, category/product navigation, checkout entry, account entry, and admin entry using existing local adapters.
- Add focused unit/integration tests for local catalog filtering, coupon validation, cart flow, form validation, and cache/revalidation helpers.
- Keep `pnpm lint`, `pnpm typecheck`, and targeted tests passing after each implementation slice.
- Add regression checks for hydration-sensitive components that render differently on mobile and desktop.
- Verify development fallbacks fail clearly when production-only provider env vars are absent.

### Accessibility and Performance

- Review keyboard flow for header navigation, mobile sheets, filters, dialogs, product cards, checkout forms, and admin actions.
- Fix contrast, visible focus, aria labels, heading order, and screen-reader labels where existing UI falls short.
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
