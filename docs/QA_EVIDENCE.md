# Elysia QA Evidence Ledger

Status: single consolidated QA evidence artifact. Each section below is one
former `docs/qa/*.md` file, preserved verbatim as recorded evidence. New QA
evidence is appended as a new `## Evidence:` section; existing sections are
historical records and are not rewritten.

Sections: 46

## Index

- [about-page-redesign](#evidence-about-page-redesign)
- [account-dashboard-privacy-shortcut-clarity-benchmark](#evidence-account-dashboard-privacy-shortcut-clarity-benchmark)
- [account-order-timeline-clarity-benchmark](#evidence-account-order-timeline-clarity-benchmark)
- [account-recovery-service-shortcuts-benchmark](#evidence-account-recovery-service-shortcuts-benchmark)
- [admin-customer-order-filter-recovery-benchmark](#evidence-admin-customer-order-filter-recovery-benchmark)
- [admin-login-redirect-evidence](#evidence-admin-login-redirect-evidence)
- [ai-stylist-fallback-benchmark](#evidence-ai-stylist-fallback-benchmark)
- [benchmark-traceability](#evidence-benchmark-traceability)
- [branches-online-only-service-continuity-benchmark](#evidence-branches-online-only-service-continuity-benchmark)
- [catalog-owner-intake-template](#evidence-catalog-owner-intake-template)
- [catalog-quality-report](#evidence-catalog-quality-report)
- [catalog-readiness-remediation-plan](#evidence-catalog-readiness-remediation-plan)
- [catalog-readiness-wave-0-baseline](#evidence-catalog-readiness-wave-0-baseline)
- [category-active-filter-sort-clarity-benchmark](#evidence-category-active-filter-sort-clarity-benchmark)
- [category-no-result-recovery-depth-benchmark](#evidence-category-no-result-recovery-depth-benchmark)
- [checkout-delivery-confidence-benchmark](#evidence-checkout-delivery-confidence-benchmark)
- [checkout-quantity-mobile-summary-benchmark](#evidence-checkout-quantity-mobile-summary-benchmark)
- [checkout-validation-payment-confidence-benchmark](#evidence-checkout-validation-payment-confidence-benchmark)
- [customer-auth-e2e-fixture](#evidence-customer-auth-e2e-fixture)
- [faq-content-service-recovery-links-benchmark](#evidence-faq-content-service-recovery-links-benchmark)
- [floating-chrome-collision-audit](#evidence-floating-chrome-collision-audit)
- [homepage-discovery-commerce-balance-benchmark](#evidence-homepage-discovery-commerce-balance-benchmark)
- [legal-page-editorial-structure-benchmark](#evidence-legal-page-editorial-structure-benchmark)
- [mobile-pdp-rail-density-benchmark](#evidence-mobile-pdp-rail-density-benchmark)
- [offline-page-install-pwa-recovery-priority-benchmark](#evidence-offline-page-install-pwa-recovery-priority-benchmark)
- [order-source-label-audit](#evidence-order-source-label-audit)
- [pdp-purchase-confidence-benchmark](#evidence-pdp-purchase-confidence-benchmark)
- [pdp-size-care-fit-fact-placement-benchmark](#evidence-pdp-size-care-fit-fact-placement-benchmark)
- [product-card-quick-facts-density-benchmark](#evidence-product-card-quick-facts-density-benchmark)
- [product-gallery-full-gallery-benchmark](#evidence-product-gallery-full-gallery-benchmark)
- [product-gallery-media-fallback-thumbnail-clarity-benchmark](#evidence-product-gallery-media-fallback-thumbnail-clarity-benchmark)
- [product-recommendation-rail-return-context-benchmark](#evidence-product-recommendation-rail-return-context-benchmark)
- [production-deployment-evidence-ledger](#evidence-production-deployment-evidence-ledger)
- [production-visual-smoke-evidence-refresh](#evidence-production-visual-smoke-evidence-refresh)
- [provider-negative-path-review](#evidence-provider-negative-path-review)
- [public-performance-sweep](#evidence-public-performance-sweep)
- [release-scorecard](#evidence-release-scorecard)
- [route-evidence-ledger](#evidence-route-evidence-ledger)
- [route-status-sharded-visual-audit](#evidence-route-status-sharded-visual-audit)
- [search-category-filter-density-benchmark](#evidence-search-category-filter-density-benchmark)
- [search-empty-state-guided-recovery-benchmark](#evidence-search-empty-state-guided-recovery-benchmark)
- [service-response-contact-clarity-benchmark](#evidence-service-response-contact-clarity-benchmark)
- [service-topic-attachment-review-benchmark](#evidence-service-topic-attachment-review-benchmark)
- [size-guide-save-context-return-path-benchmark](#evidence-size-guide-save-context-return-path-benchmark)
- [split-checkout-ux-audit](#evidence-split-checkout-ux-audit)
- [tiffany-plus-visual-qa-mobile-first](#evidence-tiffany-plus-visual-qa-mobile-first)
- [wave-0-owner-evidence-register](#evidence-wave-0-owner-evidence-register)
- [wishlist-shortlist-decision-support-benchmark](#evidence-wishlist-shortlist-decision-support-benchmark)

---

<a id="evidence-about-page-redesign"></a>

## Evidence: about-page-redesign

# About Page Redesign QA

Generated: 2026-05-20

## Baseline signals

Local benchmark reviewed before the redesign.

Key mismatches before redesign:

- Desktop about height: Elysia 5203px vs corpus median 3935px.
- Tablet about height: Elysia 6263px vs corpus median 3815px.
- Mobile about height: Elysia 9639px vs corpus median 4767px.
- Media: Elysia image count 0 in measured about content vs corpus median 18 desktop and 22 tablet.
- Density: link and control density were below the corpus range.
- Tone: excessive aqua accents were flagged compared with the high-jewelry corpus.

## Review matrix

Checked the page across these grouped aspects:

- Structure: hero, story, values, proof points, service path, closing CTA.
- Media: count, placement, aspect ratios, crop behavior, alt text, local AVIF usage, product-first imagery.
- Layout density: section height, heading count, paragraph count, row rhythm, CTA density, white-space balance.
- Commerce clarity: paths to catalog, categories, gifts, service and search.
- RTL: Hebrew flow, right-aligned content, mixed English/Hebrew brand name handling.
- Accessibility: real image alt text, decorative icons hidden, semantic sections, visible focus inherited from buttons.
- Performance: `next/image`, local bitmap assets, fixed aspect-ratio containers, no remote image dependency.
- Motion stability: initial sections use stable reveal behavior where needed; media has reserved dimensions.
- Visual restraint: no decorative gradients, no nested page cards, no redundant framed CTA block.

## Implementation

- Replaced the text-heavy About page with a compact editorial layout.
- Added 5 body image placements plus the existing hero media sequence.
- Moved from long manifesto sections to short proof-led copy.
- Kept only one repeated card grid for values; standards and workflow are line-based rows.
- Added category, catalog, gifts and service routes without turning the page into a marketing landing page.
- Preserved the project’s low-shadow, neutral, product-led visual system.

## Acceptance checks

- Page includes local product/editorial bitmap images, not SVG illustrations.
- Body media is reserved with `aspect-*` containers to avoid layout jumps.
- No final boxed `brand-surface` CTA.
- No duplicate icons inside any static icon list.
- Text scale remains editorial, not oversized dashboard or hero type inside panels.

## Relaunch v2 (2026-07-06)

Chaptered editorial rebuild on top of the original guardrails:

- Sticky chapter navigation (`about-chapter-nav`) with IntersectionObserver
  scrollspy; anchors map to the four content chapters.
- Manifesto chapter gains a facts band (`about-stats-band`) with four factual
  numerals (925 silver, 12-month warranty, 24h response, online-only model).
- Principles chapter uses a sticky editorial figure (desktop) with numbered
  hairline rows instead of boxed cards, plus a wide banner figure with an
  in-image caption.
- Process chapter is a horizontal four-step flow with a hairline that draws
  once on reveal; vertical on mobile.
- All guardrails still hold: media-led (hero + two figures + fixed band),
  compact section padding, no `Separator`, and no final boxed `brand-surface`
  CTA. Reduced-motion and night-mode variants covered in `globals.css`.

### v2.1 owner-feedback fixes (2026-07-06)

- Hero stripped to image + scrim + copy: aurora layers, Ken Burns drift and
  title sheen removed after owner review flagged them as excessive.
- Site-wide desktop category row removed from the header (owner preference);
  header returns to the split three-column layout only.
- Principles chapter: neutralised homepage story-band layout baggage
  (50vw width / fixed grid slots) that made the figure overlap the copy.
- Service chapter rebalanced to a symmetric 4+4 card grid (facts + care,
  then trust links).
- Chapter nav aligns flex-start on mobile (no horizontal page overflow) and
  centers from lg.
- Night mode: hero primary CTA label pinned to literal ink so it stays
  readable on the cream fill.

---

<a id="evidence-account-dashboard-privacy-shortcut-clarity-benchmark"></a>

## Evidence: account-dashboard-privacy-shortcut-clarity-benchmark

# Account Dashboard Privacy Shortcut Clarity Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-036 Account Dashboard Data Recovery and Privacy Shortcut Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account` recovery shortcuts, protected dashboard empty
states, privacy export, privacy deletion, and service recovery links for account
and order support.

## Gate Classification

- `Change Type`: Protected account recovery and privacy action clarity.
- `Route Context`: `/account`.
- `Primary Lens`: Account, privacy, service, and auth-boundary guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/account-recovery-service-shortcuts-benchmark.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the account/service evidence recorded in
`docs/qa/account-recovery-service-shortcuts-benchmark.md` and the privacy
control expectations already enforced by repository tests.

| Site          | Evidence URL                                  | Observed Pattern                                                                                    | Weight |
| ------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/contact-us/     | Account and service recovery route users to supported contact and protected account flows.          | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/customer-service/     | Customer service groups order, account, privacy, and contact recovery without exposing data.        | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/contact-us      | Service and privacy support are presented through supported contact/account routes.                 | 1.5    |
| Graff         | https://www.graff.com/us-en/customer-service/ | Account and order support is grouped through customer service and protected customer actions.       | 1.5    |
| Chopard       | https://www.chopard.com/en-us/contact-us      | Customer service provides account, order, and privacy-adjacent support without self-service claims. | 1.5    |
| Boucheron     | https://www.boucheron.com/us/contact-us       | Account help and privacy support route through clear service/contact destinations.                  | 1.5    |
| Piaget        | https://www.piaget.com/us-en/contact-us       | Service routes keep account and privacy support structured and protected.                           | 1.5    |
| Messika       | https://www.messika.com/us_en/contact         | Support flows centralize order and account help while keeping sensitive actions explicit.           | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The account dashboard may clarify privacy shortcuts
  and data actions when the grouping stays inside protected account UI and uses
  existing supported export/delete/service routes only.

## Implementation Decision

Implement a narrow account privacy clarity pass:

- Keep the existing account recovery shortcut rail and `#account-privacy`
  anchor.
- Add concise context above privacy actions explaining export, deletion, and
  service recovery.
- Keep export and deletion as the only direct privacy actions.
- Do not expose protected data in the shortcut rail.
- Do not add unsupported self-service account/order actions.

## Acceptance Checks

- Privacy shortcut remains anchored to `#account-privacy`.
- Privacy action context appears inside the protected account privacy card.
- Export and deletion remain explicit and separate.
- Service links remain routed through existing supported flows only.

## Verification

- `pnpm test -- src/styles/account-dashboard-privacy-shortcut-clarity.test.ts src/styles/account-recovery-shortcuts.test.ts src/styles/cookie-privacy-controls-contract.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports copy and grouping only. Any new privacy workflow,
identity challenge, data preview, or order/account mutation must be benchmarked
and verified against auth and privacy boundaries separately.

---

<a id="evidence-account-order-timeline-clarity-benchmark"></a>

## Evidence: account-order-timeline-clarity-benchmark

# Account Order Timeline Clarity Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-009 Account Order Timeline Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account`, `/account/orders/[id]`, local order status
sequencing, return context, shipment context, and read-only Shopify mirror
presentation.

## Gate Classification

- `Change Type`: Account order comprehension and self-service UX.
- `Route Context`: account and order detail.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Account, service, checkout, returns, and order guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site       | Evidence URL                                              | Observed Pattern                                                                                 | Weight |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Bulgari    | https://www.bulgari.com/en-us/account/orders/00812581     | Account order detail sits under order history with customer-care links for order information.    | 1.5    |
| Boucheron  | https://www.boucheron.com/us/faqs/your-order?glCountry=US | Logged-in clients can check order status in the My Orders section; guest tracking is separate.   | 1.5    |
| Chopard    | https://www.chopard.com/en-us/faq.html                    | FAQ explains shipping cadence, order-status email updates, and order-tracking page recovery.     | 1.5    |
| Cartier    | https://www.cartier.com/en-us/page-show?cid=faqHelp       | FAQ exposes check-order, delivery lead-time, return portal, quality-control, and status context. | 1.5    |
| Buccellati | https://www.buccellati.com/en_us/wishlist                 | Account benefits include real-time order monitoring from shipping through delivery.              | 1.5    |
| De Beers   | https://www.debeers.com/en-us/faqs.html                   | FAQ explains confirmation email, delivery tracking, returns, quality check, and client services. | 1.5    |
| Piaget     | https://www.piaget.com/us-en/faq                          | Account FAQ routes clients to My Orders for order status and client relations for questions.     | 1.5    |
| Bvlgari    | https://www.bulgari.com/en-us/account/orders/00820141     | Account order-detail pattern links back to order history and customer care routes.               | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Local account orders may show a compact status
  sequence when it uses existing order timestamps/statuses, stays read-only for
  supplier mirrors, and routes unresolved questions to service.

## Implementation Decision

Implement a narrow customer-order pass:

- Add a reusable local-order timeline helper for accepted, payment, preparation,
  handoff, completion, cancellation, and refund states.
- Show the current local-order timeline event on `/account` order cards.
- Show the full local-order timeline on `/account/orders/[id]`.
- Add a test marker to Shopify mirror status copy while keeping it read-only
  and service-routed only.
- Keep return forms, shipment cards, payment status labels, and service
  shortcuts unchanged.

## Acceptance Checks

- Timeline events are generated from existing local order status/date fields.
- Account order cards expose one current status cue, not a full dense timeline.
- Order detail exposes the full compact timeline before item/summary/support
  cards.
- Shopify mirror orders remain read-only and do not receive local order actions.
- Service/return shortcuts remain the supported recovery path.

## Verification

- `pnpm test -- src/app/account/_lib/order-timeline.test.ts src/styles/account-order-timeline.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for `/account` logged-out state and authenticated order detail
  when a seeded customer is available.

## Residual Risk

The benchmark supports status explanation only. Live carrier tracking, supplier
fulfillment events, automated return labels, customer notifications, and order
mutation actions still require provider readiness and separate benchmark
approval.

---

<a id="evidence-account-recovery-service-shortcuts-benchmark"></a>

## Evidence: account-recovery-service-shortcuts-benchmark

# Account Recovery and Service Shortcuts Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-009 Account Recovery and Service Shortcuts
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account`, `/account/orders/[id]`, `/service`, account
order recovery, return and exchange recovery, supplier-backed order support,
and privacy/service escalation.

## Gate Classification

- `Change Type`: Account and service recovery UX.
- `Route Context`: account and service.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Account, service, and commerce recovery guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                       | Weight |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier            | https://www.cartier.com/en-us/page-show?cid=faqHelp         | Account and order help connect logged-in orders, returns portal, cancellation limits, and client care. | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                    | Client care groups orders, returns, jewelry service, contact, and repair/sizing recovery.              | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/faq                           | FAQ groups order information, returns and exchanges, contact, account, services, care, and warranty.   | 1.5    |
| Boucheron          | https://www.boucheron.com/us/faqs?glCountry=US              | FAQ separates client account, orders, returns, and after-sales service.                                | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html | Care and service flow exposes sizing, maintenance, repair, customization, and concierge recovery.      | 1.5    |
| Chopard            | https://www.chopard.com/en-us/faq.html                      | FAQ connects online orders, return authorization, customer service, repairs, and service contact.      | 1.5    |
| De Beers           | https://www.debeers.com/en-us/delivery-and-returns.html     | Delivery and returns guidance requires order number plus Client Services for exchange/return help.     | 1.5    |
| Pomellato          | https://www.pomellato.com/us_en/shipping-and-returns        | Account order area and Orders/Returns paths support return or replacement requests.                    | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Account and order pages may add compact recovery
  shortcuts when they route to real service or privacy flows, keep protected
  account content task-first, and do not introduce unsupported account features.

## Implementation Decision

Implement a narrow recovery pass:

- Add compact account-level shortcuts for order help, returns, supplier-backed
  order help, and privacy/data actions.
- Add order-detail shortcuts that prefill the service form with the current
  order number and topic.
- Add supplier mirror service links because supplier orders are read-only in
  Elysia and need a support path instead of unsupported local actions.
- Let `/service` accept `topic`, `orderNumber`, `productReference`, and
  `message` query params so account links open the right recovery context.
- Keep existing account cards, privacy export route, local return form, and
  service request submission behavior unchanged.

## Acceptance Checks

- Recovery shortcuts are visible but do not replace account order cards,
  wishlist, saved sizes, addresses, privacy actions, or service forms.
- Service links preselect a valid topic and optional order number.
- Shopify mirror orders remain read-only and route customers to service instead
  of local fulfillment/payment actions.
- Privacy shortcut routes to existing privacy actions.
- No new runtime schema, database, API response shape, or auth boundary is
  introduced.

## Verification

- `pnpm test -- src/app/account/_lib/account-recovery.test.ts src/styles/account-recovery-shortcuts.test.ts src/app/account/privacy/export/route.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Browser smoke for `/account` logged-out state and `/service?topic=order`.

## Residual Risk

The benchmark supports compact recovery shortcuts and service prefill only. Any
future customer order timeline, supplier fulfillment workflow, return portal, or
live account automation must run through the gate or the relevant provider
readiness checks.

---

<a id="evidence-admin-customer-order-filter-recovery-benchmark"></a>

## Evidence: admin-customer-order-filter-recovery-benchmark

# Admin Customer and Order Filter Recovery Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-041 Admin Customer and Order Filter Recovery Audit
- `Status`: Supported and implemented

## Scope

This benchmark covers `/admin/orders`, `/admin/customers`, `/admin/service`,
active filter summaries, filtered empty states, reset links, pagination recovery,
and audit-safe operational copy.

## Gate Classification

- `Change Type`: Protected admin operations recovery and table-state clarity.
- `Route Context`: Admin order, customer, and service queues.
- `Primary Lens`: Admin and operations guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: Existing admin empty-state, route error boundary, and
  outbox/job failure contract tests.
- `Required Gate`: Internal admin benchmark evidence; public gate is not
  required because the affected routes are protected admin surfaces.

## Benchmark Evidence

This item builds on existing admin empty-state evidence and common dashboard
recovery patterns: filtered table views should expose the active filter context,
keep reset links route-backed, and avoid hidden automation claims.

| Source                    | Evidence URL                                                        | Observed Pattern                                                                                    | Weight |
| ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Existing admin audit      | `src/styles/admin-empty-state-contract.test.ts`                     | Admin table empty states already require reset actions on filtered queues.                          | 1.5    |
| Existing service queue    | `src/styles/admin-service-queue-filter-state.test.ts`               | Service queue normalizes filters, shows active filters, and distinguishes filtered/unfiltered data. | 1.5    |
| Existing route recovery   | `src/styles/route-error-boundary-recovery.test.ts`                  | Admin recovery paths route to supported safe destinations.                                          | 1.5    |
| Existing outbox contract  | `src/styles/search-outbox-job-failure-contract.test.ts`             | Operational failures stay sanitized and route-backed.                                               | 1.5    |
| Vercel admin template     | https://vercel.com/templates/next.js/admin-dashboard                | Dashboard templates organize operational data with tables and route-backed task navigation.         | 1.5    |
| shadcn table empty state  | https://www.shadcn.io/blocks/table-empty-01                         | Empty data tables benefit from clear search/filter recovery and direct next actions.                | 1.5    |
| Next.js on Vercel docs    | https://vercel.com/docs/frameworks/nextjs                           | Next.js route segments support loading/recovery states within the route tree.                       | 1.5    |
| Local admin route pattern | `src/app/admin/orders/page.tsx`, `src/app/admin/customers/page.tsx` | Order and customer tables already have route-backed filters and pagination.                         | 1.5    |

## Score

- `Supported Sources`: 8 of 8.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Admin order and customer filters may add active-filter
  summaries, distinct filtered empty states, and reset actions when they remain
  route-backed and do not add unsupported bulk actions, exports, or provider
  dashboard assumptions.

## Implementation Decision

Implement a narrow admin filter recovery pass:

- Add active-filter summaries to order and customer tables.
- Add filtered/unfiltered empty-state distinctions to order and customer views.
- Keep service queue recovery unchanged and covered.
- Keep reset actions on route-backed admin paths.
- Do not add bulk automation, exports, provider dashboard scraping, or private
  data beyond the existing protected tables.

## Acceptance Checks

- Order, customer, and service queues expose active filter recovery.
- Filtered empty states differ from unfiltered empty states.
- Reset links point to the current admin route without unsafe query reuse.
- Pagination recovery preserves only supported filter parameters.

## Verification

- `pnpm test -- src/styles/admin-customer-order-filter-recovery.test.ts src/styles/admin-empty-state-contract.test.ts src/styles/admin-service-queue-filter-state.test.ts src/styles/route-error-boundary-recovery.test.ts src/styles/search-outbox-job-failure-contract.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports protected admin filter recovery only. New exports, bulk
actions, provider dashboard automation, or customer data previews require a
separate privacy and operations review.

---

<a id="evidence-admin-login-redirect-evidence"></a>

## Evidence: admin-login-redirect-evidence

# Admin Login Redirect Evidence

Date: 2026-06-01

Scope: `next` parameter handling for `/admin/login`.

## Expected Behavior

- Empty, missing, external, protocol-relative, JavaScript, control-character, and
  non-admin redirect values resolve to `/admin`.
- Internal admin paths remain usable after whitespace trimming and one safe
  percent-decoding pass.
- The login page may use the sanitized value only after
  `sanitizeAdminRedirect` has accepted it.

## Evidence

- `src/server/auth/admin-redirect.ts` normalizes the input and accepts only
  `/admin`, `/admin/...`, or `/admin?...`.
- `src/server/auth/admin-redirect.test.ts` covers internal admin redirects,
  encoded admin paths, external URLs, protocol-relative URLs, encoded external
  URLs, scheme payloads, control characters, and non-admin paths.

---

<a id="evidence-ai-stylist-fallback-benchmark"></a>

## Evidence: ai-stylist-fallback-benchmark

# AI and Stylist Fallback UX Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-010 AI and Stylist Fallback UX
- `Status`: Supported and implemented

## Scope

This benchmark covers `/ai`, `/stylist`, gift recommendation, stylist chat,
provider unavailable states, quota or rate-limit failure states, and recovery
paths back to product discovery and service.

## Gate Classification

- `Change Type`: AI and stylist degraded-state UX.
- `Route Context`: demoted AI/service tool routes.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: AI/stylist route guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                 | Observed Pattern                                                                                              | Weight |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/experience-gift-selection.html | Gift selection is treated as assisted discovery and routes shoppers to boutique or Client Relations guidance. | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                     | Client care groups gift choice, virtual appointments, product help, and service escalation.                   | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/services                       | Services connect gifting, appointments, personalization, order information, care, and store discovery.        | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/contact-us--info.html          | Contact paths include chat, call, web message, and virtual or in-person appointment recovery.                 | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html  | Care and service content offers advisor contact and appointment recovery instead of relying on one tool.      | 1.5    |
| Boucheron          | https://www.boucheron.com/us/services                        | Services provide contact, size guide, appointment preparation, remote boutique visit, and after-sales paths.  | 1.5    |
| Chopard            | https://www.chopard.com/en-us/pendant/799070-1001.html       | Product assistance includes ambassador contact and boutique appointment actions near product discovery.       | 1.5    |
| De Beers           | https://www.debeers.com/                                     | Client Services support store appointments, live chat, enquiry, email, call back, and fallback contact copy.  | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. AI and stylist tools may expose compact degraded-state
  recovery paths when those paths route to real product discovery, size/service,
  or client-care surfaces and do not promote AI as the primary shopping path.

## Implementation Decision

Implement a narrow degraded-state pass:

- Add a shared AI fallback recovery component for stylist chat and gift
  recommendation failures.
- Show safe, customer-facing copy for unavailable, quota, rate-limit, or
  unknown AI failures without exposing provider credentials or internal model
  names in the UI.
- Route customers to `/search`, a category path, `/size-guide`, and `/service`
  with a prefilled fallback context.
- Keep existing AI SDK transport, chat route, TRPC mutation, product
  recommendation contracts, provider router, and audit behavior unchanged.

## Acceptance Checks

- AI remains a demoted service/tool experience and does not move into primary
  navigation or checkout hierarchy.
- Fallback copy is visible only when AI tool calls fail or degraded states are
  reached.
- Recovery links route to existing product discovery and service surfaces.
- Provider, quota, credential, and model details are not shown directly in the
  customer UI.
- Existing validation messages remain field-oriented and do not get replaced by
  generic AI fallback copy.

## Verification

- `pnpm test -- src/app/ai/_lib/ai-fallback.test.ts src/styles/ai-fallback-recovery.test.ts src/app/api/chat/route.test.ts src/server/ai/model.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Browser smoke for `/stylist` and `/ai?tab=gifts`.

## Residual Risk

The benchmark supports degraded-state recovery only. Any future automatic
appointment booking, AI-authored checkout guidance, live agent routing,
provider-specific quota UI, or AI promotion on primary shopping routes must run
through a new benchmark or provider readiness review.

---

<a id="evidence-benchmark-traceability"></a>

## Evidence: benchmark-traceability

# QA Benchmark Traceability

- `Backlog Item`: I-199 Benchmark Traceability
- `Status`: Implemented as a source-level traceability check

## Rule

QA benchmark documents may reference a backlog ID only when the ID is either
present in the current multi-aspect backlog or intentionally listed as a
historical benchmark ID in the traceability test.

## Historical IDs

The first QA benchmark pass used IDs `I-003` through `I-047`. Later completed
backlog rotations used IDs `I-101` through `I-300`. Those IDs remain valid
historical references for benchmark documents whose purpose is preserving
evidence from earlier passes. New benchmark documents should use a current
backlog ID unless the document explicitly preserves historical evidence.

## Active Rotation

The current active multi-aspect backlog rotation uses IDs in the `I-301`
through `I-400` range. Completed items are removed from the active table after
verification, so the traceability check validates the active range instead of
requiring every ID in the range to remain present. When that batch is retired,
update `src/styles/qa-benchmark-traceability.test.ts` so those IDs become
explicitly historical before adding the next active rotation.

If a review pass completes every actionable item in the active table, the
backlog may explicitly state that no active actionable items remain. In that
case the traceability check allows an empty active table while blocked and
deferred items remain tracked in their own section.

## Check

Run:

```powershell
pnpm test -- src/styles/qa-benchmark-traceability.test.ts
```

---

<a id="evidence-branches-online-only-service-continuity-benchmark"></a>

## Evidence: branches-online-only-service-continuity-benchmark

# Branches Online-Only Service Continuity Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-046 Branches Online-Only Service Continuity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/branches` when physical branches are disabled, including
online-only service copy, route-backed recovery, and avoidance of unsupported
store-location promises.

## Gate Classification

- `Change Type`: Public service and location clarity.
- `Route Context`: Branches and service route.
- `Primary Lens`: Public structure and service corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                         | Observed Pattern                                                                                         | Weight |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/contact-us             | Contact and client relations paths provide service continuity alongside boutique/service context.        | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/customer-service             | Customer service groups product help, appointments, orders, and contact routes.                          | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/contact-us--info.html  | Contact page separates call, message, and boutique/service recovery.                                     | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/contact-us.html | Client service routing supports online contact and boutique recovery without overpromising availability. | 1.5    |
| Boucheron          | https://www.boucheron.com/us/services                | Services connect remote support, appointment preparation, sizing, and after-sales paths.                 | 1.5    |
| Messika            | https://www.messika.com/us_en/our-messika-services   | Service page exposes delivery, returns, repair, gift packaging, and customer-care recovery.              | 1.5    |
| De Beers           | https://www.debeers.com/en-us/store-locator          | Store/service discovery remains explicit about available physical and contact paths.                     | 1.5    |
| Piaget             | https://www.piaget.com/us-en/contact-us              | Contact and service routing provide recovery when store interaction is not the immediate path.           | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The branches route may strengthen online-only service
  continuity when physical branches are unavailable, provided it does not imply
  store inventory, walk-in availability, or unsupported appointment operations.

## Implementation Decision

Implement a narrow online-only pass:

- Keep the existing online-only state and primary catalog/service actions.
- Add compact continuity steps that explain how shoppers continue through
  catalog, size guide, and service.
- Add route-backed size-guide and service links.
- Keep physical branch details gated behind real branch data.

## Acceptance Checks

- Online-only copy is visible only when physical branches are unavailable.
- Recovery links route to existing `/size-guide` and `/service` surfaces.
- No physical address, walk-in, or appointment promise is introduced without
  branch data.
- The branch list remains unchanged when physical branches exist.

## Verification

- `pnpm test -- src/styles/branches-online-service-continuity.test.ts src/styles/service-trust-placement.test.ts src/styles/public-structure-enforcement.test.ts`
- `pnpm lint`
- `pnpm typecheck`

## Residual Risk

This benchmark supports service continuity only. Real branch launch,
appointment availability, inventory-at-location, or store-hours behavior must be
verified with operational data before public release.

---

<a id="evidence-catalog-owner-intake-template"></a>

## Evidence: catalog-owner-intake-template

# Catalog Owner Intake Template

Status: owner-facing intake template for Wave 0 catalog remediation.

Last updated: 2026-06-19.

Use this template for the priority catalog slice defined in
`docs/qa/catalog-readiness-remediation-plan.md`. One row or filled copy is
required per product before engineering should mark facts, policies, or media as
verified.

Do not use this template to invent product facts. Unknown values remain blank
until a source owner verifies them.

## Generate From Audit

Use the repository helper to create a CSV scaffold from a catalog-readiness
artifact:

```powershell
pnpm catalog:intake -- --audit artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json --per-class 6 --include-named --release-scope wave-0-priority --out artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv
```

The generated file stays under `artifacts/qa/` by default and is not committed.
It pre-fills only `productSlug`, optional `releaseScope`, and residual audit
risk. Owners must fill the verification, policy, and media columns manually from
approved sources.

After owners complete the slice and engineering imports the approved fields,
audit the same scoped product list instead of claiming full-catalog readiness:

```powershell
pnpm catalog:intake:validate -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-catalog-owner-intake-validation
pnpm catalog:intake:apply -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --replace-media --out-dir artifacts/qa/<date>-catalog-owner-intake-apply-dry-run
pnpm catalog:intake:apply -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --apply --replace-media --out-dir artifacts/qa/<date>-catalog-owner-intake-apply
pnpm catalog:readiness -- --source database --scope-file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-wave-0-priority-readiness-strict
pnpm release:slice-gate -- --owner-intake-validation artifacts/qa/<date>-catalog-owner-intake-validation/catalog-owner-intake-validation.json --owner-intake-apply artifacts/qa/<date>-catalog-owner-intake-apply/catalog-owner-intake-apply.json --catalog-readiness artifacts/qa/<date>-wave-0-priority-readiness-strict/catalog-readiness.json --catalog-quality artifacts/qa/<date>-catalog-quality-report/catalog-quality-report.json --release-scorecard artifacts/qa/<date>-release-scorecard/release-scorecard.json --strict
```

Scoped readiness still compares product media against the full loaded catalog,
so shared URLs or duplicate local content outside the slice remain blockers for
the scoped products.

## Required Product Row

| Field             | Required | Owner role              | Notes                                                                             |
| ----------------- | -------- | ----------------------- | --------------------------------------------------------------------------------- |
| `productSlug`     | yes      | Merchandising           | Must match the database slug.                                                     |
| `priorityTier`    | yes      | Founder / merchandising | Suggested values: `hero`, `category-anchor`, `gift-anchor`, `essential`, `defer`. |
| `releaseScope`    | yes      | Product                 | Suggested values: `wave-0-priority`, `later`, `draft-until-ready`.                |
| `directOwner`     | yes      | Product                 | Person responsible for gathering complete facts.                                  |
| `acceptanceOwner` | yes      | Product / founder       | Person approving readiness for public use.                                        |
| `residualRisk`    | yes      | Product                 | Short note if anything remains unresolved.                                        |

## Product Truth Fields

| Field                    | Required    | Owner role                 | Acceptance rule                                                                              |
| ------------------------ | ----------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| `factSourceReference`    | yes         | Merchandising              | Link, document ID, supplier reference, internal spec sheet, or approved source note.         |
| `factVerifiedBy`         | yes         | Merchandising              | Named verifier, not a system user.                                                           |
| `factVerifiedAt`         | yes         | Merchandising              | ISO date; must not be future-dated.                                                          |
| `countryOfManufacture`   | yes         | Merchandising / legal      | Public-ready country value or approved reason to withhold.                                   |
| `manufacturerOrImporter` | yes         | Merchandising / legal      | Public-ready manufacturer/importer value or approved reason to withhold.                     |
| `materialDetails`        | yes         | Merchandising              | Exact material, purity, plating, coating, and any care-relevant constraints.                 |
| `measurements`           | yes         | Merchandising              | Dimensions, chain length, diameter, width, drop, or class-appropriate measurement.           |
| `stoneDetails`           | conditional | Merchandising              | Required for stone-bearing products. Include type/status/treatment where known and approved. |
| `variantSkuMap`          | yes         | Merchandising / operations | All public variants and SKU mapping.                                                         |

## Policy Fields

| Field                    | Required    | Owner role            | Acceptance rule                                                            |
| ------------------------ | ----------- | --------------------- | -------------------------------------------------------------------------- |
| `policySourceReference`  | yes         | Legal / operations    | Approved policy source or version ID.                                      |
| `policyVerifiedBy`       | yes         | Legal / operations    | Named verifier.                                                            |
| `policyVerifiedAt`       | yes         | Legal / operations    | ISO date; must not be future-dated.                                        |
| `deliveryPromise`        | yes         | Operations / legal    | Must match checkout, shipping policy, and customer-service script.         |
| `returnPolicy`           | yes         | Legal / operations    | Must include exceptions for personalized or supplier orders if applicable. |
| `careInstructions`       | yes         | Merchandising / legal | Must match material facts.                                                 |
| `warranty`               | yes         | Legal / operations    | Must describe scope without unsupported guarantees.                        |
| `supplierOrderException` | conditional | Operations / legal    | Required for dropship/supplier products.                                   |

## Media Fields

| Field                  | Required | Owner role                        | Acceptance rule                                                                 |
| ---------------------- | -------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `primaryMediaUrl`      | yes      | Creative / catalog ops            | Exact product, clean primary view.                                              |
| `alternateMediaUrl`    | yes      | Creative / catalog ops            | Exact product, alternate angle.                                                 |
| `scaleMediaUrl`        | yes      | Creative / catalog ops            | Scale on body or measured context.                                              |
| `constructionMediaUrl` | yes      | Creative / catalog ops            | Closure, setting, clasp, back, underside, or construction detail.               |
| `materialMediaUrl`     | yes      | Creative / catalog ops            | Material or stone macro with color and finish fidelity.                         |
| `contextMediaUrl`      | yes      | Creative / catalog ops            | Packaging, styling, or use context without false implication.                   |
| `mediaSourceReference` | yes      | Creative / catalog ops            | Shoot ID, asset library reference, license/source, or approved internal source. |
| `mediaApprovedBy`      | yes      | Creative director / merchandising | Named approver.                                                                 |
| `mediaApprovedAt`      | yes      | Creative director / merchandising | ISO date; must not be future-dated.                                             |
| `primaryAltText`       | yes      | Accessibility / content           | Decision-useful alt text for the primary media.                                 |
| `alternateAltText`     | yes      | Accessibility / content           | Decision-useful alt text for the alternate media.                               |
| `scaleAltText`         | yes      | Accessibility / content           | Decision-useful alt text for the scale media.                                   |
| `constructionAltText`  | yes      | Accessibility / content           | Decision-useful alt text for the construction media.                            |
| `materialAltText`      | yes      | Accessibility / content           | Decision-useful alt text for the material media.                                |
| `contextAltText`       | yes      | Accessibility / content           | Decision-useful alt text for the context media.                                 |
| `altTextOwner`         | yes      | Accessibility / content           | Person responsible for decision-useful alt text.                                |

## CSV Header

Use this header when collecting rows in a spreadsheet:

```csv
productSlug,priorityTier,releaseScope,directOwner,acceptanceOwner,residualRisk,factSourceReference,factVerifiedBy,factVerifiedAt,countryOfManufacture,manufacturerOrImporter,materialDetails,measurements,stoneDetails,variantSkuMap,policySourceReference,policyVerifiedBy,policyVerifiedAt,deliveryPromise,returnPolicy,careInstructions,warranty,supplierOrderException,primaryMediaUrl,alternateMediaUrl,scaleMediaUrl,constructionMediaUrl,materialMediaUrl,contextMediaUrl,mediaSourceReference,mediaApprovedBy,mediaApprovedAt,primaryAltText,alternateAltText,scaleAltText,constructionAltText,materialAltText,contextAltText,altTextOwner
```

## Engineering Acceptance

Engineering should not mark a product ready until all of the following are true:

- Required owner fields are filled.
- Required product truth fields are filled and source-backed.
- Required policy fields are filled and legal/operations-approved.
- All six media roles are filled with exact-product assets.
- All six media roles have decision-useful alt text.
- `pnpm catalog:intake:validate -- --file <owner-intake.csv> --strict` passes.
- `pnpm catalog:intake:apply -- --file <owner-intake.csv> --replace-media`
  produces a dry-run plan with no blocker.
- The product has no blocker or high-severity finding in a fresh
  `pnpm catalog:readiness -- --source database --strict` artifact for the
  intended release scope.
- `pnpm release:slice-gate -- --strict` passes against the validation, apply,
  readiness, quality, and scorecard artifacts for the same release scope.

## Repository Safety

Allowed in the repository:

- Public-approved copy.
- Redacted source reference IDs.
- Command names and pass/fail summaries.
- Artifact paths.

Not allowed in the repository:

- Supplier contracts.
- Private dashboard screenshots.
- Payment credentials or transaction payloads.
- Full customer identity.
- Unapproved legal counsel notes.
- Product facts that are plausible but not verified.

---

<a id="evidence-catalog-quality-report"></a>

## Evidence: catalog-quality-report

# Catalog Quality Report

Status: tooling complete (master plan C-08). The catalog itself is still FAIL.

Last updated: 2026-06-19.

This implements master-plan item `C-08`. It turns a catalog-readiness audit
artifact into an owner-facing rollup so blockers can be routed to the right
owner — by finding code and by product class — before a customer encounters
them. It reorganizes existing audit findings only; it invents no facts.

## How it works

- Pure model: `scripts/lib/catalog-quality-report.ts`.
- CLI: `scripts/catalog-quality-report.ts` (`pnpm catalog:quality`).
- Tests: `scripts/catalog-quality-report.test.ts`.

## Generate

```powershell
pnpm catalog:readiness -- --source database --out-dir artifacts/qa/<date>-readiness
pnpm catalog:quality -- `
  --audit artifacts/qa/<date>-readiness/catalog-readiness.json `
  --out-dir artifacts/qa/<date>-catalog-quality `
  --strict
```

`--strict` exits non-zero while the audit is not ready, so the report can be
wired into an owner review without manually transcribing findings.

## Current rollup (Wave 0)

Source: `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json`.
Artifact: `artifacts/qa/2026-06-19-wave-0-catalog-quality/`.

300 products audited, 0 publish-ready, 874 blockers, 2,426 high findings. The
generated rollup matches the manually authored breakdown in
`docs/qa/catalog-readiness-remediation-plan.md`, so that breakdown is now
reproducible by command instead of by hand.

| Owner role                          | Blocking finding codes                                           |
| ----------------------------------- | ---------------------------------------------------------------- |
| Merchandising / product truth owner | `FACT_VERIFICATION_MISSING`, `STRUCTURED_SPECIFICATIONS_MISSING` |
| Legal / operations owner            | `POLICY_VERIFICATION_MISSING`                                    |
| Creative / catalog operations       | `LOCAL_MEDIA_FILE_MISSING`, `MEDIA_*`                            |

The remaining work behind these findings is owner/asset debt (verified facts,
approved policy, real product media) and is not solvable by code.

---

<a id="evidence-catalog-readiness-remediation-plan"></a>

## Evidence: catalog-readiness-remediation-plan

# Catalog Readiness Remediation Plan

Status: Wave 0 remediation plan, not completion evidence.

Last updated: 2026-06-19.

Source evidence:

- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.md`
- `docs/qa/catalog-readiness-wave-0-baseline.md`

Owner intake:

- `docs/qa/catalog-owner-intake-template.md`
- `pnpm catalog:intake -- --audit <catalog-readiness.json> --per-class 6 --include-named --release-scope wave-0-priority --out artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv`
- `pnpm catalog:intake:validate -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-catalog-owner-intake-validation`
- `pnpm catalog:intake:apply -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --replace-media --out-dir artifacts/qa/<date>-catalog-owner-intake-apply-dry-run`
- `pnpm catalog:readiness -- --source database --scope-file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-wave-0-priority-readiness-strict`
- `pnpm release:slice-gate -- --owner-intake-validation <validation.json> --owner-intake-apply <apply.json> --catalog-readiness <catalog-readiness.json> --catalog-quality <catalog-quality-report.json> --release-scorecard <release-scorecard.json> --strict`

This plan translates the current failing catalog-readiness audit into owner
work packages. It does not assert that the audited database is production truth;
it records the repository-verifiable state of the database source used for the
Wave 0 audit.

## Current Audit Snapshot

| Metric                      |                         Current result |
| --------------------------- | -------------------------------------: |
| Active products audited     |                                    300 |
| Publish-ready products      |                                      0 |
| Blockers                    |                                    874 |
| High-severity findings      |                                  2,426 |
| Medium findings             |                                      0 |
| Info findings               |                                      0 |
| Product source distribution |        300 `OWN`, 0 `DROPSHIP_SHOPIFY` |
| Media count distribution    | 300 products with exactly 1 media item |

## Finding Breakdown

| Severity | Code                                       | Count | Affected products | Primary owner role                  | Remediation route                                                                                                             |
| -------- | ------------------------------------------ | ----: | ----------------: | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Blocker  | `FACT_VERIFICATION_MISSING`                |   300 |               300 | Merchandising / product truth owner | Add governed source reference, verifier, and verification date for product facts.                                             |
| Blocker  | `POLICY_VERIFICATION_MISSING`              |   300 |               300 | Legal / operations owner            | Add governed source reference, verifier, and verification date for product-level delivery, return, care, and warranty policy. |
| Blocker  | `LOCAL_MEDIA_FILE_MISSING`                 |   274 |               274 | Creative / catalog operations       | Replace stale local media URLs or unpublish until truthful media exists.                                                      |
| High     | `MEDIA_ROLE_MISSING`                       | 1,500 |               300 | Creative / catalog operations       | Add the five missing non-primary media roles per product.                                                                     |
| High     | `MEDIA_SET_INCOMPLETE`                     |   300 |               300 | Creative / catalog operations       | Provide at least six decision-useful media items per product.                                                                 |
| High     | `MEDIA_URL_SHARED_ACROSS_PRODUCTS`         |   300 |               300 | Creative / catalog operations       | Ensure unrelated products do not share the same stored media URL.                                                             |
| High     | `STRUCTURED_SPECIFICATIONS_MISSING`        |   300 |               300 | Merchandising / product truth owner | Add country, manufacturer/importer, material details, measurements, and stone details where applicable.                       |
| High     | `MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS` |    26 |                26 | Creative / catalog operations       | Replace duplicated local content hash group with product-specific assets or quarantine affected products.                     |

## Product-Class Breakdown

| Product class from slug | Products | Local media missing | Duplicate content hash | Notes                                                                                                            |
| ----------------------- | -------: | ------------------: | ---------------------: | ---------------------------------------------------------------------------------------------------------------- |
| `bracelet`              |       74 |                  49 |                     25 | 25 bracelet products share content hash `2ca3b3893a96`; the other bracelet blockers are mostly stale local URLs. |
| `earrings`              |       74 |                  74 |                      0 | Every audited earrings product has stale local media plus the universal fact/policy/spec/media gaps.             |
| `necklace`              |       74 |                  74 |                      0 | Every audited necklace product has stale local media plus the universal fact/policy/spec/media gaps.             |
| `ring`                  |       74 |                  74 |                      0 | Every audited ring product has stale local media plus the universal fact/policy/spec/media gaps.                 |
| `hera`                  |        1 |                   0 |                      1 | `hera-bracelet` shares the duplicated bracelet content hash.                                                     |
| `muse`                  |        1 |                   1 |                      0 | Named product still has stale local media and universal fact/policy/spec/media gaps.                             |
| `selene`                |        1 |                   1 |                      0 | Named product still has stale local media and universal fact/policy/spec/media gaps.                             |
| `venus`                 |        1 |                   1 |                      0 | Named product still has stale local media and universal fact/policy/spec/media gaps.                             |

## Product Severity Shapes

| Product shape                | Count | Meaning                                                                                                                                                                                     |
| ---------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3 blockers / 8 high findings |   274 | Missing fact verification, policy verification, and local media file; also missing structured specs, complete media set, five non-primary media roles, unique URL, and related media proof. |
| 2 blockers / 9 high findings |    26 | Missing fact and policy verification; local file exists but content is duplicated across unrelated products, so media still cannot pass.                                                    |

## Required Media Roles

Every product must have truthful, product-specific media for all required
roles:

| Role           | Decision proof                                                           |
| -------------- | ------------------------------------------------------------------------ |
| `PRIMARY`      | Clean primary image that depicts the exact product.                      |
| `ALTERNATE`    | Alternate angle that resolves silhouette and profile.                    |
| `SCALE`        | Scale-on-body or measured context image.                                 |
| `CONSTRUCTION` | Closure, setting, clasp, back, underside, or construction detail.        |
| `MATERIAL`     | Material or stone macro with color and finish fidelity.                  |
| `CONTEXT`      | Packaging, styling, or use context that does not imply false properties. |

The current post-schema audit backfilled existing primary media only. That is
why each product is missing five roles, producing `1,500` role findings.

## Remediation Sequence

### R-01 Pick A Priority Catalog Slice

Owner: founder / merchandising.

Status: blocked on owner decision.

Do not try to remediate 300 products at once. Choose a first release slice and
freeze it before assets or copy are commissioned.

Minimum recommended slice:

- 6 rings.
- 6 necklaces.
- 6 earrings.
- 6 bracelets.
- The named products `venus-line-ring`, `selene-drop-earrings`,
  `selene-chain`, `muse-necklace`, `muse-pearl-earrings`, and `hera-bracelet`
  if they are still strategic and present in the audited catalog.

Exit criteria:

- Frozen slug list.
- Product owner and acceptance owner assigned.
- Public priority: hero, category anchor, gift anchor, or essential.
- Decision whether non-slice products stay public, move to draft, or remain
  visible with explicit readiness risk.
- Intake rows started in the `docs/qa/catalog-owner-intake-template.md` format.

### R-02 Complete Product Truth Intake

Owner: merchandising / product truth.

Status: blocked on verified facts.

For every product in the priority slice, collect:

- Exact material and purity/plating.
- Stone type, stone status, and stone details where applicable.
- Dimensions, weight where appropriate, chain length, closure, size range, and
  fit constraints.
- Country of manufacture.
- Manufacturer or importer.
- SKU and variant SKU mapping.
- Source reference and verifier identity.
- Verification date.

Exit criteria:

- `FACT_VERIFICATION_MISSING` is zero for the slice.
- `STRUCTURED_SPECIFICATIONS_MISSING` is zero for the slice.
- Public PDP fact rows render only from verified fields.
- Product truth fields from `docs/qa/catalog-owner-intake-template.md` are
  complete for every slice product.

### R-03 Complete Policy Verification

Owner: legal / operations.

Status: blocked on policy approval.

For every product in the priority slice, approve product-applicable policy
facts:

- Delivery promise and exclusions.
- Return or exchange eligibility.
- Care restrictions.
- Warranty scope.
- Personalized/custom-item exceptions.
- Supplier-order exceptions if relevant.
- Policy source reference, verifier, and verification date.

Exit criteria:

- `POLICY_VERIFICATION_MISSING` is zero for the slice.
- PDP, checkout, footer, emails, and policy pages do not contradict each other.
- Policy text has effective date and owner.
- Policy fields from `docs/qa/catalog-owner-intake-template.md` are complete
  for every slice product.

### R-04 Replace Stale And Duplicated Media

Owner: creative / catalog operations.

Status: blocked on assets.

First pass:

- Replace the 274 stale local media references.
- Resolve the 26-product duplicate content-hash group.
- Stop using shared category/lifestyle assets as product proof unless they
  depict the exact same product.

Second pass:

- Add all six required media roles for the priority slice.
- Add alt text that describes decision-useful product facts, not decorative
  mood.
- Record source/license/approval internally.

Exit criteria:

- `LOCAL_MEDIA_FILE_MISSING` is zero for the slice.
- `MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS` is zero for the slice.
- `MEDIA_URL_SHARED_ACROSS_PRODUCTS` is zero for unrelated products in the
  slice.
- `MEDIA_SET_INCOMPLETE` and `MEDIA_ROLE_MISSING` are zero for the slice.
- Media fields from `docs/qa/catalog-owner-intake-template.md` are complete for
  every slice product.

### R-05 Decide What Happens To Non-Ready Products

Owner: product / merchandising / legal.

Status: blocked on catalog policy.

Because the current audit has zero ready products, the team must decide how to
handle products outside the first remediation slice.

Allowed decisions:

- Keep visible but do not claim readiness or superiority.
- Move to draft until facts/media are approved.
- Keep category coverage but reduce claims to verified fields only.

Rejected decision:

- Fill database fields with plausible but unverified facts to satisfy the gate.

Exit criteria:

- Non-ready product policy is documented.
- Admin publish blockers and public rendering rules agree.
- Release notes do not imply full-catalog readiness.

### R-06 Re-Run The Strict Audit

Owner: engineering.

Status: ready after R-01 through R-05.

Command:

```powershell
pnpm catalog:intake:validate -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-catalog-owner-intake-validation
pnpm catalog:intake:apply -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --replace-media --out-dir artifacts/qa/<date>-catalog-owner-intake-apply-dry-run
pnpm catalog:intake:apply -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --apply --replace-media --out-dir artifacts/qa/<date>-catalog-owner-intake-apply
pnpm catalog:readiness -- --source database --scope-file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-wave-0-priority-readiness-strict
pnpm release:slice-gate -- --owner-intake-validation artifacts/qa/<date>-catalog-owner-intake-validation/catalog-owner-intake-validation.json --owner-intake-apply artifacts/qa/<date>-catalog-owner-intake-apply/catalog-owner-intake-apply.json --catalog-readiness artifacts/qa/<date>-wave-0-priority-readiness-strict/catalog-readiness.json --catalog-quality artifacts/qa/<date>-catalog-quality-report/catalog-quality-report.json --release-scorecard artifacts/qa/<date>-release-scorecard/release-scorecard.json --strict
```

Exit criteria:

- Strict audit passes for the intended release scope. The scoped audit still
  compares media URLs and local content hashes against the full loaded catalog,
  so a release product cannot pass while sharing proof media with an
  out-of-scope active product.
- Owner-intake validation passes before any import, activation, or release note
  claims the slice is ready.
- Owner-intake apply plan is reviewed in dry-run mode before any database write;
  actual writes require explicit `--apply`, and media replacement requires
  explicit `--replace-media`.
- Release-slice gate passes against the validation, apply, readiness, quality,
  and scorecard artifacts for the same scope.
- Artifact is retained.
- `docs/qa/catalog-readiness-wave-0-baseline.md`,
  `docs/TIFFANY_SURPASS_MASTER_PLAN.md`, and `docs/PROJECT_TASKS.md` are
  updated with the new result.

## Owner Register

| Work package                     | Direct owner | Acceptance owner        | Target date             | Status  |
| -------------------------------- | ------------ | ----------------------- | ----------------------- | ------- |
| R-01 priority slice              | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-02 product truth intake        | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-03 policy verification         | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-04 media replacement and roles | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-05 non-ready product policy    | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-06 strict audit rerun          | Engineering  | Product / release owner | After R-01 through R-05 | WAITING |

## Release Gate Position

The catalog readiness audit should not be added to `pnpm check` or release
gates yet. Doing that now would make every release fail without creating facts
or assets. The correct gate activation sequence is:

1. Priority slice selected.
2. Facts and policy evidence approved.
3. Media replaced and role-mapped.
4. Non-ready product policy decided.
5. Strict audit passes for the release scope.
6. Then promote strict catalog readiness into release gating.

Until this sequence is complete, the accurate status remains:

> Catalog readiness infrastructure exists, but catalog readiness itself has not
> been achieved.

---

<a id="evidence-catalog-readiness-wave-0-baseline"></a>

## Evidence: catalog-readiness-wave-0-baseline

# Wave 0 Catalog Readiness Baseline

Status: failing baselines recorded before and after the Wave 0 schema foundation.

Generated: 2026-06-19.

Master workstreams:

- `B-01` Replace duplicated catalog media.
- `B-02` Define the minimum media set per product.
- `B-08` Add automated media-quality gates.
- `C-01` Complete verified product specifications.
- `C-03` Define product publish readiness.
- `L-01` Replace checklist completion with outcome evidence.

## Command

```powershell
pnpm catalog:readiness -- --source database --out-dir artifacts/qa/2026-06-19-wave-0-catalog-readiness
```

Strict release-candidate check:

```powershell
pnpm catalog:readiness -- --source database --strict --out-dir artifacts/qa/<release>-catalog-readiness
```

The strict command returns a non-zero exit code while any blocker or
high-severity finding remains.

## Baseline Result

Initial pre-schema result:

| Metric                           | Result |
| -------------------------------- | -----: |
| Active database products audited |    300 |
| Publish-ready products           |      0 |
| Blockers                         |    874 |
| High-severity findings           |  1,226 |
| Medium-severity findings         |      0 |

Finding breakdown:

| Severity | Code                                       | Count | Interpretation                                                                                       |
| -------- | ------------------------------------------ | ----: | ---------------------------------------------------------------------------------------------------- |
| Blocker  | `FACT_VERIFICATION_MISSING`                |   300 | Product facts have no governed source, verifier, and verification date.                              |
| Blocker  | `POLICY_VERIFICATION_MISSING`              |   300 | Product-level delivery, return, care, and warranty text has no governed approval evidence.           |
| Blocker  | `LOCAL_MEDIA_FILE_MISSING`                 |   274 | Raw database media URLs point to local files that do not exist.                                      |
| High     | `STRUCTURED_SPECIFICATIONS_MISSING`        |   300 | Country, manufacturer/importer, material detail, and measurements are not modeled as governed facts. |
| High     | `MEDIA_SET_INCOMPLETE`                     |   300 | Every active product has fewer than the required six decision-useful media items.                    |
| High     | `MEDIA_ROLES_UNVERIFIABLE`                 |   300 | The schema cannot prove primary, alternate, scale, construction, material, and context coverage.     |
| High     | `MEDIA_URL_SHARED_ACROSS_PRODUCTS`         |   300 | Every active product shares its stored media URL with another product.                               |
| High     | `MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS` |    26 | Local files with identical content hashes are mapped to different products.                          |

Full generated evidence:

- `artifacts/qa/2026-06-19-wave-0-catalog-readiness/catalog-readiness.md`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness/catalog-readiness.json`

Post-schema result:

| Metric                           | Result |
| -------------------------------- | -----: |
| Active database products audited |    300 |
| Publish-ready products           |      0 |
| Blockers                         |    874 |
| High-severity findings           |  2,426 |
| Medium-severity findings         |      0 |

The blocker count is unchanged because no owner fact was fabricated. Media role
reporting is now more precise: the migration classifies existing primary media,
and the audit reports 1,500 exact missing roles across the remaining five roles
per product. Evidence:

- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.md`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema-strict/catalog-readiness.md`

## Important Interpretation

`LOCAL_MEDIA_FILE_MISSING` describes raw database truth, not necessarily a
customer-visible broken image. `src/server/services/catalog-assets.ts` replaces
known legacy media patterns with current catalog imagery at display time. That
fallback protects rendering, but it also hides stale source records and cannot
prove that the fallback image depicts the actual product. The readiness audit
therefore keeps the source-record failure as a blocker.

Non-empty text is not treated as verified product truth. The seed catalog
contains complete-looking material, delivery, return, care, and warranty text,
but the current model has no fact source, verifier, approval date, or structured
specification ownership. The audit reports that absence instead of awarding
readiness for plausible text.

## Implemented in This Slice

- Pure readiness engine in `scripts/lib/catalog-readiness.ts`.
- Product, variant, policy, supplier-mapping, media-count, media-role, local-file,
  URL-duplication, and content-hash checks.
- Database and deterministic fixture sources.
- JSON and Markdown artifacts.
- Optional strict exit behavior for future release gating.
- Focused unit and CLI tests.
- `pnpm catalog:readiness` package command.
- Nullable governed product fields for origin, manufacturer/importer, material,
  measurements, stone detail, fact source, policy source, verifier, and date.
- Explicit `ProductMediaRole` values with safe primary-media backfill only.
- Admin entry and explicit fact/policy certification; verifier identity and
  timestamp are written server-side and audited.
- New admin and supplier products remain `DRAFT`; Shopify fact verification is
  cleared after supplier data changes.
- Activation is blocked until required facts, policies, verification, primary
  media, price, and supplier mapping pass.
- Public PDP specifications and product-level policy text render only after
  verification; unsupported PDP fallbacks and `[להשלמה]` rows were removed.
- Browser verification found and fixed a missing tRPC provider in the existing
  recently-viewed fetch path.

## Remaining Before the Gate Can Pass

1. Supply and approve owner facts and policy references for priority products.
2. Extend the current shared specification set with class-specific attributes.
3. Add policy versions/effective dates and central governed policy references.
4. Add media variant association where required.
5. Replace stale database media URLs.
6. Supply and approve at least six distinct, truthful media roles for priority
   products before expanding to the full catalog.
7. Resolve cross-product duplicate URLs and duplicate local content.
8. Run the strict audit against the release database and retain the artifact.

The audit is intentionally not part of `pnpm check` or the release gate yet.
Adding it now would make every build fail without fixing the underlying catalog.
It should become a required gate only after owner data and priority product
remediation are complete. Product activation is already guarded independently.

---

<a id="evidence-category-active-filter-sort-clarity-benchmark"></a>

## Evidence: category-active-filter-sort-clarity-benchmark

# Category Active Filter and Sort Clarity Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-024 Category Active Filter and Sort Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/category/[slug]`, the mobile filter sheet, active
refinement summary, reset behavior, sort clarity, and product-grid entry.

## Gate Classification

- `Change Type`: Public UX and commerce-control clarity.
- `Route Context`: `/category/[slug]`.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                       | Weight |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | Filter and sort controls appear before the grid, with item totals and load-progress summary.           | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Listing exposes result count, filters, empty recovery, and range summary before product cards.         | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Listing shows product count and a combined filters/sorting control before the grid.                    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP shows filters, product count, sort, and constrained filter guidance before products.               | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Jewelry listing exposes filter groups, item count, available-online control, and sort before products. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Listing uses a combined sort/filter sheet with clear action and result count before product cards.     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Listing exposes filters and result count before the product list.                                      | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing exposes filter button, product count, and sort select before products.                         | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                   | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Listing exposes shop-by filters, apply action, item totals, and page/range information.                | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Collection listing exposes sort/filter, reset-all, active availability selection, and product count.   | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Category filter and sort clarity may be strengthened
  when it remains compact, adjacent to the listing controls, and does not push
  the product grid below storytelling content.

## Implementation Decision

Implement a narrow clarity pass:

- Surface the current sort in the mobile sticky summary.
- Surface the current sort inside the desktop active-refinement summary.
- Use explicit reset copy for all active filter reset points.
- Keep sort as part of the existing filter controls; do not introduce a second
  standalone control row.
- Do not change product-card density, hero structure, or filter taxonomy.

## Acceptance Checks

- Active filter summary, reset, and sort copy are visible before the product
  grid.
- Mobile sticky summary stays compact and truncates active refinement preview.
- Reset copy clearly resets all active choices.
- No new content section, landing-page behavior, or unsupported commerce action
  is introduced.

## Verification

- `pnpm test -- src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts`

## Residual Risk

This benchmark supports clarity within the existing category listing controls
only. Future changes to the filter sheet structure, product-grid density, or
hero/listing order must run through the public gate again.

---

<a id="evidence-category-no-result-recovery-depth-benchmark"></a>

## Evidence: category-no-result-recovery-depth-benchmark

# Category No-Result Recovery Depth Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-033 Category No-Result Recovery Depth
- `Status`: Supported and implemented

## Scope

This benchmark covers `/category/[slug]` zero-result states after filtering,
reset behavior, route-backed adjacent category continuation, and search
continuation from the category listing context.

## Gate Classification

- `Change Type`: Public UX and commerce-discovery recovery.
- `Route Context`: `/category/[slug]`.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the same PLP/search evidence recorded for
`docs/qa/category-active-filter-sort-clarity-benchmark.md` and
`docs/qa/search-empty-state-guided-recovery-benchmark.md`.

| Site          | Evidence URL                                                     | Observed Pattern                                                                                    | Weight |
| ------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | PLP recovery keeps filters, counts, and product-continuation controls close to the listing.         | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Listing recovery exposes result context, filters, reset, and category continuation before content.  | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Product discovery keeps no-result or filter recovery inside the listing-control area.               | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP recovery remains task-first with constrained filter guidance and product-grid continuation.     | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Product listing exposes filter groups, availability controls, and sort as immediate recovery tools. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Combined sort/filter controls and result count guide continuation before product cards.             | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Filter and result summaries stay adjacent to listing results and recovery.                          | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing recovery relies on filter and sort controls rather than storytelling blocks.                | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Shop-by filters, apply actions, and item totals guide continuation inside the discovery flow.       | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Discovery pages keep reset-all, filters, active selection, and product count near product listings. | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Category no-result recovery may add compact visible
  route-backed category continuations when those continuations are generated
  from current filtered counts and remain inside the empty state.

## Implementation Decision

Implement a narrow recovery pass:

- Keep `/category/[slug]` as a product-listing page, not a content page.
- Add up to two route-backed category continuations only when the current
  filter selection returns products in another category.
- Preserve reset and search continuation as the baseline recovery paths.
- Keep all recovery inside the existing empty state.
- Do not add service, size-guide, checkout, account, editorial, or unsupported
  commerce actions.

## Acceptance Checks

- Adjacent category actions appear only when they have filtered product counts.
- Category continuation links preserve the active category filters.
- Search continuation maps only supported category filters to `/search`.
- Reset remains available for filtered zero-result states.
- The recovery area remains compact and does not introduce new public content
  sections.

## Verification

- `pnpm test -- src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/category-no-result-recovery-depth.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts src/styles/public-structure-enforcement.test.ts`

## Residual Risk

This benchmark supports route-backed category and search recovery inside the
existing empty state only. Future changes that add new destinations, service
escalation, editorial content, or a different PLP layout must run through the
public gate again.

---

<a id="evidence-checkout-delivery-confidence-benchmark"></a>

## Evidence: checkout-delivery-confidence-benchmark

# Checkout Delivery Confidence Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-008 Checkout Delivery Confidence Summary
- `Status`: Supported and implemented

## Scope

This benchmark covers `/checkout` delivery, fulfillment, local order, Shopify
supplier-only, mixed cart, and offline-adjacent recovery copy. It evaluates
whether checkout can show a compact delivery and fulfillment summary using only
currently supported data.

## Gate Classification

- `Change Type`: Public checkout commerce confidence.
- `Route Context`: Checkout.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Checkout, account, and service rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                                                 | Observed Pattern                                                                                    | Weight |
| ------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/faq/shipping-delivery/                                         | Shipping timing, checkout estimates, exceptions, tracking, and client support are explained.        | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/faq/shipping-returns-faq/                                            | Shipping, tracking, returns, gift wrap, and advisor support are grouped as checkout help.           | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/faq/shipping/what-shipping-options-are-available-on-bulgaricom | Shipping options and checkout delivery expectations are available before order completion.          | 1.5    |
| Graff         | https://www.graff.com/us-en/checkout-login/                                                  | Shopping bag summarizes estimated shipping, secure delivery, returns, help, pickup, and payment.    | 1.5    |
| Chopard       | https://www.chopard.com/en-us/faq.html                                                       | FAQ explains complimentary delivery, gift options at checkout, returns, tracking, and signature.    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs/shipping                                                   | Shipping FAQ explains delivery methods, timing, pickup, carrier handling, and support recovery.     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                                                         | Commerce benefits list contact, delivery timing, secure payment, and returns/exchanges.             | 1.5    |
| Messika       | https://www.messika.com/us_en/services-demand                                                | Services combine delivery, returns, secure payment, gift packaging, and client assistance.          | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/shipping-and-returns                                   | Shipping and returns page explains delivery limits, signature, delays, tracking, and returns.       | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/                                                               | Public service copy exposes free shipping, free return, secure payment, packaging, and support.     | 1.5    |
| De Beers      | https://www.debeers.com/en-us/delivery-and-returns.html                                      | Delivery and returns page explains secure courier, signature, tracking, packaging, and support.     | 1.5    |
| Pomellato     | https://www.pomellato.com/us_en/shipping-and-returns                                         | Shipping and returns page explains processing, tracking, delivery timing, return labels, refund.    | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/faq                                                         | FAQ explains free shipping, alternate addresses, tracking, return authorization, and quality check. | 1.5    |

## Score

- `Supported Sites`: 13 of 15.
- `Weighted Score`: 19.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Checkout may show a compact delivery and fulfillment
  confidence summary when it is close to the order summary, source-aware, and
  does not imply one combined payment, exact supplier fulfillment, or a
  guaranteed delivery date.

## Implementation Decision

Implement a narrow checkout summary:

- Replace static local-only trust rows with dynamic source-aware rows.
- For local `OWN` items, summarize local approval, delivery address handling,
  and final verification before payment completion.
- For Shopify supplier items, state that payment, address, and delivery timing
  continue in Shopify Checkout.
- For mixed carts, keep local and supplier fulfillment separate and explicitly
  avoid a combined payment or delivery promise.
- Keep the primary local submit and Shopify checkout buttons unchanged.

## Acceptance Checks

- Local checkout shows delivery and verification confidence before submit.
- Supplier-only checkout shows delivery confidence without local delivery
  fields and without creating a local-order promise.
- Mixed checkout states the two fulfillment paths remain separate.
- Copy avoids exact public inventory counts, guaranteed delivery dates, and
  supplier fulfillment certainty while supplier confirmation remains blocked.

## Verification

- `pnpm test -- src/app/checkout/_components/checkout-display.test.ts src/styles/service-trust-placement.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports checkout copy and summary structure only. Real paid
Shopify checkout, supplier fulfillment confirmation, and CardCom production
credentials remain blocked in `docs/PROJECT_TASKS.md`.

---

<a id="evidence-checkout-quantity-mobile-summary-benchmark"></a>

## Evidence: checkout-quantity-mobile-summary-benchmark

# Cart Quantity Recovery and Mobile Checkout Summary Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-039 Cart Quantity Recovery and Mobile Checkout Summary Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/checkout` quantity controls, cart mutation recovery,
offline cart update copy, mobile sticky checkout summary, and split local/Shopify
checkout source context.

## Gate Classification

- `Change Type`: Public checkout cart recovery and mobile summary clarity.
- `Route Context`: `/checkout`.
- `Primary Lens`: Checkout and payment guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/checkout-delivery-confidence-benchmark.md` and
  `docs/qa/checkout-validation-payment-confidence-benchmark.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the checkout support and payment-confidence corpus used for
I-008 and I-035.

| Site          | Evidence URL                                                                                 | Observed Pattern                                                                                    | Weight |
| ------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/faq/shipping-delivery/                                         | Checkout-adjacent help keeps delivery, tracking, and client support clear before order completion.  | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/faq/shipping-returns-faq/                                            | Checkout support groups shipping, returns, advisor help, and order recovery.                        | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/faq/shipping/what-shipping-options-are-available-on-bulgaricom | Delivery expectations are documented before checkout completion.                                    | 1.5    |
| Graff         | https://www.graff.com/us-en/checkout-login/                                                  | Bag/checkout context groups totals, delivery, payment, returns, and help close to checkout actions. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/faq.html                                                       | Checkout help explains delivery, returns, tracking, gift options, and payment-adjacent support.     | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs?glCountry=US                                               | Order support and after-sales help are grouped in customer service content.                         | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                                                         | Commerce benefits expose contact, delivery, secure payment, and returns in the shopping flow.       | 1.5    |
| Messika       | https://www.messika.com/us_en/services-demand                                                | Service content combines delivery, returns, secure payment, packaging, and client assistance.       | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/shipping-and-returns                                   | Shipping and returns content explains order limits, tracking, delays, and recovery.                 | 1.5    |
| De Beers      | https://www.debeers.com/en-us/delivery-and-returns.html                                      | Delivery and return support keeps payment/order expectations separate from unsupported guarantees.  | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/                                                               | Public commerce service copy exposes delivery, returns, secure payment, packaging, and support.     | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Checkout may add clearer quantity recovery and mobile
  summary context when split checkout ownership stays explicit and no payment,
  inventory, fulfillment, or offline-checkout claims are added.

## Implementation Decision

Implement a narrow checkout recovery pass:

- Add compact quantity recovery copy near cart item controls.
- Add a source-aware mobile summary line for local, supplier-only, and mixed
  carts.
- Keep local submit and Shopify supplier handoff unchanged.
- Keep offline cart mutation copy limited to queued cart updates.
- Do not add payment-provider claims, delivery guarantees, or offline checkout
  completion promises.

## Acceptance Checks

- Quantity controls remain button-based and capped by the existing limits.
- Mutation/offline recovery copy is visible near the cart controls.
- Mobile summary distinguishes local and supplier items.
- Split checkout source boundaries remain explicit.

## Verification

- `pnpm test -- src/styles/checkout-quantity-mobile-summary.test.ts src/styles/checkout-validation-payment-confidence.test.ts src/app/checkout/_components/checkout-display.test.ts src/styles/pwa-offline-recovery.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports UI copy and placement only. Inventory reservation,
payment capture, Shopify paid checkout, and offline checkout completion remain
outside this item.

---

<a id="evidence-checkout-validation-payment-confidence-benchmark"></a>

## Evidence: checkout-validation-payment-confidence-benchmark

# Checkout Validation Summary and Payment Confidence Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-035 Checkout Validation Summary and Payment Confidence Placement
- `Status`: Supported and implemented

## Scope

This benchmark covers `/checkout` validation recovery, issue summary placement,
payment-confidence copy, local submit readiness, Shopify supplier checkout
handoff, and source-aware delivery confidence.

## Gate Classification

- `Change Type`: Public checkout recovery and payment-confidence clarity.
- `Route Context`: `/checkout`.
- `Primary Lens`: Checkout and payment guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/checkout-delivery-confidence-benchmark.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the same checkout help, shipping, delivery, support, and
payment-confidence evidence recorded in
`docs/qa/checkout-delivery-confidence-benchmark.md`.

| Site          | Evidence URL                                                                                 | Observed Pattern                                                                                        | Weight |
| ------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/faq/shipping-delivery/                                         | Checkout-adjacent help explains delivery, exceptions, tracking, and client support before completion.   | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/faq/shipping-returns-faq/                                            | Shipping, returns, advisor support, and order help are grouped as checkout confidence information.      | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/faq/shipping/what-shipping-options-are-available-on-bulgaricom | Delivery expectations are documented before order completion.                                           | 1.5    |
| Graff         | https://www.graff.com/us-en/checkout-login/                                                  | Checkout surfaces secure payment, delivery, returns, and help close to checkout actions.                | 1.5    |
| Chopard       | https://www.chopard.com/en-us/faq.html                                                       | Checkout help covers delivery, tracking, returns, gift options, and payment-adjacent support.           | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs/shipping                                                   | Shipping and support recovery are explained near commerce decisions.                                    | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                                                         | Commerce benefits expose contact, delivery, secure payment, and returns in the shopping flow.           | 1.5    |
| Messika       | https://www.messika.com/us_en/services-demand                                                | Services combine delivery, secure payment, returns, gift packaging, and client assistance.              | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/shipping-and-returns                                   | Shipping, tracking, delays, and returns are explained as order confidence support.                      | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/                                                               | Public service copy exposes delivery, return, secure payment, packaging, and support promises.          | 1.5    |
| De Beers      | https://www.debeers.com/en-us/delivery-and-returns.html                                      | Delivery and returns page explains secure courier, signature, tracking, packaging, and service support. | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Checkout may add a clearer validation summary and
  payment-confidence placement near submit actions when copy remains
  source-aware and does not imply unsupported provider success.

## Implementation Decision

Implement a narrow checkout confidence pass:

- Mark the existing issue list as the checkout validation summary with a stable
  test id, `role="status"`, and polite live updates.
- Keep validation recovery before local submit actions.
- Add compact payment-confidence copy near submit actions.
- Keep local and Shopify supplier checkout copy separate.
- Do not add CardCom claims, paid Shopify success claims, guaranteed delivery
  dates, or a combined payment promise for mixed carts.

## Acceptance Checks

- Validation issues are summarized before submit actions and remain field-led.
- Local checkout states that details and totals are verified before payment is
  finalized.
- Supplier checkout states that payment and delivery continue in Shopify
  Checkout.
- Mixed carts keep local and supplier payment paths separate.

## Verification

- `pnpm test -- src/styles/checkout-validation-payment-confidence.test.ts src/app/checkout/_components/checkout-display.test.ts src/styles/service-trust-placement.test.ts src/styles/form-error-recovery-contract.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports checkout copy and placement only. Real paid Shopify
checkout, supplier fulfillment confirmation, and CardCom production credentials
remain blocked elsewhere and must not be implied by this UI.

---

<a id="evidence-customer-auth-e2e-fixture"></a>

## Evidence: customer-auth-e2e-fixture

# Customer Auth E2E Fixture

Status: reusable authenticated customer fixture added for Wave 0 / I-01.

Generated: 2026-06-19.

## What Exists

- Test-only route: `POST /api/e2e/customer-auth`.
- Enablement flag: `E2E_AUTH_FIXTURES=1`.
- Production guard: disabled on Vercel production even if the flag is present.
- Fixture data: customer profile, address, saved size, wishlist item, local
  shipped order, captured fixture payment, shipment, active return request,
  Shopify mirror order, and deterministic OTP challenge.
- Production E2E harness flag: `E2E_SKIP_SERWIST_BUILD=1`, used only to avoid
  the local Windows sandbox failure while account tests run with service
  workers blocked.
- Production E2E database source: `E2E_DATABASE_URL` when supplied, otherwise
  shell `DATABASE_URL`, otherwise `.env.development.local` `DATABASE_URL`.
- Managed production web server: `tests/e2e/global-setup.ts` starts
  `scripts/playwright-web-server.mjs`; `tests/e2e/global-teardown.ts` tears down
  the saved process tree for Windows Playwright runs.
- Playwright helper: `tests/e2e/helpers/customer-auth.ts`.
- E2E spec: `tests/e2e/authenticated-account.spec.ts`.

## Verification

Unit and guardrail checks:

```powershell
pnpm exec vitest run src/server/services/customer-auth-fixtures.test.ts scripts/qa-route-inventory.test.ts src/server/http/api-response-boundary.test.ts
pnpm lint
pnpm typecheck
pnpm copy:check
```

Browser E2E check:

```powershell
pnpm exec playwright test tests/e2e/authenticated-account.spec.ts --project=chromium-desktop
```

Result:

- The authenticated customer fixture test passed in Chromium desktop.
- The flow reached `/account`, verified local and Shopify order states,
  wishlist decision support, saved sizes, privacy export, and
  `/account/orders/[id]`.

## Known Harness Note

The default Playwright web server command now sets `E2E_SKIP_SERWIST_BUILD=1`
so authenticated account E2E can run through `next build && next start` without
calling Serwist's esbuild step. This is scoped to non-PWA E2E: Playwright blocks
service workers for these tests, and full service-worker production evidence
still requires a separate PWA build/smoke path without the skip flag. The
harness also injects a local E2E database URL before `next start` so `.env.local`
preview credentials do not override the same database used by `next dev`, and
uses global setup/teardown around a managed Node web-server wrapper instead of
Playwright's built-in `webServer` plugin, avoiding Windows shell teardown hangs.

---

<a id="evidence-faq-content-service-recovery-links-benchmark"></a>

## Evidence: faq-content-service-recovery-links-benchmark

# FAQ and Content Service Recovery Links Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-027 FAQ and Content Route Service Recovery Links
- `Status`: Supported and implemented

## Scope

This benchmark covers `/faq`, `/terms`, `/privacy`, `/accessibility`, and
focused service recovery links for orders, privacy, accessibility, and general
questions.

## Gate Classification

- `Change Type`: Public content-route recovery.
- `Route Context`: FAQ, legal, privacy, and accessibility content routes.
- `Primary Lens`: Content/legal readability and service recovery guidance from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                     | Weight |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                    | FAQ and customer-care content route unresolved order, product, and service questions to client care. | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/faq                           | FAQ groups order, returns, account, care, privacy, and service recovery paths.                       | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html | Care/legal support pages connect sizing, maintenance, repair, and contact recovery.                  | 1.5    |
| Boucheron          | https://www.boucheron.com/us/faqs                           | FAQ separates account, orders, returns, and after-sales service with contact recovery.               | 1.5    |
| Chopard            | https://www.chopard.com/en-us/faq.html                      | FAQ explains shipping, returns, repairs, and customer-service escalation.                            | 1.5    |
| De Beers           | https://www.debeers.com/en-us/faqs.html                     | FAQ connects order support, returns, quality checks, privacy, and client services.                   | 1.5    |
| Cartier            | https://www.cartier.com/en-us/contact-us                    | Contact routes connect order, product, boutique, and service topics without crowding legal content.  | 1.5    |
| Piaget             | https://www.piaget.com/us-en/contact-us                     | Contact page routes inquiry topics to client-service recovery.                                       | 1.5    |
| Chaumet            | https://www.chaumet.com/us_en/contact-us                    | Contact/support content keeps assistance paths focused and task-first.                               | 1.5    |
| Graff              | https://www.graff.com/us-en/contact-us/                     | Contact route supports focused inquiries without adding unrelated content sections.                  | 1.5    |
| Buccellati         | https://www.buccellati.com/en_us/customer-service.html      | Customer-service content connects product, order, and after-sales questions to support.              | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. FAQ and legal/content routes may add compact recovery
  links to existing service topics when they preserve readable content density,
  use route-backed destinations, and do not add unsupported contact channels.

## Implementation Decision

Implement a narrow recovery-link pass:

- Add a general service recovery link to `/faq`.
- Add order-focused recovery from `/terms` to `/service?topic=order`.
- Add privacy/accessibility recovery from `/privacy` and `/accessibility` to
  `/service?topic=accessibility-privacy`.
- Keep existing phone and email contact cards unchanged.
- Do not add chat, WhatsApp, appointment booking, same-page anchor CTAs, or new
  content sections.

## Acceptance Checks

- Recovery links point to existing `/service` topic routes.
- Legal/privacy/accessibility content remains the primary content on the page.
- Existing mail and phone contact methods remain available.
- No unsupported service topic or contact channel is introduced.

## Verification

- `pnpm test -- src/styles/content-route-service-recovery.test.ts src/styles/service-trust-placement.test.ts src/styles/public-structure-enforcement.test.ts`

## Residual Risk

This benchmark supports compact recovery links only. Future changes that add
new legal flows, new service topics, live chat, WhatsApp, appointment booking,
or content-route layout changes must run through the public gate again.

---

<a id="evidence-floating-chrome-collision-audit"></a>

## Evidence: floating-chrome-collision-audit

# Floating Chrome Collision Audit

Generated: 2026-05-31

Status: passed baseline audit for public floating chrome.

This audit covers cookie consent, accessibility controls, mobile navigation,
category filter sheets, and sticky public chrome behavior at the current
baseline. It records verification evidence for
the historical task item `I-002`, now consolidated under
`docs/PROJECT_TASKS.md`.

## Evidence

| Check                                   | Command or method                                                                                                                                       | Result                                                                                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Static floating chrome contract         | `pnpm test -- src/styles/floating-chrome-contract.test.ts`                                                                                              | PASS: 7 tests passed.                                                                                                                     |
| Dev server browser smoke                | `agent-browser open http://localhost:3000/` plus content, overlay, console, and snapshot checks                                                         | PASS: page has content, no Next.js error overlay, no console errors.                                                                      |
| Route visual QA                         | `scripts/visual-qa-agent-browser.ps1` against `/`, `/product/venus-line-ring`, `/checkout`, and `/category/earrings` across desktop, tablet, and mobile | PASS: 12 route/viewport checks, no blank content, no error overlay, no horizontal overflow, no broken images.                             |
| Cookie banner and accessibility trigger | Mobile browser geometry check on `/`                                                                                                                    | PASS: cookie banner and accessibility trigger are both visible and do not overlap.                                                        |
| Mobile navigation sheet                 | Mobile browser interaction on `/`                                                                                                                       | PASS: sheet is visible, `data-public-overlay-open` is set, accessibility trigger is hidden by opacity, and no horizontal overflow exists. |
| Category filter sheet                   | Mobile browser interaction on `/category/earrings`                                                                                                      | PASS: sheet is visible, `data-public-overlay-open` is set, accessibility trigger is hidden by opacity, and no horizontal overflow exists. |
| Accessibility dialog                    | Mobile browser interaction on `/category/earrings`                                                                                                      | PASS: dialog is visible, focus lands inside the dialog, and no horizontal overflow exists.                                                |

Local artifacts:

- `artifacts/qa/2026-05-31-floating-chrome-audit/agent-browser-visual-qa.json`
- `artifacts/qa/2026-05-31-floating-chrome-audit/agent-browser-screenshots/desktop-home.png`

The artifact directory is intentionally ignored by git.

## Current Conclusion

No code change is required for the current baseline. The existing CSS contract,
public motion provider, cookie banner offset, accessibility trigger offset, and
sheet overlay behavior are coherent for the audited route set.

## Remaining Risk

- This audit is a baseline sample, not an exhaustive interaction crawl.
- Re-run visual QA when public sheets, dialogs, sticky checkout controls,
  cookie placement, or accessibility trigger placement changes.
- For checkout or product sticky-bar edits, include a route-specific mobile
  interaction pass in addition to the static contract test.

---

<a id="evidence-homepage-discovery-commerce-balance-benchmark"></a>

## Evidence: homepage-discovery-commerce-balance-benchmark

# Homepage Discovery-to-Commerce Balance Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-010 Homepage Discovery-to-Commerce Balance
- `Status`: Supported and implemented

## Scope

This benchmark covers `/`, the homepage hero, category entry points, search,
gifts, sizing, service, featured products, and the ordering of commerce
discovery before editorial support sections.

## Gate Classification

- `Change Type`: Homepage structure and discovery UX.
- `Route Context`: home.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Home, PLP, search, gifts, service, and route-structure
  guidance in `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                        | Observed Pattern                                                                                            | Weight |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/home                  | Homepage balances brand imagery with direct gift, jewelry, watch, care, tracking, and appointment paths.    | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us                       | Homepage leads with gifting and product discovery while keeping service, appointments, and care accessible. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/                            | Homepage exposes shop-by-category, product entries, gifting, and advisor appointment paths.                 | 1.5    |
| Boucheron     | https://www.boucheron.com/us/                       | Homepage includes product entries, saved-list creation, services, and store/appointment paths.              | 1.5    |
| Piaget        | https://www.piaget.com/us-en                        | Global home navigation exposes search, jewelry categories, wishlist, boutiques, and service paths.          | 1.5    |
| Chopard       | https://www.chopard.com/en-us/day-of-happiness.html | Homepage/gift landing patterns combine editorial modules with product carousels and shop links.             | 1.5    |
| De Beers      | https://www.debeers.com/en-us/home?region=true      | Homepage provides fine jewelry collection, new-arrival, product, wishlist, appointment, and contact paths.  | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/home               | Homepage structure keeps brand storytelling near shop, wishlist, store locator, and contact access.         | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The homepage may tighten commerce discovery when the
  change is restrained, routes to real search/category/gift/service utilities,
  and does not turn the hero into a dense control panel or a PLP.

## Implementation Decision

Implement a narrow homepage pass:

- Add a compact text-link shortcut rail immediately after the category grid.
- Link to existing real destinations: `/search`, `/gifts`, `/size-guide`, and
  `/service`.
- Preserve the current hero, category grid, quick-search form, featured product
  grid, and editorial sections.
- Avoid cards, pills, same-page anchors, extra hero CTAs, or product-card
  changes.

## Acceptance Checks

- Commerce shortcuts appear after categories and before material/editorial
  sections.
- The shortcut rail is text-only with underlines/borders, not a nested card or
  button cluster.
- The existing quick-search form still appears before featured products.
- The homepage hero remains the first viewport signal and is not converted into
  a control surface.
- Links route only to existing public tasks.

## Verification

- `pnpm test -- src/styles/homepage-discovery-commerce-balance.test.ts src/styles/mobile-commerce-density.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for `/` on desktop and mobile.

## Residual Risk

The benchmark supports a restrained shortcut rail only. Moving the quick-search
form above editorial content, adding a merchandising mega-panel, changing hero
composition, or introducing personalized recommendation controls still requires
a separate benchmark.

---

<a id="evidence-legal-page-editorial-structure-benchmark"></a>

## Evidence: legal-page-editorial-structure-benchmark

# Legal Page Editorial Structure Benchmark

- `Date`: 2026-07-10
- `Backlog Item`: I-330 / J-07 Legal-page editorial usability
- `Status`: Not supported — no implementation

## Scope

Checked whether Tier-A high jewelry sites give their long-form legal/policy
pages (1) in-page navigation usable on mobile, and (2) short summaries near
the full legal text — the two gaps identified in Elysia's shared
`content-page-shell.tsx` / `legal-section-list.tsx` (ToC is `hidden` below
the `lg` breakpoint; no summaries exist at any width).

## Gate Classification

- `Change Type`: Legal/policy page mobile navigation and summary treatment.
- `Route Context`: legal.
- `Primary Lens`: High Jewelry Reference Gate in `docs/DESIGN.md`.
- `Secondary Lens`: full site-by-site evidence in
  `docs/qa/legal-page-editorial-structure-benchmark.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Score

- `Supported Sites`: 0 of 15 (14 verified with real fetched evidence,
  Buccellati unreachable — HTTP 405 on every legal-page URL tried).
- `Weighted Score`: 0.0.
- `Threshold`: 11.25.
- `Decision`: **Not supported.** Every verified site's legal pages open
  directly into full linear legal prose — no jump-link ToC, no accordion
  (except Anna Sheffield's non-ToS store-policies page, which groups by
  topic but still has no summary and isn't a jump-link ToC), no
  plain-language summary anywhere. Elysia's existing desktop-only sidebar
  ToC already exceeds what most reference sites offer. No code change made.

## Residual Risk

This result is scoped exactly as researched (jump-link ToC + summaries). A
narrower or differently-shaped proposal (e.g., an accordion grouping like
Anna Sheffield's) was not evaluated and would need its own benchmark pass —
do not reuse this "not supported" result to block an unrelated proposal.

---

<a id="evidence-mobile-pdp-rail-density-benchmark"></a>

## Evidence: mobile-pdp-rail-density-benchmark

# Mobile PDP Recommendation-Rail Density Benchmark

- `Date`: 2026-07-10
- `Backlog Item`: I-302 / E-07 Mobile PDP product-rail density reduction
- `Status`: Supported and implemented

## Scope

Elysia's PDP could render up to 3 stacked recommendation sections below the
purchase panel (same collection, same category, same material), each with up
to 4 full product cards — worst case 12 cards stacked vertically on mobile
before a separate recently-viewed rail. This benchmark checks whether Tier-A
high jewelry sites support a leaner pattern.

## Gate Classification

- `Change Type`: PDP recommendation-rail density and mobile layout.
- `Route Context`: PDP (product detail).
- `Primary Lens`: High Jewelry Reference Gate in `docs/DESIGN.md`.
- `Secondary Lens`: full evidence table, site-by-site notes, and the ADR 0015
  site-list substitution record in
  `docs/qa/mobile-pdp-rail-density-benchmark.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Score

- `Supported Sites`: 12 of 15 (Cartier, Chopard, Mikimoto, Messika, Buccellati,
  De Beers, Pomellato, Repossi, Garrard, Vhernier, Verdura, Suzanne Kalan).
- `Weighted Score`: 18.0.
- `Threshold`: 11.25.
- `Decision`: Supported. None of the verified sites approach Elysia's prior
  worst case; most show 0-1 recommendation rails, and where a rail exists it
  reads as a horizontal carousel rather than a full vertical stack. One
  verified site (Anna Sheffield) was denser and is reported as a genuine
  counterexample, not excluded from the record.

## Implementation Decision

- Cap total recommendation rails at **2** (was up to 3) —
  `getProductRecommendationRails` in
  `src/app/product/[slug]/_lib/product-recommendation-rails.ts` only adds the
  material rail when fewer than 2 rails were already produced.
- Cap products per rail at **3** (was 4), uniformly across breakpoints; the
  PDP grid changed from `lg:grid-cols-4` to `lg:grid-cols-3` to avoid an
  orphaned empty column.
- `RecentlyViewedProducts` is unchanged — it is user-specific, not a
  merchandising rail.

## Acceptance Checks

- `getProductRecommendationRails` never returns more than 2 rails.
- Each rail renders at most 3 product cards.
- No rail loses its `reason`, `title`, or `continuationHref`.

## Verification

- `pnpm test -- "src/app/product/[slug]/_lib/product-recommendation-rails.test.ts" src/styles/pdp-design-pass-2.test.ts src/styles/product-recommendation-rail-return-context.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke: PDP at mobile viewport, confirmed exactly 2 stacked rail
  sections with 3 cards each before "Recently Viewed" (light + dark).

## Residual Risk

Carousel-vs-vertical-stack presentation could not be confirmed with a
rendered mobile screenshot for most reference sites (fetch tooling returns
markdown, not a rendered viewport) — this benchmark supports rail/card
**count** reduction with higher confidence than a specific carousel
mechanism. Full site-by-site evidence, the two verification passes on the 8
originally-unreachable sites, and the ADR 0015 site-list substitution
rationale live in `docs/qa/mobile-pdp-rail-density-benchmark.md`.

---

<a id="evidence-offline-page-install-pwa-recovery-priority-benchmark"></a>

## Evidence: offline-page-install-pwa-recovery-priority-benchmark

# Offline Page Install and PWA Recovery Priority Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-037 Offline Page Install and PWA Recovery Priority
- `Status`: Supported and implemented

## Scope

This benchmark covers `/offline`, manifest shortcuts, install-context copy,
cached public route prioritization, retry behavior, and the boundary between
offline browsing and online-only checkout/payment completion.

## Gate Classification

- `Change Type`: PWA reliability and offline recovery clarity.
- `Route Context`: `/offline` and `src/app/manifest.ts`.
- `Primary Lens`: PWA, reliability, and public route rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/production-deployment-evidence-ledger.md` and
  existing PWA route tests.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

High-jewelry references generally prioritize realistic recovery over offline
commerce promises: product discovery, sizing/help, support, and retry paths are
safe; checkout/payment completion remains online-only.

| Site          | Evidence URL                                                  | Observed Pattern                                                                                         | Weight |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                        | Product discovery and service routes remain the primary safe recovery paths when commerce cannot finish. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/                              | Discovery, service, and sizing/help paths are more appropriate than offline payment promises.            | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry                         | Jewelry browsing and service guidance are route-backed recovery paths; checkout requires live handling.  | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html        | Product discovery and client service are safe continuations when a transaction cannot proceed.           | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections | Collection browsing and service information are prioritized before commerce completion.                  | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html         | Listing discovery and help paths remain public, route-backed continuations.                              | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                          | Product discovery, sizing/contact support, and retry are safe reliability continuations.                 | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/           | Product discovery and delivery/support content are appropriate before live checkout resumes.             | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Offline recovery may prioritize cached product
  discovery, gifts, sizing, service, and retry when it clearly states checkout,
  account, and payment completion require a restored connection.

## Implementation Decision

Implement a narrow PWA recovery pass:

- Add install-context copy that explains cached pages and installed-app behavior
  without promising full offline commerce.
- Prioritize recovery actions as discovery, gifts, sizing, service, then retry.
- Align manifest shortcut order with the same recovery priority.
- Keep service request sync copy realistic.
- Do not promise offline checkout, offline account mutation, or offline
  payment completion.

## Acceptance Checks

- Offline page states that install/cache can help reopen recently loaded public
  pages.
- Recovery actions prefer public discovery and sizing/service before retry.
- Manifest shortcuts use route-backed public URLs and avoid checkout.
- Checkout/payment/account completion remains explicitly online-only.

## Verification

- `pnpm test -- src/styles/offline-page-install-pwa-recovery-priority.test.ts src/styles/pwa-offline-recovery.test.ts src/app/manifest.test.ts src/app/serwist-route.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports offline recovery copy, route order, and manifest
shortcut order only. Changes to service worker caching strategy, background
sync, install prompt mechanics, or offline checkout/payment behavior need
separate reliability verification.

---

<a id="evidence-order-source-label-audit"></a>

## Evidence: order-source-label-audit

# Order Source Label Audit

- `Date`: 2026-05-31
- `Backlog Item`: I-004 Order Source Label Audit
- `Status`: Passed for account/admin labeling and read-only Shopify mirror guardrails

## Scope

This audit covers customer account order lists, local account order detail,
admin order lists, local admin order detail, and Shopify order mirror records.
It verifies that local `Order` records and read-only `ShopifyOrderMirror`
records are visibly distinct and do not expose the wrong operational actions.

## Findings

- Account order cards now label local records as store orders and Shopify
  mirrors as supplier orders.
- Account Shopify mirror cards show read-only copy plus supplier payment and
  fulfillment status labels.
- Local account order detail is explicitly labeled as a store order.
- Admin local order rows now include a source column and a local-only action
  label.
- Admin Shopify mirror rows are in a dedicated read-only table, use translated
  supplier payment and fulfillment labels, and only expose a Shopify admin link
  when an external URL exists.
- Local-only filters such as status, fulfillment method, and physical branch now
  hide Shopify mirror rows instead of mixing local order filters with supplier
  records.
- Local admin order detail states that status, shipment, and refund actions are
  local operations only.

## Acceptance Checks

- Local and Shopify-backed orders have clear customer-facing source labels.
- Admin local order rows and Shopify mirror rows use separate source labels and
  distinct actions.
- Shopify mirror rows expose only read-oriented UI in Elysia; supplier
  fulfillment/refund/capture actions remain outside the local workflow.
- Local admin order detail remains the only page that renders local operational
  actions.
- Query search can still surface Shopify mirrors, while local-only filters do
  not imply that mirror rows share local order status or fulfillment semantics.

## Verification

- `pnpm test -- src/lib/commerce-labels.test.ts src/styles/order-source-labels.test.ts src/server/services/shopify-order-mirror.test.ts src/server/services/admin-operations.test.ts`
- `pnpm typecheck`

## Residual Risk

This audit validates labeling, action separation, and local UI guardrails. It
does not validate live Shopify admin permissions or supplier-side fulfillment
operations because those remain external to the current Elysia runtime.

---

<a id="evidence-pdp-purchase-confidence-benchmark"></a>

## Evidence: pdp-purchase-confidence-benchmark

# PDP Purchase Confidence Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-008 PDP Purchase Confidence Pass
- `Status`: Supported and implemented

## Scope

This benchmark covers the public product detail route `/product/[slug]`,
including gallery, purchase panel, selected variant state, size guidance,
source-specific checkout expectations, delivery and return copy, service entry,
and recommendation placement.

## Gate Classification

- `Change Type`: Public PDP commerce confidence.
- `Route Context`: PDP.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Product detail and purchase-confidence rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                                                  | Observed Pattern                                                                                          | Weight |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/faq/shipping-delivery/                                          | Shipping timing, exceptions, order tracking, Client Relations support, returns, and exchanges are clear.  | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/return-to-tiffany-sterling-silver-rings-1152181305.html | PDP exposes size guide, selected size, availability, add-to-cart, advisor contact, and store lookup.      | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/323537.html                                                     | PDP keeps size, customization return limits, delivery delay note, add-to-bag, gift, contact, and store.   | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs/shipping                                                    | Shipping and return guidance points to delivery options, carrier handling, and client service recovery.   | 1.5    |
| Messika       | https://www.messika.com/us_en/our-messika-services                                            | Services page combines deliveries, returns, secure payments, after-sales repair, gift packaging, support. | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                                                          | Jewelry commerce benefits include contact, delivery timing, secure payment, returns, exchanges, sizing.   | 1.5    |
| De Beers      | https://www.debeers.com/en-us/faqs.html                                                       | FAQ supports secure payment, product-page resizing advice, 30-day exchange/return, and client services.   | 1.5    |
| Pomellato     | https://www.pomellato.com/us_en/catene-ring-pac3010-o7000-00000                               | PDP exposes size guide, add-to-cart, boutique/appointment options, care, shipping, exchange, and payment. | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The PDP can add compact confidence copy near the
  purchase action when it clarifies selected variant state, size support,
  source-specific checkout expectations, and delivery/return handling without
  replacing product facts or adding exact public inventory counts.

## Implementation Decision

Implement a narrow PDP purchase-confidence pass:

- Keep gallery and purchase panel as the first-screen focus.
- Keep the primary CTA and wishlist action unchanged.
- Replace generic static trust copy with source-aware confidence rows generated
  from selected variant, product source, size kind, delivery promise, and return
  policy.
- Make supplier-backed products explicit about completing payment and delivery
  in the supplier checkout.
- Keep exact public inventory counts out of copy and tests.
- Keep service rows and recommendation rails below the purchase context.

## Acceptance Checks

- Confidence copy appears near the purchase CTA and before lower-page service
  content.
- Shopify supplier products explain supplier checkout expectations.
- Owned products explain verification before completion without public stock
  precision.
- Size guidance remains tied to size-aware categories.
- Delivery and return text uses product commerce data when available.
- The purchase panel remains task-first and does not add a marketing section.

## Verification

- `pnpm test -- src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/service-trust-placement.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Visual smoke for an owned PDP and the Shopify fixture PDP.

## Residual Risk

The benchmark supports compact confidence rows, not a broad PDP redesign. Any
future change to first-screen hierarchy, gallery placement, product facts,
exact inventory visibility, or recommendation order must run through the public
gate again.

---

<a id="evidence-pdp-size-care-fit-fact-placement-benchmark"></a>

## Evidence: pdp-size-care-fit-fact-placement-benchmark

# PDP Size, Care, and Fit Fact Placement Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-025 PDP Size, Care, and Fit Fact Placement
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]`, the purchase panel, size guidance,
fit confidence, care facts, warranty facts, delivery/returns reassurance, and
the relationship between the buy area and secondary product details.

## Gate Classification

- `Change Type`: PDP purchase-confidence clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: Product detail and purchase confidence guidance from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                     | Weight |
| ------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | PDP purchase context keeps size guidance, service, care, and delivery reassurance near the CTA.      | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | PDP purchase flows keep size help, item facts, delivery, returns, and care information nearby.       | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Product detail keeps size selection, service links, delivery, and care confidence close to buy.      | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | Product pages keep purchase options, care/service support, and product facts before recommendations. | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | PDP patterns surface sizing, service, delivery, and care reassurance without separating the CTA.     | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Product detail keeps selection, delivery, returns, and care facts close to purchase confidence.      | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | PDP layouts keep size guide and product-care confidence available near the purchase decision.        | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Product pages keep item facts and service support adjacent to purchase context.                      | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Product detail exposes material, size guide, care/service, and add-to-bag context together.          | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Product shopping context keeps selected item facts and assistance near purchase controls.            | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Product detail supports purchase decisions with service, sizing, delivery, and aftercare context.    | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. PDP care, warranty, size, and fit facts may be moved
  closer to the purchase decision when the change reuses existing product data,
  stays inside the current purchase-confidence area, and does not add a new
  content block before the CTA.

## Implementation Decision

Implement a narrow purchase-confidence pass:

- Keep gallery, product title, price, options, and primary CTA order unchanged.
- Keep size guidance inside the existing size/fit confidence pattern.
- Pass existing care and warranty data into the purchase panel.
- Append care and warranty facts to the existing service confidence item near
  the CTA.
- Do not add a new fact grid, accordion, hero section, exact public inventory
  count, or recommendation displacement.

## Acceptance Checks

- Size/fit guidance remains available before the purchase action.
- Care and warranty facts appear inside the existing purchase-confidence area.
- The detailed product commerce rows remain available below the buy area.
- The CTA and wishlist/save action keep their current order and visual weight.
- No new public commerce promise, support channel, or inventory precision is
  introduced.

## Verification

- `pnpm test -- src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/product-purchase-facts-placement.test.ts src/styles/service-trust-placement.test.ts`

## Residual Risk

This benchmark supports moving existing PDP facts into existing purchase
confidence only. Future changes that introduce new accordions, new service
promises, exact inventory counts, or layout changes above the CTA must run
through the public gate again.

---

<a id="evidence-product-card-quick-facts-density-benchmark"></a>

## Evidence: product-card-quick-facts-density-benchmark

# Product Card Quick Facts Density Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-007 Product Card Quick Facts Density
- `Status`: Supported and implemented

## Scope

This benchmark covers product cards on `/category/[slug]`, `/search`,
`/gifts`, home featured products, related products, and recommendation rails.

## Gate Classification

- `Change Type`: Product-listing card UX.
- `Route Context`: PLP/search/gifts/product recommendations.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: PLP, search, gifts, product-card, and PDP guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                                                      | Observed Pattern                                                                                  | Weight |
| ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                                                            | Listing cards show material/stone, price, size/add-to-bag availability, and restrained badges.    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/joaillerie/jewelry-category/bracelets.html                           | Listing cards expose product name, reference, price, saved-list action, and availability filters. | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/jewelry                                                     | Listing cards include collection, product name, SKU, price, wishlist action, and details link.    | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery.html?cat=335210&category=101&country=int&materials=195 | Listing pages use material/stone filters and compact product name, price, wishlist rows.          | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/necklaces/yellow-gold                                       | Category listing is material-scoped and keeps price/product facts compact.                        | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/sterling-silver/                                                  | Material-scoped listing groups silver jewelry with compact product entries.                       | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/piaget-rose/rose-gold-diamond-necklace-g37ub600              | Product facts identify product type, metal, stones, and add-to-bag context.                       | 1.5    |
| De Beers      | https://www.debeers.com/en-us/lotus-by-de-beers-white-gold-diamond-ring/R104124.html              | Product detail exposes material, diamond facts, size guide, price, and add-to-bag context.        | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Product cards may expose one quiet line of useful
  quick facts when it reuses existing data, remains text-only, does not add
  visual badges or overlays, and preserves scan speed.

## Implementation Decision

Implement a narrow product-card pass:

- Keep the existing single `product-card-attributes` text line.
- Extend that line from material/stone only to material/stone, public
  availability label, and a supplier source fact only for supplier-backed
  products.
- Keep the existing image badge budget, price line, favorite action, and PDP
  CTA unchanged.
- Do not use `commerceHighlights`, collection marketing text, match reasons,
  discount badges, or extra product-card rows.

## Acceptance Checks

- Product cards still render one quiet metadata line.
- The line is truncated to one text slot and uses existing catalog data.
- No additional `<Badge>` component, overlay, add-to-cart action, or checkout
  link is introduced.
- Supplier source is visible only when the product source is
  `DROPSHIP_SHOPIFY`.
- The product title, price or consultation label, favorite control, and PDP link
  remain unchanged.

## Verification

- `pnpm test -- src/styles/product-card-overlays.test.ts src/styles/mobile-commerce-density.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for category/search listing routes.

## Residual Risk

The benchmark supports only one text-line expansion on existing product cards.
Any visual comparison chips, sale badges, inventory counts, collection rails,
or card-level checkout action still requires a separate benchmark.

---

<a id="evidence-product-gallery-full-gallery-benchmark"></a>

## Evidence: product-gallery-full-gallery-benchmark

# Product Gallery Full Gallery Benchmark

- `Date`: 2026-06-03
- `Backlog Item`: I-034 Product Gallery Full Gallery Infrastructure
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]` gallery infrastructure: bounded PDP
media, scrollable thumbnails for many images, full-viewport gallery viewing,
keyboard navigation, visible image position, and supplier multi-image media.

It replaces the narrower thumbnail-clarity decision in
`docs/qa/product-gallery-media-fallback-thumbnail-clarity-benchmark.md`.

## Gate Classification

- `Change Type`: Public PDP media and purchase confidence clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: High Jewelry Reference Gate and the selected 30-site jewelry
  benchmark corpus in `src/lib/public-design-policy.ts`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; 30-site threshold is `18.75`.

## Benchmark Evidence

| Site               | Evidence URL                                                          | Observed Pattern                                                                  | Weight |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/jewelry/                                | PDP media stays bounded, product-led, and navigable before service content.       | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/                                              | PDP imagery supports multi-image inspection without hiding purchase context.      | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/collections/jewelry/couture.html | Product/collection media uses restrained product inspection and clear sequence.   | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/                                        | PDP media presents product image sequences with dedicated larger viewing.         | 1.5    |
| Harry Winston      | https://www.harrywinston.com/                                         | Product imagery remains image-led and bounded around the product task.            | 1.5    |
| Graff              | https://www.graff.com/us-en/home/                                     | Product photography dominates, with selection controls visually contained.        | 1.5    |
| Chopard            | https://www.chopard.com/en-us                                         | Product galleries keep media, details, and purchase confidence in one flow.       | 1.5    |
| Boucheron          | https://www.boucheron.com/us/                                         | Gallery controls stay near product media and support image continuation.          | 1.5    |
| Chaumet            | https://www.chaumet.com/us_en/                                        | Product image treatment favors bounded inspection over decorative enlargement.    | 1.5    |
| Piaget             | https://www.piaget.com/us-en                                          | PDP/gallery surfaces emphasize current image position and product context.        | 1.5    |
| Mikimoto           | https://www.mikimoto.com/en/index.html                                | Product media supports browsing without obscuring product facts.                  | 1.5    |
| Messika            | https://www.messika.com/us_en/                                        | Product pages keep image sequences and product facts in a direct commerce flow.   | 1.5    |
| Buccellati         | https://www.buccellati.com/en_us/home                                 | Product media stays restrained, factual, and product specific.                    | 1.5    |
| De Beers           | https://www.debeers.com/en-us/home                                    | Product media and detail controls remain route-backed and product led.            | 1.5    |
| Pomellato          | https://www.pomellato.com/                                            | PDP image viewing supports close inspection while keeping commerce context clear. | 1.5    |
| David Yurman       | https://www.davidyurman.com/                                          | Commerce PDPs use multi-image galleries with bounded media and thumbnails.        | 1      |
| Pandora            | https://www.pandora.net/                                              | PDP media sequences support thumbnail navigation and product inspection.          | 1      |
| Swarovski          | https://www.swarovski.com/                                            | Product galleries provide image sequences without replacing purchase details.     | 1      |
| Mejuri             | https://mejuri.com/                                                   | Product pages support multiple product images in compact commerce layouts.        | 1      |
| Brilliant Earth    | https://www.brilliantearth.com/                                       | PDP galleries use thumbnails and larger product viewing for confidence.           | 1      |
| Blue Nile          | https://www.bluenile.com/                                             | Product detail media emphasizes navigable inspection before purchase.             | 1      |
| James Allen        | https://www.jamesallen.com/                                           | Product inspection is explicit, bounded, and commerce oriented.                   | 1      |
| Kay Jewelers       | https://www.kay.com/                                                  | PDP galleries support many images while keeping purchase controls adjacent.       | 1      |
| Zales              | https://www.zales.com/                                                | Product pages keep thumbnail navigation close to the main image.                  | 1      |
| Jared              | https://www.jared.com/                                                | PDP media supports full product inspection and visible image selection.           | 1      |
| VRAI               | https://www.vrai.com/                                                 | Product media uses constrained, product-led inspection patterns.                  | 1      |
| Catbird            | https://www.catbirdnyc.com/                                           | PDP galleries preserve product details and route-backed shopping flow.            | 1      |
| Aurate             | https://auratenewyork.com/                                            | Product imagery uses multiple images and bounded commerce presentation.           | 1      |
| Monica Vinader     | https://www.monicavinader.com/                                        | PDP galleries support image selection with compact purchase context.              | 1      |
| Kendra Scott       | https://www.kendrascott.com/                                          | PDP media supports thumbnails, active image state, and product inspection.        | 1      |

## Score

- `Supported Sites`: 30 of 30.
- `Weighted Score`: 37.5.
- `Threshold`: 18.75.
- `Decision`: Supported. PDP gallery infrastructure may use a bounded main
  gallery, scrollable thumbnail rail, and true full-viewport image viewer when
  it stays inside the existing PDP media area and keeps purchase context
  adjacent.

## Implementation Decision

- Replace the small zoom dialog with a full-viewport gallery viewer.
- Add a touch magnifier affordance inside the main media area that opens the
  same full-viewport viewer in an enlarged inspection state.
- Keep the PDP main image bounded and `object-contain` so large source images do
  not crop or pretend to be magnification.
- Use stable scroll rails for thumbnails in both the PDP and full-screen viewer.
- Preserve all supplier images already available from Shopify sync.
- Expand fixtures so local, e2e, and visual QA cover multi-image galleries.
- Do not add decorative media, same-page storytelling, urgency, or checkout
  prompts inside the gallery.

## Acceptance Checks

- Multi-image PDPs expose visible selected-image status and active thumbnail
  state.
- Full-screen viewer occupies the viewport, uses a bounded image stage, supports
  next/previous and keyboard navigation, and returns focus to the trigger.
- Touch viewports expose an in-image magnifier trigger, and full-screen viewing
  exposes close, image navigation, and magnification controls.
- Thumbnail rail supports many images without horizontal page overflow.
- Supplier sync preserves all Shopify images fetched by the adapter.
- Missing-media fallback remains compact and keeps purchase details visible.

## Verification

- `pnpm test -- src/styles/product-gallery-media-fallback-thumbnail-clarity.test.ts src/lib/image-performance.test.ts src/server/services/shopify-dropship-sync.test.ts src/server/adapters/shopify.test.ts`
- `pnpm typecheck`
- `pnpm e2e -- tests/e2e/critical-flows.spec.ts`
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/visual-qa-agent-browser.ps1 -Routes "/product/venus-line-ring","/product/hera-bracelet","/product/elysia-supplier-silver-halo-ring" -Viewports "desktop:1440x900","tablet:768x1024","mobile:390x844"`
- `pnpm copy:check`
- `pnpm build`

## Residual Risk

This benchmark supports a full-gallery image viewer with a basic touch
magnifier state, not augmented try-on, video media, or a broader PDP redesign.
Those changes require a separate public benchmark decision.

---

<a id="evidence-product-gallery-media-fallback-thumbnail-clarity-benchmark"></a>

## Evidence: product-gallery-media-fallback-thumbnail-clarity-benchmark

# Product Gallery Media Fallback and Thumbnail Clarity Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-034 Product Gallery Media Fallback and Thumbnail Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]` gallery selected-state clarity,
thumbnail controls, missing-media fallback, and image alt/status copy. It
evaluates whether the product gallery can become clearer without changing the
gallery-first PDP layout or adding decorative media.

## Gate Classification

- `Change Type`: Public PDP media and purchase confidence clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: Product detail and public media rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the same high-jewelry PDP evidence used for
`docs/qa/pdp-size-care-fit-fact-placement-benchmark.md`.

| Site          | Evidence URL                                          | Observed Pattern                                                                                        | Weight |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/rings/          | PDP media remains product-led with clear gallery navigation and purchase details beside or below media. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                | Product imagery, thumbnail selection, and purchase facts remain close without decorative detours.       | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings           | PDP media uses a stable product image sequence before service or editorial content.                     | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections/    | Product detail pages keep product photography dominant and selection controls visually bounded.         | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery               | Product image galleries keep media, detail, and purchase confidence in a compact product task.          | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html | Product discovery and detail media stay image-led with clear continuation controls.                     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings            | PDP/gallery surfaces emphasize current product imagery and visible selection context.                   | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                 | Product pages keep image sequences and product facts in a direct commerce flow.                         | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/   | Product media and detail controls stay factual, route-backed, and product specific.                     | 1.5    |
| Van Cleef     | https://www.vancleefarpels.com/us/en/collections.html | Product-led visual presentation avoids generic decorative media in shopping contexts.                   | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/jewelry         | Product media supports browsing and purchase confidence without obscuring product details.              | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. PDP gallery clarity may add visible selected-image
  status, stronger thumbnail selected markers, and a clearer missing-media
  fallback when all changes stay inside the existing gallery component.

## Implementation Decision

Implement a narrow gallery clarity pass:

- Keep the current gallery-first PDP structure unchanged.
- Add a visible and live selected-image status for multi-image galleries.
- Keep thumbnail controls keyboard reachable and mark the active thumbnail with
  a stable testable state.
- Keep the missing-media fallback inside the gallery frame and keep purchase
  details visible outside the gallery.
- Do not add decorative imagery, new media sections, service CTAs, checkout
  prompts, or editorial content.

## Acceptance Checks

- The gallery exposes a selected-image status for assistive technology and
  sighted users.
- Thumbnails retain `aria-current`, `aria-pressed`, keyboard navigation, and a
  stable selected-state marker.
- Main image alt text identifies the product and the active image index.
- Missing-media fallback remains compact and does not obscure the purchase
  panel.

## Verification

- `pnpm test -- src/styles/product-gallery-media-fallback-thumbnail-clarity.test.ts src/styles/product-led-media.test.ts src/styles/product-purchase-facts-placement.test.ts src/styles/service-trust-placement.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports clarity inside the existing gallery only. New gallery
layouts, new product media sources, decorative imagery, or cross-page media
systems must pass the public gate again.

---

<a id="evidence-product-recommendation-rail-return-context-benchmark"></a>

## Evidence: product-recommendation-rail-return-context-benchmark

# Product Recommendation Rail Relevance and Return Context Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-038 Product Recommendation Rail Relevance and Return Context
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]` recommendation rails, related-product
context labels, product-card context copy, and route-backed return links from a
search-origin PDP visit.

## Gate Classification

- `Change Type`: Public PDP recommendation and discovery continuation clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: PDP and product discovery guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the PDP and product-led discovery evidence recorded in
`docs/qa/pdp-size-care-fit-fact-placement-benchmark.md` and
`docs/qa/product-gallery-media-fallback-thumbnail-clarity-benchmark.md`.

| Site          | Evidence URL                                          | Observed Pattern                                                                               | Weight |
| ------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                | Product discovery keeps collection/filter continuation close to product-led shopping contexts. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/                      | Product and category browsing rely on direct product cards and service-backed continuation.    | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry                 | Product pages keep related discovery factual and route-backed rather than editorial-only.      | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections/    | Collections keep product-led continuation and clear collection context.                        | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery               | Product discovery uses compact category/collection continuation before broader content.        | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html | Listing and product continuation remain tied to category, collection, and product attributes.  | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                  | Jewelry discovery keeps visible category and product context in the shopping flow.             | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                 | Product browsing emphasizes related product context without checkout shortcuts in the rail.    | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/   | Related discovery stays product-specific and keeps service/commerce facts separate.            | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/jewelry         | Product recommendations are safest when they preserve product-card clarity and category paths. | 1.5    |
| Van Cleef     | https://www.vancleefarpels.com/us/en/collections.html | Collection discovery supports route-backed continuation from product contexts.                 | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. PDP recommendation rails may show compact reason copy,
  product-card context labels, and return-to-search/category links when the rail
  remains below product details and does not add checkout, urgency, or editorial
  content.

## Implementation Decision

Implement a narrow recommendation context pass:

- Add a short reason and route-backed continuation link to each rail.
- Add product-card context labels only when a caller passes context.
- Add search-origin return context when the PDP was reached from search.
- Keep recommendation rails below product details and service facts.
- Do not add checkout shortcuts, urgency copy, decorative media, or new content
  sections inside the recommendation area.

## Acceptance Checks

- Rails expose why products are related.
- Product cards can show a compact context label without affecting default
  product-card surfaces.
- Search return links preserve the originating query only.
- Recommendation continuation links point to `/category/[slug]` or `/search`.

## Verification

- `pnpm test -- src/styles/product-recommendation-rail-return-context.test.ts src/app/product/[slug]/_lib/product-recommendation-rails.test.ts src/styles/product-card-overlays.test.ts src/styles/public-structure-enforcement.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports context and routing copy only. Recommendation algorithm
changes, personalization, AI-ranked rails, or cross-session tracking require a
separate benchmark and data review.

---

<a id="evidence-production-deployment-evidence-ledger"></a>

## Evidence: production-deployment-evidence-ledger

# Production Deployment Evidence Ledger

Status: active release evidence ledger.

Last updated: 2026-06-21.

This ledger records the latest production deployment evidence that is safe to
keep in the repository. It stores deployment URLs, aliases, command names, and
pass/fail results only. Do not add tokens, provider credentials, secret
environment values, customer data, or private dashboard screenshots.

Related documents:

- `docs/PROJECT_TASKS.md`
- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/ENGINEERING_CONVENTIONS.md`
- `scripts/smoke.mjs`

## Latest Production Evidence

| Field               | Evidence                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence date       | 2026-06-21                                                                                                                                                                               |
| Branch              | `main`                                                                                                                                                                                   |
| Commit SHA          | `f59b4a8dbdcffcfa662add7e4a3f6593d9739d1d`                                                                                                                                               |
| Vercel project      | `ariel-twitos-projects/elysia`                                                                                                                                                           |
| Deployment URL      | `https://elysia-nrmnccd8x-ariel-twitos-projects.vercel.app`                                                                                                                              |
| Deployment ID       | `dpl_8F4hp3EBXado63ycn6RHQ7XPSEmB`                                                                                                                                                       |
| Target              | Production                                                                                                                                                                               |
| Status              | Ready                                                                                                                                                                                    |
| Created             | 2026-06-21 14:09:26 Asia/Jerusalem                                                                                                                                                       |
| Production alias    | `https://elysia-jewellery.com`                                                                                                                                                           |
| Additional aliases  | `https://elysia-ariel-twitos-projects.vercel.app`, `https://elysia-git-main-ariel-twitos-projects.vercel.app`                                                                            |
| Smoke command       | `$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"; pnpm smoke`                                                                                                                       |
| Smoke result        | PASS: 35 checks passed across health, public, search, category, checkout, account, API, and admin smoke routes                                                                           |
| Health result       | PASS: `/api/health` returned 200 during smoke                                                                                                                                            |
| Error log scan      | PASS: `$env:VERCEL_TOKEN=$null; vercel logs https://elysia-jewellery.com --since 30m --level error` returned `No logs found for ariel-twitos-projects/elysia` after smoke                |
| Error-log window    | PENDING: current scan is clean and covers the deployment lifetime so far, but the deployment was about 11 minutes old at refresh time so the 60-minute post-alias window has not elapsed |
| Marker checks       | PASS: `/search`, `/search?q=venus`, and `/search?q=zzzz-no-match&maxPrice=1` rendered search form/grid/empty states without RSC digest after the Typesense fallback fix                  |
| Runtime data caveat | Smoke uses public/logged-out routes and documented unauthenticated API expectations only                                                                                                 |
| Remaining risk      | Does not prove authenticated admin workflows, paid checkout, live supplier fulfillment, provider secrets, or the full 60-minute post-alias error-log window for the current deployment   |

## Required Release Evidence Fields

Every production release note or ledger update must record:

- Branch name.
- Commit SHA.
- Deployment URL.
- Deployment ID.
- Deployment target.
- Production alias URL.
- Alias verification result from `vercel inspect`.
- Health check result against the production alias.
- Smoke command and result.
- Error-log scan command and result.
- Minimum clean error-log window, currently `60 minutes` after production alias
  verification.
- Residual risk that remains outside repository verification.

## Verification Commands

Run these commands from the repository root when updating this ledger:

```powershell
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
vercel ls --yes
vercel inspect https://elysia-jewellery.com
vercel logs https://elysia-jewellery.com --level error --since 1h --json
$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"; pnpm smoke
pnpm exec prettier --check docs/qa/production-deployment-evidence-ledger.md docs/PROJECT_TASKS.md
git diff --check
```

## Post-Deploy Error-Log Rule

Do not mark release evidence complete until the production deployment has a
clean Vercel error-log scan for at least `60 minutes` after the production
alias points at the inspected deployment. If an error appears, record the
command, the affected route or function if known, and rerun the clean window
after the fix is deployed.

Repeatable log scan command:

```powershell
vercel logs <deployment-url> --level error --since 1h --json
```

If the local Vercel CLI cannot write to its auth/cache path, the non-JSON form
is acceptable for a manual refresh as long as the output is short and states
that no logs were found:

```powershell
vercel logs <deployment-url> --level error --since 1h
```

## Rollback Decision Tree

1. If the production alias points to a deployment with customer-visible 5xx
   errors, broken checkout, or provider webhook failures, run
   `vercel rollback <deployment-url>` to restore the last known-good production
   deployment.
2. If the candidate deployment is healthy but the alias still points to an older
   deployment, run `vercel promote <deployment-url>` and then repeat smoke,
   health, and log checks.
3. If the deployment failed before readiness or has build/runtime errors, fix
   the branch, redeploy, and start a new ledger entry instead of promoting or
   rolling back blindly.
4. Record the chosen action, operator, command, resulting alias target, and
   residual risk in this ledger or the release note.

## Smoke Route Summary

The latest production smoke command passed the following route groups:

| Route group               | Evidence                                                                      |
| ------------------------- | ----------------------------------------------------------------------------- |
| Health                    | `/api/health` returned 200                                                    |
| Public navigation         | `/`, `/branches`, `/gifts`, `/ai`, `/stylist`, `/about`, `/faq` returned 200  |
| Legal and accessibility   | `/privacy`, `/terms`, `/accessibility` returned 200                           |
| Discovery and commerce    | `/search`, filtered search, categories, one PDP, and `/checkout` returned 200 |
| Logged-out account        | `/account` returned 200 and `/account/privacy/export` returned 401            |
| API negative paths        | `/api/chat` returned 400 and `/api/webhooks/cardcom` returned 401             |
| Admin logged-out surfaces | Admin login and protected admin routes returned expected 200 responses        |

## Update Rules

- Update this ledger only after a production deployment has been inspected or a
  production smoke run has completed.
- Keep the production alias explicit so smoke evidence is tied to
  `https://elysia-jewellery.com`, not only to a generated deployment URL.
- Replace the deployment URL and ID together.
- Record only command names and pass/fail summaries; keep raw logs out of this
  file unless they are short and contain no secrets.

---

<a id="evidence-production-visual-smoke-evidence-refresh"></a>

## Evidence: production-visual-smoke-evidence-refresh

# Production Visual Smoke Evidence Refresh

- `Date`: 2026-06-01
- `Backlog Item`: I-047 Production Visual Smoke Evidence Refresh
- `Status`: Implemented as a repeatable evidence checklist

## Scope

This refresh records the production smoke and route evidence that should be
updated after the current batch of backlog-backed changes reaches production.

## Refresh Cadence

- Refresh after every production deployment that changes public routes,
  checkout, account, admin chrome, floating controls, PWA behavior, or visual QA
  scripts.
- Refresh after deployment aliases change, even when the code commit is
  unchanged, so the evidence is tied to the active production domain.
- Keep one representative route-set artifact for every release candidate.
  Capture an all-products route-set artifact before releases that affect
  catalog routing, product fixtures, search, category filters, or PDP media.

## Artifact Naming

Use this production artifact pattern:

```text
artifacts/qa/<utc-timestamp>-<route-set>-<deployment-id>-agent-browser/
```

Required metadata for each visual evidence directory:

- UTC timestamp.
- Production base URL.
- Deployment ID or `local` for non-production checks.
- Route set name, either `representative`, `all-products`, or an explicitly
  named release subset.
- Viewport set.
- Route list.
- Console error budget.

## Evidence Targets

- `/product/elysia-supplier-silver-halo-ring?q=venus`
- `/checkout`
- `/service?topic=order`
- `/branches`
- `/size-guide?kind=ring&returnTo=/product/elysia-supplier-silver-halo-ring`
- `/admin/appointments`
- `/admin/inventory`
- `/admin/notifications`
- `/serwist/sw.js`

## Required Evidence

- Production deployment inspect output reports `READY`.
- `SMOKE_BASE_URL=https://elysia-jewellery.com pnpm smoke` passes.
- `/serwist/sw.js` returns `200`.
- Product, service, size guide, and branches pages expose their new route
  context markers in production HTML.
- Admin routes return expected protected-route responses in smoke; detailed
  admin UI state remains covered by source tests because production HTML is
  permission-dependent.
- Vercel error-log scan for the deployment returns no error entries for the
  post-deploy window.

## Verification Commands

```powershell
vercel inspect <deployment-url>
$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"; pnpm smoke
curl.exe -I https://elysia-jewellery.com/serwist/sw.js
vercel logs <deployment-url> --level error --since 1h --json
$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"
$env:VERCEL_DEPLOYMENT_ID = "<deployment-id>"
$env:QA_ROUTE_SET_NAME = "representative"
pnpm visual:qa
pnpm visual:qa -- -AllProducts
```

## Residual Risk

This refresh does not replace authenticated manual admin workflow checks,
provider-dashboard validation, paid Shopify checkout, or supplier fulfillment
confirmation.

---

<a id="evidence-provider-negative-path-review"></a>

## Evidence: provider-negative-path-review

# Provider Negative-Path Review

- `Date`: 2026-05-31
- `Backlog Item`: I-006 Provider Negative-Path Review
- `Status`: Passed for route-level provider and webhook failure contracts

## Scope

This review covers provider-facing API routes where external systems can fail
or send invalid requests: CardCom webhooks, Shopify order webhooks, Cloudinary
webhooks, search reindexing, the outbox job runner, shared API response helpers,
rate-limit helpers, and provider signature adapters.

## Findings

- CardCom webhook processing failures now return a stable `503` JSON response
  instead of leaking provider exception text through an unhandled route error.
- Shopify order webhooks now record a received event before mirror processing,
  return a stable `503` if mirror processing fails, and only mark the webhook as
  processed after mirror work succeeds.
- Cloudinary invalid-signature callbacks now record a failed webhook event,
  matching the CardCom and Shopify audit behavior.
- Search reindex provider failures now return a stable `503` response and do
  not enqueue a misleading successful audit event.
- Search reindex audit/outbox failures now return a stable `503` response
  rather than exposing persistence details.
- Outbox job runner top-level processing failures now return a stable `503`
  response instead of a raw thrown error.
- Rate-limit responses continue to use the shared `{ ok: false, error }` shape
  and include `Retry-After`.

## Acceptance Checks

- Invalid webhook signatures return stable unauthorized JSON and do not run
  provider mutation work.
- Webhook provider-processing failures return generic service-unavailable JSON
  and keep secret-bearing exception text out of the public response.
- Rate-limited webhook and API routes include `Retry-After`.
- Search reindex and outbox job failures return generic service-unavailable JSON
  with route-specific wording.
- Production-only provider configuration checks remain covered by adapter and
  readiness tests; this review does not loosen those guards.

## Verification

- `pnpm test -- src/app/api/webhooks/cardcom/route.test.ts src/app/api/webhooks/shopify/orders/route.test.ts src/app/api/webhooks/cloudinary/route.test.ts src/app/api/search/reindex/route.test.ts src/app/api/jobs/outbox/route.test.ts src/server/http/api-response.test.ts src/server/services/rate-limit.test.ts src/server/adapters/payment.test.ts src/server/adapters/shopify.test.ts`
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`

## Residual Risk

This review validates local route contracts and mocked provider failures. It
does not replace live CardCom, Shopify, Cloudinary, Typesense, or outbox
delivery smoke tests after production credentials and provider dashboards are
available.

---

<a id="evidence-public-performance-sweep"></a>

## Evidence: public-performance-sweep

# Public Performance Sweep

- `Date`: 2026-05-31
- `Backlog Item`: I-005 Public Performance Sweep
- `Status`: Passed with no remediation required

## Scope

This sweep ran the existing performance route matrix from
`scripts/qa-site-audit.ts` and `scripts/qa-route-inventory.ts` against a local
production Next.js server built from the current workspace.

## Environment

- `Build`: `pnpm build`
- `Base URL`: `http://localhost:3102`
- `Fixtures`: `E2E_CATALOG_FIXTURES=1`
- `Artifact directory`: `artifacts/qa/2026-05-31-public-performance-sweep`
- `Browsers`: Chromium
- `Viewports`: desktop, mobile
- `Repeats`: 3

## Results

- `Status`: PASS
- `Passed`: 48
- `Failed`: 0
- `Routes`: `/`, `/search?q=venus`, `/checkout`, `/account`, `/ai`,
  `/service`, `/category/earrings`, `/product/venus-line-ring`
- `Objective Failures`: None

No route exceeded the strict performance budgets enforced by
`qa-site-audit`: navigation time, mobile navigation time, CLS, TBT, same-origin
request failures, console errors, page errors, broken images, framework error
overlays, blank content, or horizontal overflow.

## Acceptance Checks

- Every finding has a route, viewport, browser, metric, artifact path, likely
  cause, and remediation class: not applicable because no findings were
  produced.
- The route matrix and audit artifacts were generated and archived under
  `artifacts/qa/2026-05-31-public-performance-sweep`.
- The generated `site-audit.md` reports `Status: PASS`, `Passed: 48`, and
  `Failed: 0`.

## Verification

- `pnpm build`
- Agent-browser load check on `http://localhost:3102/`: page loaded, content
  rendered, no framework error overlay detected.
- `E2E_BASE_URL=http://localhost:3102 QA_ARTIFACT_DIR=artifacts/qa/2026-05-31-public-performance-sweep pnpm qa:performance`

## Residual Risk

This was a local production-server performance sweep with seeded fixtures. It
does not replace periodic preview or production monitoring after provider
configuration, real account data, or Shopify supplier traffic changes.

---

<a id="evidence-release-scorecard"></a>

## Evidence: release-scorecard

# Release Scorecard

Status: tooling complete; the release is NOT READY.

Last updated: 2026-06-19.

This implements master-plan item `L-11`. The scorecard exists so that a release
cannot be labeled "Tiffany-surpassing" through prose while any required field is
missing, pending, or failing. Statuses are recorded from evidence and never
inferred from narrative.

## How it works

- Pure model: `scripts/lib/release-scorecard.ts`.
- CLI: `scripts/release-scorecard.ts` (`pnpm release:scorecard`).
- Slice gate: `scripts/release-slice-gate.ts` (`pnpm release:slice-gate`).
- Tests: `scripts/release-scorecard.test.ts`.

Every required field defaults to `MISSING`. A field only counts as satisfied
when its status is `PASS`. Any `MISSING`, `PENDING`, or `FAIL` keeps the overall
verdict at `NOT READY`.

`catalogCompleteness` and `mediaCompleteness` are derived directly from a
catalog-readiness audit artifact (`--catalog-readiness`) so the scorecard cannot
claim catalog or media completeness while `pnpm catalog:readiness` fails.

## Generate

```powershell
pnpm release:scorecard -- `
  --config docs/qa/release-scorecard-wave-0.json `
  --catalog-readiness artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json `
  --out-dir artifacts/qa/<date>-release-scorecard `
  --strict
```

`--strict` exits non-zero when the release is NOT READY, so the scorecard can be
wired into a release gate once the underlying fields can actually pass.

After owner-intake validation, owner-intake apply, scoped readiness, catalog
quality, and this scorecard all produce artifacts for the same release scope,
run:

```powershell
pnpm release:slice-gate -- --owner-intake-validation <validation.json> --owner-intake-apply <apply.json> --catalog-readiness <catalog-readiness.json> --catalog-quality <catalog-quality-report.json> --release-scorecard <release-scorecard.json> --strict
```

The slice gate is intentionally stricter than the scorecard alone: it requires
the owner-intake and catalog artifacts that prove the scoped product data was
validated, applied, and re-audited.

## Current verdict (Wave 0)

Source config: `docs/qa/release-scorecard-wave-0.json`.
Artifact: `artifacts/qa/2026-06-19-wave-0-release-scorecard/`.

| Field                | Status  |
| -------------------- | ------- |
| P0 blockers          | FAIL    |
| Catalog completeness | FAIL    |
| Media completeness   | FAIL    |
| Paid-flow proof      | MISSING |
| Supplier fulfillment | MISSING |
| Reconciliation       | MISSING |
| WCAG 2.2 AA          | MISSING |
| Core Web Vitals      | MISSING |
| Security review      | MISSING |
| Provider health      | MISSING |
| Visual matrix        | MISSING |
| Production smoke     | PASS    |
| Clean log window     | PENDING |
| Legal sign-off       | MISSING |
| Rollback readiness   | MISSING |

Required fields satisfied: `1/15`. Only production smoke is currently proven.

> Elysia is a technically mature, increasingly distinctive luxury-jewelry
> commerce product with several UX advantages. It has not yet proven complete
> brand, media, transaction, fulfillment, service, and customer-preference
> superiority over Tiffany.

## Gate position

Do not add `--strict` release scorecard to `pnpm check` or release gates yet;
the fields are owner/external-blocked and would fail every release without
producing evidence. Promote it into gating only once the underlying P0 fields
can pass.

---

<a id="evidence-route-evidence-ledger"></a>

## Evidence: route-evidence-ledger

# Route Evidence Ledger

Generated: 2026-06-02

Status: active QA evidence ledger for route-level product changes.

This ledger records the latest baseline route evidence for public, account,
admin, API, and PWA surfaces. Use it before accepting product-changing work that
touches route behavior, route structure, checkout/account/admin flows, provider
routes, or global QA coverage.

Related documents:

- `docs/PROJECT_TASKS.md`
- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/PUBLIC_CHANGE_GATE.md`
- `docs/ENGINEERING_CONVENTIONS.md`

## Latest Baseline

| Check                       | Command or artifact                                                                                                          | Result                                       | Remaining risk                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| App route template coverage | `pnpm qa:routes`                                                                                                             | PASS: 60 app route templates covered         | This verifies inventory coverage only; it does not render pages.           |
| Full seeded route inventory | `pnpm exec tsx scripts/qa-route-inventory.ts --check --all-products --out-dir artifacts/qa/2026-06-02-route-evidence-ledger` | PASS: 361 route entries, 0 missing templates | Artifact is local and ignored by git; regenerate when route shape changes. |
| Performance route set       | `pnpm exec tsx scripts/qa-route-inventory.ts --performance-routes`                                                           | PASS: 8 routes selected for performance QA   | This lists targets only; run `pnpm qa:performance` for runtime metrics.    |

Current full-seed inventory summary:

| Kind    | Count |
| ------- | ----: |
| Public  |    18 |
| Dynamic |   306 |
| Account |     2 |
| Admin   |    13 |
| API     |    21 |
| PWA     |     1 |

Coverage summary:

| Coverage type                  | Count |
| ------------------------------ | ----: |
| Browser-visible routes         |   340 |
| Documented or smoke API routes |    21 |
| Performance-audited routes     |     8 |
| Missing app templates          |     0 |

## Route Group Evidence

| Route group                                                                                                                                                  | Change class                                                | Current evidence                                                             | Last checked | Remaining risk                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Public brand and content routes: `/`, `/about`, `/faq`, legal, accessibility, branches                                                                       | Public UX and Brand                                         | Covered by route inventory and public benchmark docs                         | 2026-05-31   | Needs visual QA for layout, media, first viewport, and floating chrome changes.                                        |
| Commerce discovery routes: `/search`, `/gifts`, `/category/[slug]`, `/product/[slug]`                                                                        | Public UX and Brand; Commerce and Checkout                  | Covered by route inventory, seed catalog dynamic routes, and benchmark gates | 2026-05-31   | Needs benchmark evidence before public UX changes and runtime QA for layout or filter behavior changes.                |
| Checkout and account routes: `/checkout`, `/account`, `/account/orders/[id]`, `/account/privacy/export`                                                      | Commerce and Checkout; Accessibility, Privacy, and Security | Covered by route inventory; privacy export has smoke expectation             | 2026-05-31   | Needs flow-level tests for mutations, auth boundaries, payment paths, and source-specific checkout behavior.           |
| Admin operations routes: `/admin`, `/admin/orders`, `/admin/catalog`, `/admin/inventory`, `/admin/customers`, `/admin/integrations`, and related admin pages | Admin and Operations                                        | Covered by route inventory with protected-route expectations                 | 2026-05-31   | Needs authenticated admin checks and data-state fixtures for workflow changes.                                         |
| Provider and API routes: `/api/health`, cart count, cart item mutations, chat, webhooks, push, PWA sync, search reindex, events, jobs, tRPC                  | Backend, API, and Data                                      | Covered as smoke or documented protocol routes                               | 2026-06-02   | Needs route-specific negative-path tests for signatures, auth, rate limits, provider failures, and payload validation. |
| PWA and offline routes: `/offline`, `/serwist/[path]`, PWA sync APIs                                                                                         | Performance, PWA, and Reliability                           | Covered by route inventory and documented service-worker route               | 2026-05-31   | Needs browser/runtime verification for cache behavior, offline recovery, and queued mutation promises.                 |

## Update Rules

- Update the relevant route group when route structure, route ownership, or QA
  coverage changes.
- Add a new evidence entry when a route group gets a meaningful smoke, e2e,
  visual, performance, or provider negative-path result.
- Keep local artifact paths exact, but do not commit ignored artifact output.
- If a route changes public structure or public commerce controls, record the
  benchmark decision before marking the route group as implementation-ready.

---

<a id="evidence-route-status-sharded-visual-audit"></a>

## Evidence: route-status-sharded-visual-audit

# Route-Status and Sharded Visual Audit

Status: Wave 0 QA harness upgrade added for I-305, I-307, E-08/E-09/L-02.

Generated: 2026-06-19.

## What Exists

- Route inventory carries `expectedStatuses` for visual routes.
- `/category/not-a-real-category` is recorded as an intentional recovery-state
  route with expected status `404`.
- `qa-site-audit` suppresses only the expected primary route response for the
  audited route. Same-origin asset, API, image, script, or unrelated route
  failures still count as objective findings.
- Long visual reviews can be split with `--route-shard <index>/<total>`, for
  example `--route-shard 1/4`.
- Sharding is route-based: each selected shard still runs every requested
  browser, viewport, repeat, and screenshot mode for its route subset.

## Verification

```powershell
pnpm exec vitest run scripts/qa-site-audit.test.ts scripts/qa-route-inventory.test.ts
pnpm typecheck
```

## Example Commands

Representative recovery-aware audit:

```powershell
pnpm exec tsx scripts/qa-site-audit.ts --base-url http://localhost:3000 --browsers chromium --viewports mobile --screenshots failures
```

All-product visual review split across four shards:

```powershell
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 1/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-1
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 2/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-2
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 3/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-3
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 4/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-4
```

---

<a id="evidence-search-category-filter-density-benchmark"></a>

## Evidence: search-category-filter-density-benchmark

# Search and Category Filter Density Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-007 Search and Category Filter Density
- `Status`: Supported and implemented

## Scope

This benchmark covers public commerce discovery routes: `/search`,
`/category/[slug]`, `/gifts`, filter sheets, active refinement summaries, sort
controls, reset behavior, and product-grid entry.

## Gate Classification

- `Change Type`: Public UX and commerce-control density.
- `Route Context`: PLP/search/gifts.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                       | Weight |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | Filter and sort controls appear before the grid, with item totals and load-progress summary.           | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Ring listing exposes result count, filters, empty recovery, and range summary before product cards.    | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Listing shows product count and a combined filters/sorting control before the grid.                    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP shows filters, product count, sort, and constrained filter guidance before products.               | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Jewelry listing exposes filter groups, item count, available-online control, and sort before products. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Listing uses a combined sort/filter sheet with clear action and result count before product cards.     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Ring listing exposes filters and result count before the product list.                                 | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing exposes filter button, product count, and sort select before products.                         | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                   | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Listing exposes shop-by filters, apply action, item totals, and page/range information.                | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Collection listing exposes sort/filter, reset-all, active availability selection, and product count.   | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. The change may proceed if it remains compact,
  task-first, and does not push filters, result count, sort, recovery, or grid
  below storytelling content.

## Implementation Decision

Implement a small refinement-summary pass rather than a large redesign:

- Add compact active-refinement summaries above active chips on `/search` and
  desktop `/category/[slug]`.
- Add a truncated active-refinement preview to the mobile category sticky bar.
- Keep chips tappable and individually removable.
- Keep filter and sort controls before product grids.
- Do not change `/gifts` behavior beyond documenting that it already satisfies
  the product-listing requirement with count and search recovery.

## Acceptance Checks

- Active refinement summaries are visible only when selections exist.
- Summaries remain compact and do not replace individual removable chips.
- Mobile category summary is truncated in a stable single line.
- Search and category result summaries, filters, sort controls, and grids remain
  before storytelling content.
- No exact public inventory count is introduced.

## Verification

- `pnpm test -- src/app/search/_lib/search-state.test.ts src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/discovery-filter-density.test.ts`
- Visual smoke for `/search` and `/category/earrings` with active filters before
  product grids.

## Residual Risk

The benchmark supports density and summary refinements, not a broad PLP
redesign. Future changes to filter placement, hero structure, or product-card
density must run through the gate again.

---

<a id="evidence-search-empty-state-guided-recovery-benchmark"></a>

## Evidence: search-empty-state-guided-recovery-benchmark

# Search Empty-State Guided Recovery Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-023 Search Empty-State Guided Recovery
- `Status`: Supported and implemented

> **Update 2026-07-07 (design-restraint pass):** the recovery affordance was
> de-duplicated. The descriptive `search-guided-recovery` text list and the
> redundant standalone first-category button were removed; the single
> **count-backed recovery-actions row** (each action shows its result total)
> remains as the recovery affordance, alongside filter reset and the category
> suggestions. This keeps the benchmark's core decision (route-backed,
> count-backed continuation) while cutting the empty state's button/text density.

## Scope

This benchmark covers `/search` zero-result states, query persistence, filter
recovery, and route-backed continuation links.

## Gate Classification

- `Change Type`: Public UX and commerce discovery recovery.
- `Route Context`: `/search`.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                       | Weight |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | Discovery pages keep filters, result totals, and continuation controls close to the product grid.      | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Listing/search recovery keeps result count, filters, reset, and product continuation before content.   | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Product discovery keeps no-result/filter recovery inside the listing control area.                     | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP recovery stays task-first with constrained filter guidance and grid continuation.                  | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Product listing exposes filters, online availability, and sort controls as recovery before products.   | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Combined sort/filter controls and result count guide users before product cards.                       | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Filter and result summary stay adjacent to listing results and recovery.                               | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing recovery relies on filter and sort controls, not storytelling blocks.                          | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                   | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Shop-by filters, apply action, and item totals guide continuation inside the discovery flow.           | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Discovery pages keep reset-all, filters, active selection, and product count near the product listing. | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Search zero-result recovery may add compact visible
  guidance when it is generated from existing route-backed recovery actions and
  remains inside the empty state.

## Implementation Decision

Implement a narrow recovery pass:

- Keep `/search` as a product-discovery page, not a content page.
- Make existing count-backed recovery action descriptions visible in the empty
  state instead of relying only on `title` text.
- Keep recovery actions as neutral secondary controls.
- Do not add service, size-guide, checkout, account, or editorial links to the
  search empty state.
- Do not add a new section below the empty state.

## Acceptance Checks

- Empty-state guidance appears only when count-backed recovery actions exist.
- Query/filter recovery links remain route-backed and deduped.
- Buttons still show the available result count.
- The recovery area remains compact and does not introduce public content blocks
  or unsupported commerce actions.

## Verification

- `pnpm test -- src/app/search/_lib/search-state.test.ts src/styles/search-empty-recovery.test.ts`

## Residual Risk

This benchmark supports visible guidance for existing recovery actions only.
Future changes that add new destinations, service escalation, editorial content,
or a different search layout must run through the public gate again.

---

<a id="evidence-service-response-contact-clarity-benchmark"></a>

## Evidence: service-response-contact-clarity-benchmark

# Service Response and Contact Clarity Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-026 Service Response Expectations and Contact Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/service`, visible contact methods, response
expectations, service-topic guidance, service request confirmation copy, and
recovery copy without adding unsupported contact channels.

## Gate Classification

- `Change Type`: Public service-contact clarity.
- `Route Context`: `/service`.
- `Primary Lens`: Service route guidance from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                    | Weight |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                    | Client care groups contact methods, product help, order support, and response paths in one surface. | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/services                      | Service pages group contact, care, orders, appointments, and topic-specific guidance.               | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/contact-us--info.html         | Contact page keeps phone, email/message, and topic selection together with expectations.            | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html | Care and service content routes users to advisor contact and service topics without extra channels. | 1.5    |
| Boucheron          | https://www.boucheron.com/us/services                       | Services expose contact, sizing, appointment preparation, care, and after-sales paths compactly.    | 1.5    |
| Chopard            | https://www.chopard.com/en-us/faq.html                      | FAQ/service guidance explains order, returns, delivery, and customer-service recovery.              | 1.5    |
| De Beers           | https://www.debeers.com/en-us/faqs.html                     | Client services support contact, enquiries, delivery, returns, and care expectations.               | 1.5    |
| Cartier            | https://www.cartier.com/en-us/contact-us                    | Contact/service routes keep phone, email, boutique/service topics, and response context together.   | 1.5    |
| Piaget             | https://www.piaget.com/us-en/contact-us                     | Contact route groups topic selection, contact method, and client-service expectations.              | 1.5    |
| Chaumet            | https://www.chaumet.com/us_en/contact-us                    | Contact page keeps assistance routes and service expectations task-first.                           | 1.5    |
| Graff              | https://www.graff.com/us-en/contact-us/                     | Contact support presents inquiry context and response path without shifting to unrelated content.   | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Service response and contact clarity may be
  strengthened when it stays compact, uses existing phone/email/form channels,
  and ties guidance to the selected topic rather than adding new contact
  promises.

## Implementation Decision

Implement a narrow service clarity pass:

- Add compact response expectation copy near the existing contact/service
  summary.
- Show the selected service topic description directly below the topic select.
- Update request success copy to confirm that Elysia will respond through the
  chosen contact preference.
- Keep phone, email, and the form as the only visible contact paths.
- Do not add WhatsApp, live chat, appointments, SLA timing, automation, or new
  provider-backed flows.

## Acceptance Checks

- Service users can see what happens after they choose a topic and submit.
- Topic guidance changes with the selected topic.
- Confirmation copy references the selected contact preference without
  guaranteeing a timing SLA.
- Existing validation, offline save, and attachment guidance remain intact.
- The service route remains compact and task-first.

## Verification

- `pnpm test -- src/styles/service-response-contact-clarity.test.ts src/styles/service-trust-placement.test.ts src/styles/service-attachment-ux.test.ts src/styles/form-error-recovery-contract.test.ts`

## Residual Risk

This benchmark supports clearer expectations only within existing service
channels. Future changes that add live chat, WhatsApp, appointment booking,
hard response-time SLAs, or a different service workflow must run through the
public gate again.

---

<a id="evidence-service-topic-attachment-review-benchmark"></a>

## Evidence: service-topic-attachment-review-benchmark

# Service Request Topic Routing and Attachment Review Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-040 Service Request Topic Routing and Attachment Review Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/service` topic selection, account/order prefilled
service links, selected-topic routing copy, attachment count review, attachment
constraints, and offline queued service requests.

## Gate Classification

- `Change Type`: Public service request recovery and support-routing clarity.
- `Route Context`: `/service`.
- `Primary Lens`: Service, account, and public form guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/service-response-contact-clarity-benchmark.md` and
  existing attachment UX tests.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the customer service evidence used for service response and
account recovery decisions.

| Site          | Evidence URL                                     | Observed Pattern                                                                                 | Weight |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/contact-us/        | Customer support routes customers through contact and service categories without extra channels. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/customer-service/        | Service support groups product care, order, and customer help in supported flows.                | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/contact-us         | Contact/service pages route support through explicit topics and supported contact paths.         | 1.5    |
| Graff         | https://www.graff.com/us-en/customer-service/    | Customer service content keeps order and product help inside official support routes.            | 1.5    |
| Chopard       | https://www.chopard.com/en-us/contact-us         | Support pages present service routing without hard SLA promises in the shopping surface.         | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs?glCountry=US   | FAQ/customer service content groups order, care, after-sales, and contact recovery.              | 1.5    |
| Piaget        | https://www.piaget.com/us-en/contact-us          | Contact flows keep topic and customer help structured around supported service channels.         | 1.5    |
| Messika       | https://www.messika.com/us_en/contact            | Contact support centralizes service topics and customer assistance.                              | 1.5    |
| De Beers      | https://www.debeers.com/en-us/contact-us         | Client service keeps product/order support routed through official contact flows.                | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/contact-us | Contact support routes customers through official service help and avoids unsupported channels.  | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/contact-us         | Customer service/contact routes keep questions and product help structured.                      | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. The service form may add selected-topic routing and
  attachment review copy when it uses existing topics, existing validation, and
  existing online/offline submission behavior only.

## Implementation Decision

Implement a narrow service-form clarity pass:

- Add selected-topic routing review inside the existing service form.
- Show attachment count review after file selection.
- Keep attachment type and size constraints unchanged.
- Keep offline service request copy limited to queued submission.
- Do not add new support channels, hard response-time promises, or admin-only
  data to the public form.

## Acceptance Checks

- Selected-topic review follows the current topic select value.
- Attachment review reflects selected file count without bypassing validation.
- Account/order default topic links continue to preselect existing topics.
- Online and offline submission paths remain unchanged.

## Verification

- `pnpm test -- src/styles/service-topic-attachment-review.test.ts src/styles/service-response-contact-clarity.test.ts src/styles/service-attachment-ux.test.ts src/styles/account-recovery-shortcuts.test.ts src/styles/offline-sync-response-contract.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports routing and review copy only. New support channels,
SLA commitments, attachment storage changes, or admin assignment workflows need
separate review.

---

<a id="evidence-size-guide-save-context-return-path-benchmark"></a>

## Evidence: size-guide-save-context-return-path-benchmark

# Size Guide Save Context and Product Return Path Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-045 Size Guide Save Context and Product Return Path
- `Status`: Supported and implemented

## Scope

This benchmark covers `/size-guide`, PDP links into the size guide, saved-size
context, and route-backed return from the guide to the originating product.

## Gate Classification

- `Change Type`: Public UX and commerce-support clarity.
- `Route Context`: Size guide and product detail route.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: PDP and service support rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                               | Weight |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/services/jewelry/size-guide/rings/ | Ring sizing guidance is a support utility tied to purchase confidence rather than a standalone marketing page. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/size-guide/                              | Size guidance supports ring, bracelet, and necklace fit decisions with direct shopping context.                | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/services                           | Service content connects sizing, care, delivery, and client support as practical commerce assistance.          | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                             | Jewelry commerce guidance exposes sizing, delivery, contact, and service context near shopping decisions.      | 1.5    |
| De Beers      | https://www.debeers.com/en-us/faqs.html                          | FAQ guidance supports product-page sizing and customer-service recovery without exposing exact inventory.      | 1.5    |
| Pomellato     | https://www.pomellato.com/us_en                                  | Product support patterns include size guidance and service recovery near product selection.                    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/services                            | Service guidance includes appointment preparation, sizing support, and client-care recovery.                   | 1.5    |
| Messika       | https://www.messika.com/us_en/our-messika-services               | Service pages connect purchase support, delivery, returns, after-sales, and customer care.                     | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The size guide may clarify saved-size behavior and
  preserve a route-backed return to a product when entered from a PDP, provided
  it does not add checkout shortcuts, exact inventory, or unsupported account
  promises.

## Implementation Decision

Implement a narrow support pass:

- Add save-context copy inside the existing size guide tool.
- Preserve local-device saved-size behavior and existing account sync behavior.
- Add a safe `/product/[slug]` return context when the PDP supplied
  `returnTo`.
- Update PDP size-guide links to pass the product return context.
- Do not add checkout, appointment booking, exact stock, or provider claims.

## Acceptance Checks

- The size guide explains local save behavior before submit.
- Product-origin visits show a route-backed return action to `/product/[slug]`.
- Return URLs are constrained to product routes only.
- PDP size-guide links keep the selected size kind and product context.
- Existing saved-size validation and account sync behavior stay unchanged.

## Verification

- `pnpm test -- src/styles/size-guide-return-context.test.ts src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/product-purchase-facts-placement.test.ts`
- `pnpm lint`
- `pnpm typecheck`

## Residual Risk

This benchmark supports context and return-path clarity only. Future changes to
interactive measuring, appointment booking, checkout placement, or
inventory-aware size recommendations require a new benchmark.

---

<a id="evidence-split-checkout-ux-audit"></a>

## Evidence: split-checkout-ux-audit

# Split Checkout UX Audit

- `Date`: 2026-05-31
- `Backlog Item`: I-003 Split Checkout UX and Copy Review
- `Status`: Passed for local UX, fixture checkout coverage, and service guardrails

## Scope

This audit covers checkout behavior for local `OWN` items, Shopify dropship
items, and mixed carts. It verifies that the UI does not imply one combined
payment path and that provider-specific checkout actions remain separated.

## Findings

- Supplier-only carts now skip the local customer, delivery, gift, coupon, and
  local submit sections.
- Supplier-only carts show a dedicated message explaining that payment and
  delivery details continue in the supplier checkout.
- Mixed carts keep the local order form for `OWN` items and label the local
  submit action as store-item approval.
- Checkout source grouping is exposed through stable test IDs for own and
  Shopify dropship groups.
- The local checkout service and Shopify dropship checkout service both keep
  negative-path guards so one source cannot be submitted through the other
  provider path.

## Acceptance Checks

- `OWN` cart: local checkout progress, local delivery fields, and local submit
  action remain present.
- Shopify-only cart: supplier message, supplier summary, Shopify checkout
  action, and Shopify source group are present; local progress steps, local
  delivery fields, and local submit action are absent.
- Mixed cart: local and supplier groups remain distinct; local summary and
  supplier checkout copy avoid a fake combined payment promise.
- Missing Shopify variant mapping or a local-only cart cannot create a Shopify
  dropship checkout.
- The supplier-only E2E flow can run without a live Shopify catalog by using a
  deterministic dropship fixture product.

## Verification

- `pnpm test -- src/server/services/cart-checkout.test.ts src/server/services/shopify-dropship-checkout.test.ts src/server/services/catalog-fixtures.test.ts src/app/product/[slug]/_components/product-purchase-utils.test.ts`
- `pnpm typecheck`
- `pnpm exec prettier --check src/app/checkout/_components/cart-checkout-form.tsx src/app/product/[slug]/_components/product-purchase-panel.tsx src/server/services/catalog-fixtures.ts src/server/services/shopify-dropship-checkout.test.ts tests/e2e/critical-flows.spec.ts`
- Agent-browser dev check on `http://localhost:3100/checkout`: page loaded,
  content rendered, no Next.js error overlay detected.
- `E2E_BASE_URL=http://localhost:3100 QA_ARTIFACT_DIR=.tmp/qa-playwright-supplier node node_modules/@playwright/test/cli.js test tests/e2e/critical-flows.spec.ts --project=chromium-desktop -g "supplier-only checkout" --reporter=list --timeout=45000 --global-timeout=90000`

## Residual Risk

The paid Shopify Checkout handoff is still blocked by live Shopify supplier
configuration and paid checkout test access. This audit verifies the local UI
split and service guardrails, not a real external payment completion.

---

<a id="evidence-tiffany-plus-visual-qa-mobile-first"></a>

## Evidence: tiffany-plus-visual-qa-mobile-first

# Tiffany Plus Visual QA - Mobile First

- `Status`: Implemented
- `Date`: 2026-06-10
- `Scope`: Home, Category, Search, Product, Checkout, Wishlist, Service
- `Mobile viewport`: 390x844
- `Desktop viewport`: 1440x900

## Checks

- Pages load without a Next.js error overlay.
- Primary commerce controls are visible without horizontal overflow.
- Product cards keep image, name, material cues, decision facts, price, wishlist, and quick action stable.
- Search view controls expose one active state and keep grid/list visually distinct.
- Checkout readiness, payment confidence, legal agreement, and action area remain in order.
- Footer trust layer is present on all public pages through `RootLayout`.
- No legacy aqua/turquoise UI colors are reintroduced.

## Browser Smoke Routes

- `/`
- `/category/necklaces`
- `/search?view=list`
- `/product/selene-chain`
- `/checkout`
- `/wishlist`
- `/service`

## Evidence Target

The implementation is considered complete when static guardrails pass, `pnpm build` passes, and browser smoke confirms no overflow or incoherent overlap on the mobile viewport.

---

<a id="evidence-wave-0-owner-evidence-register"></a>

## Evidence: wave-0-owner-evidence-register

# Wave 0 Owner Evidence Register

Status: owner-assignment register, not completion evidence.

Last updated: 2026-06-19.

This register covers the Wave 0 owner-gated blockers named in
`docs/TIFFANY_SURPASS_MASTER_PLAN.md` immediate action 6:

- G-01 real Shopify supplier proof.
- G-02 paid Shopify checkout proof.
- G-03 supplier fulfillment proof.
- G-04 CardCom own-product payment proof.
- J-08 legal identity and policy review.

Do not replace `UNASSIGNED` with a person, date, or approval unless the owner
has explicitly accepted the responsibility and evidence target. Engineering can
prepare checks and runbooks, but these items require operations, supplier,
payment, and legal facts that are not present in the repository.

## Assignment Rules

Every P0 owner-gated item needs all of the following before it can leave
`OWNER` or `EXTERNAL` status:

- Directly responsible owner.
- Acceptance owner.
- Target evidence date.
- Evidence location.
- Rollback or containment owner.
- Residual-risk note.

The owner and acceptance owner should not be the same person unless the founder
explicitly accepts that concentration of responsibility.

## Current Register

| Item                                   | Required owner role                    | Direct owner | Acceptance owner | Target evidence date | Evidence location                                                                                         | Current status | Next owner action                                                                                                                       |
| -------------------------------------- | -------------------------------------- | ------------ | ---------------- | -------------------- | --------------------------------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 real Shopify supplier proof       | Operations plus merchandising          | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Outside-repo supplier/Shopify evidence, with redacted summary in this register                            | BLOCKED        | Confirm the real supplier channel, inventory source, SKUs, cancellation path, fulfillment behavior, and support escalation.             |
| G-02 paid Shopify checkout proof       | Operations plus commerce/payment owner | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Shopify order evidence, Elysia webhook/account/admin observation, and redacted release note               | BLOCKED        | Approve a low-value paid checkout canary, test identity, cleanup rule, refund/void handling, and analytics exclusion.                   |
| G-03 supplier fulfillment proof        | Operations plus customer-service owner | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Supplier order receipt, fulfillment/tracking proof, failure/cancel proof, and redacted support runbook    | BLOCKED        | Run a supplier-confirmed fulfillment path from Shopify order receipt through shipment/tracking and escalation.                          |
| G-04 CardCom own-product payment proof | Finance/payment owner plus operations  | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Provider credential confirmation, payment/decline/cancel/webhook/refund evidence, and reconciliation note | BLOCKED        | Provide production-safe CardCom credentials and approve payment canary scope for own-product checkout.                                  |
| J-08 legal identity and policy review  | Legal/privacy plus founder/brand       | UNASSIGNED   | UNASSIGNED       | UNASSIGNED           | Counsel-approved policy package, version/effective dates, and public-field approval record                | BLOCKED        | Approve legal entity details, registration number, policy versions, supplier-order terms, data retention, and footer/checkout exposure. |

## Evidence Requirements

### G-01 Real Shopify Supplier Proof

Required evidence:

- Supplier app/channel name and connection path.
- Real supplier product IDs, variant IDs, handles, SKUs, and inventory behavior.
- Price ownership and currency behavior.
- Cancellation or unavailable-product path.
- Supplier support escalation contact or process.
- Confirmation that seeded validation products are not being mistaken for live
  supplier proof.

Repository-safe summary:

- Record only redacted identifiers, command names, and pass/fail results.
- Do not commit supplier contracts, private dashboard screenshots, tokens, or
  customer data.

### G-02 Paid Shopify Checkout Proof

Required evidence:

- Approved low-value paid test order or provider-approved test mode path.
- Shopify checkout completion.
- Shopify order creation.
- Webhook mirror received once.
- Elysia account and admin order states are accurate.
- Refund, void, or cleanup instruction.
- Analytics and reporting contamination handling.

Repository-safe summary:

- Record order status and redacted order reference only.
- Do not commit payment details, full customer identity, or provider secrets.

### G-03 Supplier Fulfillment Proof

Required evidence:

- Supplier receives the Shopify-created order.
- Supplier accepts or rejects through the normal workflow.
- Shipment/tracking update path is observed.
- Failure, cancellation, or out-of-stock path is documented.
- Customer-service escalation and ownership are defined.

Repository-safe summary:

- Record fulfillment status transitions and redacted references.
- Keep supplier dashboard screenshots and customer data outside the repository.

### G-04 CardCom Own-Product Payment Proof

Required evidence:

- Production and preview credential ownership.
- Successful payment path.
- Decline path.
- Cancel or abandoned payment path.
- Timeout or provider error recovery.
- Duplicate webhook handling.
- Refund/cancel policy and reconciliation owner.

Repository-safe summary:

- Record command names, route states, and redacted transaction references.
- Do not commit terminal IDs, API names, API passwords, or payment payloads.

### J-08 Legal Identity And Policy Review

Required evidence:

- Legal entity name.
- Registration number.
- Address and customer contact details approved for public display.
- Terms, privacy, cookies, accessibility, shipping, returns, warranty, supplier
  orders, personalized goods, promotions, and data-retention review.
- Version and effective date for every public policy.
- Approval of which legal facts are exposed in footer, checkout, emails, and
  account surfaces.

Repository-safe summary:

- Commit only approved public legal text and a redacted approval record.
- Do not commit private counsel notes or internal identity documents.

## Exit Criteria

This register is complete only when every row has:

- A named direct owner.
- A named acceptance owner.
- A target evidence date.
- A repository-safe evidence summary.
- A residual-risk note.

Until then, Wave 0 remains blocked on owner/external proof even if all
repository tests pass.

---

<a id="evidence-wishlist-shortlist-decision-support-benchmark"></a>

## Evidence: wishlist-shortlist-decision-support-benchmark

# Wishlist Shortlist Decision Support Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-006 Wishlist and Shortlist Decision Support
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account`, saved wishlist review, saved product
decision cues, category continuation, sizing help, and service escalation from
saved pieces.

## Gate Classification

- `Change Type`: Account wishlist UX and public commerce decision support.
- `Route Context`: account.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Account, wishlist, PLP, PDP, and service guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                  | Weight |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/wishlist                      | Wishlist is an account-adjacent saved-selection area, with anonymous state expiring by session.   | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/account/wishlist              | Account navigation groups overview, order history, wishlist, profile, and Maison content.         | 1.5    |
| Boucheron          | https://www.boucheron.com/us/faqs/your-client-account       | Account FAQ supports saved-item lists, list creation, sharing, orders, addresses, and service.    | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/dk/en/secure/my-account.html | Account groups online orders, service tracking, Maison/contact paths, and wishlist.               | 1.5    |
| De Beers           | https://www.debeers.com/en-us/faqs.html?tabID=your-account  | Account benefits include order history, wishlist/favourites, contact details, and sharing.        | 1.5    |
| Piaget             | https://www.piaget.com/us-en/faq                            | Account FAQ links order following, wishlist review/editing, addresses, and client relations help. | 1.5    |
| Graff              | https://www.graff.com/us-en/login/                          | Login/register screen connects account access, order checking, contact help, and wishlist.        | 1.5    |
| Buccellati         | https://www.buccellati.com/en_us/wishlist                   | Wishlist login page frames saved favourites and real-time order monitoring as account benefits.   | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The account wishlist may add compact shortlist
  interpretation and next-step links when the feature remains informational,
  routes to real category/search, sizing, or service destinations, and does not
  become a checkout prompt or product-card density increase.

## Implementation Decision

Implement a narrow account-wishlist pass:

- Add saved-item cues for category concentration, material/stone direction, and
  variant or sizing review.
- Add category continuation, size-guide, and service-prefill links above the
  saved item list.
- Keep the saved item list, product links, and remove action unchanged.
- Do not add add-to-cart, checkout, urgency, price comparison, or product-card
  highlights.

## Acceptance Checks

- Wishlist decision support appears only when there are saved items.
- Support remains above the saved-item rows and does not replace item-level
  product links or remove controls.
- Links route to `/category/[slug]` or `/search`, `/size-guide`, and `/service`
  with `topic=sizing`.
- No `/checkout` link or add-to-cart action is introduced.
- Product cards and cart behavior remain unchanged.

## Verification

- `pnpm test -- src/app/account/_lib/wishlist-shortlist.test.ts src/styles/account-wishlist-decision-support.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for `/account` logged-out state.

## Residual Risk

The benchmark supports compact account-level shortlist help only. A dedicated
wishlist route, visual comparison table, item ranking, cart conversion module,
or supplier-aware availability promise still requires a separate benchmark and
provider-readiness review.
