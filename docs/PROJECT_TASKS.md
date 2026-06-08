# Project Tasks

Status: canonical task, roadmap, and implementation-tracker document.

Last consolidated: 2026-06-08.

This file replaces the previous standalone task and roadmap documents:

- `docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md`
- `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `docs/ELYSIA_BRAND_COMMERCE_UPGRADE.md`

`docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, and
`docs/ENGINEERING_CONVENTIONS.md` remain policy and benchmark references, not
active task lists.

## Task Status Rules

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

Blocked and deferred items must name the blocker and the exact unblock
condition. They must not be treated as active implementation work until the
unblock condition is met.

## Actionable Now

Deep review basis: `docs/FULL_PRODUCT_BENCHMARK.md`,
`docs/PUBLIC_CHANGE_GATE.md`, `scripts/qa-route-inventory.ts`,
`scripts/qa-site-audit.ts`, `docs/qa/*`, `src/app`, `src/components`,
`src/lib`, and `src/server`.

Completed items are intentionally removed from this active list.

No active actionable items remain in this review batch.

The previous active items were completed and removed after focused
implementation and verification for product cards, coupon messaging, guest
wishlist merge behavior, and the 2026-06-08 public design ready batch. Evidence
was recorded through:

- `pnpm test -- src/styles/product-card-overlays.test.ts src/app/api/cart/items/route.test.ts src/server/services/inventory.test.ts src/styles/public-palette.test.ts src/styles/visible-site-improvements.test.ts`
- `pnpm test -- src/server/services/coupons.test.ts src/server/services/cart.test.ts src/styles/visible-site-improvements.test.ts`
- `pnpm test -- src/app/account/actions.test.ts src/styles/guest-wishlist-saving.test.ts src/styles/account-wishlist-decision-support.test.ts`
- `pnpm typecheck`
- `pnpm qa:routes`
- `pnpm exec tsx scripts/qa-route-inventory.ts --check --all-products --out-dir artifacts/qa/2026-06-02-route-evidence-ledger`
- `pnpm check`
- `pnpm build`
- `pnpm format:check`
- `SMOKE_BASE_URL=http://localhost:3000 pnpm smoke` against fixture-backed local server
- `pnpm exec playwright test tests/e2e/critical-flows.spec.ts --project=chromium-desktop --grep "adds a product to cart and shows it in checkout"`
- `pnpm exec playwright test tests/e2e/critical-flows.spec.ts --project=chromium-desktop --grep "shows supplier-only checkout without local order fields|shows recoverable no-results and empty checkout states"`
- `pnpm exec playwright test tests/e2e/critical-flows.spec.ts --project=chromium-desktop --grep "renders empty checkout fallback without JavaScript|renders empty checkout content in the initial HTML"`
- `pnpm test -- src/styles/floating-chrome-contract.test.ts src/styles/checkout-quantity-mobile-summary.test.ts scripts/qa-site-audit.test.ts`
- `pnpm test -- src/styles/massive-design-ready-items.test.ts src/lib/public-structure-policy.test.ts src/lib/public-design-policy.test.ts src/styles/visible-site-improvements.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts src/styles/size-guide-return-context.test.ts src/styles/offline-page-install-pwa-recovery-priority.test.ts src/styles/guest-wishlist-saving.test.ts src/styles/service-response-contact-clarity.test.ts src/app/manifest.test.ts scripts/qa-site-audit.test.ts`
- `pnpm test -- src/styles/massive-design-ready-items.test.ts src/lib/accessibility-guardrails.test.ts src/lib/public-structure-policy.test.ts src/lib/public-design-policy.test.ts src/styles/visible-site-improvements.test.ts src/styles/size-guide-return-context.test.ts src/styles/offline-page-install-pwa-recovery-priority.test.ts src/app/product/[slug]/_components/product-purchase-utils.test.ts`
- `pnpm test -- src/styles/massive-design-ready-items.test.ts src/lib/accessibility-guardrails.test.ts src/lib/public-structure-policy.test.ts src/lib/public-design-policy.test.ts src/styles/visible-site-improvements.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts src/styles/size-guide-return-context.test.ts src/styles/offline-page-install-pwa-recovery-priority.test.ts src/styles/guest-wishlist-saving.test.ts src/styles/service-response-contact-clarity.test.ts src/app/manifest.test.ts scripts/qa-site-audit.test.ts src/app/product/[slug]/_components/product-purchase-utils.test.ts`
- `pnpm copy:check`
- `pnpm exec prettier --check` for the public design batch files and focused
  documentation files
- `pnpm typecheck`
- `pnpm lint`
- Mobile geometry probe for `/checkout` with clean storage; result:
  `cookieBannerPlacement=top`, `contentPaddingTop=126px`, no overlap with
  `checkout-empty-actions`, and no horizontal overflow.
- `pnpm visual:qa` equivalent focused agent-browser pass against `/checkout`
  via `http://127.0.0.1:3000` passed on desktop, tablet, and mobile.
- `agent-browser` verification against `http://127.0.0.1:3000` after a clean
  Next dev restart passed for the homepage and mobile navigation. Screenshots:
  `artifacts/qa/2026-06-08-design-batch-browser-restarted/agent-home-restarted.png`
  and
  `artifacts/qa/2026-06-08-design-batch-browser-restarted/agent-mobile-nav-open-restarted.png`.
- Focused mobile Playwright verification for the public design batch recorded
  passing selectors for search filters, gifts decision bar, category mobile
  summary, wishlist onboarding, offline split, branches compact highlights,
  and legal cookie callout in
  `artifacts/qa/2026-06-08-design-batch-browser-restarted/focused-public-design-batch-results.json`.
  Isolated retry confirmed the PDP gallery count, service triage, and size
  guide confidence strip in
  `artifacts/qa/2026-06-08-design-batch-browser-restarted/focused-public-design-isolated-results.json`.
- The same Playwright batch captured a semantic-search timeout console error
  on `/search?q=venus`; it was intentionally left unresolved and remains
  tracked as `I-309`.
- `pnpm exec tsx scripts/qa-site-audit.ts --base-url http://127.0.0.1:3000 --screenshots none --browsers chromium --viewports mobile --performance-only --warm-screenshots --out-dir artifacts/qa/2026-06-08-warm-screenshot-metadata-check`
  wrote `design-review.md` with `Screenshot warm-up: enabled`; it failed
  strict local performance budgets and remains evidence of metadata behavior,
  not a production performance pass.

`pnpm e2e` was also attempted against a local dev server and timed out after
10 minutes with broad existing environment-sensitive failures; the focused
checkout/cart e2e paths above passed.

## Candidate Improvements

Candidate items are not implementable by default. Public-facing candidates must
pass `docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before
product code is edited.

Design proposal evidence for the expanded 2026-06-08 pass:
`pnpm qa:routes`, the representative public audit in
`artifacts/qa/2026-06-08-public-design-review-representative`, the checkout
floating-chrome artifact in
`artifacts/qa/2026-06-08-checkout-floating-chrome-agent-browser`, desktop and
mobile density metrics in
`artifacts/qa/2026-06-08-massive-design-proposals-playwright`, and focused
source review of `src/app`, `src/components`, and `src/lib` public UX policy
files. A broad `agent-browser` pass was attempted for this expanded round, but
the browser harness timed out before route review; Playwright artifacts were
used as fallback evidence for proposal discovery.

### Design Changes - Ready for User Decision

The following ready items remain after the 2026-06-08 implementation batch.
Implemented items removed from this section: I-308, I-311, I-312,
I-313, I-314, I-316, I-317, I-318, I-319, I-320, I-321,
I-322, I-323, and I-324.

#### I-309 Search No-Results Recovery Without AI Quota Noise

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Actionable Now
- `Priority`: P1
- `Effort`: M
- `Target Surface`: `/search?q=zzzz-no-match&maxPrice=1`, no-results recovery
- `Finding`: The no-results route renders a usable recovery state, and normal
  search can still render product results, but expanded probes captured
  development console errors from semantic search timeout/quota paths while
  calculating search context. A premium search or recovery state should never
  depend on an AI provider being available.
- `Evidence`:
  `artifacts/qa/2026-06-08-massive-design-proposals-playwright/massive-design-proposals-metrics.json`
  recorded `status=200` with one console error for the no-results route. The
  implementation-batch browser probe also captured
  `[semantic-search:intent] TimeoutError: The operation was aborted due to timeout`
  on `/search?q=venus` in
  `artifacts/qa/2026-06-08-design-batch-browser-restarted/focused-public-design-batch-results.json`.
- `Gate Result`: Ready for user decision as a mandatory backend-correctness and
  public recovery improvement. The change should keep the same public structure
  while making the fallback deterministic.
- `Recommended Change`: Make no-results recovery count/category suggestions
  degrade to classic catalog search or cached category suggestions when the AI
  semantic path is unavailable or rate-limited.
- `Acceptance Checks`: No-results UI remains helpful, no provider quota detail
  reaches the browser console for the public route, and recovery links remain
  route-backed.
- `Verification`: Search adapter tests for AI-unavailable fallback, focused
  no-results visual QA, and `pnpm qa:routes`.
- `Next Decision`: User should choose whether to implement the fallback now or
  keep accepting provider-noise risk in local/public recovery review.

#### I-310 Home First-Commerce Peek Under the Cinematic Hero

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Actionable Now
- `Priority`: P1
- `Effort`: M
- `Target Surface`: Mobile homepage first viewport and immediate post-hero
  entry
- `Finding`: The homepage is cinematic and brand-led, but mobile evidence shows
  the first viewport contains no product/category link. The mobile metrics
  recorded `scrollRatio=14.16`, `productLinkCount=4`, and
  `productLinksFirstViewport=0` for `/`.
- `Evidence`:
  `artifacts/qa/2026-06-08-massive-design-proposals-playwright/massive-design-proposals-mobile-metrics.json`
  and
  `artifacts/qa/2026-06-08-public-design-review-representative/screenshots/chromium-mobile-r1.png`.
- `Gate Result`: Ready for user decision. `homeBrandHeroThenCommerceEntry` is
  allowed with score `25`; this proposal makes the existing required commerce
  entry more visible without replacing the editorial hero.
- `Recommended Change`: Adjust mobile hero height/spacing so the trust strip or
  first category/product entry peeks into the initial scroll, while preserving
  the cinematic image/video as the homepage lead.
- `Acceptance Checks`: H1 remains first, the hero stays product/brand led, and
  a route-backed collection/search entry is visible or clearly hinted before
  the first scroll feels complete.
- `Verification`: Mobile visual QA for `/`, layout stability tests, and a
  first-viewport probe that records category/product entry visibility.
- `Next Decision`: User should choose whether to make the home first viewport
  more commercial or keep the current pure cinematic opening.

#### I-315 PDP Purchase Confidence Summary Reorder

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Actionable Now
- `Priority`: P1
- `Effort`: M
- `Target Surface`: `/product/[slug]` purchase panel and post-purchase facts
- `Finding`: The PDP is information-rich, but mobile evidence shows a very
  long product detail journey. The mobile metrics for
  `/product/venus-line-ring` recorded `scrollRatio=14.47`,
  `firstViewportInteractiveCount=12`, and `productLinkCount=9`.
- `Evidence`:
  `artifacts/qa/2026-06-08-massive-design-proposals-playwright/massive-design-proposals-mobile-metrics.json`
  and
  `artifacts/qa/2026-06-08-public-design-review-representative/screenshots/chromium-mobile-r1--product-venus-line-ring.png`.
- `Gate Result`: Ready for user decision. `pdpGalleryPurchaseFirst` is allowed
  with score `31`, and `trustNearPurchase` is allowed with score `24`; this
  proposal keeps product facts near purchase and reduces repetition after the
  buy panel.
- `Recommended Change`: Consolidate delivery, returns, warranty, service, gift,
  and care into one premium "before you order" summary immediately after the
  purchase controls, with deeper details still available below.
- `Acceptance Checks`: Gallery, title, price, availability, and add-to-cart
  remain first. Service, returns, warranty, sizing, and gift context remain
  visible before recommendation rails.
- `Verification`: PDP visual QA, product purchase panel tests, and mobile
  scroll review.
- `Next Decision`: User should choose whether to prioritize concise purchase
  confidence over the current full-detail sequencing.

### Design Changes - Needs Benchmark

#### I-302 Mobile PDP and Product-Rail Density Benchmark

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Target Surface`: Mobile `/product/[slug]`, mobile homepage product rails,
  and mobile search/product recommendation rails
- `Finding`: Full-page mobile review shows very long product-card sequences
  after the primary task, especially on PDP and search surfaces. After a real
  scroll pass, media loads correctly, so this is not confirmed as broken image
  behavior. The design question is whether secondary product rails should be
  compacted so purchase facts, service context, and footer content do not feel
  buried under repeated cards.
- `Evidence`: Representative audit:
  `artifacts/qa/2026-06-08-public-design-review-representative/site-audit.md`.
  Mobile PDP screenshot:
  `artifacts/qa/2026-06-08-public-design-review-representative/screenshots/chromium-mobile-r1--product-venus-line-ring.png`.
  Scroll-warmed PDP screenshot:
  `artifacts/qa/2026-06-08-public-design-review-representative/mobile-pdp-after-scroll.png`.
  The scroll-warmed probe found no completed broken images, confirming the
  remaining issue is density and sequencing, not asset failure.
- `Gate Result`: Not implementation-ready. `relatedProducts` are currently
  allowed by the public design policy with score `24`, but changing rail count,
  progressive reveal, or mobile hierarchy affects public content density and
  must be scored against the High Jewelry Reference Gate before product code is
  edited.
- `Recommended Change`: Benchmark a compact mobile secondary-rail pattern:
  keep related products after purchase context, cap visible mobile cards per
  rail, collapse lower-priority rails behind a restrained reveal, or merge
  duplicate recommendation reasons into fewer sections.
- `Acceptance Checks`: PDP first screen still leads with gallery, product
  facts, availability, and purchase action. Related products remain after
  purchase context. Mobile scroll length and repeated card density are reduced
  without hiding service, return, warranty, or sizing context.
- `Verification`: Record High Jewelry Gate evidence and score before
  implementation. If approved later, run focused PDP/product-card tests,
  mobile visual QA for `/product/venus-line-ring`, and browser scroll checks
  that ensure lazy media loads before screenshots are used as design evidence.
- `Next Decision`: User should choose whether to commission/approve the
  benchmark pass, reject the idea, or defer it.

#### I-325 Full Homepage Hero Recomposition

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P1
- `Effort`: L
- `Target Surface`: `/` first viewport and hero-to-commerce sequencing
- `Finding`: A stronger, bolder homepage could move beyond the current
  cinematic hero by introducing campaign tiles, a collection teaser, or a
  product-led editorial composition in the first viewport. That would be a
  noticeable brand change, not a minor polish item.
- `Evidence`: Mobile metrics for `/` recorded `scrollRatio=14.16` and
  `productLinksFirstViewport=0`; current hero implementation is in
  `src/app/page.tsx`.
- `Gate Result`: Not implementation-ready. The existing policy allows one
  editorial hero, but a full first-viewport redesign must be scored against the
  High Jewelry Reference Gate before code is edited.
- `Recommended Change`: Benchmark two or three home hero compositions:
  current cinematic hero with commerce peek, split editorial campaign with
  category teaser, and product-first seasonal launch module.
- `Acceptance Checks`: Home remains brand-led, restrained, route-backed, and
  immediately commercial without becoming a marketing-only landing page.
- `Verification`: High Jewelry Gate record, home visual QA, layout stability,
  performance/LCP review, and reduced-motion review.
- `Next Decision`: User should choose whether to commission a homepage hero
  benchmark.

#### I-326 Mobile PLP Product Card Density Redesign

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P1
- `Effort`: M
- `Target Surface`: Mobile search, gifts, and category product grids
- `Finding`: A bolder mobile PLP design could use a denser card, altered image
  ratio, partial two-up layout, or progressive disclosure to reduce long scroll
  fatigue. This would materially change catalog rhythm and product-card visual
  hierarchy.
- `Evidence`: Mobile metrics recorded `scrollRatio=18.61` for
  `/search?q=venus`, `scrollRatio=7.53` for category routes, and a long gift
  grid in representative screenshots.
- `Gate Result`: Not implementation-ready. Product cards are allowed, but
  changing ratio, column count, or mobile content density requires High Jewelry
  and commerce-corpus scoring.
- `Recommended Change`: Benchmark compact card variants against luxury PLP
  references before editing `ProductCard` or grid breakpoints.
- `Acceptance Checks`: Product image, name, material, price, availability,
  wishlist, and supported cart action remain clear; mobile scroll length is
  reduced without making the page feel like a discount grid.
- `Verification`: Benchmark record, product-card visual tests, search/category
  visual QA, and mobile screenshot warm-up.
- `Next Decision`: User should choose whether to benchmark a denser mobile PLP
  card system.

#### I-327 PDP Sticky Purchase Bar Redesign

- `Aspect`: Commerce and Checkout
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P1
- `Effort`: M
- `Target Surface`: Mobile `/product/[slug]`
- `Finding`: A sticky purchase bar could make long PDPs easier to buy from,
  especially after users scroll into specifications and recommendations. It
  would also add another floating commerce control to a page that already has
  cookie/accessibility chrome and gallery controls.
- `Evidence`: Mobile PDP metrics recorded `scrollRatio=14.47`; existing public
  policy requires floating chrome not to cover commerce controls.
- `Gate Result`: Not implementation-ready. Sticky purchase controls are a
  public commerce-control change and need High Jewelry/commercial benchmark
  evidence plus collision review.
- `Recommended Change`: Benchmark whether mobile PDP should get a sticky
  price/add-to-cart summary after the purchase panel leaves the viewport, and
  define collision rules before implementation.
- `Acceptance Checks`: Sticky bar never covers gallery, variant controls,
  service links, cookie controls, or accessibility controls; reduced-motion and
  keyboard focus remain safe.
- `Verification`: Benchmark record, floating chrome tests, PDP e2e add-to-cart
  tests, and mobile visual QA.
- `Next Decision`: User should choose whether to benchmark a sticky PDP
  purchase bar.

#### I-328 Product Story Module Before Recommendation Rails

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Target Surface`: PDP post-purchase content
- `Finding`: The PDP could gain a more editorial "why this piece" or
  styling-story module before recommendation rails. This may improve brand
  impression but could also delay related products and service details.
- `Evidence`: Current PDP source includes product description, service rows,
  FAQ, recommendation rails, and recently viewed in
  `src/app/product/[slug]/page.tsx`.
- `Gate Result`: Not implementation-ready. Editorial PDP content density and
  placement must be scored against the High Jewelry Reference Gate.
- `Recommended Change`: Benchmark a single concise product-story module that
  appears after purchase confidence and before recommendation rails.
- `Acceptance Checks`: Product facts and purchase controls remain first;
  service/warranty/returns are not buried; recommendation rails stay secondary.
- `Verification`: Benchmark record and PDP mobile/desktop visual QA.
- `Next Decision`: User should choose whether to benchmark a richer PDP story
  layer.

#### I-329 Checkout Visual Recomposition Benchmark

- `Aspect`: Commerce and Checkout
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P1
- `Effort`: L
- `Target Surface`: `/checkout`, cart summary, and form hierarchy
- `Finding`: Checkout could become more boutique and more decisive through a
  stronger two-zone layout, clearer order summary, and calmer reassurance
  language. Because payment and order state are involved, visual ambition must
  be weighed against correctness and clarity.
- `Evidence`: Checkout floating chrome was fixed in the previous pass; empty
  checkout mobile metrics now show no overflow and no overlap, but only empty
  checkout was reviewed in detail.
- `Gate Result`: Not implementation-ready. Checkout recomposition needs
  commerce benchmark evidence and focused e2e coverage before code edits.
- `Recommended Change`: Benchmark a checkout layout pass that preserves
  payment correctness, validation, mixed-cart grouping, and provider-specific
  checkout boundaries.
- `Acceptance Checks`: Cart state, form validation, payment state, submit
  progress, source-specific checkout actions, and recovery are more legible
  without inventing a single fake checkout for mixed carts.
- `Verification`: Benchmark record, checkout/cart e2e, visual QA with empty and
  populated carts, and provider boundary tests.
- `Next Decision`: User should choose whether checkout deserves a full design
  benchmark next.

#### I-330 Legal Pages Editorial Styling Benchmark

- `Aspect`: Accessibility, Privacy, and Security
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Target Surface`: `/privacy`, `/terms`, `/shipping-returns`, `/warranty`,
  `/accessibility`, `/jewellery-care`
- `Finding`: Legal and care pages are readable but plain. A more editorial
  legal/content treatment could improve brand impression, but legal pages must
  stay compact, accessible, and unambiguous.
- `Evidence`: Mobile metrics show legal pages are moderate to long, including
  `/privacy` at `scrollRatio=9.16` and `/shipping-returns` at
  `scrollRatio=7.44`.
- `Gate Result`: Not implementation-ready. The policy allows compact readable
  legal content; an editorial visual treatment needs benchmark and legal
  readability review.
- `Recommended Change`: Benchmark subtle content-page enhancements such as
  section summaries, a restrained inline table of contents, and service
  recovery links without hero-like marketing.
- `Acceptance Checks`: Legal meaning, keyboard navigation, print readability,
  cookie access, and contact/recovery links remain clear.
- `Verification`: Benchmark record, accessibility guardrails, legal route
  tests, and print/readability review.
- `Next Decision`: User should choose whether legal/content styling should be
  benchmarked.

#### I-331 AI/Stylist Concierge Promotion Exception Review

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Needs Benchmark
- `Priority`: P2
- `Effort`: M
- `Target Surface`: `/ai`, `/stylist`, mobile nav, and public service entry
- `Finding`: A brave alternative would promote AI/stylist as a concierge
  experience. That conflicts with the current policy direction that AI remains
  demoted and out of primary commerce navigation.
- `Evidence`: `src/lib/public-design-policy.ts` scores `aiStylistPrimary` as
  `remove` with score `1` and `aiStylistServiceEntry` as `demote` with score
  `7`; Playwright probes also timed out on `/ai` and `/stylist` in this
  expanded pass.
- `Gate Result`: Not implementation-ready. Promotion is currently unsupported
  and would require High Jewelry evidence or an explicit user-approved
  exception.
- `Recommended Change`: If the user wants AI to become a visible concierge
  pillar, first benchmark that decision and define fallback/loading standards.
- `Acceptance Checks`: AI never blocks core catalog, PDP, checkout, or service
  tasks; provider failures degrade to route-backed service/search recovery.
- `Verification`: Benchmark or exception record, AI fallback tests, route
  performance checks, and visual QA.
- `Next Decision`: User should choose whether to reject AI promotion, benchmark
  it, or approve an explicit exception.

## Blocked / Deferred

### Design Changes - Blocked or Exception Required

#### I-304 Supplier PDP Visual Review Blocked by Local 404

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P1
- `Effort`: S
- `Target Surface`: `/product/elysia-supplier-silver-halo-ring`
- `Finding`: The representative public visual audit cannot review the supplier
  PDP because the local route returns `404` in desktop, tablet, and mobile,
  even though the route inventory includes it as a visual route.
- `Evidence`: `artifacts/qa/2026-06-08-public-design-review-representative/site-audit.md`
  reports one console error and one same-origin request failure for
  `/product/elysia-supplier-silver-halo-ring` on all three viewports. The route
  appears in
  `artifacts/qa/2026-06-08-public-design-review-representative/route-inventory.md`
  as `catalog-fixture-sample`.
- `Gate Result`: Blocked before design judgment. PDP hierarchy changes cannot
  be evaluated for the supplier product until the route renders locally or the
  route is explicitly removed from the public design-review route set.
- `Blocker`: Local fixture, database, or route-inventory state does not expose
  the supplier PDP at the configured slug.
- `Unblock Condition`: `/product/elysia-supplier-silver-halo-ring` returns a
  browser-visible product page in local visual QA, or the review route set is
  updated to use a supplier PDP slug that renders reliably.
- `Next Decision`: User should choose whether to unblock supplier PDP evidence
  before approving any supplier-product design changes.

#### I-305 Recovery-State Visual Review Blocked by Expected 404 Semantics

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P2
- `Effort`: S
- `Target Surface`: `/category/not-a-real-category`, public not-found and
  recovery-state review
- `Finding`: The recovery route is useful for design review, but the current
  visual audit treats the intentional `404` response as a failed same-origin
  request and console error. This prevents the not-found/recovery state from
  having a clean design baseline.
- `Evidence`: `artifacts/qa/2026-06-08-public-design-review-representative/site-audit.md`
  reports the same `404` failure for `/category/not-a-real-category` on
  desktop, tablet, and mobile. Route inventory identifies it as
  `source: recovery-state`.
- `Gate Result`: Blocked before public design approval. The issue is not
  whether a recovery page should exist; it is that the QA tool currently cannot
  distinguish an intentional recovery status from an accidental route failure.
- `Blocker`: Visual QA lacks route-status-aware handling for expected public
  recovery responses.
- `Unblock Condition`: The recovery route either receives an expected-status
  allowance in the visual audit or is reviewed through a separate not-found
  design check that records the `404` as intentional.
- `Next Decision`: User should choose whether to fix the review harness before
  approving recovery-state design changes.

#### I-306 Authenticated Account Design Review Blocked by Missing Customer E2E State

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Target Surface`: Authenticated `/account` and `/account/orders/[id]`
  customer states
- `Finding`: The public review covered anonymous `/account` rendering, but it
  did not verify the authenticated dashboard, customer profile, saved sizes,
  privacy export shortcut, or real order detail visual states.
- `Evidence`: No `E2E_*` customer credentials or reusable customer auth state
  were present in the environment. Route inventory marks
  `/account/orders/fixture-order` as auth-required, so the browser-visible pass
  is not proof of the authenticated customer screen.
- `Gate Result`: Blocked by missing test state. Account dashboard visual
  changes should not be approved from anonymous or redirected route evidence.
- `Blocker`: No repeatable customer login/auth fixture exists for this design
  review pass.
- `Unblock Condition`: Provide a reusable customer E2E auth state, fixture
  account, or approved mocked authenticated account route for visual QA.
- `Next Decision`: User should choose whether authenticated account design
  review is required before the next implementation batch.

#### I-307 All-Products Cross-Viewport Design Review Blocked by Runtime Budget

- `Aspect`: QA, Release, and Observability
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P2
- `Effort`: S
- `Target Surface`: All-products public visual QA across desktop, tablet, and
  mobile
- `Finding`: The requested all-products visual audit started and produced many
  desktop product screenshots, but did not complete all viewports inside the
  15-minute command budget. The representative public route audit did complete
  and produced a full `site-audit.md`.
- `Evidence`: Attempted command:
  `pnpm exec tsx scripts/qa-site-audit.ts --base-url http://localhost:3000 --screenshots all --browsers chromium --viewports "desktop,tablet,mobile" --all-products --out-dir artifacts/qa/2026-06-08-public-design-review`.
  Partial artifact directory:
  `artifacts/qa/2026-06-08-public-design-review`. Completed representative
  artifact directory:
  `artifacts/qa/2026-06-08-public-design-review-representative`.
- `Gate Result`: Blocked by QA runtime, not by High Jewelry evidence.
- `Blocker`: A single all-products, all-viewports, screenshot-all run is too
  long for the current local command budget.
- `Unblock Condition`: Split all-products visual review by viewport, product
  category, or route shard, or increase the allowed QA runtime for this
  artifact.
- `Next Decision`: User should choose whether full all-products visual evidence
  is required before approving broad catalog design changes.

#### I-332 Product Media Diversity Blocked by Asset Coverage

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P1
- `Effort`: L
- `Target Surface`: Homepage category tiles, search/gifts/category grids, PDP
  galleries, and recommendation rails
- `Finding`: The strongest visual improvement would be better product-specific
  photography: distinct primary product shots, hover/angle shots, scale-on-body
  images, and fewer repeated lifestyle placeholders. The current screenshots
  show repeated imagery across long product grids, which lowers boutique
  distinctiveness even when layout is technically stable.
- `Evidence`: Representative mobile screenshots for `/search?q=venus`,
  `/gifts`, and `/product/venus-line-ring` show repeated product media
  patterns. `ProductCard` also supports a secondary hover image, but many
  fixture/seed products appear to share the same visual sources.
- `Gate Result`: Blocked before implementation. Layout can be improved now,
  but the high-impact media upgrade requires real or approved generated product
  assets mapped to actual products.
- `Blocker`: No approved product-specific media set exists for the expanded
  catalog and supplier products.
- `Unblock Condition`: Provide approved product photography/generated assets,
  source mapping, alt/caption policy, and replacement priorities for at least
  the top catalog routes.
- `Next Decision`: User should choose whether to commission a product media
  asset pass before broad PLP/PDP visual redesign.

#### I-333 Verified Product Specification Data Blocked by Supplier Facts

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P1
- `Effort`: M
- `Target Surface`: PDP specification blocks and legal/product confidence copy
- `Finding`: PDP design can be made more premium, but several specification
  rows still depend on verified product facts such as country of manufacture,
  manufacturer/importer, coating, measurements, and material specificity. A
  prettier spec table cannot compensate for uncertain facts.
- `Evidence`: `src/app/product/[slug]/page.tsx` still contains TODO-backed
  fallback rows for country of manufacture and manufacturer/importer, and uses
  `legalPlaceholder` when product data is missing.
- `Gate Result`: Blocked by product data. Legal/product correctness outranks
  visual polish.
- `Blocker`: Verified manufacturer/importer, origin, coating, measurement, and
  supplier fact data are incomplete for public PDP presentation.
- `Unblock Condition`: Product data source provides verified values or an
  approved public fallback policy for every legally sensitive PDP row.
- `Next Decision`: User should choose whether to prioritize data completion
  before approving spec-table redesign.

#### I-334 Supplier-Product Merchandising Blocked by Supplier PDP Route

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P1
- `Effort`: M
- `Target Surface`: Supplier PDPs, supplier product cards, dropship trust copy
- `Finding`: Supplier products likely need distinct merchandising and trust
  language, but the local supplier PDP used by route inventory still returns
  `404`, so supplier-specific design cannot be judged from browser evidence.
- `Evidence`: Same representative audit evidence as `I-304`; the route
  `/product/elysia-supplier-silver-halo-ring` fails across desktop, tablet,
  and mobile.
- `Gate Result`: Blocked before design judgment.
- `Blocker`: Supplier PDP route evidence is unavailable locally.
- `Unblock Condition`: A reliable supplier product route renders locally, or
  the visual route inventory is updated to a supplier slug that renders.
- `Next Decision`: User should choose whether supplier merchandising should
  wait for the supplier PDP unblock.

#### I-335 AI/Stylist Reliability Review Blocked by Provider Quota and Harness Timeouts

- `Aspect`: Performance, PWA, and Reliability
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P1
- `Effort`: M
- `Target Surface`: `/ai`, `/stylist`, semantic search, AI fallback recovery
- `Finding`: AI and stylist routes can be improved visually, but this expanded
  pass produced provider quota noise on search recovery and timeout behavior on
  direct AI/stylist probes. A visual redesign would be premature until the
  fallback and loading contract is reliable.
- `Evidence`:
  `artifacts/qa/2026-06-08-massive-design-proposals-playwright/massive-design-proposals-metrics.json`
  records semantic-search quota console noise and timeouts on `/ai` and
  `/stylist` during the expanded pass.
- `Gate Result`: Blocked for broad AI design changes. Narrow fallback work such
  as `I-309` may proceed separately because it reduces public recovery risk.
- `Blocker`: AI provider quota and route load timing are not stable enough for
  a confident design baseline.
- `Unblock Condition`: AI routes have deterministic loading/fallback behavior
  under missing quota, and a browser QA pass can load `/ai` and `/stylist`
  repeatably.
- `Next Decision`: User should choose whether to fix AI reliability before any
  AI visual expansion.

#### I-336 Physical Branch Experience Blocked by No Active Branches

- `Aspect`: Public UX and Brand
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Target Surface`: `/branches` physical-branch state
- `Finding`: A full boutique location page with branch cards, appointment
  routing, hours, service tags, and map presentation cannot be validated while
  physical branches are disabled.
- `Evidence`: `src/app/branches/page.tsx` renders an online-only state unless
  `physicalBranchesEnabled` is true and branch data exists.
- `Gate Result`: Blocked by missing operational state.
- `Blocker`: No enabled physical branch data is available for public review.
- `Unblock Condition`: Branch data, hours, service offerings, contact details,
  and location policy are available in a repeatable local/preview state.
- `Next Decision`: User should choose whether to keep branches as online-only
  polish or wait for real physical branch requirements.

#### I-337 Populated Checkout Visual Review Blocked by Cart Fixture State

- `Aspect`: Commerce and Checkout
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P1
- `Effort`: M
- `Target Surface`: `/checkout` with own-product, supplier-product, and mixed
  cart states
- `Finding`: Empty checkout is now visually verified after the floating chrome
  fix, but a bolder checkout design cannot be approved without populated cart
  states, including local, Shopify supplier-only, and mixed-cart flows.
- `Evidence`: Previous verification covered empty checkout geometry and
  focused `/checkout` visual QA. Existing Shopify roadmap notes require source
  groups to stay distinct and not combine mixed carts into one fake order.
- `Gate Result`: Blocked for broad checkout redesign. Empty-state polish can be
  reviewed separately, but populated checkout hierarchy needs fixture evidence.
- `Blocker`: No current visual artifact set covers populated local,
  supplier-only, and mixed-cart checkout states.
- `Unblock Condition`: Provide repeatable cart fixtures or e2e setup that
  opens checkout in all three source states.
- `Next Decision`: User should choose whether populated checkout fixture work
  is required before checkout redesign.

#### I-338 Expanded Agent-Browser Visual QA Blocked by Harness Instability

- `Aspect`: QA, Release, and Observability
- `Category`: Design Changes
- `Status`: Blocked
- `Priority`: P2
- `Effort`: S
- `Target Surface`: Public visual QA evidence collection
- `Finding`: The expanded proposal pass attempted a broad `agent-browser`
  route review, but the harness timed out before reliable route evidence could
  be collected. Playwright fallback evidence was sufficient for proposal
  discovery, but not for a full approval-grade visual QA run.
- `Evidence`: The attempted command against
  `artifacts/qa/2026-06-08-massive-design-proposals-agent-browser` failed
  during initial browser open/repair, while Playwright fallback artifacts were
  written under
  `artifacts/qa/2026-06-08-massive-design-proposals-playwright`.
- `Gate Result`: Blocked by QA harness reliability, not by product design.
- `Blocker`: `agent-browser` did not complete the expanded route pass in this
  environment.
- `Unblock Condition`: Repair agent-browser session startup or use a
  maintained Playwright visual QA script that provides equivalent screenshots,
  console, network, and geometry evidence.
- `Next Decision`: User should choose whether approval-grade visual evidence
  must use agent-browser specifically or may use Playwright fallback.

### I-011 Real Shopify Supplier Connection

- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
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

- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
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

- `Aspect`: Admin and Operations
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
- `Target Surface`: Supplier fulfillment workflow, Shopify order handoff,
  support operations
- `Improvement`: Blocker: supplier fulfillment behavior has not been confirmed
  for Shopify-created orders. Unblock condition: the supplier receives and can
  fulfill a Shopify-created test order through its normal integration.
- `Acceptance Checks`: Supplier receipt, fulfillment status, cancellation or
  failure path, and customer support handoff are documented.
- `Verification`: Confirm in Shopify Admin and supplier tooling; record
  operational evidence in this file or a linked release note.

### I-014 CardCom Production Credentials

- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
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

- `Aspect`: Backend, API, and Data
- `Status`: Deferred
- `Priority`: P2
- `Effort`: M
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

- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
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

- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
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

## Shopify Dropship Status

Implemented in the repository:

- Product source split for `OWN` and `DROPSHIP_SHOPIFY`.
- Optional Shopify configuration and safe disabled defaults.
- Shopify API adapter for catalog reads, Client Credentials admin tokens, and
  Storefront cart checkout creation.
- Dry-run/write catalog sync command guarded by
  `SHOPIFY_DROPSHIP_SYNC_ENABLED`.
- Mixed-cart grouping with separate local and Shopify checkout paths.
- Shopify order webhook signature verification and read-only order mirror.
- Account privacy export, account order visibility, and admin mirror visibility.

Still external/manual:

- Real supplier app/channel connection inside Shopify.
- End-to-end paid test order through Shopify Checkout and the supplier
  fulfillment workflow.
- CardCom account credentials for local `OWN` product online payment.
- SMS provider credentials, if SMS delivery is required later.

Current execution status, checked on May 31, 2026:

- Local code verification passed with `pnpm verify:fast`.
- Release verification passed with `pnpm gate:coherence` and
  `pnpm gate:ship`; production smoke on `https://elysia-jewellery.com` passed.
- Shopify Admin API credentials are valid for
  `elysia-dropship.myshopify.com`.
- The Shopify Dev Dashboard app is CLI-linked through `shopify.app.toml`.
- Required Shopify scopes are approved:
  `read_products`, `write_products`, `read_orders`, `read_publications`,
  `write_publications`, `unauthenticated_read_product_listings`, and
  `unauthenticated_write_checkouts`.
- Storefront access token creation completed and the token is set locally and in
  Vercel Production/Preview.
- Shopify order webhook registration completed for
  `https://elysia-jewellery.com/api/webhooks/shopify/orders`.
- Four active Shopify supplier seed products were created, priced, published to
  the Online Store publication, and imported into the local database as
  `DROPSHIP_SHOPIFY`.
- `pnpm shopify:dropship:doctor -- --first 5 --register-orders-webhook --site-url https://elysia-jewellery.com`
  reports `localReady`, `catalogReady`, `checkoutReady`, `webhookReady`, and
  `rolloutReady` as `true`.
- Shopify Dashboard UI automation is blocked by Shopify login/Cloudflare
  verification in the agent browser.
- Production database work is complete with Neon. Vercel Production and the
  current Preview branch have usable `DATABASE_URL`, Prisma migrations are
  applied, and 4 Shopify dropship products are present.
- Vercel Production is enabled for Shopify dropship checkout:
  `SHOPIFY_DROPSHIP_ENABLED=true`. Catalog write sync remains disabled with
  `SHOPIFY_DROPSHIP_SYNC_ENABLED=false`.
- `SITE_URL` is configured in Vercel as `https://elysia-jewellery.com`.
- Full provider readiness is still blocked by missing provider env values
  outside Shopify: `CARD_COM_TERMINAL`, `CARD_COM_API_NAME`,
  `CARD_COM_API_PASSWORD`, and `SMS_PROVIDER_API_KEY`.
- `STORE_FROM_EMAIL`, `STORE_FROM_NAME`, `OPERATIONS_EMAIL`,
  `JOB_RUNNER_SECRET`, `CRON_SECRET`, and `CARD_COM_WEBHOOK_SECRET` are set in
  Vercel Production and Preview.
- Production env includes usable Typesense, Brevo, Google AI, Neon
  `DATABASE_URL`, and Upstash REST Redis values.
- Dropship production rollout has been enabled after explicit approval. The
  remaining live-order blocker is a real paid Shopify checkout test and
  supplier fulfillment confirmation.
- CardCom account setup is deferred. Shopify dropship checkout remains
  independent of CardCom.
- SMS provider setup is deferred. Email and admin flows can still operate where
  configured.

Operational helper:

- Run `pnpm shopify:dropship:doctor -- --first 5` for a redacted setup
  diagnosis.
- Add `--register-orders-webhook --site-url https://elysia-jewellery.com` when
  verifying webhook and rollout readiness.
- Run `pnpm shopify:dropship:sync -- --first 10` for a dry-run against the
  Storefront API. Set `SHOPIFY_DROPSHIP_SYNC_ENABLED=true` for the command
  process and add `--write` only when the dry-run lists the expected products.
- Run `pnpm vercel:env:upsert -- --target production` for a dry-run of Vercel
  env values that would be synced from local env files. Add `--write` only
  after the dry-run shows correct non-empty values.

Shopify roadmap tasks:

- Phase 0, prerequisites and manual Shopify setup: mostly complete, except the
  real supplier connection and supplier fulfillment proof remain blocked.
- Phase 1, product source split and safe feature flags: complete for current
  repository behavior. Existing products remain `OWN`, Shopify is optional, and
  local development does not require Shopify unless the feature is enabled.
- Phase 2, Shopify catalog sync or import: complete for the seeded validation
  products. Catalog write sync remains guarded by
  `SHOPIFY_DROPSHIP_SYNC_ENABLED`.
- Phase 3, cart grouping and mixed-cart checkout UX: complete for local,
  supplier-only, and mixed carts. Mixed carts stay split instead of pretending
  there is one combined payment.
- Phase 4, Shopify checkout creation and redirect: complete for dropship line
  items with server-generated Shopify checkout URLs. Real paid checkout remains
  externally blocked.
- Phase 5, Shopify order webhook mirror: implemented as a read-only mirror for
  account, service, admin, and support visibility.
- Phase 6, account and admin order visibility: implemented so local orders and
  Shopify mirror orders are distinguishable.
- Phase 7, hardening, QA, rollout, and monitoring: repository rollout is
  enabled and verified; live supplier and payment proof remain outside the
  repository.
- Phase 8, optional future direct payment without Shopify Checkout: deferred.
  Do not start without explicit approval, supplier proof, payment/tax ownership,
  and accepted operational risk.

Future interface summary:

- Product source remains `OWN | DROPSHIP_SHOPIFY`.
- Shopify mapping exists only for `DROPSHIP_SHOPIFY` products and variants.
- Cart summaries expose source groups.
- Checkout actions are source-specific.
- Shopify checkout creation returns only a server-generated `checkoutUrl`.
- Shopify order mirror records are read-oriented support/account/admin records,
  not local payment or inventory records.

Release note pattern:

- Actionable release tasks: list repository changes that can be implemented,
  tested, deployed, or rolled back by the current release owner.
- Verification evidence: list the local commands, production smoke commands,
  deployment URL, deployment ID, production alias, and clean error-log window.
- Deferred supplier blockers: list supplier app connection, paid Shopify test
  checkout, and supplier fulfillment confirmation separately from repository
  implementation debt.
- Deferred payment blockers: list CardCom terminal, API name, and API password
  separately from Shopify dropship checkout readiness.
- Deferred SMS blockers: list SMS provider credentials and delivery testing
  separately from email, admin, and Shopify order mirror readiness.
- Dashboard-access blockers: list Shopify dashboard or provider-dashboard
  login/verification blockers separately from API-level readiness when CLI or
  API checks already passed.
- Residual risk: state what has not been proven by the release, without turning
  blocked provider work into an actionable code task.

Manual setup checklist:

- [x] Shopify store exists.
- [ ] Real supplier is connected to Shopify.
- [x] Dev Dashboard app has Client ID and Client secret configured.
- [x] Storefront unauthenticated scope exists for Shopify Checkout.
- [x] Required webhook topics are selected.
- [x] Webhook signing secret is available.
- [x] Supplier product IDs, variant IDs, handles, and SKUs are confirmed for the
      seeded Shopify validation products.
- [x] Preview test product can create a Shopify checkout URL.
- [ ] Real supplier fulfillment behavior is confirmed with the supplier
      integration.
- [ ] Test product can complete paid Shopify Checkout.
- [ ] Supplier receives a Shopify-created test order through the normal
      integration.
- [ ] CardCom credentials are available for production local checkout.
- [ ] SMS provider credentials are available, if SMS is re-enabled.

Do not implement without explicit approval:

- Replacing local checkout with Shopify for `OWN` products.
- Removing CardCom or local payment support.
- Making Shopify required for local development or unrelated builds.
- Combining mixed carts into one fake total or one fake order.
- Processing Shopify product payments directly in Elysia.
- Writing local inventory ledgers for Shopify-owned inventory.
- Treating Shopify mirror orders as local orders that can be fulfilled,
  captured, refunded, or adjusted by existing local workflows.

## Brand Commerce Checklist

Brand commerce roadmap:

- Homepage should lead with a cinematic product/brand signal, clear H1, brand
  promise, direct collection entry, trust strip, category discovery, new or
  recommended products, materials/service, boutique story, and commerce CTA.
- Public copy should move from operational text toward material, light, body,
  gift, season, confidence, and styling context.
- Product pages should feel premium and useful without delaying the purchase
  task.
- Category pages should be search-aware, filterable, image-led where useful,
  and easy to scan.
- SEO should include Hebrew search intent for jewelry, rings, necklaces,
  earrings, bracelets, silver jewelry, gold plating, pearls, gifts for women,
  and delicate jewelry.

Standing direction:

- Keep the public experience quiet-luxury: ivory, ink, soft gold, delicate
  borders, large product photography, generous spacing, calm typography, and
  minimal noise.
- Public copy should speak about season, light, material, gift context, skin
  tone, metal tone, sizing, confidence before purchase, and styling use.
- Avoid generic, operational, or template-like copy on public pages.
- Navigation should stay short, commercial, and scannable: all jewelry, new,
  rings, necklaces, earrings, bracelets, gifts, favorites, size guide, about,
  and service.
- Product pages should expose gallery, name, short description, price,
  availability, material, stone, collection, delivery, returns, warranty, gift
  note, service contact, pre-order questions, and related items.
- Category pages should open with a focused H1, seasonal/material description,
  brand image when appropriate, trust strip, useful filters, breathable grid,
  and a styling or care cue.
- Trust details should appear before checkout: secure payment, shipping,
  returns, human service, gift packaging, and size guidance.

Implementation checklist:

- Keep `SITE_COPY_MAP` synced on every text change.
- Run `copy:check`, lint, typecheck, tests, and build before production.
- Ensure product cards include image, name, material, price, availability,
  favorites, and cart action only where supported.
- Ensure product pages present gift, service, returns, and size context before
  recommendation sections.

## Maintenance Rules

- Remove completed items from the active section after acceptance checks and
  verification are recorded in commit, PR, release, or QA evidence.
- Move an item from `Needs Benchmark` to `Actionable Now` only after benchmark
  evidence is recorded.
- Keep blocker language concrete: name the missing credential, provider action,
  operational proof, or environment condition.
- Add new items conservatively. Prefer evidence from repository docs, route
  inventory, tests, provider checks, QA artifacts, or explicit product
  decisions.
