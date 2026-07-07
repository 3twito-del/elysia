# Elysia vs. Tiffany: Master Gap Plan

Status: master execution document.

Last reviewed: 2026-06-19.

Objective: define every material gap that still prevents a defensible statement
that Elysia has surpassed Tiffany as a complete digital luxury-jewelry
experience, and convert those gaps into executable work with evidence-based
acceptance criteria.

This document does not replace:

- `docs/PUBLIC_CHANGE_GATE.md`
- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/ELYSIA_DESIGN_MANIFESTO.md`
- `docs/PROJECT_TASKS.md`
- `docs/HOMEPAGE_IMPROVEMENTS.md`
- `docs/qa/production-deployment-evidence-ledger.md`

It sits above them as the master product outcome plan. Existing item IDs are
preserved where relevant so this plan can be traced back to repository evidence.

---

## 1. Brutal Baseline

### 1.1 Verdict

Elysia has not yet surpassed Tiffany as a complete luxury-commerce and brand
experience.

Elysia is already competitive or stronger in several product-engineering areas:

- Hebrew-first RTL behavior.
- Explicit failure and recovery states.
- Route coverage and static guardrails.
- Split-cart transparency.
- Product, wishlist, account, service, AI, PWA, and admin breadth.
- Automated QA discipline.

Tiffany remains ahead in the areas that most strongly determine perceived
luxury and purchase authority:

- Distinctive and instantly recognizable brand authorship.
- Consistent, product-specific art direction.
- Depth and credibility of product facts.
- Catalog cohesion and collection architecture.
- Personalization, advisor, boutique, repair, and post-purchase continuity.
- Real transaction, fulfillment, and service proof.
- Ruthless reduction of generic commerce language and interface noise.

The current `Tiffany Plus` implementation status proves that an internal UX
checklist was implemented. It does not prove comparative superiority.

### 1.2 What the repository currently proves

- The latest objective local site audit passes `48/48` route runs with no
  objective failures across representative desktop and mobile routes.
- Public route inventory is complete and reports no missing app templates.
- Product, checkout, search/category, product-card, trust, and mobile visual QA
  guardrails exist.
- Local and Shopify product sources are structurally separated.
- Shopify catalog, checkout URL generation, webhook mirror, account visibility,
  and admin visibility are implemented for validation products.
- Homepage completion work on 2026-06-19 added discovery, trust, accessibility,
  media, and SEO improvements.

Primary evidence:

- `artifacts/qa/2026-06-19T10-40-23-597Z-performance/site-audit.md`
- `artifacts/qa/2026-06-19T10-40-23-597Z-performance/route-inventory.md`
- `docs/TIFFANY_PLUS_IMPLEMENTATION_PLAN.md`
- `docs/HOMEPAGE_IMPROVEMENTS.md`
- `docs/PROJECT_TASKS.md`

### 1.3 What the repository does not prove

- That a real customer can complete every production payment path.
- That a real supplier receives and fulfills a paid order.
- That all public product specifications are verified.
- That all catalog products have unique, premium, inspection-grade media.
- That authenticated account, order, return, and appointment journeys pass a
  production-grade visual and behavioral review.
- That WCAG 2.2 AA passes manual keyboard and screen-reader testing.
- That production Core Web Vitals pass with field traffic.
- That legal identity, policy, promotion, press, review, or social-proof claims
  are complete and verified.
- That customers prefer, trust, or convert better on Elysia than on Tiffany.
- That Elysia's visual language is unique enough to be recognized without the
  logo.

---

## 2. Benchmark Target

### 2.1 The target is not a visual clone

Surpassing Tiffany does not mean copying Tiffany's color, typography, page
order, campaign concepts, or interaction details. It means beating the outcome
on Elysia's own terms:

- More intimate and locally relevant.
- More transparent about price, availability, delivery, and service.
- Better in Hebrew and RTL.
- Faster to complete a task.
- Equally authoritative in product, material, craft, and care.
- More coherent from discovery through ownership.
- More reliable under failure.

### 2.2 Official Tiffany comparison surfaces

The following official surfaces are the minimum recurring comparison set:

| Surface              | Official source                                                                               | Comparison focus                                          |
| -------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Homepage             | https://www.tiffany.com/                                                                      | Brand signal, campaigns, category entry, gifting, service |
| Jewelry listing      | https://www.tiffany.com/jewelry/                                                              | Taxonomy, collection authority, product-card restraint    |
| Rings listing        | https://www.tiffany.com/jewelry/rings/                                                        | Result count, filters, range context, product density     |
| Representative PDP   | https://www.tiffany.com/jewelry/rings/return-to-tiffany-sterling-silver-rings-1152181305.html | Gallery, size, facts, availability, advisor/store support |
| Client service       | https://www.tiffany.com/customer-service/                                                     | Advisor, order, product, repair, appointment recovery     |
| Size guide           | https://www.tiffany.com/size-guide/                                                           | Ring, bracelet, necklace fit confidence                   |
| Shipping and returns | https://www.tiffany.com/faq/shipping-returns-faq/                                             | Delivery, tracking, returns, gift wrap, support           |

Live benchmark observations must be refreshed before approving major public
changes. Access protection may prevent automated review; when it does, record
the date, affected source, and human-review requirement rather than inventing
evidence.

### 2.3 Comparative scorecard

Scores are not claims until evidence is attached. Each dimension is scored from
`0` to `5` for Elysia and Tiffany using the same rubric.

| Dimension                         | Weight | Minimum Elysia exit score | Evidence required                                     |
| --------------------------------- | -----: | ------------------------: | ----------------------------------------------------- |
| Brand distinctiveness             |    12% |                       4.5 | Blind recognition study and design audit              |
| Art direction and media           |    12% |                       4.5 | Catalog media audit and side-by-side review           |
| Product truth and craft authority |    12% |                       4.5 | Verified data completeness report                     |
| Discovery and merchandising       |     8% |                       4.5 | Task study, search analytics, PLP benchmark           |
| PDP decision confidence           |    10% |                       4.7 | Usability study and content completeness              |
| Checkout and payment confidence   |    10% |                       4.7 | Paid E2E tests and abandonment data                   |
| Service and clienteling           |    10% |                       4.5 | Appointment/service SLA and mystery-shopper test      |
| Post-purchase ownership           |     7% |                       4.5 | Order, delivery, return, repair journey test          |
| Accessibility and localization    |     6% |                       4.7 | WCAG audit, Hebrew/RTL review, assistive tech         |
| Performance and reliability       |     5% |                       4.7 | Field CWV, SLOs, error budget, synthetic monitoring   |
| Trust, privacy, and legal clarity |     4% |                       4.7 | Legal sign-off and customer comprehension test        |
| Operational readiness             |     4% |                       4.7 | Live payment, fulfillment, support, rollback evidence |

Claim gate:

- Elysia's weighted score is at least `4.6/5`.
- Elysia beats Tiffany's measured score by at least `0.2` overall.
- Elysia is not more than `0.2` behind Tiffany in any dimension weighted `8%`
  or more.
- No P0 blocker remains.
- All required evidence is less than 90 days old.
- The claim is approved by product, brand, operations, and legal owners.

---

## 3. Status, Priority, and Evidence Rules

### 3.1 Status

| Status      | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| `NOW`       | Implementable with current repository and known decisions          |
| `BENCHMARK` | Public change needs High Jewelry Reference Gate evidence first     |
| `OWNER`     | Requires verified facts, assets, policy, or owner decision         |
| `EXTERNAL`  | Requires provider, supplier, customer, legal, or production action |
| `MEASURE`   | Requires observation or research before implementation             |
| `DEFER`     | Intentionally excluded until a named condition is met              |

### 3.2 Priority

| Priority | Meaning                                                              |
| -------- | -------------------------------------------------------------------- |
| `P0`     | Blocks real commerce, legal truth, or a defensible superiority claim |
| `P1`     | Largest remaining luxury, trust, or conversion gap                   |
| `P2`     | Important depth, polish, or scale work                               |
| `P3`     | Optimization after the core experience is proven                     |

### 3.3 Definition of done for every item

An item is complete only when all applicable conditions are true:

1. The product decision and benchmark are documented.
2. Verified copy/data/assets exist.
3. Implementation is complete across supported routes and states.
4. Mobile, desktop, keyboard, loading, empty, error, and recovery behavior pass.
5. Focused tests and the appropriate release gate pass.
6. Production or preview evidence is recorded when the item depends on runtime.
7. Residual risk is explicit.
8. The old task is removed or marked complete in its canonical tracker.

---

## 4. Critical Path

The work must not start as a broad visual redesign. The correct order is:

1. Establish product truth and operational truth.
2. Create a distinct Elysia house system and media system.
3. Rebuild merchandising around verified collections and assets.
4. Deepen PDP purchase authority.
5. Prove payment, fulfillment, service, and post-purchase continuity.
6. Reduce homepage and global chrome after the strongest content exists.
7. Complete accessibility, performance, SEO, and production evidence.
8. Run comparative customer research and decide whether the superiority claim
   is defensible.

Reason: visual polish cannot compensate for repeated media, uncertain product
facts, unproven payment, or unproven fulfillment. Those are the actual P0/P1
constraints.

---

## 5. Workstream A: Brand Authority and House Codes

### A-01 Define Elysia's unmistakable house idea

- `Priority`: P1
- `Status`: OWNER + MEASURE
- `Effort`: L
- `Gap`: “Quiet luxury” is a useful restraint rule, but it is not yet a unique
  brand idea. Ivory, ink, soft gold, serif display type, and cinematic jewelry
  photography are category conventions.
- `Work`: define one sentence of brand truth, three customer promises, three
  emotional territories, and the specific tension Elysia owns in Israeli and
  Hebrew luxury jewelry.
- `Deliverables`: brand platform, audience definition, positioning statement,
  promise hierarchy, prohibited claims, and proof map.
- `Acceptance`: independent reviewers can describe Elysia consistently and do
  not default to “premium jewelry store” or “Tiffany-like.”
- `Evidence`: moderated interviews with at least target customers and internal
  stakeholder sign-off.

### A-02 Build a recognizable visual code system

- `Priority`: P1
- `Status`: BENCHMARK
- `Effort`: L
- `Gap`: the current visual system is polished but still depends heavily on
  generic luxury cues.
- `Work`: define image geometry, crop rules, material surfaces, signature
  framing, editorial composition, icon behavior, motion grammar, typography
  hierarchy, and one restrained proprietary brand accent.
- `Deliverables`: visual identity specification and token-level implementation
  guide for home, PLP, PDP, service, packaging, and transactional surfaces.
- `Acceptance`: five unbranded screens are recognized as one house; the system
  remains premium with animation disabled and without decorative gradients.
- `Dependencies`: A-01, High Jewelry Reference Gate.

### A-03 Resolve the bilingual voice system

- `Priority`: P1
- `Status`: NOW + OWNER
- `Effort`: M
- `Source`: homepage backlog `3.2`, `3.3`, and `3.4`.
- `Work`: define when English is allowed, whether eyebrows may be English, how
  names and collections are transliterated, punctuation direction, numeral and
  currency formatting, and CTA verb standards.
- `Acceptance`: no accidental English headline hierarchy; Hebrew remains the
  primary reading path; every public CTA is concrete and short.

### A-04 Replace generic copy with evidence-backed house copy

- `Priority`: P1
- `Status`: OWNER
- `Effort`: L
- `Gap`: several routes still communicate through generic boutique language or
  system explanation rather than specific material, form, fit, origin, or use.
- `Work`: rewrite home, category, collection, PDP, gifting, about, care, and
  service copy from a verified fact bank.
- `Acceptance`: every claim can be traced to a product, policy, craft process,
  service capability, or approved brand position; unsupported superlatives are
  absent.

### A-05 Create a collection architecture, not only categories

- `Priority`: P1
- `Status`: OWNER + BENCHMARK
- `Effort`: L
- `Gap`: categories organize inventory; collections create memory and desire.
- `Work`: define named collections, design motifs, hero pieces, entry products,
  material rules, visual worlds, launch cadence, and cross-sell logic.
- `Acceptance`: every priority product belongs to a coherent collection or is
  explicitly classified as an essential; collection pages have enough distinct
  products and media to justify publication.

### A-06 Extend the brand into ownership

- `Priority`: P2
- `Status`: OWNER
- `Effort`: L
- `Work`: define packaging, gift note, order email, shipment update, care card,
  repair communication, return communication, and unboxing language.
- `Acceptance`: ownership touchpoints feel like the same house as the PDP and
  do not fall back to provider templates.

### A-07 Establish a campaign and editorial cadence

- `Priority`: P2
- `Status`: OWNER
- `Effort`: L, recurring
- `Work`: define seasonal campaigns, evergreen materials content, gifting
  moments, launches, asset expiration, and campaign rollback.
- `Acceptance`: homepage and collection storytelling change because there is a
  real campaign, not because the layout needs novelty.

### A-08 Run blind distinctiveness validation

- `Priority`: P0 for the final claim
- `Status`: MEASURE
- `Effort`: M
- `Work`: compare unbranded Elysia, Tiffany, and peer screenshots with target
  customers; test recognition, perceived quality, trust, and desire.
- `Acceptance`: Elysia reaches the predefined distinctiveness and preference
  thresholds; failures return to A-01/A-02, not to decorative UI additions.

---

## 6. Workstream B: Product Media and Art Direction

### B-01 Replace duplicated catalog media

- `Priority`: P0
- `Status`: OWNER
- `Effort`: L
- `Existing item`: `I-332`.
- `Evidence`: repository hash inspection found repeated files across categories,
  including shared `02`, `03`, `05`, `09`, `11`, `14`, and `15` catalog assets.
- `Work`: create a product-to-media manifest and replace cross-product reuse
  unless the image intentionally depicts the exact same product.
- `Acceptance`: every published priority SKU has a unique primary image; no
  unrelated products share identical media hashes; missing assets unpublish or
  clearly quarantine the product.

### B-02 Define the minimum media set per product

- `Priority`: P0
- `Status`: OWNER
- `Effort`: L
- `Required set`: clean primary, alternate angle, scale-on-body, closure or
  construction detail, material macro, and packaging/context image.
- `Optional set`: short motion clip, 360-degree sequence, styling pair, and
  variant-specific image.
- `Acceptance`: P0/P1 products meet `100%` of the required set; no PDP presents
  repeated crops as separate evidence.

### B-03 Create media art-direction standards

- `Priority`: P1
- `Status`: NOW + OWNER
- `Effort`: M
- `Work`: define background, shadow, color temperature, skin-tone range,
  model-use policy, crop safe areas, aspect ratios, focal points, retouching,
  reflection control, and metal/gemstone color accuracy.
- `Acceptance`: category grids read as one set; metal color does not shift
  materially between gallery images; crops remain intentional at all supported
  breakpoints.

### B-04 Map media to product variants

- `Priority`: P1
- `Status`: NOW after assets
- `Effort`: M
- `Gap`: `ProductMedia` is product-scoped, while premium variant selection may
  require variant-specific visual evidence.
- `Work`: decide whether schema needs variant-media association; update admin,
  API, sync, gallery selection, and fallback behavior.
- `Acceptance`: changing metal or stone color updates relevant media without
  losing gallery position or accessibility context.

### B-05 Upgrade PDP inspection quality

- `Priority`: P1
- `Status`: NOW after B-02
- `Effort`: M
- `Work`: verify zoom resolution, touch pan, thumbnail clarity, image count,
  full-gallery sequencing, video controls, fallback behavior, and color
  fidelity.
- `Acceptance`: customers can inspect finish, setting, clasp, scale, and fit on
  mobile and desktop; no interaction blocks the purchase panel.

### B-06 Add truthful scale and fit media

- `Priority`: P1
- `Status`: OWNER
- `Effort`: L
- `Work`: photograph rings on hands, earrings on ears, necklaces at defined
  chain lengths, and bracelets on measured wrists; include model measurements
  where useful.
- `Acceptance`: scale claims are reproducible; alt text conveys decision-useful
  context without describing decorative mood.

### B-07 Build asset governance

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Work`: add ownership, source/license, approval, product mapping, alt text,
  dimensions, expiration, and replacement priority to an asset manifest.
- `Acceptance`: every production asset has provenance and an owner; generated
  assets are labeled internally and never imply a false product property.

### B-08 Add automated media-quality gates

- `Priority`: P2
- `Status`: NOW
- `Effort`: M
- `Work`: detect duplicate hashes, missing primary media, low resolution,
  missing alt, unsupported formats, extreme aspect ratios, and broken URLs.
- `Acceptance`: catalog publish/release fails for P0 media violations and warns
  for non-critical issues with exact product IDs.

---

## 7. Workstream C: Product Truth, Catalog, and Merchandising Data

### C-01 Complete verified product specifications

- `Priority`: P0
- `Status`: OWNER + EXTERNAL
- `Effort`: L
- `Existing item`: `I-333`.
- `Known code debt`: country of manufacture and manufacturer/importer remain
  TODO-backed fallbacks in `src/app/product/[slug]/page.tsx`; Shopify sync can
  still use `legalPlaceholder` for material.
- `Required data`: exact materials, purity, plating, stone type, stone status,
  dimensions, weight where appropriate, chain length, closure, size range,
  manufacturer, importer, origin, care restrictions, warranty, and SKU.
- `Acceptance`: no published PDP renders a legal placeholder or inferred fact;
  data completeness is `100%` for required fields by product class.

### C-02 Replace free-form facts with governed attributes

- `Priority`: P1
- `Status`: NOW after C-01 policy
- `Effort`: L
- `Gap`: `commerceHighlights`, delivery, returns, care, and warranty are partly
  free-form product text, which risks inconsistency and unsupported promises.
- `Work`: define typed attributes, controlled vocabularies, policy references,
  effective dates, locale support, and source-of-truth ownership.
- `Acceptance`: shared facts update centrally; product overrides require a
  reason and audit trail.

### C-03 Define product publish readiness

- `Priority`: P0
- `Status`: NOW
- `Effort`: M
- `Work`: add a publish checklist for facts, media, price, inventory mode,
  source mapping, shipping policy, returns, warranty, SEO, and accessibility.
- `Acceptance`: a product cannot move to `ACTIVE` while a class-specific P0
  field is missing; admin shows exact failures.

### C-04 Verify pricing and promotion truth

- `Priority`: P0
- `Status`: OWNER
- `Effort`: M
- `Work`: define compare-at price rules, promotion ownership, start/end dates,
  coupon stacking, price history requirements, and supplier price drift.
- `Acceptance`: no fake urgency, stale discount, unexplained price mismatch, or
  supplier checkout surprise; every public discount is reproducible.

### C-05 Build collection merchandising controls

- `Priority`: P1
- `Status`: NOW after A-05
- `Effort`: L
- `Work`: hero product, manual rank, launch status, collection membership,
  visual balance, availability-aware fallback, and route-specific curation.
- `Acceptance`: a merchandiser can compose home, collection, category, gifting,
  and recommendation sets without code changes or duplicate product dominance.

### C-06 Improve product relationship modeling

- `Priority`: P2
- `Status`: NOW
- `Effort`: M
- `Work`: explicit same-family, complements, sets, alternatives, upgrades, and
  recently-viewed exclusions; keep AI labels from implying personalization when
  logic is source-based.
- `Acceptance`: recommendations are explainable, non-duplicative, available,
  and visually coherent.

### C-07 Define supplier provenance language

- `Priority`: P1
- `Status`: BENCHMARK + OWNER
- `Effort`: M
- `Existing item`: `I-334`.
- `Work`: decide what source, fulfillment, warranty, returns, and importer facts
  must be public; hide operational plumbing that does not help a decision.
- `Acceptance`: supplier products remain premium and understandable without
  implying Elysia manufacture, local stock, combined checkout, or unverified
  provenance.

### C-08 Add catalog quality reporting

- `Priority`: P1
- `Status`: STARTED
- `Effort`: M
- `Work`: admin dashboard for completeness, stale prices, unavailable items,
  missing media, duplicate assets, sync age, supplier mapping, and policy drift.
- `Acceptance`: owners can see blockers by product and collection before a
  customer encounters them.
- `Progress`: implemented `pnpm catalog:quality`
  (`scripts/catalog-quality-report.ts`, `scripts/lib/catalog-quality-report.ts`,
  `scripts/catalog-quality-report.test.ts`). It turns a `catalog-readiness.json`
  artifact into an owner-facing rollup grouped by finding code (with owner role
  and affected product samples) and by product class. The Wave 0 rollup
  reproduces the previously hand-authored remediation breakdown by command.
  Evidence: `docs/qa/catalog-quality-report.md` and
  `artifacts/qa/2026-06-19-wave-0-catalog-quality/`. A rendered admin surface for
  the same data remains, but the reporting data layer is code-complete.

---

## 8. Workstream D: Homepage and Global Experience

### D-01 Reduce homepage length and competing intent

- `Priority`: P1
- `Status`: BENCHMARK
- `Effort`: M
- `Gap`: the homepage is polished but long and carries hero, shortcuts, gift
  finder, categories, products, materials, story, newsletter, and a large
  footer. More content does not automatically create more authority.
- `Work`: rank sections by business value, remove duplicate paths, cap product
  rails, and ensure a hint of the next section remains visible.
- `Acceptance`: the page communicates brand, product world, and primary
  commerce entry quickly; repeated CTAs and explanations are removed.

### D-02 Make the hero unmistakably Elysia

- `Priority`: P1
- `Status`: OWNER + BENCHMARK
- `Effort`: M
- `Work`: replace generic hero language with the approved house idea; use a
  campaign or product image that belongs uniquely to Elysia; keep one dominant
  action and at most one genuinely distinct secondary task.
- `Acceptance`: brand/product/offer is clear without relying only on the logo;
  copy remains legible over every video frame and at short viewport heights.

### D-03 Complete homepage manual validation

- `Priority`: P0 for release claim
- `Status`: MEASURE
- `Effort`: M
- `Source`: homepage backlog sections `4`, `5`, `6`, and `7`.
- `Work`: full keyboard pass, screen-reader walkthrough, heading audit, color
  contrast, touch targets, reduced motion, hero controls, device matrix, real
  CWV, Rich Results, and share-card review.
- `Acceptance`: WCAG and performance criteria in workstreams J and L pass with
  recorded artifacts.

### D-04 Resolve factual homepage blockers

- `Priority`: P0
- `Status`: OWNER
- `Effort`: S after facts exist
- `Required facts`: legal business identity, approved shipping/returns/warranty
  phrasing, real press/social proof, and real promotion rules.
- `Acceptance`: unverified claims remain absent; verified facts link to the
  canonical policy or source.

### D-05 Rationalize header taxonomy

- `Priority`: P1
- `Status`: BENCHMARK
- `Effort`: M
- `Work`: validate category, collection, new, gifts, favorites, sizing, service,
  account, search, and cart placement on desktop and mobile; keep AI out of
  primary navigation unless an exception is approved.
- `Acceptance`: target users find product categories and service tasks without
  hesitation; no utility exists without a real backed route.

### D-06 Reduce footer density

- `Priority`: P2
- `Status`: BENCHMARK
- `Effort`: M
- `Work`: remove duplicate navigation, group service and legal links, verify
  mobile disclosure behavior, and expose legal identity only when verified.
- `Acceptance`: footer remains complete but does not feel like a second landing
  page; keyboard and touch behavior pass.

### D-07 Remove intrusive global chrome

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Work`: review cookie, accessibility, sticky header, cart summary, mobile buy
  bar, and other fixed layers together on every core route.
- `Acceptance`: no floating element covers focusable content or a purchase
  action; short viewports, keyboards, safe areas, and zoom are covered.
- `Existing evidence`: baseline only in `docs/qa/floating-chrome-collision-audit.md`.

### D-08 Normalize motion and interaction grammar

- `Priority`: P2
- `Status`: NOW
- `Effort`: M
- `Source`: homepage backlog `2.8` and `4.8`.
- `Work`: one easing family, restrained durations, no layout movement, reduced
  motion support, and stable hover/focus states.
- `Acceptance`: interaction feels consistent across cards, galleries, sheets,
  tabs, and CTAs; no motion is required to discover content.
- `Progress` (2026-07-02): easing vocabulary consolidated in
  `src/styles/globals.css` to one documented family — `--ease-standard`
  (in-out), `--ease-enter` (decelerate), `--ease-exit` (accelerate). The six
  legacy tokens (`--ease-liquid`, `--ease-motion-standard/expressive/feedback/
  enter/exit`) are now aliases onto that family, so all 122 consumers stay
  consistent without call-site edits. Two were exact duplicates; the only value
  change is `--ease-liquid` (16 uses) moving to the shared `enter` curve.
- `Progress` (2026-07-02, hover/focus): all interactive state transitions that
  used the bare `ease` keyword + magic values (150ms/160ms) now use one tokenized
  duration and the shared family — a new `--motion-micro: 160ms` token plus
  `var(--ease-standard)` across account links/sidebar, wishlist card, checkout
  action/item panels, and the public select trigger. No bare `ease` interactive
  transition remains (only decorative `ease-in-out` keyframe loops on /about).
  Full styles contract suite green (293 tests / 74 files).
- `Assessment` (2026-07-02, durations + spacing): the restrained-duration and
  home vertical-rhythm sub-items were reviewed and intentionally left unchanged.
  The `--motion-*` durations form a deliberate scale guarded by
  `public-motion-budget.test.ts` (e.g. the 680ms cinematic media zoom and 620ms
  feature reveal are art direction, and reveal timings sync with JS stagger);
  home sections already share `--ui-section-y-wide` (the `py-7` bands are
  intentional tight dividers). Cutting these would degrade intentional design
  without visual review, so no churn was made.
- `Progress` (2026-07-02, no-layout-movement audit): no `transition: all` exists
  anywhere. The one layout-animating transition — `.about-rule` animating
  `width` 900ms for its scroll-in draw effect — was converted to a
  compositor-only `transform: scaleX()` from the RTL start edge (visually
  identical, zero per-frame layout). The remaining non-transform transitions are
  intentional and non-repeated: `.public-motion-content` `padding` (header
  safe-area offset) and an SVG `fill`/`stroke-width` (paint, not layout).
- D-08 is substantially complete at the token/CSS layer. Subjective motion-feel
  changes still require `PUBLIC_CHANGE_GATE` sign-off and L-03 visual-regression
  review before release.

---

## 9. Workstream E: Discovery, Search, Categories, and Gifts

### E-01 Create a real taxonomy audit

- `Priority`: P1
- `Status`: MEASURE + OWNER
- `Effort`: M
- `Work`: analyze customer language, search logs, categories, materials,
  collections, occasions, recipients, price bands, styles, and synonyms in
  Hebrew and English.
- `Acceptance`: every primary navigation and filter term has customer evidence,
  catalog coverage, and a unique purpose.

### E-02 Improve semantic search quality with an evaluation set

- `Priority`: P1
- `Status`: NOW + MEASURE
- `Effort`: L
- `Work`: create a labeled query corpus for exact products, materials, styles,
  gifts, budgets, misspellings, Hebrew morphology, transliteration, and no-match
  intent; evaluate deterministic and AI-assisted paths.
- `Acceptance`: target precision/recall and zero-result thresholds are defined
  and met; AI/provider failure silently falls back without console noise.

### E-03 Make search ranking merchandiser-aware

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Work`: blend textual relevance, availability, collection priority, launch
  status, product quality, and business rules without hiding relevance.
- `Acceptance`: exact intent wins; unavailable or low-quality products do not
  dominate; ranking decisions are inspectable.

### E-04 Complete filter and sort validation

- `Priority`: P1
- `Status`: MEASURE
- `Effort`: M
- `Work`: verify filter labels, counts, combinations, URL persistence, back
  navigation, mobile sheet state, active chips, reset, disabled options, and
  sort stability against a realistic catalog.
- `Acceptance`: no contradictory count, lost state, duplicated control, or
  dead-end combination; keyboard and screen-reader semantics pass.

### E-05 Add collection-led discovery without weakening PLP utility

- `Priority`: P2
- `Status`: BENCHMARK
- `Effort`: M
- `Work`: allow restrained collection context after core count/filter/sort and
  before or within the grid only when it improves decision quality.
- `Acceptance`: storytelling never scroll-gates products or moves controls out
  of the first task area.

### E-06 Rework gifts around decisions

- `Priority`: P1
- `Status`: BENCHMARK + MEASURE
- `Effort`: M
- `Work`: validate occasion, recipient, budget, material, and delivery urgency;
  preserve route-backed filters and avoid a long editorial landing page.
- `Acceptance`: customers can reach a viable shortlist with fewer decisions;
  no gift recommendation invents stock, delivery, or suitability.

### E-07 Fix long mobile product-rail density

- `Priority`: P1
- `Status`: BENCHMARK
- `Effort`: M
- `Existing item`: `I-302`.
- `Work`: cap visible secondary cards, merge duplicate recommendation reasons,
  or add a restrained reveal after purchase/service context.
- `Acceptance`: primary product and service tasks are not buried; lazy media
  remains correctly loaded and measured.

### E-08 Validate all-products visual consistency

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Existing item`: `I-307`.
- `Work`: shard visual QA by viewport/category instead of one over-budget run.
- `Acceptance`: every active product receives desktop and mobile evidence;
  failures identify product, viewport, and asset.

### E-09 Make intentional 404 recovery testable

- `Priority`: P2
- `Status`: NOW
- `Effort`: S
- `Existing item`: `I-305`.
- `Work`: teach visual QA expected response status or add a dedicated recovery
  test lane.
- `Acceptance`: intentional 404 pages can pass design QA while accidental 404s
  still fail.

### E-10 Measure discovery outcomes

- `Priority`: P1
- `Status`: NOW + MEASURE
- `Effort`: M
- `Work`: instrument query success, refinements, zero results, product click,
  wishlist, cart, and exit while respecting privacy.
- `Acceptance`: dashboards segment by query class, device, source, and route;
  events are deduplicated and documented.

---

## 10. Workstream F: Product Detail and Purchase Authority

### F-01 Design a class-specific PDP fact model

- `Priority`: P0
- `Status`: NOW after C-01
- `Effort`: L
- `Work`: define required and optional facts for rings, necklaces, earrings,
  bracelets, stones, plated pieces, solid metals, pearls, and supplier items.
- `Acceptance`: the purchase panel shows decision-critical facts early and the
  detailed specification section remains complete without repetition.

### F-02 Deepen size and fit confidence

- `Priority`: P1
- `Status`: OWNER + NOW
- `Effort`: M
- `Work`: class-specific fit language, measured diagrams, conversion tables,
  saved sizes, return context, and advisor escalation.
- `Acceptance`: customers can choose size without leaving context; returning
  from the guide restores product and selection; unsupported certainty is
  absent.

### F-03 Add personalization only when operationally real

- `Priority`: P1
- `Status`: OWNER + EXTERNAL
- `Effort`: L
- `Gap`: no complete public engraving/personalization workflow is proven.
- `Work`: define eligible products, characters, fonts, preview, price, lead
  time, cancellation/return rules, production handoff, and error handling.
- `Acceptance`: a paid personalized order can be produced, tracked, supported,
  and represented correctly in account/admin; otherwise the control is absent.

### F-04 Add advisor and appointment continuity near purchase

- `Priority`: P1
- `Status`: OWNER + EXTERNAL
- `Effort`: L
- `Work`: product-aware contact, appointment request, saved context, branch or
  remote mode, confirmation, reschedule/cancel, and admin ownership.
- `Acceptance`: advisor receives product, variant, size, customer intent, and
  consent; customer gets a reliable confirmation and fallback.

### F-05 Add truthful availability and delivery resolution

- `Priority`: P0
- `Status`: EXTERNAL + NOW
- `Effort`: L
- `Work`: resolve availability by source/variant, distinguish ready-to-order,
  made-to-order, supplier checkout, and unavailable, and expose an evidence-
  backed delivery window.
- `Acceptance`: PDP, cart, checkout, email, account, and admin agree; no exact
  stock count or delivery guarantee is invented.

### F-06 Build product-specific care and warranty

- `Priority`: P1
- `Status`: OWNER
- `Effort`: M
- `Work`: material-sensitive care, exclusions, inspection/repair path, warranty
  term, evidence needed, and customer-friendly summary.
- `Acceptance`: instructions match material and construction; generic policy
  does not contradict product-specific guidance.

### F-07 Add concise product story where facts support it

- `Priority`: P2
- `Status`: BENCHMARK
- `Effort`: M
- `Existing item`: `I-328`.
- `Work`: one “why this piece” module after purchase confidence and before
  recommendations, grounded in design, material, technique, or use.
- `Acceptance`: no generic prose, no duplicated description, no delay to
  service/warranty/returns.

### F-08 Improve comparison and shortlist support

- `Priority`: P2
- `Status`: MEASURE + BENCHMARK
- `Effort`: L
- `Work`: determine whether customers need direct comparison by dimensions,
  material, price, fit, availability, and care; avoid feature-table aesthetics
  if side-by-side comparison is not useful.
- `Acceptance`: comparison reduces uncertainty in testing and remains usable on
  mobile.

### F-09 Verify recommendations and recently viewed behavior

- `Priority`: P2
- `Status`: NOW
- `Effort`: M
- `Work`: dedupe current product and repeated rails, preserve return context,
  respect availability, prevent hydration/layout shifts, and disclose logic
  accurately.
- `Acceptance`: no misleading personalization claim; no rail buries ownership
  or service content.

### F-10 Add product structured data completeness

- `Priority`: P1
- `Status`: NOW after C-01
- `Effort`: M
- `Work`: validate Product, Offer, availability, price, image, brand, SKU, and
  policy fields against actual public truth.
- `Acceptance`: Rich Results validation passes; structured data never exposes a
  value hidden or contradicted by the page.

### F-11 Validate PDP across the whole catalog

- `Priority`: P0 for final claim
- `Status`: MEASURE
- `Effort`: L
- `Work`: every product class, variant state, missing media state, supplier
  state, unavailable state, mobile/desktop, keyboard, and zoom behavior.
- `Acceptance`: all-products matrix passes; no representative-only evidence is
  used to claim full catalog quality.

### F-12 Prove virtual try-on before promotion

- `Priority`: P3
- `Status`: DEFER + EXTERNAL
- `Effort`: L
- `Gap`: data models and AI tool paths exist, but no trustworthy customer-facing
  try-on quality or provider workflow is proven.
- `Acceptance`: output accuracy, consent, retention, deletion, failure, and
  product mapping pass; otherwise keep the capability demoted or unavailable.

---

## 11. Workstream G: Cart, Checkout, Payment, and Order Completion

### G-01 Connect and prove the real Shopify supplier

- `Priority`: P0
- `Status`: EXTERNAL
- `Effort`: L
- `Existing item`: `I-011`.
- `Acceptance`: real product, variant, SKU, inventory, price, cancellation,
  fulfillment, and support behavior are documented and reproducible.

### G-02 Complete a paid Shopify checkout

- `Priority`: P0
- `Status`: EXTERNAL
- `Effort`: M
- `Existing item`: `I-012`.
- `Acceptance`: a real payment completes, Shopify order exists, customer sees
  correct completion, webhook mirror arrives once, and account/admin state is
  accurate.

### G-03 Prove supplier fulfillment end to end

- `Priority`: P0
- `Status`: EXTERNAL
- `Effort`: L
- `Existing item`: `I-013`.
- `Acceptance`: supplier receives, accepts, ships, updates tracking, handles a
  failure/cancel case, and supports escalation; evidence is recorded outside
  secrets.

### G-04 Enable and prove CardCom for own products

- `Priority`: P0
- `Status`: EXTERNAL
- `Effort`: M
- `Existing item`: `I-014`.
- `Acceptance`: successful payment, decline, cancel, duplicate webhook,
  timeout, refund/cancel policy, and reconciliation pass in production-safe
  testing.

### G-05 Build a complete order-confirmation state

- `Priority`: P0
- `Status`: NOW after G-02/G-04
- `Effort`: M
- `Gap`: checkout completion must be judged after payment, not only before it.
- `Work`: source-aware confirmation, order reference, payment state, next step,
  delivery expectation, account link, support, and retry/recovery.
- `Acceptance`: refresh and duplicate callbacks are idempotent; customer never
  mistakes a payment request for a completed order.

### G-06 Test every checkout state with realistic carts

- `Priority`: P0
- `Status`: NOW + MEASURE
- `Effort`: L
- `Matrix`: empty, own-only, supplier-only, mixed, coupon, unavailable item,
  price change, inventory conflict, validation failure, payment failure,
  provider timeout, mobile keyboard, back navigation, and refresh.
- `Acceptance`: totals, source groups, policies, actions, and recovery remain
  correct; no fake combined payment exists.

### G-07 Clarify delivery promises from real operations

- `Priority`: P0
- `Status`: OWNER + EXTERNAL
- `Effort`: M
- `Work`: define cutoff, geography, handling, supplier variance, holiday
  exceptions, tracking, failed delivery, and customer communication.
- `Acceptance`: PDP, checkout, policy, email, and service use the same rule and
  never overpromise.

### G-08 Add gift options only when fulfilled

- `Priority`: P1
- `Status`: OWNER + EXTERNAL
- `Effort`: M
- `Work`: gift wrap, note, receipt suppression, price visibility, eligibility,
  supplier limitations, and operational print/pack flow.
- `Acceptance`: the selected option appears in order, admin, fulfillment, and
  confirmation; failure is recoverable.

### G-09 Add order and payment reconciliation

- `Priority`: P0
- `Status`: NOW after providers
- `Effort`: L
- `Work`: detect paid-without-order, order-without-payment, duplicate callbacks,
  stale pending payments, supplier mismatch, and webhook lag.
- `Acceptance`: alerts and runbooks identify ownership and safe remediation;
  no manual database edits are required for normal recovery.

### G-10 Define refund, cancellation, and return ownership

- `Priority`: P0
- `Status`: OWNER + EXTERNAL
- `Effort`: L
- `Work`: separate own and supplier orders, payment reversal, status mapping,
  eligibility, fees, communication, and audit trail.
- `Acceptance`: support can explain and execute the correct path; account/admin
  never expose unsupported actions for Shopify mirrors.

### G-11 Validate checkout accessibility and security

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: M
- `Work`: keyboard, screen reader, error summary, field association, RTL input,
  autofill, password manager, mobile keyboard, CSP, CSRF, webhook signatures,
  rate limits, and sensitive logging.
- `Acceptance`: independent accessibility/security review has no critical or
  high unresolved issue.

### G-12 Decide the long-term payment architecture

- `Priority`: P2
- `Status`: OWNER
- `Effort`: M decision
- `Work`: explicitly decide whether own products stay local/CardCom, move to
  Shopify, or retain split architecture; evaluate customer confusion,
  reconciliation, tax, refunds, inventory, and operations.
- `Acceptance`: one approved architecture and migration/runbook; no accidental
  platform drift.

---

## 12. Workstream H: Client Service, Appointments, and Ownership Care

### H-01 Define the service promise

- `Priority`: P0
- `Status`: OWNER
- `Effort`: M
- `Work`: supported channels, hours, response target, languages, order help,
  sizing, product advice, repair, returns, and escalation.
- `Acceptance`: every public service claim maps to staffing and an operational
  queue; no unsupported SLA or channel appears.

### H-02 Make appointments a real customer journey

- `Priority`: P1
- `Status`: OWNER + EXTERNAL
- `Effort`: L
- `Gap`: appointment data/admin capability exists, but a complete public remote
  or boutique booking journey is not proven.
- `Work`: availability, timezone, topic, product context, confirmation,
  reminder, reschedule, cancel, no-show, advisor assignment, and consent.
- `Acceptance`: mystery-shopper booking completes end to end and admin can own
  every state.

### H-03 Build product-aware advisor handoff

- `Priority`: P1
- `Status`: NOW after H-01
- `Effort`: M
- `Work`: preserve product, variant, size, wishlist, budget, source route, and
  customer question when moving to service.
- `Acceptance`: customer does not need to repeat context; sensitive data is
  minimized and consented.

### H-04 Add repair, resize, and care intake

- `Priority`: P1
- `Status`: OWNER + EXTERNAL
- `Effort`: L
- `Work`: eligibility, proof of purchase, photos, estimate, intake, shipping or
  drop-off, status, approval, payment, return shipment, and exception handling.
- `Acceptance`: at least one real case completes with tracked status and clear
  ownership; unavailable services are not implied.

### H-05 Build a service case timeline

- `Priority`: P1
- `Status`: NOW
- `Effort`: L
- `Work`: customer-visible status, internal assignment, notes, attachments,
  outbound communication, deadlines, and audit history.
- `Acceptance`: customer and operator share the same high-level state; internal
  notes remain private; attachment access is protected.

### H-06 Add order-aware return initiation

- `Priority`: P1
- `Status`: NOW + OWNER
- `Effort`: M
- `Work`: eligibility, item/reason selection, source-specific instructions,
  evidence, status, and service fallback.
- `Acceptance`: no unsupported self-service action for Shopify mirrors; local
  and supplier paths are explicit.

### H-07 Validate contact and attachment delivery

- `Priority`: P0
- `Status`: MEASURE + EXTERNAL
- `Effort`: M
- `Work`: real email delivery, reply routing, attachment scanning/storage,
  access controls, offline sync, duplicate submission, and failure alerts.
- `Acceptance`: a submitted case reaches the right queue exactly once and the
  customer receives a truthful confirmation.

### H-08 Decide WhatsApp, chat, callback, and SMS policy

- `Priority`: P2
- `Status`: OWNER
- `Effort`: M
- `Existing item`: SMS remains deferred as `I-015`.
- `Acceptance`: only staffed, consented, measurable channels are exposed; SMS
  remains absent until credentials and delivery requirements exist.

### H-09 Build service quality measurement

- `Priority`: P1
- `Status`: NOW + MEASURE
- `Effort`: M
- `Metrics`: first response, resolution, reopen, abandonment, transfer,
  appointment completion, return cycle, repair cycle, and satisfaction.
- `Acceptance`: metrics exclude spam/test traffic and can be segmented without
  exposing customer data.

### H-10 Prove ownership continuity with mystery shopping

- `Priority`: P0 for final claim
- `Status`: MEASURE
- `Effort`: M, recurring
- `Work`: anonymous product question, size question, paid order issue, return,
  and care/repair request across mobile and desktop.
- `Acceptance`: each journey meets the approved promise and has no dead end.

---

## 13. Workstream I: Account, Wishlist, and Post-Purchase

### I-01 Create repeatable authenticated E2E state

- `Priority`: P0
- `Status`: STARTED
- `Effort`: M
- `Existing item`: `I-306`.
- `Work`: fixture customer, reusable auth state, seeded own order, Shopify
  mirror order, return, saved sizes, wishlist, address, and privacy data.
- `Progress`: test-only fixture route, Playwright helper, and Chromium desktop
  authenticated account E2E are implemented. The default Playwright production
  harness now uses `E2E_SKIP_SERWIST_BUILD=1` for non-PWA account tests so the
  local Serwist/esbuild sandbox failure does not block account review, and it
  injects the local E2E database URL before `.env.local` preview credentials can
  take over. The harness runs through global setup/teardown and a managed Node
  wrapper so Windows teardown does not leave `next start` behind.
- `Acceptance`: visual and behavioral tests can enter every state without real
  customer data or manual OTP.

### I-02 Complete authenticated visual review

- `Priority`: P1
- `Status`: MEASURE after I-01
- `Effort`: M
- `Acceptance`: dashboard, profile, addresses, saved sizes, wishlist merge,
  privacy, order details, returns, empty/error/loading, and mobile layouts pass.

### I-03 Build an ownership-grade order timeline

- `Priority`: P1
- `Status`: NOW after provider proof
- `Effort`: M
- `Work`: source-aware milestones, payment, processing, shipment, delivery,
  cancellation, return, support, and tracking.
- `Acceptance`: timeline reflects actual event truth and avoids fabricated
  milestones for Shopify mirrors.

### I-04 Improve reorder, care, and service continuity

- `Priority`: P2
- `Status`: BENCHMARK
- `Effort`: M
- `Work`: from order detail expose relevant care, warranty, return, repair,
  advisor, and complementary products without turning account into marketing.
- `Acceptance`: service actions remain primary and route-backed.

### I-05 Make wishlist a real decision tool

- `Priority`: P1
- `Status`: MEASURE + NOW
- `Effort`: M
- `Work`: availability change, price change, source, size memory, comparison
  cues, share policy, and advisor handoff; avoid urgency and fake scarcity.
- `Acceptance`: saved state survives guest-to-account merge and never adds the
  wrong variant.

### I-06 Add preference and consent governance

- `Priority`: P0
- `Status`: NOW + OWNER
- `Effort`: M
- `Work`: email, push, future SMS, service, analytics, and personalization
  preferences with source, timestamp, withdrawal, and retention.
- `Acceptance`: communication respects current consent and privacy export/delete
  behavior.

### I-07 Validate privacy export and deletion end to end

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: M
- `Work`: authentication challenge, data completeness, delivery, deletion
  dependencies, legal retention, provider data, audit, and recovery.
- `Acceptance`: legal sign-off and production-safe test pass; no other
  customer's data can be inferred.

### I-08 Add transactional communication governance

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Work`: template ownership, localization, provider fallback, idempotency,
  unsubscribe boundaries, bounce handling, test addresses, and previews.
- `Acceptance`: every order/service state has the required message and no state
  sends duplicate or contradictory communication.

### I-09 Measure repeat ownership, not only conversion

- `Priority`: P2
- `Status`: MEASURE
- `Effort`: M
- `Metrics`: repeat purchase, care engagement, service resolution, returns,
  wishlist return, appointment-to-purchase, and customer retention.
- `Acceptance`: definitions and attribution windows are documented; no vanity
  metric is used as superiority proof.

---

## 14. Workstream J: Content, SEO, Accessibility, and Performance

### J-01 Complete WCAG 2.2 AA audit

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: L
- `Scope`: all public templates, account, checkout, service, legal, dialogs,
  sheets, galleries, video, forms, errors, and authenticated states.
- `Required`: automated checks, full keyboard pass, NVDA/Windows, VoiceOver/iOS,
  200% and 400% zoom, reflow, contrast, reduced motion, and touch targets.
- `Acceptance`: no critical/high issue; medium issues have owner and deadline;
  accessibility statement reflects reality.

### J-02 Validate hero media accessibility

- `Priority`: P1
- `Status`: MEASURE
- `Effort`: S
- `Source`: homepage backlog `2.1`, `4.3`, and `4.8`.
- `Acceptance`: pause is discoverable, reduced motion and data saver work,
  poster fallback is meaningful, and text contrast passes every bright frame.

### J-03 Establish production Core Web Vitals

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: M
- `Work`: RUM for LCP, INP, CLS by route/device/network; synthetic budgets for
  regression; consent and privacy review.
- `Acceptance`: p75 mobile targets are met on core templates with sufficient
  sample size; local load time is not used as field proof.

### J-04 Reduce homepage and PDP JavaScript cost

- `Priority`: P1
- `Status`: NOW after measurement
- `Effort`: M
- `Source`: homepage backlog `5.2` through `5.7`.
- `Work`: video strategy, image sizes, static server rendering, deferred client
  code, font loading, preload discipline, and bundle analysis.
- `Acceptance`: no regression in interaction, media, or accessibility; bundle
  and field metrics improve against recorded baseline.

### J-05 Complete technical SEO validation

- `Priority`: P1
- `Status`: NOW + MEASURE
- `Effort`: M
- `Work`: crawl, canonicals, sitemap, robots, metadata uniqueness, Hebrew
  titles, pagination, filtered URLs, unavailable products, structured data, OG,
  and redirect/404 behavior.
- `Acceptance`: no indexable duplicate trap, broken canonical, orphan priority
  page, or inaccurate schema.

### J-06 Build a Hebrew search-content model

- `Priority`: P1
- `Status`: OWNER + MEASURE
- `Effort`: L
- `Work`: map real search intent for jewelry classes, materials, plating,
  pearls, gifts, sizes, styles, care, and service; create useful route content
  only where catalog and customer intent justify it.
- `Acceptance`: content answers a task and leads to relevant products; no SEO
  filler or mass-generated thin pages.

### J-07 Add editorial legal-page usability carefully

- `Priority`: P2
- `Status`: BENCHMARK
- `Effort`: M
- `Existing item`: `I-330`.
- `Work`: restrained summaries, table of contents, print style, last-updated,
  contact/recovery, and readable line length.
- `Acceptance`: legal meaning and hierarchy remain exact; keyboard, print, and
  mobile reading improve.

### J-08 Complete legal identity and policy review

- `Priority`: P0
- `Status`: OWNER + EXTERNAL
- `Effort`: M
- `Required`: legal entity, registration number, address/contact, terms,
  privacy, cookies, accessibility, shipping, returns, warranty, promotions,
  personalized goods, supplier orders, and data retention.
- `Acceptance`: counsel approves; footer and checkout expose only applicable
  facts; version/effective date are recorded.

### J-09 Validate cookie and analytics behavior

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: M
- `Work`: pre-consent network, categories, withdrawal, persistence, region,
  accessibility, script blocking, and policy consistency.
- `Acceptance`: optional tracking does not fire before consent where prohibited;
  withdrawal is effective and observable.

### J-10 Define content governance

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Work`: owner, source, locale, legal sensitivity, review date, expiration,
  route, and rollback for every public claim and policy.
- `Acceptance`: stale or unowned claims are reportable; `SITE_COPY_MAP` remains
  synchronized but is not treated as editorial approval.

### J-11 Add social proof only when real

- `Priority`: P2
- `Status`: OWNER
- `Effort`: M
- `Source`: homepage backlog `1.3`.
- `Work`: decide allowed source types, consent, moderation, date, product/order
  verification, rating calculation, and negative-review policy.
- `Acceptance`: no invented customer count, press logo, rating, or testimonial;
  source and permission are retained.

### J-12 Validate internationalization boundaries

- `Priority`: P2
- `Status`: OWNER
- `Effort`: M
- `Work`: decide supported language, country, currency, tax, delivery, phone,
  and timezone behavior; do not expose selectors for unsupported service.
- `Acceptance`: every selectable locale is complete across catalog, checkout,
  policy, email, service, and SEO.

---

## 15. Workstream K: Operations, Admin, Security, and Reliability

### K-01 Prove authenticated admin workflows

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: L
- `Gap`: production smoke proves logged-out/admin-protected behavior, not real
  authenticated catalog, order, inventory, service, appointment, integration,
  notification, or audit workflows.
- `Acceptance`: role-scoped E2E tests cover critical read/write actions with
  safe fixtures and audit assertions.

### K-02 Complete role and permission review

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: M
- `Work`: least privilege, disabled users, session expiry, sensitive exports,
  customer data, refunds, catalog publishing, inventory, campaigns, and audit.
- `Acceptance`: security review finds no privilege escalation or unlogged
  sensitive mutation.

### K-03 Build operational runbooks

- `Priority`: P0
- `Status`: NOW + OWNER
- `Effort`: L
- `Required runbooks`: payment outage, webhook delay, supplier failure, price
  mismatch, oversell, email outage, AI outage, search outage, DB outage,
  credential rotation, customer data request, and rollback.
- `Acceptance`: a second operator can diagnose, contain, communicate, and
  recover using the runbook without tribal knowledge.

### K-04 Establish SLOs and alert ownership

- `Priority`: P1
- `Status`: OWNER + NOW
- `Effort`: M
- `Scope`: availability, checkout creation, payment callbacks, outbox age,
  webhook failures, search latency, AI fallback, email delivery, and job health.
- `Acceptance`: alerts are actionable, deduplicated, privacy-safe, and tested;
  every alert has an owner and escalation path.

### K-05 Complete inventory correctness testing

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: L
- `Work`: concurrent carts, reservations, expiration, cancellation, payment
  race, admin adjustment, oversell, supplier ownership, and ledger repair.
- `Acceptance`: invariants hold under concurrency; Shopify inventory never
  enters the local ownership ledger.

### K-06 Add catalog and provider drift detection

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Work`: price, availability, variant mapping, unpublished products, webhook
  registration, token scopes, stale sync, and provider configuration.
- `Acceptance`: drift is detected before a customer reaches checkout and has a
  documented safe response.

### K-07 Validate backups and recovery

- `Priority`: P0
- `Status`: EXTERNAL + MEASURE
- `Effort`: M
- `Work`: database backup, restore drill, retention, media recovery, secrets,
  provider configuration, RPO/RTO, and audit evidence.
- `Acceptance`: restore drill meets approved RPO/RTO and does not expose
  production customer data in an unsafe environment.

### K-08 Perform application security review

- `Priority`: P0
- `Status`: MEASURE
- `Effort`: L
- `Scope`: auth, OTP, sessions, admin, IDOR, CSRF, XSS, SSRF, upload, webhooks,
  rate limiting, secrets, logs, AI tools, prompt injection, and dependency risk.
- `Acceptance`: no critical/high unresolved issue; remediation and retest are
  recorded.

### K-09 Validate privacy and retention implementation

- `Priority`: P0
- `Status`: OWNER + MEASURE
- `Effort`: L
- `Work`: retention matrix for orders, payments, OTP, attachments, AI runs,
  analytics, push, service, audit, and provider mirrors; deletion/anonymization
  jobs and legal holds.
- `Acceptance`: policy and implementation agree; scheduled verification proves
  expiry and deletion.

### K-10 Decide dashboard automation strategy

- `Priority`: P2
- `Status`: DEFER
- `Effort`: M
- `Existing item`: `I-016`.
- `Decision`: prefer Shopify API/CLI evidence; use dashboard evidence only for
  facts unavailable through supported APIs and with human login.
- `Acceptance`: no critical release check depends on brittle Cloudflare-blocked
  automation.

### K-11 Resolve or document Windows prebuilt limitation

- `Priority`: P3
- `Status`: DEFER
- `Effort`: M
- `Existing item`: `I-017`.
- `Acceptance`: WSL/permissions workaround passes or remote Vercel build is
  explicitly the supported release path.

### K-12 Decide physical boutique scope

- `Priority`: P2
- `Status`: OWNER
- `Effort`: M decision, L implementation
- `Existing item`: `I-336`.
- `Acceptance`: either maintain a truthful online-only service route or provide
  verified location, hours, services, appointment routing, map, and closure
  handling for every active branch.

---

## 16. Workstream L: QA, Measurement, and Release Proof

### L-01 Replace checklist completion with outcome evidence

- `Priority`: P0
- `Status`: NOW
- `Effort`: M
- `Work`: every “implemented and checked” claim links to current artifact,
  environment, commit, route, state, and residual risk.
- `Acceptance`: stale evidence is detectable; local fixture proof is never
  presented as live production proof.

### L-02 Stabilize browser evidence collection

- `Priority`: P1
- `Status`: NOW
- `Effort`: M
- `Existing item`: `I-338`.
- `Work`: use a maintained agent-browser or Playwright path that records
  screenshots, console, failed requests, status expectations, and geometry;
  shard long runs.
- `Acceptance`: repeated runs complete within budget and produce comparable
  artifacts.

### L-03 Add visual regression with human approval boundaries

- `Priority`: P1
- `Status`: NOW
- `Effort`: L
- `Source`: homepage backlog `8.4`.
- `Work`: deterministic fixtures, stable media loading, key widths, masks only
  for true nondeterminism, baseline review, and route ownership.
- `Acceptance`: objective regressions fail automatically; subjective design is
  never auto-approved by pixel similarity.

### L-04 Build the full state matrix

- `Priority`: P0
- `Status`: NOW
- `Effort`: L
- `Required dimensions`: anonymous/authenticated/admin, own/supplier/mixed,
  empty/populated, loading/error/recovery, mobile/tablet/desktop, keyboard,
  reduced motion, offline/online, and provider available/unavailable.
- `Acceptance`: every P0 journey has at least one deterministic test per
  applicable state.

### L-05 Refresh production deployment evidence

- `Priority`: P0
- `Status`: NOW after release
- `Effort`: S
- `Gap`: current ledger is dated 2026-06-01 and has a pending commit SHA while
  the workspace includes later homepage work.
- `Acceptance`: commit SHA, deployment URL/ID, alias, health, smoke, clean log
  window, and residual risk match the current production release.

### L-06 Add real transaction canaries

- `Priority`: P0
- `Status`: EXTERNAL
- `Effort`: M
- `Work`: scheduled or pre-release low-value own and supplier transactions,
  refund/void, webhook observation, email, mirror, and reconciliation.
- `Acceptance`: canary has approved cost, test identity, cleanup, alerting, and
  no contamination of business analytics.

### L-07 Define product analytics correctly

- `Priority`: P1
- `Status`: NOW + OWNER
- `Effort`: M
- `Required funnel`: landing, discovery, search, PDP, variant/size, wishlist,
  cart, checkout start, provider handoff, payment success, order, delivery,
  return, service, and repeat purchase.
- `Acceptance`: event schema, deduplication, consent, identity boundaries,
  source, and attribution are documented and tested.

### L-08 Establish experiment governance

- `Priority`: P2
- `Status`: OWNER
- `Effort`: M
- `Work`: hypothesis, primary metric, guardrails, sample size, duration,
  segmentation, stopping rule, accessibility, and rollback.
- `Acceptance`: no A/B test changes legal truth, pricing integrity, or core
  accessibility; low-traffic tests do not produce false certainty.

### L-09 Run comparative usability studies

- `Priority`: P0 for final claim
- `Status`: MEASURE
- `Effort`: L
- `Tasks`: discover a gift, find a ring under a budget, assess material and fit,
  choose a size, understand delivery/returns, seek advisor help, complete
  checkout, find order status, and start care/return.
- `Acceptance`: Elysia beats the comparison baseline on completion, time,
  errors, confidence, and preference without prompting.

### L-10 Run trust and luxury perception research

- `Priority`: P0 for final claim
- `Status`: MEASURE
- `Effort`: M
- `Work`: blind and branded evaluation of distinctiveness, quality, desire,
  trust, authenticity, price confidence, and service expectation.
- `Acceptance`: thresholds are defined before results are seen; findings link
  to concrete workstreams.

### L-11 Create a release scorecard

- `Priority`: P1
- `Status`: STARTED
- `Effort`: M
- `Fields`: P0 blockers, catalog completeness, media completeness, paid-flow
  proof, WCAG, CWV, security, provider health, visual matrix, production smoke,
  clean log window, legal sign-off, and rollback readiness.
- `Acceptance`: a release cannot be labeled “Tiffany-surpassing” through prose
  while any required field is missing.
- `Progress`: implemented `pnpm release:scorecard` (`scripts/release-scorecard.ts`,
  `scripts/lib/release-scorecard.ts`, `scripts/release-scorecard.test.ts`). Every
  required field defaults to `MISSING` and only a `PASS` counts; any
  `MISSING/PENDING/FAIL` keeps the verdict `NOT READY`. Catalog and media
  completeness are derived from a `catalog-readiness.json` artifact so the
  scorecard cannot claim completeness while the audit fails. The current Wave 0
  scorecard is `1/15` satisfied (production smoke only). Evidence:
  `docs/qa/release-scorecard.md`, `docs/qa/release-scorecard-wave-0.json`, and
  `artifacts/qa/2026-06-19-wave-0-release-scorecard/`. The strict slice gate is
  now wired as the manual `gate:release-slice`/`gate:slice` artifact gate, but
  remains outside automatic `gate:release` because the remaining fields are
  owner/external blocked.

### L-12 Schedule benchmark refresh

- `Priority`: P2
- `Status`: NOW
- `Effort`: S, recurring
- `Work`: quarterly official-source review of Tiffany and the 15-site High
  Jewelry Reference Gate; archive date, URL, observation, and access failures.
- `Acceptance`: public policy does not fossilize around old screenshots or
  transient competitor patterns.

---

## 17. Existing Backlog Reconciliation

| Existing item                          | Destination in this plan  | Action                                    |
| -------------------------------------- | ------------------------- | ----------------------------------------- |
| `I-302` mobile rail density            | E-07                      | Benchmark, then implement if supported    |
| `I-305` expected 404 QA                | E-09                      | Implement harness support now             |
| `I-306` authenticated account evidence | I-01/I-02                 | Build fixture/auth state, then review     |
| `I-307` all-products QA runtime        | E-08/L-02                 | Shard runs                                |
| `I-328` product story                  | F-07                      | Keep secondary to facts/service           |
| `I-330` legal editorial styling        | J-07                      | Benchmark after legal review              |
| `I-331` AI concierge promotion         | A separate exception only | Do not promote by default                 |
| `I-332` media diversity                | B-01 through B-08         | Elevate to P0/P1 program                  |
| `I-333` verified specifications        | C-01/F-01                 | Elevate to P0                             |
| `I-334` supplier merchandising         | C-07                      | Benchmark after supplier facts            |
| `I-335` AI reliability                 | L-04 plus provider work   | Stabilize before visual expansion         |
| `I-336` physical branches              | K-12                      | Explicit online-only vs physical decision |
| `I-338` browser harness                | L-02                      | Replace brittle dependency if needed      |
| `I-011` supplier connection            | G-01                      | P0 external                               |
| `I-012` paid Shopify test              | G-02                      | P0 external                               |
| `I-013` fulfillment proof              | G-03                      | P0 external                               |
| `I-014` CardCom credentials            | G-04                      | P0 external                               |
| `I-015` SMS credentials                | H-08                      | Deferred until channel decision           |
| `I-016` Shopify UI automation          | K-10                      | Prefer API evidence                       |
| `I-017` local Vercel prebuilt          | K-11                      | Document supported remote path            |

Homepage backlog reconciliation:

- The implementation-pass items listed at the top of
  `docs/HOMEPAGE_IMPROVEMENTS.md` are treated as implemented but still need the
  manual and field verification in D-03, J-01, J-03, J-05, and L-05.
- Legal identity, social proof, promotions, and policy phrasing remain D-04 and
  J-08/J-11 owner blockers.
- Hero, rhythm, crop, bilingual, accessibility, performance, SEO, and device
  items are not assumed complete merely because the page passes objective route
  QA.

---

## 18. Execution Waves

### Wave 0 execution progress: 2026-06-19

- `B-01/B-02/B-08`, `C-01/C-03`, and `L-01` started through the new
  `pnpm catalog:readiness` audit.
- The first database baseline reviewed 300 active products and found 0
  publish-ready products, 874 blockers, and 1,226 high-severity findings.
- The dominant gaps are missing fact/policy verification ownership, absent
  structured specifications, incomplete and unclassified media, stale local
  media references, and cross-product media duplication.
- Evidence is recorded in
  `docs/qa/catalog-readiness-wave-0-baseline.md` and generated JSON/Markdown
  artifacts under `artifacts/qa/2026-06-19-wave-0-catalog-readiness`.
- The governed schema and migration now cover specifications, fact/policy
  sources, verifier identity, verification timestamps, and explicit media roles.
- Admin creation and supplier sync are draft-first; activation reports exact
  truth/policy/media/price/source blockers. Public PDP fact and product-policy
  rows render only after verification.
- `I-01` now has a repeatable authenticated customer fixture behind
  `E2E_AUTH_FIXTURES=1`, covering customer profile, address, saved size,
  wishlist, local order, return request, Shopify mirror order, privacy export,
  and OTP login without manual customer data.
- The Playwright production-build harness now has an explicit
  `E2E_SKIP_SERWIST_BUILD=1` escape hatch for non-PWA tests. Full
  service-worker evidence remains a separate PWA smoke requirement without
  that flag.
- The same harness now resolves its database from `E2E_DATABASE_URL`, shell
  `DATABASE_URL`, or `.env.development.local`, which keeps local production E2E
  on the same reachable database used by `next dev`.
- The web server command now goes through `tests/e2e/global-setup.ts`,
  `scripts/playwright-web-server.mjs`, and `tests/e2e/global-teardown.ts` to
  run `next build`, start `next start`, and clean up the process tree after
  Playwright exits without relying on the built-in `webServer` plugin.
- Visual QA now understands route-level expected statuses. The intentional
  `/category/not-a-real-category` recovery route is expected `404`, without
  hiding unrelated same-origin failures.
- Long all-product visual reviews can now be split with `--route-shard 1/4`
  style route shards while preserving the browser and viewport matrix for the
  selected route subset.
- The post-schema baseline still has 0 of 300 products ready, 874 blockers, and
  2,426 high findings. This is owner/asset debt, not a reason to fabricate data.
- L-05 production evidence was refreshed on 2026-06-21 for commit
  `f59b4a8dbdcffcfa662add7e4a3f6593d9739d1d` and deployment
  `dpl_8F4hp3EBXado63ycn6RHQ7XPSEmB`. Production smoke passed on
  `https://elysia-jewellery.com`, including the `/search` fallback states
  fixed after a Typesense 403 regression, and the current error-log scan found
  no errors. The deployment was about 11 minutes old at refresh time, so the
  60-minute post-alias clean error window remains pending and is recorded as
  residual risk rather than complete.
- Immediate action 6 started through
  `docs/qa/wave-0-owner-evidence-register.md`, which defines required owner
  roles, acceptance owners, evidence locations, target-date fields, and
  repository-safe proof requirements for G-01 through G-04 and J-08. The actual
  owners and dates remain unassigned rather than fabricated.
- The catalog readiness baseline was converted into
  `docs/qa/catalog-readiness-remediation-plan.md`, which breaks the 874
  blockers and 2,426 high findings into owner work packages: priority slice,
  product truth intake, policy verification, media replacement, non-ready
  product policy, and strict audit rerun.
- `docs/qa/catalog-owner-intake-template.md` now defines the exact owner-facing
  fields needed to collect verified product truth, policy approval, and six-role
  media evidence without inventing missing facts. `pnpm catalog:intake` now
  generates CSV scaffolds from catalog-readiness artifacts,
  `pnpm catalog:intake:validate` blocks incomplete or malformed owner evidence,
  `pnpm catalog:intake:apply` creates a dry-run/apply plan for approved rows,
  `pnpm catalog:readiness -- --scope-file <owner-intake.csv>` can verify the
  same release slice without ignoring full-catalog media duplication, and
  `pnpm release:slice-gate` ties the validation, apply, readiness, quality, and
  scorecard artifacts into one strict release-scope verdict. The current
  generated `2026-06-21-unblocked-current-*` artifact set still resolves to
  `NOT READY`: owner intake is incomplete, no apply artifact exists, readiness
  and quality remain blocked, and the scorecard is `1/15`.
- `I-341` tracks owner data, class-specific attributes, asset remediation, and
  final release-gate activation. Wave 0 remains in progress.
- `L-11` release scorecard tooling now exists through `pnpm release:scorecard`.
  It enforces that a release cannot be called "Tiffany-surpassing" while any
  required field is missing, pending, or failing, and derives catalog/media
  completeness from the catalog-readiness audit. The current Wave 0 scorecard is
  `1/15` satisfied (production smoke only) and resolves to `NOT READY`. Evidence:
  `docs/qa/release-scorecard.md`, `docs/qa/release-scorecard-wave-0.json`, and
  `artifacts/qa/2026-06-19-wave-0-release-scorecard/`.

### Wave 0: Truth and proof foundation

Start criteria: immediate.

Included:

- C-01, C-03, C-04.
- D-04.
- G-01 through G-04.
- H-01 and H-07.
- I-01, I-06, I-07.
- J-08, J-09.
- K-01 through K-03, K-05, K-07 through K-09.
- L-01, L-04, L-05, L-07, L-11.

Exit criteria:

- Verified fact model and legal policy exist.
- Real payment and supplier plan has owners and booked execution.
- Authenticated test fixtures exist.
- Current production evidence is tied to a commit.
- No public placeholder or unsupported promise remains.

### Wave 1: House identity, collections, and media

Start criteria: fact ownership is clear.

Included:

- A-01 through A-05.
- B-01 through B-08.
- C-05, C-07, C-08.

Exit criteria:

- Approved house platform and visual code system.
- Priority catalog has complete unique media.
- Collections have distinct product and visual worlds.
- Asset and catalog governance blocks incomplete publication.

### Wave 2: Discovery and PDP authority

Start criteria: priority assets and facts are available.

Included:

- E-01 through E-10.
- F-01 through F-11, excluding deferred F-12.
- D-05.

Exit criteria:

- Search evaluation targets pass.
- All-products visual and PDP state matrix passes.
- Product facts, size, care, availability, service, and media are complete.
- Recommendations and mobile density remain subordinate to purchase confidence.

### Wave 3: Real commerce and clienteling

Start criteria: provider and supplier dependencies are available.

Included:

- G-02 through G-11.
- H-02 through H-10.
- I-02 through I-08.
- A-06.

Exit criteria:

- Own and supplier paid orders complete.
- Supplier fulfillment and reconciliation are proven.
- Appointment, service, return, and care journeys have real operational owners.
- Account and communication reflect actual order/service state.

### Wave 4: Reduction, polish, and field quality

Start criteria: strong content and real journeys exist.

Included:

- D-01 through D-03 and D-06 through D-08.
- J-01 through J-07 and J-10 through J-12.
- K-04, K-06.
- L-02, L-03, L-06.

Exit criteria:

- WCAG 2.2 AA review passes.
- Production CWV and SLOs pass.
- Homepage/global chrome are reduced around proven content.
- Current visual, production, and canary evidence is complete.

### Wave 5: Comparative proof

Start criteria: no P0 blocker and at least 30 days of stable operations.

Included:

- A-08.
- L-08 through L-10 and L-12.
- I-09.

Exit criteria:

- Comparative task and perception research meets pre-registered thresholds.
- Weighted scorecard meets the claim gate.
- Product, brand, operations, and legal approve the wording and evidence date.

---

## 19. Required Owners

The program cannot be completed by engineering alone.

| Owner                    | Non-delegable decisions                                               |
| ------------------------ | --------------------------------------------------------------------- |
| Founder/brand            | Positioning, collection strategy, claims, campaign, house codes       |
| Creative director        | Photography, art direction, crop, styling, asset approval             |
| Merchandising            | Assortment, collection membership, ranking, launches, pricing         |
| Product                  | Priorities, research, journeys, measurement, acceptance               |
| Engineering              | Data model, implementation, reliability, tests, observability         |
| Operations               | Payment, supplier, fulfillment, returns, repair, service ownership    |
| Customer service         | Channels, response promise, case handling, escalation                 |
| Legal/privacy            | Entity, policies, consent, retention, claims, accessibility statement |
| Accessibility specialist | Manual WCAG and assistive-technology review                           |
| Security reviewer        | Threat model, penetration review, remediation validation              |
| Analytics/research       | Event quality, field metrics, comparative studies                     |

Every P0 item must have one directly responsible owner, one acceptance owner,
and a target evidence date before work begins.

---

## 20. Explicit Non-Goals

The following do not count as progress toward surpassing Tiffany unless they
solve a measured gap:

- More gradients, glass, decorative motion, badges, or floating controls.
- More homepage sections.
- More AI prominence.
- More generic “luxury,” “timeless,” “crafted,” or “premium” copy.
- A larger automated test count without state or production coverage.
- Generated lifestyle images that do not depict the actual product accurately.
- Press logos, reviews, ratings, customer counts, discounts, delivery promises,
  materials, certifications, origin, or warranties without evidence.
- Combining own and supplier checkout to look simpler while making payment and
  fulfillment less truthful.
- Treating a local fixture, 200 response, screenshot, or static source test as
  proof of paid production behavior.
- Copying Tiffany's visual language instead of building Elysia's own authority.

---

## 21. Final Claim Checklist

Do not state “Elysia has surpassed Tiffany” until every item below is checked.

- [ ] No P0 item in this document remains open.
- [ ] Legal identity and all public policies are approved and current.
- [ ] Every published priority product has complete verified facts.
- [ ] Every published priority product has the required unique media set.
- [ ] No public legal/material placeholder remains.
- [ ] Real own-product payment passes end to end.
- [ ] Real supplier payment and fulfillment pass end to end.
- [ ] Payment and order reconciliation are operational.
- [ ] Returns, cancellation, service, and care ownership are proven.
- [ ] Authenticated customer and admin matrices pass.
- [ ] WCAG 2.2 AA manual review passes.
- [ ] Production p75 Core Web Vitals meet target.
- [ ] Security review has no unresolved critical/high issue.
- [ ] Backup restore drill meets RPO/RTO.
- [ ] Production evidence points to the current commit and deployment.
- [ ] Comparative usability study meets predefined thresholds.
- [ ] Blind luxury/trust/distinctiveness study meets predefined thresholds.
- [ ] Weighted comparative score is at least `4.6/5`.
- [ ] Elysia leads Tiffany by at least `0.2` overall under the same rubric.
- [ ] Evidence is less than 90 days old.
- [ ] Product, brand, operations, and legal approve the claim.

Until then, the accurate statement is:

> Elysia is a technically mature, increasingly distinctive luxury-jewelry
> commerce product with several UX advantages. It has not yet proven complete
> brand, media, transaction, fulfillment, service, and customer-preference
> superiority over Tiffany.

---

## 22. Immediate Next Actions

The first executable batch should be narrow and evidence-producing:

1. Create a product-data completeness report for all active products and list
   every missing verified field from C-01.
   `DONE: docs/qa/catalog-readiness-wave-0-baseline.md and
docs/qa/catalog-readiness-remediation-plan.md now record the current
database-source product truth gaps and remediation sequence.`
2. Generate a duplicate-media and media-completeness report for every active
   product from B-01/B-02.
   `DONE: docs/qa/catalog-readiness-wave-0-baseline.md and
docs/qa/catalog-readiness-remediation-plan.md now record stale media,
duplicate media, media-count, and media-role gaps from the generated audit.`
3. Add authenticated customer fixture/auth state for I-01.
4. Add expected-status support and QA sharding for E-08/E-09/L-02. `DONE:
route-level expected statuses and --route-shard are implemented.`
5. Refresh production ledger evidence for the current release under L-05.
   - `DONE`: `docs/qa/production-deployment-evidence-ledger.md` now points to
     commit `f59b4a8dbdcffcfa662add7e4a3f6593d9739d1d` and production
     deployment `dpl_8F4hp3EBXado63ycn6RHQ7XPSEmB`, with smoke and a clean
     current error-log scan. The 60-minute clean-log window is explicitly
     pending because the deployment had not been live for 60 minutes when the
     ledger was refreshed.

6. Assign owners and target evidence dates to G-01 through G-04 and J-08.
   - `STARTED`: `docs/qa/wave-0-owner-evidence-register.md` now defines the
     owner roles, acceptance-owner fields, evidence locations, and safe
     repository summary rules. Named owners and target dates remain
     `UNASSIGNED` until the responsible business/legal/operations owners accept
     them.

7. Commission A-01/A-02 only after the fact and asset inventory is visible, so
   brand direction is built around real products rather than placeholder media.

This batch produces the information needed to estimate the remaining program
without pretending that missing facts, assets, providers, and customer evidence
are engineering details.
