# Elysia Customer Site — Master Improvement Plan

Marker: `CUSTOMER_SITE_MASTER_IMPROVEMENT_PLAN`

Status: consolidating over-document for the customer-facing storefront.

Last reviewed: 2026-07-02.

## 0. What this document is

This is the single, exhaustive map of every improvement thread that touches the
**customer-facing site** — the public storefront a shopper, guest, or logged-in
customer uses. It aggregates work that today lives scattered across the
benchmark, homepage backlog, catalog readiness, QA ledgers, and the Tiffany
gap plan into **one prioritized, route-aware, wave-sequenced picture**.

It exists because the improvement knowledge is real but fragmented: the master
gap plan is organized by workstream (A–L), the homepage backlog by section, the
catalog work by finding code, and the QA folder by benchmark. A reader who asks
"what is the complete set of things we still want to do to the customer site,
and in what order?" currently has to reassemble the answer from a dozen files.
This document answers that question in one place.

### 0.1 Authority — this document does not replace

This is an **index and consolidation layer**, not a new gate and not a new source
of truth. When any tension exists, the following retain precedence and their own
detail:

1. Mandatory legal, accessibility, payment, security, privacy, and SEO
   requirements.
2. `docs/PUBLIC_CHANGE_GATE.md` — the High Jewelry Reference Gate and public
   change process.
3. `docs/FULL_PRODUCT_BENCHMARK.md` — the public structure benchmark.
4. `docs/ELYSIA_DESIGN_MANIFESTO.md` — house point of view and restraint rules.
5. `docs/TIFFANY_SURPASS_MASTER_PLAN.md` — the master execution plan with the
   authoritative item definitions, acceptance criteria, and claim gate.

Where this document lists an item, the **canonical definition lives in the
source doc** (usually the Tiffany gap plan workstream ID). This file adds:
scope framing, the route-by-route lens, cross-referencing, and a consolidated
wave view. It never invents an acceptance criterion that contradicts its source.

### 0.2 Non-negotiable ground rules (inherited)

- **Do not invent facts.** No legal entity, registration number, material,
  purity, origin, warranty, shipping promise, delivery guarantee, discount,
  rating, review, press logo, customer count, or certification without verified
  owner-provided evidence. Missing fact → hide the field, do not fabricate it.
- **Reduction creates value.** More sections, badges, gradients, floating
  controls, AI prominence, or generic "luxury/timeless/crafted" copy is not
  progress. See `TIFFANY_SURPASS_MASTER_PLAN.md` §20 Non-Goals.
- **Hebrew-first RTL is preserved** on every route. `dir="rtl"` on the root
  stays; layout work must keep RTL correct.
- **Evidence over checklist.** "Implemented" is not "verified." Runtime claims
  need current artifacts tied to a commit (L-01, L-05).
- **Design tokens, not arbitrary values.** Use the CSS variables in
  `src/styles/globals.css` (`--brand-*`, `--glass-*`, `--motion-*`, `--ui-*`).
- **Copy-map sync.** Any change to public copy/markup requires `pnpm copy:sync`
  or the build fails on a stale `docs/SITE_COPY_MAP.md`.

## 1. Scope — what "the customer site" is

### 1.1 In scope (public storefront routes)

| Route | Path | Archetype |
| --- | --- | --- |
| Home | [/](src/app/page.tsx) | Brand + commerce entry |
| Category | [/category/[slug]](src/app/category/[slug]/page.tsx) | Commerce listing |
| Search | [/search](src/app/search/page.tsx) | Commerce listing |
| Gifts | [/gifts](src/app/gifts/page.tsx) | Guided commerce listing |
| Product (PDP) | [/product/[slug]](src/app/product/[slug]/page.tsx) | Purchase authority |
| Checkout | [/checkout](src/app/checkout/page.tsx) | Payment |
| Wishlist | [/wishlist](src/app/wishlist/page.tsx) | Decision tool |
| Account home | [/account](src/app/account/page.tsx) | Ownership |
| Order detail | [/account/orders/[id]](src/app/account/orders/[id]/page.tsx) | Ownership |
| Invoices | [/account/invoices](src/app/account/invoices/page.tsx) | Ownership |
| Service | [/service](src/app/service/page.tsx) | Service/clienteling |
| Stylist | [/stylist](src/app/stylist/page.tsx) | Advisory |
| AI concierge | [/ai](src/app/ai/page.tsx) | Assistive (demoted by default) |
| Blog index / post | [/blog](src/app/blog/page.tsx), [/blog/[slug]](src/app/blog/[slug]/page.tsx) | Editorial |
| Branches | [/branches](src/app/branches/page.tsx) | Service/location |
| About | [/about](src/app/about/page.tsx) | Brand proof |
| Size guide | [/size-guide](src/app/size-guide/page.tsx) | Fit confidence |
| Jewellery care | [/jewellery-care](src/app/jewellery-care/page.tsx) | Ownership content |
| Warranty | [/warranty](src/app/warranty/page.tsx) | Trust/legal |
| Shipping & returns | [/shipping-returns](src/app/shipping-returns/page.tsx) | Trust/legal |
| FAQ | [/faq](src/app/faq/page.tsx) | Service recovery |
| Privacy | [/privacy](src/app/privacy/page.tsx) | Legal |
| Terms | [/terms](src/app/terms/page.tsx) | Legal |
| Accessibility | [/accessibility](src/app/accessibility/page.tsx) | Legal/a11y |
| Content pages | [/p/[slug]](src/app/p/[slug]/page.tsx) | Editorial/legal |
| Offline (PWA) | [/offline](src/app/offline/page.tsx) | Recovery |

Global surfaces in scope: `SiteHeader`, `SiteFooter`, navigation/taxonomy,
cart, mobile buy bar, cookie/consent layer, accessibility widget, sticky
chrome, transactional email/PWA-push copy that a customer receives, and the
service-worker offline experience.

### 1.2 Out of scope

- `src/app/admin/**` — the admin/ERP/CRM console (see
  `docs/ERP_CRM_MASTER_BLUEPRINT.md`).
- `src/app/vendor-portal/**` — supplier surface.
- Backend/operations except where they directly determine a public promise
  (availability, delivery window, payment, reconciliation). Those are tracked
  here only as **dependencies** of a customer-visible outcome, with the detail
  owned by the Tiffany plan workstreams G/H/K/L.

## 2. Priority & status model (shared vocabulary)

Reused verbatim from `TIFFANY_SURPASS_MASTER_PLAN.md` §3 so IDs trace cleanly.

**Priority:** `P0` blocks real commerce, legal truth, or a defensible claim ·
`P1` largest luxury/trust/conversion gap · `P2` depth & polish · `P3`
optimization after the core is proven.

**Status:** `NOW` (buildable today) · `BENCHMARK` (needs Reference Gate evidence
first) · `OWNER` (needs verified facts/assets/policy/decision) · `EXTERNAL`
(needs provider/supplier/customer/legal/production action) · `MEASURE` (needs
observation/research first) · `DEFER` (excluded until a named condition).

## 3. Source-document consolidation map

Every existing improvement source and where its threads land in this document.

| Source | Covers | Consolidated here as |
| --- | --- | --- |
| `TIFFANY_SURPASS_MASTER_PLAN.md` | Workstreams A–L, waves 0–5, claim gate | §4 workstream index + §5 routes (canonical detail stays there) |
| `HOMEPAGE_IMPROVEMENTS.md` | Home section-by-section backlog | §5 Home row + D-01…D-08 |
| `ELYSIA_DESIGN_MANIFESTO.md` | House taste, restraint, composition | §0.2 ground rules + every §5 row |
| `FULL_PRODUCT_BENCHMARK.md` | Public structure archetypes | §1.1 archetypes + §5 acceptance |
| `PUBLIC_CHANGE_GATE.md` | High Jewelry Reference Gate process | §0.1 authority (BENCHMARK status) |
| `SITE_COPY_MAP.md` | Copy inventory + build gate | §0.2 copy-map rule + A-03/A-04 |
| `qa/catalog-readiness-*`, `catalog-quality-report.md` | Catalog truth/media debt | §5 Category/PDP + workstreams B/C |
| `qa/*-benchmark.md` (per-route) | Route-level UX evidence | §5 per-route "Evidence" column |
| `qa/production-deployment-evidence-ledger.md` | Live release proof | §6 wave exit / L-05 |
| `qa/release-scorecard.md` | Claim-gate readiness | §7 acceptance |
| `PROJECT_TASKS.md`, `I-*` backlog | Legacy item IDs | reconciled in Tiffany plan §17 |

## 4. Cross-cutting workstream index (customer-site slice)

The full definitions live in `TIFFANY_SURPASS_MASTER_PLAN.md`. This is the
one-line orientation of each workstream **as it affects the customer site**.

| WS | Theme | Customer-site meaning | Lead priority |
| --- | --- | --- | --- |
| A | Brand authority & house codes | Recognizable identity, bilingual voice, collections, evidence-backed copy, ownership tone | P1 |
| B | Product media & art direction | Unique inspection-grade media set per product; no duplicate/cross-product reuse | P0 |
| C | Product truth & merchandising data | Verified specs, governed attributes, publish-readiness, price/promotion truth, collections | P0 |
| D | Home & global chrome | Shorter home, unmistakable hero, header taxonomy, footer density, non-intrusive chrome, motion grammar | P1 |
| E | Discovery — search/category/gifts | Taxonomy, semantic search quality, filters/sort, gift decisions, rail density, measurement | P1 |
| F | PDP & purchase authority | Class-specific facts, size/fit, availability/delivery truth, care/warranty, story, recs, structured data | P0 |
| G | Cart / checkout / payment / order | Proven paid flows (own + supplier), confirmation truth, delivery promise, reconciliation, refunds | P0 |
| H | Service, appointments, ownership care | Service promise, real appointment journey, advisor handoff, repair/return intake, case timeline | P0 |
| I | Account, wishlist, post-purchase | Auth fixtures, order timeline, wishlist as decision tool, consent, privacy export/delete, comms | P0 |
| J | Content, SEO, a11y, performance | WCAG 2.2 AA, CWV, technical SEO, Hebrew content model, legal identity/policy, cookies, social proof | P0 |
| L | QA, measurement, release proof | Evidence discipline, state matrix, visual regression, canaries, analytics, comparative studies | P0 |

(Workstream K — operations/admin/security — is out of customer-site scope
except as a dependency; see §1.2.)

## 5. Route-by-route improvement matrix

This is the consolidation heart. For each public route: the current posture,
the concrete improvement themes (with owning workstream IDs), the gating
priority, and the route's existing QA evidence. Item detail and acceptance
live in the referenced workstream item.

### 5.1 Home — [/](src/app/page.tsx)

- **Posture:** polished but long; hero + shortcuts + gift finder + categories +
  featured + materials + story + newsletter + large footer.
- **Improvements:** reduce length & duplicate intent (D-01); unmistakable house
  hero, one dominant action (D-02); resolve factual blockers — legal identity,
  real social proof, real promotions (D-04, J-08, J-11); rationalize header
  taxonomy (D-05); footer density (D-06); remove intrusive floating chrome
  (D-07); normalize motion (D-08); manual a11y/CWV/rich-results validation
  (D-03, J-01, J-03, J-05).
- **Priority:** P0 for factual blockers + manual validation; P1 for reduction.
- **Evidence:** `qa/homepage-discovery-commerce-balance-benchmark.md`,
  `HOMEPAGE_IMPROVEMENTS.md`.

### 5.2 Category — [/category/[slug]](src/app/category/[slug]/page.tsx)

- **Posture:** commerce listing; must lead with count/filters/sort/active
  refinements over storytelling.
- **Improvements:** taxonomy audit with customer evidence (E-01); filter/sort
  validation — labels, counts, combinations, URL persistence, mobile sheet,
  active chips, reset, keyboard/SR (E-04); merchandiser-aware ranking (E-03);
  collection-led context without scroll-gating products (E-05); no-result
  recovery depth; all-products visual consistency (E-08); intentional-404
  recovery testable (E-09). Depends on catalog media/truth (B, C).
- **Priority:** P1.
- **Evidence:** `qa/category-active-filter-sort-clarity-benchmark.md`,
  `qa/category-no-result-recovery-depth-benchmark.md`.

### 5.3 Search — [/search](src/app/search/page.tsx)

- **Posture:** Typesense + vector semantic search, `AI_SEMANTIC_SEARCH_ENABLED`
  gated; recent Typesense 403 fallback regression fixed (L-05 ledger).
- **Improvements:** labeled query eval set incl. Hebrew morphology,
  transliteration, misspellings, no-match intent (E-02); merchandiser-aware
  ranking (E-03); filter density (E-04); guided empty-state recovery; silent
  provider fallback with no console noise; discovery measurement (E-10).
- **Priority:** P1.
- **Evidence:** `qa/search-empty-state-guided-recovery-benchmark.md`,
  `qa/search-category-filter-density-benchmark.md`.

### 5.4 Gifts — [/gifts](src/app/gifts/page.tsx)

- **Posture:** guided listing; risk of becoming a long editorial landing page.
- **Improvements:** rework around decisions — occasion, recipient, budget,
  material, delivery urgency; preserve route-backed filters; reach a viable
  shortlist with fewer decisions; never invent stock/delivery/suitability
  (E-06). Gift options only when fulfilled (G-08).
- **Priority:** P1.
- **Evidence:** benchmark refresh required (BENCHMARK + MEASURE).

### 5.5 Product / PDP — [/product/[slug]](src/app/product/[slug]/page.tsx)

- **Posture:** the highest-authority route. Known code debt: country of
  manufacture and manufacturer/importer are TODO-backed fallbacks; Shopify sync
  may still use `legalPlaceholder` for material (C-01).
- **Improvements:** verified class-specific fact model, no placeholders (C-01,
  F-01); inspection-grade unique media set + zoom/pan/gallery (B-02, B-05,
  F-11); truthful scale/fit media (B-06); size & fit confidence with saved
  sizes and return context (F-02); truthful availability & delivery resolution
  agreeing across PDP/cart/checkout/email/account (F-05); product-specific
  care & warranty (F-06); personalization/engraving only when operationally
  real (F-03); advisor/appointment continuity near purchase (F-04); concise
  "why this piece" story after purchase confidence (F-07); comparison/shortlist
  support (F-08); recommendations/recently-viewed dedupe + accurate disclosure
  (F-09); complete Product/Offer structured data (F-10); whole-catalog PDP
  state matrix (F-11).
- **Priority:** P0 (facts, media, availability, catalog matrix); P1 for the rest.
- **Evidence:** `qa/pdp-purchase-confidence-benchmark.md`,
  `qa/pdp-size-care-fit-fact-placement-benchmark.md`,
  `qa/product-gallery-*`, `qa/product-recommendation-rail-return-context-benchmark.md`.

### 5.6 Checkout — [/checkout](src/app/checkout/page.tsx)

- **Posture:** split-cart architecture (own/CardCom + Shopify supplier);
  transparency is a current strength but paid flows are not yet production-proven.
- **Improvements:** prove real supplier connection + paid Shopify checkout
  (G-01, G-02); enable + prove CardCom for own products (G-04); complete
  order-confirmation state, idempotent on refresh/duplicate callback (G-05);
  full checkout state matrix — empty/own/supplier/mixed/coupon/unavailable/
  price-change/inventory-conflict/failure/timeout/mobile-keyboard/back/refresh
  (G-06); delivery promise from real operations (G-07); gift options only when
  fulfilled (G-08); reconciliation (G-09); refund/cancel/return ownership
  (G-10); checkout accessibility & security review (G-11).
- **Priority:** P0.
- **Evidence:** `qa/checkout-delivery-confidence-benchmark.md`,
  `qa/checkout-validation-payment-confidence-benchmark.md`,
  `qa/checkout-quantity-mobile-summary-benchmark.md`, `qa/split-checkout-ux-audit.md`.

### 5.7 Wishlist — [/wishlist](src/app/wishlist/page.tsx)

- **Posture:** exists; needs to become a real decision tool.
- **Improvements:** availability & price change cues, source labeling, size
  memory, comparison cues, share policy, advisor handoff; survive
  guest-to-account merge without adding the wrong variant; no fake scarcity
  (I-05).
- **Priority:** P1.
- **Evidence:** `qa/wishlist-shortlist-decision-support-benchmark.md`.

### 5.8 Account — [/account](src/app/account/page.tsx), [orders/[id]](src/app/account/orders/[id]/page.tsx), [invoices](src/app/account/invoices/page.tsx)

- **Posture:** authenticated E2E fixture now exists behind `E2E_AUTH_FIXTURES=1`
  (I-01 started).
- **Improvements:** complete authenticated visual review — dashboard, profile,
  addresses, saved sizes, wishlist merge, privacy, order detail, returns,
  empty/error/loading, mobile (I-02); ownership-grade source-aware order
  timeline with real event truth, no fabricated Shopify-mirror milestones
  (I-03); reorder/care/service continuity without turning account into
  marketing (I-04); preference & consent governance (I-06); privacy export &
  deletion validated end to end (I-07); order-aware return initiation with
  source-specific instructions (H-06); transactional comms governance (I-08).
- **Priority:** P0 (privacy, consent, timeline truth); P1 for the rest.
- **Evidence:** `qa/account-dashboard-privacy-shortcut-clarity-benchmark.md`,
  `qa/account-order-timeline-clarity-benchmark.md`,
  `qa/account-recovery-service-shortcuts-benchmark.md`, `qa/customer-auth-e2e-fixture.md`.

### 5.9 Service — [/service](src/app/service/page.tsx)

- **Posture:** service route; contact + attachment flow exists, delivery not
  fully proven.
- **Improvements:** define the service promise mapped to real staffing/queue
  (H-01); validate real email/reply routing, attachment scanning/storage,
  access control, offline sync, duplicate submission, failure alerts (H-07);
  product-aware advisor handoff (H-03); service case timeline (H-05); channel
  policy — WhatsApp/chat/callback/SMS only when staffed & consented (H-08).
- **Priority:** P0 (contact delivery, promise truth).
- **Evidence:** `qa/service-response-contact-clarity-benchmark.md`,
  `qa/service-topic-attachment-review-benchmark.md`, `qa/provider-negative-path-review.md`.

### 5.10 Stylist — [/stylist](src/app/stylist/page.tsx) & AI — [/ai](src/app/ai/page.tsx)

- **Posture:** advisory/assistive; AI concierge is **demoted by default** and
  must not enter primary navigation without an approved exception (I-331, D-05).
- **Improvements:** AI/provider reliability with silent fallback (E-02, L-04);
  no personalization claims when logic is source-based (C-06); keep advisory
  supportive of purchase confidence, not a centerpiece; virtual try-on stays
  deferred until accuracy/consent/retention/deletion proven (F-12).
- **Priority:** P2 (unless an exception elevates).
- **Evidence:** `qa/ai-stylist-fallback-benchmark.md`.

### 5.11 Branches — [/branches](src/app/branches/page.tsx)

- **Posture:** currently truthful online-only service continuity.
- **Improvements:** explicit decision — maintain truthful online-only route OR
  provide verified location/hours/services/appointment-routing/map/closure per
  active branch; never imply physical boutiques that do not exist (K-12).
- **Priority:** P2 (OWNER decision).
- **Evidence:** `qa/branches-online-only-service-continuity-benchmark.md`.

### 5.12 About — [/about](src/app/about/page.tsx)

- **Posture:** brand proof; redesign already reviewed.
- **Improvements:** replace generic boutique language with evidence-backed house
  copy tied to real design/material/craft/service (A-04); read as short
  verifiable proof, not institutional padding (manifesto); reflect the house
  idea (A-01) once defined.
- **Priority:** P1 (OWNER).
- **Evidence:** `qa/about-page-redesign.md`.

### 5.13 Blog — [/blog](src/app/blog/page.tsx), [/blog/[slug]](src/app/blog/[slug]/page.tsx)

- **Posture:** editorial surface.
- **Improvements:** Hebrew search-content model — useful, task-answering
  content that leads to relevant products, no SEO filler or thin mass-generated
  pages (J-06); editorial cadence tied to real campaigns (A-07); content
  governance — owner, source, review date, expiration (J-10).
- **Priority:** P1/P2.
- **Evidence:** covered by J-05/J-06 SEO validation.

### 5.14 Fit & care content — [/size-guide](src/app/size-guide/page.tsx), [/jewellery-care](src/app/jewellery-care/page.tsx)

- **Improvements:** class-specific measured diagrams and conversion tables;
  save context and restore product/selection on return from the guide (F-02);
  material-sensitive care that never contradicts product-specific guidance
  (F-06).
- **Priority:** P1.
- **Evidence:** `qa/size-guide-save-context-return-path-benchmark.md`.

### 5.15 Trust & legal — [/warranty](src/app/warranty/page.tsx), [/shipping-returns](src/app/shipping-returns/page.tsx), [/privacy](src/app/privacy/page.tsx), [/terms](src/app/terms/page.tsx), [/accessibility](src/app/accessibility/page.tsx), [/p/[slug]](src/app/p/[slug]/page.tsx)

- **Improvements:** complete legal identity & policy review with counsel
  sign-off, version/effective date, expose only applicable facts (J-08);
  editorial legal-page usability — restrained summaries, ToC, print style,
  last-updated, contact/recovery, readable line length, without changing legal
  meaning (J-07); accessibility statement reflects real audit state (J-01);
  cookie/analytics behavior validated — no pre-consent tracking where
  prohibited, effective withdrawal (J-09).
- **Priority:** P0 (legal identity, cookies, accessibility statement truth).
- **Evidence:** covered by J-07/J-08/J-09; `PUBLIC_CHANGE_GATE.md`.

### 5.16 FAQ — [/faq](src/app/faq/page.tsx)

- **Improvements:** service-recovery links that route to real backed actions;
  answers map to the same delivery/returns/warranty rule used elsewhere (G-07,
  H-01); no dead-end links.
- **Priority:** P2.
- **Evidence:** `qa/faq-content-service-recovery-links-benchmark.md`.

### 5.17 Offline / PWA — [/offline](src/app/offline/page.tsx)

- **Improvements:** meaningful install/recovery priority; Serwist service worker
  + Web Push validated; offline sync for service submissions (H-07); reduced
  reliance on the `E2E_SKIP_SERWIST_BUILD=1` escape hatch for full PWA smoke.
- **Priority:** P2.
- **Evidence:** `qa/offline-page-install-pwa-recovery-priority-benchmark.md`.

### 5.18 Global chrome (all routes)

- **Improvements:** header taxonomy (D-05); footer density (D-06); no floating
  element covers focusable content or a purchase action across short viewports,
  keyboards, safe areas, zoom (D-07); one easing family, no layout-shifting
  motion, reduced-motion support (D-08); mobile buy bar / cart summary collision
  audit.
- **Priority:** P1.
- **Evidence:** `qa/floating-chrome-collision-audit.md`,
  `qa/route-evidence-ledger.md`, `qa/route-status-sharded-visual-audit.md`.

## 6. Consolidated wave sequence

Aligned 1:1 with `TIFFANY_SURPASS_MASTER_PLAN.md` §18, viewed through customer-
site routes. Order is deliberate: **truth and proof before visual polish** —
polish cannot compensate for placeholder facts, duplicate media, or unproven
payment.

| Wave | Theme | Routes most affected | Workstream items |
| --- | --- | --- | --- |
| **0** | Truth & proof foundation | PDP, Checkout, Account, Service, Legal | C-01/C-03/C-04, D-04, G-01…G-04, H-01/H-07, I-01/I-06/I-07, J-08/J-09, L-01/L-04/L-05/L-07/L-11 |
| **1** | House identity, collections, media | Home, About, Category, PDP | A-01…A-05, B-01…B-08, C-05/C-07/C-08 |
| **2** | Discovery & PDP authority | Category, Search, Gifts, PDP | E-01…E-10, F-01…F-11, D-05 |
| **3** | Real commerce & clienteling | Checkout, Service, Account, Wishlist | G-02…G-11, H-02…H-10, I-02…I-08, A-06 |
| **4** | Reduction, polish, field quality | Home, global chrome, legal, all | D-01…D-03/D-06…D-08, J-01…J-07/J-10…J-12, L-02/L-03/L-06 |
| **5** | Comparative proof | whole site | A-08, I-09, L-08…L-10/L-12 |

Wave-0 current reality (2026-06-19 → 06-21 baseline): the first catalog
readiness pass found **0 of 300 active products publish-ready, 874 blockers,
2,426 high-severity findings** — dominated by missing fact/policy ownership,
absent structured specs, and duplicate/stale media. The release scorecard is
**1/15** (production smoke only) and resolves to **NOT READY**. This is owner
and asset debt, not an engineering blocker, and not a reason to fabricate data.

## 7. Master acceptance (definition of done, per item)

An item is done only when all applicable conditions hold (from Tiffany plan §3.3):

1. Product decision and benchmark are documented.
2. Verified copy/data/assets exist.
3. Implementation is complete across supported routes and states.
4. Mobile, desktop, keyboard, loading, empty, error, recovery all pass.
5. Focused tests and the appropriate release gate pass.
6. Production/preview evidence is recorded for runtime-dependent items.
7. Residual risk is explicit.
8. The old task is closed in its canonical tracker.

The customer-site superiority claim additionally requires the full claim gate
and scorecard in `TIFFANY_SURPASS_MASTER_PLAN.md` §2.3 and §21.

## 8. Radical / next-generation candidates (BENCHMARK-gated, not yet approved)

"Extreme in scope" includes an honest backlog of ambitious ideas — but every
one here is a **candidate**, subject to the High Jewelry Reference Gate, the
non-invention rules, and the §20 non-goals. None is approved by listing here,
and none should be built before its wave-0/1 foundations exist.

- **CX-N1 — Signature configurator.** A house-owned engraving/personalization
  experience with live preview, price, lead time, and production handoff.
  Gate: F-03 must be operationally real first; otherwise the control stays
  absent.
- **CX-N2 — Guided clienteling thread.** A persistent, consented advisor
  conversation that carries product/size/wishlist/budget context from PDP →
  appointment → post-purchase care. Gate: H-01…H-05 and I-06 consent.
- **CX-N3 — Fit & scale confidence system.** Measured on-body media + saved
  measurements + return-context continuity across PDP, size guide, and account.
  Gate: B-06 real media, F-02.
- **CX-N4 — Collection worlds.** Named collections with distinct visual worlds,
  hero pieces, and cross-sell logic replacing category-only browsing. Gate:
  A-05, C-05, sufficient unique media.
- **CX-N5 — Ownership continuum.** Unified post-purchase surface — order
  timeline, care schedule, warranty, repair intake, reorder — that feels like
  the same house as the PDP, never provider templates. Gate: I-03, H-04, A-06.
- **CX-N6 — Trustworthy virtual try-on.** Only after accuracy/consent/
  retention/deletion/failure/product-mapping pass (F-12, currently DEFER).
- **CX-N7 — Editorial-commerce fusion.** Blog/collection content that leads
  directly to shortlists with real availability. Gate: J-06, E-05.
- **CX-N8 — Privacy-respecting personalization.** Recommendations that are
  explainable and consented, never implying personalization when logic is
  source-based (C-06, I-06).

Explicitly **not** candidates (per §20 non-goals): more homepage sections, more
decorative motion/gradients/badges, more AI prominence, generic luxury copy,
generated lifestyle imagery that misrepresents a product, or any unverified
proof claim.

## 9. Traceability index

- Master execution & item detail: `docs/TIFFANY_SURPASS_MASTER_PLAN.md`
- House taste & restraint: `docs/ELYSIA_DESIGN_MANIFESTO.md`
- Public change process / Reference Gate: `docs/PUBLIC_CHANGE_GATE.md`
- Public structure archetypes: `docs/FULL_PRODUCT_BENCHMARK.md`
- Home backlog: `docs/HOMEPAGE_IMPROVEMENTS.md`
- Copy inventory + build gate: `docs/SITE_COPY_MAP.md`
- Catalog debt: `docs/qa/catalog-readiness-wave-0-baseline.md`,
  `docs/qa/catalog-readiness-remediation-plan.md`,
  `docs/qa/catalog-quality-report.md`
- Release readiness: `docs/qa/release-scorecard.md`,
  `docs/qa/production-deployment-evidence-ledger.md`
- Per-route UX evidence: `docs/qa/*-benchmark.md` (linked per route in §5)
- Owner/legal blockers: `docs/qa/wave-0-owner-evidence-register.md`

## 10. How to use this document

1. Starting new customer-site work? Find the **route** in §5, read its
   improvement themes, and open the referenced **workstream item** for the
   canonical acceptance criteria.
2. Planning a wave? Use §6 to see which routes and items belong together.
3. Proposing a public change? Confirm it passes §0.2 ground rules and the
   `PUBLIC_CHANGE_GATE.md` before implementing.
4. Claiming completion? Apply §7 and, for the superiority claim, the scorecard
   and claim gate in the master plan.

This document is a map. Keep it synchronized when a route materially changes or
a workstream item closes; keep the detail in the canonical source.
