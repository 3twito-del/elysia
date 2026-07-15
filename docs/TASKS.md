# Elysia Tasks

Status: the single open-work backlog for the whole product. This document
merges the former `PROJECT_TASKS.md`, `CUSTOMER_SITE_MASTER_IMPROVEMENT_PLAN.md`,
`TIFFANY_SURPASS_MASTER_PLAN.md`, and `HOMEPAGE_IMPROVEMENTS.md`. Completed
items are deleted, not archived — git history and `docs/QA_EVIDENCE.md` hold
the record. The fully shipped Tiffany-plus passes live on as standing
invariants in `docs/DESIGN.md` Part III.

Last consolidated: 2026-07-08.

Authority: this backlog never overrides `docs/DESIGN.md` (public change gate),
`docs/ENGINEERING.md` (conventions and benchmark method), or `docs/DECISIONS.md`
(ADR register). Launch gating (L1/L2) is defined by ADR 0013; deferred
decisions with named triggers live in `docs/PARKING_LOT.md`.

## 1. Status, priority, and evidence rules

**Status vocabulary** (unified):

| Status      | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| In Progress | Actively being executed                                            |
| NOW         | Implementable with current repository and known decisions          |
| BENCHMARK   | Public change needs High Jewelry Reference Gate evidence first     |
| OWNER       | Requires verified facts, assets, policy, or owner decision         |
| EXTERNAL    | Requires provider, supplier, customer, legal, or production action |
| MEASURE     | Requires observation or research before implementation             |
| DEFER       | Intentionally excluded until a named condition is met              |

**Priority:** `P0` blocks real commerce, legal truth, or a defensible claim ·
`P1` largest luxury/trust/conversion gap · `P2` depth & polish · `P3`
optimization after the core is proven.

**Definition of done** (all applicable conditions):

1. The product decision and benchmark are documented.
2. Verified copy/data/assets exist.
3. Implementation is complete across supported routes and states.
4. Mobile, desktop, keyboard, loading, empty, error, and recovery behavior pass.
5. Focused tests and the appropriate release gate pass.
6. Production or preview evidence is recorded when the item depends on runtime.
7. Residual risk is explicit.
8. The item is deleted from this backlog.

**Ground rules (non-negotiable):** do not invent facts — no legal entity,
material, warranty, delivery promise, rating, press logo, or certification
without verified owner evidence (missing fact → hide the field); reduction
creates value; Hebrew-first RTL is preserved on every route; evidence over
checklist — "implemented" is not "verified"; design tokens, not arbitrary
values; any public copy/markup change requires `pnpm copy:sync` or the build
fails on a stale `docs/SITE_COPY_MAP.md`.

## 2. Active engineering work

| ID    | Task                                          | Status      | Priority | Evidence              |
| ----- | --------------------------------------------- | ----------- | -------- | --------------------- |
| I-341 | Wave 0 catalog truth and media readiness gate | In Progress | P0       | `docs/QA_EVIDENCE.md` |

### I-341 Wave 0 catalog truth and media readiness gate

- `Status`: In Progress · `Priority`: P0 · `Effort`: L
- `Built`: catalog-readiness engine and CLI (`pnpm catalog:readiness`),
  duplicate-hash and local-file inspection, governed specification/verification
  schema, media roles, draft-first creation and supplier sync, activation
  blockers, verified-only PDP fact rendering, owner-intake CSV pipeline
  (`pnpm catalog:intake`, `catalog:intake:validate`, `catalog:intake:apply`),
  scoped release-slice audits, and the strict `pnpm release:slice-gate`.
- `Current result`: 0 of 300 active products are publish-ready — 874 blockers,
  2,426 high-severity findings; release scorecard `1/15`, verdict `NOT READY`.
  This is owner and asset debt, not an engineering blocker, and not a reason to
  fabricate data.
- `Remaining`: owner-supplied and approved product/policy facts, stale media
  replacement, five additional truthful media roles per product, duplicate
  asset remediation, global legal identity/policy approval, full PWA
  service-worker production smoke without the E2E Serwist skip flag, and
  release-gate activation after remediation.
- `Acceptance`: the strict database audit passes; every active product has
  verified facts and policy evidence; required media roles are explicit; local
  media exists; no unrelated product shares a URL or content hash.
- `Verification`: `pnpm test -- scripts/catalog-readiness.test.ts scripts/catalog-readiness-audit.test.ts`,
  `pnpm check`, `pnpm catalog:readiness -- --source database` (strict expected
  to fail until remediation).

Note: under ADR 0011 the launch gate is the **capsule** (floor 30, target 36
publish-ready supplier products), not 300 remediated products. The 0/300
metric remains catalog-debt reporting; the release gate scores capsule members.

Launch-gate engineering shipped 2026-07-09 (branch
`feat/launch-engineering-p0`): ADR 0004 DB immutability triggers (verified
via `pnpm db:verify:immutability`), ADR 0007 OperationalAlert sweeps +
delivery + `/admin/notifications` card + health heartbeats, ADR 0012
fail-closed click-out verification + dropship sync cron, ADR 0005 partial
(edge middleware over `/admin` + `/api/admin`, 12-hour admin sessions,
per-account/per-IP login rate limiting, audited AdminAuth security events),
operational runbooks (`docs/RUNBOOKS.md`), and the C-03 activation gate
verified as enforced.

I-342 (Admin TOTP enrollment + recovery codes) shipped 2026-07-12: mandatory
TOTP for every admin including bootstrap, forced enrollment at next login,
one-time hash-stored recovery codes, TOTP secrets encrypted at rest, and the
full audited enrollment/failure/recovery event set — completing the ADR 0005
L1 auth package (`docs/QA_EVIDENCE.md`).

## 3. Benchmark-gated design candidates

Public-facing candidates are not implementable by default; each needs a High
Jewelry Reference Gate record (see `docs/DESIGN.md`) before product code is
edited.

| ID    | Candidate                                        | Status          | Priority |
| ----- | ------------------------------------------------ | --------------- | -------- |
| I-330 | Legal pages editorial styling                    | Needs Benchmark | P2       |
| I-331 | AI/stylist concierge promotion exception review  | Needs Benchmark | P2       |
| I-334 | Supplier-product merchandising treatment         | Needs Benchmark | P1       |

These map into the workstream backlog below: I-330→J-07, I-334→C-07. I-331
stays a standalone exception decision — AI remains demoted by default and
out of primary navigation without an approved
exception.

## 4. Workstream backlog (open items)

Canonical open-item definitions, condensed from the former master gap plan.
Each item keeps its workstream ID. Items whose work was completed and verified
have been deleted; partially done items state only their remaining scope.

### A — Brand authority and house codes

- **A-02 Recognizable visual code system** · P1 · BENCHMARK — image geometry,
  crop rules, signature framing, motion grammar, one restrained proprietary
  accent. Acceptance: five unbranded screens read as one house. Depends:
  A-01 (closed — see `docs/DESIGN.md` "House Idea and Positioning"; the
  existing "House Point Of View" manifesto already expresses it visually) —
  A-02 is now unblocked, still needs its own High Jewelry Reference Gate
  benchmark pass.
- **A-03 Bilingual voice system — residual** · P1 · NOW+OWNER — owner-confirmed
  2026-07-15 (`docs/DESIGN.md`): Hebrew is the default register for all
  copy; English only for memorable slogans/short phrases whose effect would
  be lost in translation. Remaining scope: transliteration conventions,
  punctuation direction, numerals/currency, CTA verb standards.
- **A-04 Evidence-backed house copy** · P1 · OWNER — a real fact now exists
  to build the bank from (`docs/DESIGN.md`): Elysia currently runs on
  dropship suppliers with limited customization — copy must not imply
  in-house manufacture or bespoke craftsmanship this doesn't support. Still
  needs the rest of a full verified fact bank before a copy rewrite pass.
- **A-05 Collection architecture** · P1 · OWNER+BENCHMARK — named collections,
  hero pieces, visual worlds, cross-sell logic; publication justified by
  distinct products and media. Owner-confirmed 2026-07-15: no named hero
  piece exists yet — this item stays blocked on that fact, not fabricated.
- **A-06 Brand into ownership** · P2 · OWNER — packaging, gift note, order
  email, care card, repair/return communication; no provider-template feel.
  Owner-confirmed 2026-07-15 (`docs/DESIGN.md`): the post-purchase touch is
  "a personal message" — concrete shape (from whom, what channel, current
  vs. needs building) still needs its own follow-up, not assumed.
- **A-07 Campaign and editorial cadence** · P2 · OWNER — storytelling changes
  because a real campaign exists, not for layout novelty.
- **A-08 Blind distinctiveness validation** · P0 (final claim) · MEASURE —
  unbranded recognition study; failures return to A-01/A-02.

### B — Product media and art direction

**Real status, all four below (2026-07-15):** the current catalog
("Silver Israel", `prisma/seed-catalog.ts`) is **demo/seed data, not a real
supplier feed or real inventory** — confirmed by the owner. These items are
not independent process gaps to solve now; they are correctly blocked on
real products existing at all. Photography/media production will be
Elysia's own responsibility going forward (owner-confirmed), not the
supplier's — but that only becomes actionable once real products are being
sold. Not fabricating readiness here: these stay OWNER-blocked on "real
inventory exists," re-check when that changes rather than treating the
demo catalog's media as a defect to fix.

- **B-01 Replace duplicated catalog media** · P0 · OWNER — blocked on real
  inventory (see note above); the demo catalog's shared media is not a bug
  to fix in place.
- **B-02 Minimum media set per product** · P0 · OWNER — clean primary,
  alternate angle, scale-on-body, construction detail, material macro,
  packaging/context; P0/P1 products at 100%. Blocked on real inventory;
  photography will be Elysia's own (owner-confirmed), not the supplier's.
- **B-03 Media art-direction standards** · P1 · NOW+OWNER — background, shadow,
  color accuracy, crops, retouching; category grids read as one set. Blocked
  on real inventory (demo catalog's media is not the target to retouch).
- **B-04 Variant-media mapping** · P1 · NOW after assets — decide schema need;
  metal/stone change updates media without losing gallery position.
- **B-05 PDP inspection quality** · P1 · NOW after B-02 — zoom resolution,
  touch pan, sequencing, color fidelity; nothing blocks the purchase panel.
- **B-06 Truthful scale and fit media** · P1 · OWNER — on-body photography at
  defined measurements; reproducible scale claims. Owner-confirmed: only
  possible once real products are sold (needs real physical stock to
  photograph).
- **B-07 Asset governance — residual** · P1 · NOW — the manifest and
  enforcement engine are shipped: `ProductMedia` carries `provenance`
  (`SUPPLIER_FEED`/`OWNER_UPLOAD`/`AI_GENERATED`/`STOCK_LICENSED`/`UNKNOWN`),
  `licenseStatus` (`OWNED`/`SUPPLIER_GRANTED`/`LICENSED`/`NEEDS_REVIEW`/
  `UNKNOWN`), `licenseExpiresAt`, `isGenerated`, `approvedAt`/`approvedBy`
  (`prisma/migrations/20260714030000_product_media_asset_governance`); the
  I-341 catalog-readiness engine (`scripts/lib/catalog-readiness.ts`) gates on
  all of it — unknown provenance/license (medium), `NEEDS_REVIEW` (high),
  an expired license (blocker), and a generated asset with no explicit
  `approvedAt` (blocker) — enforcing the "generated assets labeled" rule and
  the D-01 non-goal against misrepresentative generated imagery structurally,
  not by convention. `alt` and per-product mapping already existed
  (`ProductMedia.alt`, the `productId` relation). Verified: 4 new unit tests
  (`scripts/catalog-readiness.test.ts`, 13/13 passing) plus a live query
  through real seeded DB rows via `mapPrismaProductToCatalogReadiness`
  confirming the DB→engine wiring. **Remaining scope**: no admin UI surface
  yet to set these fields per-asset (they default to `UNKNOWN`/`false` and
  can currently only be set by direct DB/script access); populating real
  provenance/license facts for the existing catalog is owner-dependent, same
  as the rest of I-341's asset debt.

### C — Product truth, catalog, and merchandising data

- **C-01 Verified product specifications** · P0 · OWNER+EXTERNAL — full
  required data per class; known code debt: country-of-manufacture and
  manufacturer/importer are TODO-backed fallbacks in the PDP; Shopify sync can
  still use `legalPlaceholder` for material. Acceptance: no published PDP
  renders a placeholder or inferred fact.
- **C-02 Governed attributes over free-form facts** · P1 · NOW after C-01
  policy — typed attributes, controlled vocabularies, effective dates; shared
  facts update centrally.
- **C-04 Pricing and promotion truth** · P0 · OWNER — compare-at rules,
  promotion ownership, price history, supplier drift; every public discount
  reproducible. (Note, updated 2026-07-15: the old "ADR 0012 blocks
  discounts on supplier-MOR items" framing no longer applies — World B
  means these are Elysia's own-priced items, not supplier-MOR. Discounting
  is blocked instead until the supplier wholesale/COGS agreement
  (`docs/TASKS.md` §5) gives a real cost basis to discount against
  truthfully.)
- **C-05 Collection merchandising controls** · P1 · NOW after A-05 — hero
  product, manual rank, launch status, availability-aware fallback.
- **C-07 Supplier provenance language** · P1 · BENCHMARK+OWNER — what source/
  fulfillment/warranty facts are public; premium tone without implying Elysia
  manufacture. (I-334)
### D — Homepage and global experience

- **D-01 Reduce homepage length and competing intent** · P1 · BENCHMARK — rank
  sections, remove duplicate paths, cap rails.
- **D-02 Unmistakable hero** · P1 · OWNER+BENCHMARK — approved house idea
  (**done, A-01**), uniquely-Elysia campaign/product image (**blocked**: no
  real products/photography exist yet, same demo-catalog constraint as
  B-02/B-06 — no named hero piece either, per A-05), one dominant action
  (design/engineering, not owner-blocked).
- **D-03 Homepage manual validation** · P0 (release claim) · MEASURE — full
  keyboard/screen-reader/contrast/touch/reduced-motion/device matrix, real CWV,
  Rich Results.
- **D-04 Factual homepage blockers** · P0 · OWNER — legal identity
  (**blocked**: no entity yet, §5), approved policy phrasing (**blocked**:
  lawyer engagement not yet started, §5), real social proof (**blocked**:
  no real sales/customers yet), real promotion rules (**blocked**: C-04 →
  supplier wholesale/COGS agreement, §5); unverified claims stay absent.
  No new owner input needed here — already downstream of facts gathered
  elsewhere in §5.
- **D-05 Header taxonomy** · P1 · BENCHMARK — validate placement on desktop
  and mobile; AI stays out of primary navigation without an approved exception.
- **D-06 Footer density** · P2 · BENCHMARK — no second landing page.
- **D-08 Motion grammar — residual** · P2 · BENCHMARK — token/CSS layer is
  complete (one easing family, tokenized durations, no layout-animating
  transitions); remaining scope is subjective motion-feel changes, which need
  gate sign-off and visual-regression review.

### E — Discovery: search, categories, gifts

- **E-01 Taxonomy audit** · P1 · MEASURE+OWNER — customer-language evidence for
  every navigation and filter term.
- **E-02 Semantic search evaluation — residual** · P1 · NOW+MEASURE — the
  deterministic-path harness and labeled Hebrew corpus exist
  (`src/server/adapters/search-evaluation.ts`). Deepened the corpus
  (`search-evaluation.test.ts`): 7 new measured cases covering plural
  category terms (passes, but via `categoryName` coincidence — labeled
  distinctly from real stemming), plural stone/material terms, attached
  Hebrew prefix letters (ב/ו/ה/ל/מ), construct-plural phrase reordering (all
  four: documented, real, zero-result limitations — no stemmer exists on
  this path), and Latin-transliterated product names (passes cleanly,
  case-insensitive — script mixing itself is not a limitation). All measured
  against the real `filterCatalogProducts` behavior, not asserted from a
  guess. Remaining scope: semantic/AI path evaluation, and runs against the
  real catalog (blocked on I-341 remediation for a real catalog to run
  against).
- **E-03 Merchandiser-aware ranking — residual** · P1 · NOW — the Typesense
  path already blended `_text_match` relevance with `popularityScore`
  (`buildTypesenseSort`); the **local/degraded path had none** — a real
  text query under `E2E_CATALOG_FIXTURES=1` or a Typesense outage returned
  filter-order results with zero relevance ranking, only category-interleave
  for the no-query browse case. Fixed: `computeLocalRelevanceScore`
  (`src/server/adapters/search.ts`, exported for direct inspection/testing —
  the "ranking inspectable" requirement) blends exact/prefix/contains
  name-match tiers (exact intent wins), a facet-match tier, a
  description-only tier, and a real availability boost (a sold-out
  ready-to-order item ranks below an otherwise-identical in-stock one; a
  made-to-order/consultation item is correctly *not* penalized as
  unavailable — caught by a failing test before it shipped). Verified: 8 new
  unit tests plus the existing degraded-Typesense and search e2e tests
  re-run clean. **Collection priority deliberately not attempted**: there is
  no real manual-rank data model for collections yet — that's C-05, blocked
  on A-05 — and `CatalogProduct.collections` only carries names, not
  priority metadata, through the current mapping pipeline. Fabricating a
  proxy signal here (e.g. `Collection.isFeatured`) would risk conflicting
  with whatever C-05 eventually builds; left as genuinely deferred, not
  silently dropped.
- **E-04 Filter and sort validation** · P1 · MEASURE — labels, counts, URL
  persistence, mobile sheet, keyboard/SR semantics against a realistic catalog.
- **E-05 Collection-led discovery** · P2 · BENCHMARK — restrained collection
  context that never scroll-gates products.
- **E-06 Gifts around decisions** · P1 · BENCHMARK+MEASURE — occasion,
  recipient, budget, material, urgency; shortlist with fewer decisions; no
  invented stock/delivery/suitability.
- **E-08 All-products visual consistency — residual** · P1 · NOW — run for
  the first time (2026-07-15): the documented 4-shard command
  (`docs/QA_EVIDENCE.md` → `route-status-sharded-visual-audit`) had never
  actually been executed. Ran all 4 shards against a real production build
  and a freshly-seeded real DB (chromium, desktop+tablet+mobile,
  `--screenshots all`): **197 routes × 3 viewports = 591 audits, 567 passed,
  24 failed** — every failure attributed, none left unexplained:
  (1) 9 failures were a real, live CSP bug this same pass found and fixed
  (G-11, `/search` in every variant — see that item); (2) 9 failures are
  `hera-bracelet`/`muse-pearl-earrings`/`venus-line-ring` 404ing against the
  real DB, the exact already-documented L-02 gap surfacing through a third
  path (this tool's route inventory reads `listFixtureCatalogProducts()`
  directly, independent of `E2E_CATALOG_FIXTURES`); (3) 3 failures on
  `elysia-supplier-silver-halo-ring` are expected per the tool's own route
  notes (needs fixtures mode or a real DB-backed supplier product, neither
  active in this run); (4) 3 failures on `/p/sample-landing` are a new,
  minor, same-shape finding — a hardcoded example CMS landing-page slug
  (`scripts/qa-route-inventory.ts`) with no matching seeded `LandingPage`
  row. Artifacts: `artifacts/qa/2026-07-15-all-products-shard-{1..4}/`
  (gitignored, `591` screenshots + JSON/markdown reports per shard).
  **Remaining scope**: firefox/webkit and full-catalog runs at this size are
  untried; the 3 already-documented fixture-catalog gaps and the new
  landing-page one are content/seed-data debt, not visual-consistency
  findings, so nothing here blocks calling the *mechanism* itself proven.
- **E-10 Discovery measurement — residual** · P1 · NOW+MEASURE — more capture
  already exists than expected: `SearchEvent` (server-written, every real
  search) plus the client `search_performed` `AnalyticsEvent` beacon
  (consent-gated, deduplicated via `idempotencyKey`) both capture
  query/filters/resultCount; `ProductClickEvent` already ties a click back to
  `query`+`position`; `analytics-insights.ts` already surfaces top and
  zero-result queries. Not yet built: an actual clickthrough/query-success
  rate (joining `SearchEvent`/`search_performed` to a following click or
  order in the same session) and a refinement rate (sequential query changes
  within a session) — `SearchEvent` itself carries no session identifier, so
  refinement analysis would need the `AnalyticsEvent` path's
  `sessionKeyHash` instead. Not attempted this pass: this is pre-launch with
  no real traffic, so these rates would have nothing to compute against yet
  — genuinely MEASURE-blocked, not an engineering gap. Found and flagged
  separately, not fixed here: `SearchEvent`'s write path has no consent gate
  at all (see I-06).

### F — PDP and purchase authority

- **F-01 Class-specific PDP fact model** · P0 · NOW after C-01 — required and
  optional facts per class; decision-critical facts early.
- **F-02 Size and fit confidence** · P1 · OWNER+NOW — measured diagrams,
  conversion tables, saved sizes, return context; returning from the guide
  restores product and selection. **Blocked**: accurate measured diagrams
  need real product measurements, same demo-catalog constraint as B-02.
- **F-03 Personalization only when operationally real** · P1 · OWNER+EXTERNAL —
  otherwise the control stays absent. **Resolved 2026-07-15, not open**:
  owner already confirmed (A-01 characterization) the current dropship
  suppliers offer "little room for personalization" — not operationally
  real today. Per this item's own rule, the control stays absent; revisit
  only if that supplier reality changes.
- **F-04 Advisor/appointment continuity near purchase** · P1 · OWNER+EXTERNAL —
  product-aware contact with saved context and reliable confirmation.
  Depends on the service model (H-01/H-02 below, not yet asked) — is
  advisory/appointment service real, staffed, and scheduled yet?
- **F-05 Truthful availability and delivery resolution** · P0 · EXTERNAL+NOW —
  PDP, cart, checkout, email, account, and admin agree; no invented stock
  counts or delivery guarantees.
- **F-06 Product-specific care and warranty** · P1 · OWNER — material-sensitive
  care that never contradicts product guidance. **Blocked**: needs real
  material facts per real product, same demo-catalog constraint.
- **F-08 Comparison/shortlist support** · P2 · MEASURE+BENCHMARK — only if
  testing proves it reduces uncertainty.
- **F-09 Recommendations — closed 2026-07-15** · P2 · OWNER — dedupe and
  disclosure are implemented and tested; owner confirmed the current
  disclose-and-demote behavior (show unavailable items tagged, not
  hard-excluded) is the intended design. No change needed — the existing
  implementation is already correct, not a gap.
- **F-10 Product structured data — residual** · P1 · NOW after C-01 — the
  builder omits empty/placeholder fields and gates the Offer on a valid price;
  remaining scope: verified field completeness and live Rich Results
  validation once owner data exists.
- **F-11 PDP validation across the whole catalog** · P0 (final claim) ·
  MEASURE — every class/variant/media/supplier/unavailable state.
- **F-12 Virtual try-on** · P3 · DEFER+EXTERNAL — deferred until accuracy,
  consent, retention, deletion, and product mapping are proven.

### G — Cart, checkout, payment, order completion

- **G-01 Real Shopify supplier connection** · P0 · EXTERNAL — real product,
  variant, SKU, inventory, fulfillment, and support behavior documented.
  Verify with `pnpm shopify:dropship:doctor -- --first 5`.
- **G-02 Paid Shopify checkout** · P0 · EXTERNAL — a real payment completes;
  webhook mirror arrives once; account/admin state accurate.
- **G-03 Supplier fulfillment proof** · P0 · EXTERNAL — receive, ship, track,
  fail/cancel, escalate; evidence recorded outside secrets.
- **G-04 CardCom enablement and proof** · P0 · EXTERNAL — credentials missing
  (`CARD_COM_TERMINAL`, `CARD_COM_API_NAME`, `CARD_COM_API_PASSWORD`); then
  success/decline/cancel/duplicate/timeout/refund/reconciliation per the ADR
  0006 trust model. Gates first public launch itself now, not a separate L2
  (ADR 0013, merged 2026-07-15 — World B means dropship needs CardCom from
  day one). **Confirmed in code** (2026-07-12 K-08 webhook review,
  `docs/QA_EVIDENCE.md` "k-08-webhook-security-review"):
  `src/server/services/payment-webhooks.ts` currently commits
  `PAID`/`CAPTURED` and fires the GL/loyalty pipeline directly from
  `x-cardcom-signature`-gated webhook fields — ADR 0006's server-to-server
  verification call is not implemented. Not exploitable today
  (`OWN_COMMERCE_ENABLED` off, no CardCom credentials configured, so no
  order can reach `PENDING_PAYMENT` via this path), but the verify-then-commit
  flow must ship as part of this item, not assumed already done, before
  launch.
- **G-05 Complete order-confirmation state** · P0 · NOW after G-02/G-04 —
  source-aware confirmation; refresh and duplicate callbacks idempotent.
- **G-06 Checkout state matrix** · P0 · NOW+MEASURE — empty/own/supplier/mixed/
  coupon/unavailable/price-change/conflict/failure/timeout/mobile-keyboard/
  back/refresh; no fake combined payment.
- **G-07 Delivery promises from real operations** · P0 · OWNER+EXTERNAL — one
  rule used by PDP, checkout, policy, email, and service. **Blocked**: needs
  a real supplier fulfillment process (G-01/G-03, EXTERNAL, not real yet —
  demo catalog) before any delivery promise can be truthful.
- **G-08 Gift options only when fulfilled** · P1 · OWNER+EXTERNAL. **Blocked**:
  same real-fulfillment dependency as G-07.
- **G-09 Order and payment reconciliation** · P0 · NOW after providers —
  paid-without-order, order-without-payment, duplicates, stale pendings;
  remediation without manual DB edits. (See also ADR 0002/0006 acceptance.)
- **G-10 Refund/cancellation/return ownership** · P0 · OWNER+EXTERNAL — own vs
  supplier paths explicit; no unsupported actions on Shopify mirrors.
  **Blocked**: World B means Elysia owns refund liability for dropship
  (ADR 0009), but the actual split with the supplier depends on the
  still-open wholesale/COGS agreement (§5) — can't be made explicit until
  that exists.
- **G-11 Checkout accessibility and security review — residual** · P1 ·
  MEASURE — the security half is shipped and evidenced
  (`docs/QA_EVIDENCE.md` → `g-11-checkout-security-review`): a site-wide
  Content-Security-Policy with a per-request nonce now runs alongside the
  ADR 0005 admin gate in `src/proxy.ts` (verified live in a real browser —
  zero CSP violations across home/admin/admin-login/search/checkout, a real
  form submission round-tripped through a Server Action and rendered its
  Hebrew error correctly); CSRF and webhook signatures were already clean
  (K-08); rate limits already covered all four checkout mutations; autofill
  and RTL input direction were already correct on every checkout field.
  Remaining scope: keyboard-navigation and screen-reader (NVDA/VoiceOver)
  testing — this needs a human with real assistive tech and cannot be
  fabricated or inferred from code. **Live incident found and fixed
  2026-07-15, during an E-08 all-products visual QA sweep**: `/search` (every
  query/filter variant) had a real, reproducible CSP violation live in
  production — 2 script chunks rendered with no `nonce` attribute, blocked
  by the browser (confirmed 3× locally, then reproduced live against
  `elysia-jewellery.com` itself). Root-caused, not guessed: the build was
  silently running on Turbopack (this Next.js version's new default — the
  codebase already forces `--webpack` for `dev` for stability but the
  `build` script never got the same flag), and Turbopack has a known,
  tracked, unresolved upstream bug where dynamically-loaded script chunks
  don't get the nonce propagated (`vercel/next.js#64037`, confirmed via web
  search). Forcing `--webpack` on the build surfaced a second, real,
  independent bug it had been silently masking: `verifyCloudinarySignature`
  was exported directly from `route.ts`, which breaks Next's typed-route
  validation under webpack (Turbopack didn't catch it) — fixed by moving it
  to `src/server/adapters/cloudinary.ts`, matching the exact pattern already
  used for Shopify/CardCom webhook verification. `scripts/build.mjs` now
  forces `--webpack`. Verified: a clean `next build --webpack` production
  build shows **zero CSP console errors** across home/search (all variants)/
  category, vs. the same build under the default bundler showing 2 real
  violations every time. Full detail:
  `docs/QA_EVIDENCE.md` → `g-11-turbopack-csp-nonce-incident`. **Known cost,
  accepted deliberately**: the CSP's per-request nonce requires the root
  layout to read `headers()`, which
  forces every route (including previously-static marketing pages like
  `/checkout`, `/gifts`, `/warranty`) into dynamic rendering — confirmed via
  build output and a rejected hash-based alternative that broke Next's own
  RSC-streaming scripts (see `docs/QA_EVIDENCE.md`). Relevant to J-03/J-04 if
  Core Web Vitals regress after this ships.
- **G-12 Long-term payment architecture decision** · P2 · OWNER —
  **owner-confirmed 2026-07-15**: owned-inventory commerce (products
  Elysia holds itself, not dropship) is real and near-term, not
  hypothetical — raises this item's practical priority even though its
  P2 label is unchanged here. Direction confirmed: continue the existing
  local/CardCom architecture already built for owned stock
  (`cart-checkout.ts`/`manual-order.ts`/`pos-register.ts`, `InventoryItem`)
  rather than a Shopify-channel or split approach — no new architecture
  needed, this was already the only implemented path. A written runbook is
  still open.

### H — Service, appointments, ownership care

- **H-01 Service promise** · P0 · OWNER — channels, hours, response target,
  languages; every public claim maps to staffing and a queue.
  **Owner-confirmed 2026-07-15, partial**: channels are email + phone (not
  WhatsApp/chat/SMS — H-08 stays deferred per its own rule); hours are
  "defined" but the specific hours/response-target numbers were not given
  — still needed before any public claim can cite them. Unblocks H-03
  (already NOW after H-01) to proceed; H-02/H-04 still need their own
  EXTERNAL real-case proof on top of this.
- **H-02 Appointments as a real journey** · P1 · OWNER+EXTERNAL —
  mystery-shopper booking completes end to end.
- **H-03 Product-aware advisor handoff** · P1 · NOW after H-01 — context moves
  with the customer; minimized and consented.
- **H-04 Repair/resize/care intake** · P1 · OWNER+EXTERNAL — one real case
  completes with tracked status.
- **H-07 Contact and attachment delivery validation** · P0 · MEASURE+EXTERNAL —
  real email delivery, reply routing, scanning, offline sync, duplicate
  submission, failure alerts.
- **H-08 WhatsApp/chat/callback/SMS policy** · P2 · OWNER — only staffed,
  consented channels; SMS stays deferred until credentials and a channel
  decision exist (`SMS_PROVIDER_API_KEY` missing).
- **H-09 Service quality measurement** · P1 · NOW+MEASURE.
- **H-10 Ownership-continuity mystery shopping** · P0 (final claim) · MEASURE.

### I — Account, wishlist, post-purchase

- **I-03 Ownership-grade order timeline** · P1 · NOW after provider proof —
  event truth only; no fabricated milestones for Shopify mirrors.
- **I-04 Reorder/care/service continuity** · P2 · BENCHMARK — without turning
  account into marketing.
- **I-05 Wishlist as a decision tool — residual** · P1 · MEASURE+NOW —
  availability cues, decision-support comparison (category/material/variant
  cues), advisor handoff (`/service` with saved-item context), and
  guest-to-account merge already existed
  (`src/app/account/_lib/wishlist-shortlist.ts`). Closed the one gap the code
  itself flagged as missing ("no price/availability snapshot from when the
  item was saved"): `WishlistItem.priceAtSave` (nullable, additive-only
  migration) is now captured at save time on both write paths (`saveWishlistItem`,
  `mergeGuestWishlistAction`) and surfaced as a real "price dropped/increased
  since you saved it" note (`getWishlistItemPriceChange`) on the wishlist
  page — computed only from a genuine stored-vs-current comparison, never
  fabricated, and silently absent for pre-migration saves rather than
  guessing a historical price. "Size memory" already exists structurally: a
  wishlist item is a specific saved variant (including its size), and the
  separate site-wide saved-size feature (`size-fit.ts`) already restores
  selection on PDP return. Verified: 5 new unit tests
  (`wishlist-shortlist.test.ts`), a fixed pre-existing test that would have
  silently accepted `NaN` into a price column, and a live round-trip through
  the real DB and the exact Prisma query shape the wishlist page uses.
  **Remaining, genuinely MEASURE**: whether these cues measurably change
  decision behavior needs field data, not further engineering.
- **I-06 Preference and consent governance** · P0 · NOW+OWNER — source,
  timestamp, withdrawal, retention. (ADR 0014 requires behavioral pre-consent
  proof; consent-surface unification is parked post-L1.) **New finding
  (2026-07-15), not fixed here — flagged, not guessed at**: J-09's audit
  scoped explicitly to "client-side call sites" sending to
  `/api/analytics/events`/`/api/analytics/replay`. A separate, server-side
  write sits outside that scope: `recordSearchEvent`
  (`src/app/search/page.tsx`) fires unconditionally via `after()` on every
  real search request, writing the raw query text, filters, and result count
  to `SearchEvent` with **no consent check at all** — every other live
  tracking path is gated on `consent === "all"`, this one has no gate.
  Investigated *why*: `src/lib/cookie-consent.ts`'s consent record lives only
  in `window.localStorage` (never a real HTTP cookie), so it is
  **structurally unreadable from a Server Component** — there is currently no
  server-side signal to gate on, not a simple missed `if`. `SearchEvent` rows
  carry no visitor/session/customer identifier, so whether anonymous
  query-text logging even requires consent under Amendment 13 is itself a
  real legal question, not an engineering one. (The two other server-side
  event-writers, `recordProductClickEvent`/`recordProductViewEvent`, are
  confirmed dead code per J-09 — their only callers are two API routes with
  zero live callers in `src` — so they are not part of this finding.) Needs
  either a lawyer read (does anonymous query telemetry need consent) or, if
  yes, a real server-readable consent signal (an actual cookie, not
  localStorage) before this can be fixed correctly — not attempted blind.
- **I-07 Privacy export and deletion end to end** · P0 · MEASURE — legal
  sign-off and production-safe test.
- **I-08 Transactional communication governance — residual** · P1 · NOW —
  audited every `BUSINESS_EVENTS.emailRequested` outbox send-site (14 call
  sites across order/shipment/refund/appointment/service/journey/return-request
  flows). All but one already keyed idempotency on stable identifiers alone
  (order/entity id + status, never wall-clock time), so retries correctly
  collapse via `createOutboxEvent`'s upsert-by-`idempotencyKey`. Found and
  fixed the one real gap: `upsertAdminShipment`'s key embedded `Date.now()`,
  so an EDI/carrier webhook retry for the same order+status silently sent a
  second "your order shipped" email on every retry — fixed to drop the
  timestamp, pinned with a regression test. Localization is Hebrew-only
  app-wide (matches ADR 0014's L1 scope, not a gap). **Remaining scope**: no
  central template registry exists — each send-site inlines its own copy, so
  a wording fix requires finding every call site by hand; whether that's worth
  building is a real design decision, not attempted here. Evidence:
  `docs/QA_EVIDENCE.md` → `i-08-transactional-communication-governance`.
- **I-09 Repeat-ownership measurement** · P2 · MEASURE.

### J — Content, SEO, accessibility, performance

- **J-01 WCAG 2.2 AA audit** · P0 · MEASURE — automated + full keyboard +
  NVDA/VoiceOver + zoom/reflow/contrast/reduced-motion; statement reflects
  reality. (ADR 0014: statutory baseline ת"י 5568 is the L1 floor,
  capsule-scoped.)
- **J-02 Hero media accessibility** · P1 · MEASURE — pause discoverable,
  reduced motion/data saver, poster fallback, contrast on every bright frame.
- **J-03 Production Core Web Vitals** · P0 · MEASURE — RUM by route/device;
  needs real traffic (post-L1); lab-only until then.
- **J-04 Homepage/PDP JavaScript cost** · P1 · NOW after measurement.
- **J-05 Technical SEO validation — residual** · P1 · MEASURE — the NOW-doable
  mechanical half is shipped and evidenced (`docs/QA_EVIDENCE.md` →
  `j-05-technical-seo-validation`): new `pnpm qa:seo` crawl tool + tests for
  `sitemap.ts`/`robots.ts`. Found and fixed a real gap: 6 live pages
  (`/gifts`, `/wishlist`, `/checkout`, `/ai`, `/stylist`, `/size-guide`) had
  no page-specific meta description and silently inherited the root
  layout's, making them indistinguishable to a crawler; each now has its own.
  Structured data was already tested (`json-ld.test.ts`,
  `product-structured-data.test.ts`, pre-existing); no `redirects()` rules
  are configured in `next.config.js`, so there is nothing to validate there
  yet. **Remaining, genuinely MEASURE**: the site is intentionally
  `noindex`/`nofollow` site-wide pre-launch (no verified legal identity,
  J-08 open; 0/300 catalog products publish-ready, I-341 open) — real
  search-console crawl/ranking behavior cannot be measured until that
  policy is lifted for a real launch, which is a business/legal decision,
  not an engineering one. (Language/SEO architecture decision itself is
  parked: Hebrew-only at L1.)
- **J-06 Hebrew search-content model** · P1 · OWNER+MEASURE — content answers a
  task and leads to products; no SEO filler.
- **J-07 Editorial legal-page usability** · P2 · BENCHMARK — print style and
  last-updated are already shipped; a 2026-07-10 benchmark pass found zero of
  15 Tier A sites support mobile in-page ToC or plain-language summaries
  (`docs/QA_EVIDENCE.md` legal-page-editorial-structure-benchmark) — that
  specific pairing is not implementable without an explicit exception.
  Remaining scope, if pursued: a differently-scoped proposal (e.g. an
  accordion grouping) would need its own benchmark pass. (I-330)
- **J-08 Legal identity and policy review** · P0 · OWNER+EXTERNAL — counsel
  approval; footer/checkout expose only applicable facts. (ADR 0014: no
  verified legal identity, no L1.)
- **J-10 Content governance — residual, scoped to product facts/policy** ·
  P1 · NOW — "every public claim" site-wide (legal pages, homepage copy,
  FAQ, etc.) has no single existing data model to extend, unlike B-07's
  `ProductMedia` — attempting all of it in one pass would mean inventing a
  new governance concept from nothing, which this pass deliberately did not
  do. Scoped instead to the one place governance already partially existed:
  `Product.factVerifiedAt`/`factVerifiedBy`/`factSourceReference` and the
  `policy*` equivalents (owner, source, review date already there since
  I-341) had no **expiration** and no **rollback** — a fact verified once
  stayed "verified" forever, with nothing to force re-review. Closed both:
  `factVerificationExpiresAt`/`policyVerificationExpiresAt`
  (`prisma/migrations/20260715010000_product_verification_expiration`,
  additive-only) plus three new I-341 catalog-readiness checks
  (`scripts/lib/catalog-readiness.ts`): no expiration set (medium),
  expiration passed (blocker), matching the existing MISSING severity — an
  expired verification is treated as unverified, the "rollback" is that
  automatic degradation (matching the "missing fact → hide the field"
  ground rule), not a separate manual undo mechanism. Verified: 3 new unit
  tests plus a live round-trip against a real DB row proving the full
  DB → mapping → engine path. **Remaining, explicitly not this pass's
  scope**: extending owner/source/review-date/expiration/rollback to
  non-product public content (legal pages, homepage, FAQ) needs its own
  governance model decision first — a real design question, not an
  extension of B-07's pattern.
- **J-11 Social proof only when real** · P2 · OWNER. **Blocked**: needs real
  customers/reviews, which need real sales — same demo-catalog constraint.
- **J-12 Internationalization boundaries** · P2 · OWNER — no selectors for
  unsupported service; multi-currency is parked (ADR 0012, ILS-only).
  Already has a working default (Hebrew/ILS-only); no fresh owner input
  needed unless that default should change.

### K — Operations, admin, security, reliability

- **K-04 SLOs and alert ownership — residual** · P1 · OWNER — the alert model,
  event-class SLOs, escalating email delivery to `OPERATIONS_EMAIL`, and the
  invariant sweep are shipped (ADR 0003/0007). Remaining scope: the owner
  names a human owner + escalation path per alert class beyond the single
  operations inbox. **Owner-confirmed 2026-07-15, partial**: there is more
  than one person, routed by alert class/type (not one solo operator) — the
  model is per-class ownership. Still needed: the actual name/contact per
  alert class to route `OPERATIONS_EMAIL` escalation to, once real staffing
  exists — not fabricated here.
- **K-05 Inventory correctness testing — residual** · P1 · MEASURE — the
  correctness work is shipped and evidenced (docs/QA_EVIDENCE.md →
  `k-05-inventory-correctness`): the checkout oversell guard is a proven
  compare-and-swap on `reserved` (READ COMMITTED EvalPlanQual re-check), the
  same guard covers manual-order and POS, and the reservation-expiry vs.
  payment-capture race is fixed with a symmetric `PENDING_PAYMENT` status CAS
  in `jobs.ts` (expiry now claims the cancellation before releasing stock) and
  `payment-webhooks.ts` (capture flips to PAID only from PENDING_PAYMENT).
  Shopify stock never reaches the local ledger — the sync writes no inventory
  rows, checkout filters to `source === "OWN"`, and `updateAdminInventory` now
  rejects dropship variants. Deterministic + source-shape tests pin all of it.
  The same status CAS also gates the GL/loyalty pipeline directly: a payment
  captured after the order already lost the race to cancellation is logged
  (`captured-after-order-not-paid`) and never posts a sale or awards points
  against inventory it no longer owns. Remaining scope: (1) an empirical
  live-DB concurrency e2e (two simultaneous checkouts of the same low-stock
  variant) — this repo has no Vitest test-DB wiring, so the oversell guard is
  currently proven by reasoning + DB semantics rather than measured; (2) a
  payment captured in that same narrow race still leaves a CAPTURED payment
  sitting on a CANCELLED order (inventory and the books both stay correct, but
  the customer paid for an order marked cancelled) — needs a manual
  finance/refund reconciliation path, tracked as an EXTERNAL+OWNER follow-up
  once CardCom refund credentials exist (G-04), not an inventory gap.
- **K-06 Catalog and provider drift detection — residual** · P1 · NOW+MEASURE —
  the fail-closed click-out verification, price-drift re-confirmation, the
  scheduled sync job (ADR 0012), and webhook-registration/token-scope drift
  checks (wired into the existing operational-alert sweep) are shipped.
  Remaining scope: mirror-staleness alerting against the 12h freshness SLO
  (needs the 6h cadence unlocked by Fact B). **Live incident found
  2026-07-15, while doing an L-05 deployment evidence refresh**: production
  Typesense (`TYPESENSE_HOST=tdgkmbue18jz7xwap-1.a2.typesense.net`) has been
  **unreachable** — the hostname doesn't resolve at all (confirmed via `vercel
  logs`: `ENOTFOUND`, and independently via a plain `nslookup` from outside
  Vercel's network: "Non-existent domain") — while `TYPESENSE_API_KEY` and
  `TYPESENSE_HOST` both stay set, and `AI_SEMANTIC_SEARCH_ENABLED="true"`.
  Every production search request has been silently running on the local
  fallback path with **zero signal anywhere** — no alert exists to catch
  this, because `/api/health`'s `search` check (`src/server/services/health.ts`)
  only verified "are credentials present," never "is the provider actually
  reachable" (unlike `checkDatabase()`, which already does a real `SELECT 1`
  ping). Not user-facing broken — the fallback is the same tested, working
  path E-03/L-04 already cover — but real functionality (Typesense-scored
  relevance, semantic/AI search) has been silently degraded for an unknown
  duration. **Fixed the detection gap**: added `checkTypesenseConnectivity`
  (`src/server/adapters/search.ts`, a real `client.health.retrieve()` probe,
  2s timeout so a dead provider can't hang a health check) and wired it into
  `health.ts`'s `search` status, now distinguishing `configured` (reachable)
  from `unreachable` (configured but dead — the exact state found here) from
  `local-fallback` (not configured at all). Deliberately did **not** add
  `unreachable` to the hard-failure list — search stays non-blocking by
  design per `docs/RUNBOOKS.md`'s Typesense outage runbook; the status value
  now just tells the truth for that runbook (and any future alerting) to act
  on. Verified: 5 new unit tests
  (`search-typesense-connectivity.test.ts` — reachable, unreachable-response,
  unreachable-network-error using the exact real `ENOTFOUND` message,
  timeout-doesn't-hang, and not-configured-never-calls-provider). **Not
  fixed, and not attempted**: (1) the actual Typesense Cloud cluster —
  needs dashboard/account access this pass doesn't have, tracked as an
  EXTERNAL/OWNER follow-up, same shape as G-04's CardCom gap; (2)
  `admin-integrations.ts`'s dashboard summary still only checks
  configuration presence, not real connectivity — its `createIntegrationSummary`
  helper is synchronous and would need a real refactor to thread an async
  probe through, named here rather than rushed; (3) wiring the new
  `unreachable` signal into the operational-alert sweep itself (this fix
  only makes `/api/health` accurate — nothing currently reads it
  automatically) is the concrete remaining scope for this item's own
  mirror-staleness-alerting line above.
- **K-07 Backups and recovery** · P0 · EXTERNAL+MEASURE — restore drill meets
  RPO/RTO. (ADR 0008: PITR is a launch requirement; drill is acceptance;
  blocked on owner Fact A — Postgres provider/tier.)
- **K-09 Privacy and retention implementation** · P0 · OWNER+MEASURE —
  retention matrix, deletion jobs, legal holds; policy and implementation
  agree. **Blocked**: this is lawyer-scoped work (ADR 0014), and that
  engagement hasn't started yet (§5) — not something to guess at ahead of
  counsel.
- **K-10 Dashboard automation strategy** · P2 · DEFER — prefer Shopify API/CLI
  evidence; no release check depends on Cloudflare-blocked automation.
- **K-11 Windows prebuilt limitation** · P3 · DEFER — local
  `vercel build --prod` hits an `EPERM` symlink error; remote Vercel build is
  the supported path until a workaround is confirmed.
- **K-12 Physical boutique scope** · P2 · OWNER — **closed 2026-07-15**:
  owner confirmed online-only, with an explicit instruction — keep the
  branch-management code/infrastructure, only hide it from the end
  customer, not remove it. Verified already correct, no change needed:
  `src/app/branches/page.tsx:54-55` gates customer-facing branch display on
  `ServiceSettings.physicalBranchesEnabled` (defaults `false` in
  `prisma/schema.prisma`) AND real branch data existing; all admin
  branch-management surfaces (`src/app/admin/*`) stay untouched. This is
  the same shape as the earlier `20260518120000_service_requests_hidden_branches`
  migration — a deliberate, already-existing pattern, not new work.

### L — QA, measurement, release proof

- **L-01 Outcome evidence over checklists** · P0 · NOW, ongoing discipline —
  not a completable build (every future evidence entry must keep meeting
  this bar), but audited rather than left as an assumption: grepped
  `docs/QA_EVIDENCE.md` for cross-references to documents this repo's own
  PR #17 consolidation deleted. Found **62 stale references** across the
  file — mostly a repeated boilerplate "Required Gate" line
  (`docs/PUBLIC_CHANGE_GATE.md`, `docs/FULL_PRODUCT_BENCHMARK.md`) on older
  benchmark entries, plus scattered references to `docs/PROJECT_TASKS.md`
  and the pre-merge master-plan docs — pointing at paths that no longer
  exist, exactly what L-01 exists to prevent. Fixed mechanically (verified
  no test pins the old strings first): `PROJECT_TASKS.md` → `TASKS.md`,
  `FULL_PRODUCT_BENCHMARK.md`/`PUBLIC_CHANGE_GATE.md` → `DESIGN.md` (the
  content was merged into it, confirmed via the L-03 evidence entry), 
  `ENGINEERING_CONVENTIONS.md` → `ENGINEERING.md`, and the three former
  master-plan docs → `TASKS.md` (matching `TASKS.md`'s own header, which
  already documents the merge). Line count unchanged (7719 before/after) —
  pure substitution, no content lost.
- **L-02 Stable browser evidence collection — residual** · P1 · NOW —
  the originally-diagnosed reliability gap is fixed: catalog-fixture drift
  under `E2E_CATALOG_FIXTURES=1` (hard-coded friendly slugs like
  `hera-bracelet`/`venus-line-ring`/`muse-pearl-earrings` 404ing because the
  fixture catalog never defined them) was fixed at the source — all three
  added as explicit fixture products in `catalog-fixtures.ts` — rather than
  retrofitting the ~13 affected test call sites. Two clean runs of
  `critical-flows.spec.ts --project=chromium-desktop` post-fix: **62 passed,
  3 failed, 3 skipped, ~2.1–2.9 minutes**, zero failures in the fixed class.
  Along the way: seeded a previously-empty local dev DB (fixed 3 more
  failures) and corrected two stale e2e assertions (a not-found testid/CTA
  copy drift and a stale home-hero-title assertion). Full detail:
  `docs/QA_EVIDENCE.md` → `l-02-stable-browser-evidence-collection`.
  **Remaining, newly found and genuinely distinct**: (1) a PDP layout test on
  the supplier product throws "missing layout elements", undiagnosed; (2) the
  admin "archiving a product" e2e test's row filter is now ambiguous against
  the C-08 catalog-readiness dashboard (10 matching rows, needs a stricter
  selector); (3) the admin "refunding an order" e2e test's own setup route
  returns 500, undiagnosed; (4) `customer-auth-fixtures.ts` needs
  `hera-bracelet` in the **real** DB too (a separate gap from the in-memory
  fixture catalog fixed here) — not fabricated, since `prisma/seed.ts`'s
  `SeedProduct` shape requires real supplier-provenance facts this pass
  doesn't have; needs an owner decision on representing a first-party seed
  product. Sharding (`--shard=i/n`) remains available and unexercised.
- **L-04 Full state matrix** · P0 · NOW (residual) — anonymous/authenticated/
  admin × own/supplier/mixed × device × offline/provider states; every P0
  journey has a deterministic test per applicable state. **Covered (e2e,
  `tests/e2e/critical-flows.spec.ts` + `authenticated-account.spec.ts` +
  `pwa.spec.ts`), each auto-parametrized across desktop/tablet/mobile ×
  chromium/firefox/webkit via `playwright.config.ts` projects:** anon×own
  checkout, anon×supplier-only checkout, **anon×mixed checkout** (own+supplier
  kept on separate local-submit vs. supplier-click-out paths — no fake combined
  payment), auth-customer×own+supplier order view + data export, admin auth
  (password→TOTP→session, recovery-code login+reuse-reject, MFA-mandatory) and
  audited admin writes, **admin per-domain READ permission split** (CATALOG_READ
  reaches `/admin/catalog`, denied on orders/finance/crm/erp/inventory/analytics/
  customers), **offline-degraded checkout** (payment status→unavailable, both
  pay actions disabled, recovers on reconnect, no crash), PWA offline (cached
  PDP, offline size-save, queued add-to-cart), **search under Typesense
  unreachable** (real fixture catalog results + count, no invented/empty state),
  and **admin per-domain WRITE-gate** (a new `finance-read-only` fixture role —
  `FINANCE_READ` without `FINANCE_WRITE` — reaches `/admin/finance` but a real
  form-submitted write (`seedChartAction`) is blocked, proving K-15's WRITE
  split through the real UI, not just at the mutation gate).
  **Open gaps (named):** (1) authenticated-customer *local order placement* +
  own-checkout payment success + supplier click-out redirect — blocked on
  CardCom/Shopify credentials (G-01/G-02/G-04, EXTERNAL); (2) empirical
  two-simultaneous-checkout concurrency proof (K-05 MEASURE); (3) provider-down
  for a live Shopify/CardCom error (no creds locally → mock path, EXTERNAL).
  Harness note: `signInAdminWithFixture` shares one fixture account per role,
  so admin tests can contend under parallel projects (shared TOTP secret) —
  verified serialized. Evidence: `docs/QA_EVIDENCE.md` → `l-04-full-state-matrix`.
- **L-05 Production deployment evidence refresh** · P0 · NOW after each
  release — commit SHA, deployment ID, alias, smoke, 60-minute clean-log
  window; recorded in `docs/QA_EVIDENCE.md`. **Third live incident found
  2026-07-15, same refresh pass as K-06/G-11**: two production deploys
  failed on `Error: P1002 ... Timed out trying to acquire a postgres
  advisory lock` — root-caused, not assumed transient: `prisma migrate
  deploy`'s advisory lock is session-scoped and unreliable through
  PgBouncer transaction pooling (`DATABASE_URL`'s Neon `-pooler` endpoint);
  a direct query against production found the lock genuinely stuck on an
  idle, 20-minute-old pooled backend. Terminated the stuck backend
  (`pg_terminate_backend`, confirmed 0 remaining advisory locks) and fixed
  the root cause: added `directUrl` to the Prisma datasource
  (`env("DATABASE_URL_UNPOOLED")`, the standard Prisma+Neon pattern),
  provisioned the real unpooled connection string in Vercel production env
  (derived from the pooled URL per Neon's own naming convention — same host
  minus `-pooler` — then verified reachable before use), and documented the
  local/`.env.example` equivalent. **Verified**: the next production deploy's
  build log showed the migration step complete in under half a second (vs.
  two prior attempts each blocking the full 10-second timeout and failing);
  confirmed live on the `elysia-jewellery.com` alias. Full detail:
  `docs/QA_EVIDENCE.md` → `l-05-deployment-evidence-2026-07-15`.
- **L-06 Real transaction canaries** · P0 · EXTERNAL — low-value own and
  supplier transactions with refund/void, cleanup, and alerting.
- **L-07 Product analytics definition** · P1 · NOW+OWNER — full funnel schema,
  deduplication, consent, attribution.
- **L-08 Experiment governance** · P2 · OWNER.
- **L-09 Comparative usability studies** · P0 (final claim) · MEASURE.
- **L-10 Trust and luxury perception research** · P0 (final claim) · MEASURE.
- **L-11 Release scorecard — residual** · P1 · OWNER/EXTERNAL —
  `pnpm release:scorecard` exists and enforces `NOT READY` on any missing
  field; the L1/L2 split is implemented, **but now stale** — ADR 0013
  merged L1/L2 into one real-money gate 2026-07-15 (World B), so the tool's
  two-section model no longer matches reality; see the new "Release
  scorecard L1/L2 merge" item in §5. Remaining scope is turning the
  owner/external-blocked fields to `PASS` with real evidence.
- **L-12 Benchmark refresh cadence** · P2 · NOW, recurring — ran a real
  reachability pass 2026-07-15 against all 15 current gate sources
  (`src/lib/public-design-policy.ts` `tierALuxuryHouses`, the ADR
  0015-replaced list — this row's own wording still said "Tiffany", which
  ADR 0015 already replaced with Repossi; corrected here). **12 of 15**
  loaded with real, confirmed product content (Cartier, Repossi, Garrard,
  Vhernier, Verdura, Chopard, Suzanne Kalan, Anna Sheffield, Mikimoto,
  Messika, De Beers, Roberto Coin). **1 hard failure**: Buccellati returned
  HTTP 405 (likely a bot-detection edge rule, the same failure class ADR
  0015 already documented for other sites). **2 partial**: Jessica
  McCormack and Pomellato returned navigation/structure only, no product
  listings in the fetched content — plausibly client-rendered product grids
  this tool's fetch-and-convert-to-markdown approach doesn't execute, not
  necessarily the site being down. **Not a replacement trigger**: ADR 0015's
  own bar was 8 of 15 unreachable across two independent passes; 1 clean
  failure plus 2 ambiguous ones falls well short of that, so no site
  substitution is warranted from this pass — recorded as a normal quarterly
  observation. Next due: 2026-10-15 (quarterly from this pass).

## 5. Launch gates and external/owner blockers

**Launch gate merged (owner decision, 2026-07-15):** the former two-gate
model (ADR 0013) — L1 referral storefront with zero Elysia-processed money,
then L2 own commerce — no longer holds. World B (Elysia is merchant of
record for dropship, ADR 0009) breaks L1's "zero money on day one" premise
for the entire supplier-only L1 capsule. Presented with the real options,
the owner chose explicitly: **no zero-money-day-one phase; CardCom capture,
invoicing, and reconciliation — previously L2-only — now gate first public
launch itself.** Full detail and the specific corrected acceptance criteria:
`docs/DECISIONS.md` ADR 0013 ("What the merge means"). Still open, not
assumed either way: whether owned-inventory commerce (`InventoryItem`
stock, unrelated to dropship) launches alongside dropship or stays a
separate later phase.

**Release scorecard L1/L2 merge — closed 2026-07-15.**
`scripts/lib/release-scorecard.ts` no longer has a `ReleaseGate`/per-field
gate concept — one flat required-field list, one `ready` verdict. Two
fields renamed/relabeled to match World B: `supplierPaidFlowProof` →
`dropshipPaidFlowProof` ("Elysia as merchant of record, not a supplier
click-out"); `ownPaidFlowProof` relabeled to specify owned-inventory
(branch stock) specifically, since both proofs are now Elysia-MOR flows.
`reconciliation`'s scope grew to explicitly include the dropship
supplier-payable/COGS leg. `formatReleaseScorecardMarkdown` output
simplified to match (no more per-gate sections). Verified: CLI smoke run
(`pnpm exec tsx scripts/release-scorecard.ts`) produces a clean flat
artifact with the renamed field and no `gates.L1`/`gates.L2`;
`scripts/release-scorecard.test.ts`,
`scripts/release-slice-pipeline-smoke.test.ts`, and
`scripts/release-slice-gate.test.ts` all green (30/30); full `pnpm check`
green.

Named blockers that no engineering task can close:

- **EXTERNAL-P0 — CardCom sandbox + official integration documentation**
  (ADR 0006): verification endpoint, stable transaction identity, signing
  semantics, sandbox cases. Now gates first public launch, not just L2.
- **EXTERNAL-P0 — Israeli רו"ח engagement** (ADR 0010): document type, VAT,
  digital-document rules, PCN874/SHAAM, and the D6 ruling on internal issuance.
  Scope grows from commission-only invoicing to full customer-sale invoicing
  for dropship — now gates first public launch.
- **EXTERNAL-P0 — Lawyer engagement for the L1 package** (ADR 0014): referral
  terms, seller-identity wording, privacy (incl. Amendment 13), cookies,
  accessibility statement, refund split.
- **OWNER-P0 — Supplier wholesale/COGS agreement** (ADR 0009, updated
  2026-07-15): store-ownership question answered — **World B, Elysia is
  merchant of record for dropship**. Still open: wholesale pricing terms,
  payment terms to the supplier, refund/return cost allocation at the
  supplier leg, written-agreement status. No agreement, no dropship launch.
- **OWNER-P0 — Verified legal identity** (ADR 0014): entity, registration
  number, contacts across all legal surfaces. No verified identity, no
  launch. **Real status (2026-07-15): no entity exists yet** — owner plans
  to incorporate shortly before launch. All facts in
  `src/lib/legal-content.ts` are placeholder (`[להשלמה]`) and stay that way
  until then; that file is the single place to fill in once real, no
  engineering rework needed. Given the launch gate now requires real money
  infrastructure (World B, above), registration + business bank account +
  CardCom merchant KYC + accountant invoicing setup can plausibly take
  weeks, not days, which narrows how late "shortly before launch" can
  actually mean. Lawyer/accountant engagement (the two EXTERNAL-P0 items
  above) does not require the entity to exist first and should start now
  regardless of exact incorporation
  timing.
- **OWNER-P0 — Fact A / Fact B infrastructure answers** (ADR 0008): Postgres
  provider/tier/PITR; Vercel per-minute cron capability.
- **OWNER — capsule facts, media rights, and photography** (ADR 0011): ≥30
  publish-ready supplier products with explicit media-rights status.
- Deferred decisions with triggers (admin subdomain, role separation, QStash,
  passkeys, step-up re-auth, multi-currency, ERP breadth resumption, etc.):
  see `docs/PARKING_LOT.md`.

## 6. Wave sequence

Truth and proof before visual polish — polish cannot compensate for
placeholder facts, duplicate media, or unproven payment.

| Wave  | Theme                              | Open items                                                                                                               |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **0** | Truth & proof foundation           | I-341, I-342, C-01/C-04, D-04, G-01…G-04, H-01/H-07, I-06/I-07, J-08, K-05/K-07/K-09, L-01/L-04/L-05/L-07 |
| **1** | House identity, collections, media | A-02…A-05 (A-01 closed), B-01…B-07, C-05/C-07                                                                            |
| **2** | Discovery & PDP authority          | E-01…E-10, F-01…F-11, D-05                                                                                               |
| **3** | Real commerce & clienteling        | G-05…G-12, H-02…H-10, I-02…I-08, A-06                                                                                    |
| **4** | Reduction, polish, field quality   | D-01…D-03/D-06…D-08, J-01…J-07/J-10…J-12, K-04/K-06, L-02/L-03/L-06                                                      |
| **5** | Comparative proof                  | A-08, I-09, L-08…L-10/L-12                                                                                               |

Homepage backlog reconciliation: the former homepage implementation-pass items
are implemented but not field-verified — verification lands in D-03, J-01,
J-03, J-05, and L-05; the factual blockers live in D-04 and J-08/J-11. Hero,
rhythm, bilingual, and device items are not assumed complete merely because
the page passes objective route QA.

## 7. Superiority claim gate (unchanged, not yet claimable)

The "surpassed Tiffany" claim requires: weighted comparative score ≥ `4.6/5`,
lead of ≥ `0.2` overall, no dimension ≥8% weight more than `0.2` behind, no
open P0, evidence under 90 days, and product/brand/operations/legal approval.
Until then the accurate statement remains: technically mature, increasingly
distinctive, several UX advantages — superiority unproven. Final claim
checklist items (paid E2E proof, WCAG manual pass, field CWV, security review,
restore drill, comparative studies) are tracked as the P0 items above.

**Non-goals** (do not count as progress): more gradients/badges/floating
controls, more homepage sections, more AI prominence, generic luxury copy, a
larger test count without state coverage, generated lifestyle images that
misrepresent products, unverified proof claims, fake combined checkout, or
copying Tiffany's visual language.

## 8. Radical candidates (BENCHMARK-gated, none approved)

- **CX-N1 Signature configurator** — gate: F-03 operationally real.
- **CX-N2 Guided clienteling thread** — gate: H-01…H-05, I-06 consent.
- **CX-N3 Fit & scale confidence system** — gate: B-06 media, F-02.
- **CX-N4 Collection worlds** — gate: A-05, C-05, sufficient unique media.
- **CX-N5 Ownership continuum** — gate: I-03, H-04, A-06.
- **CX-N6 Trustworthy virtual try-on** — gate: F-12 (currently DEFER).
- **CX-N7 Editorial-commerce fusion** — gate: J-06, E-05.
- **CX-N8 Privacy-respecting personalization** — gate: C-06, I-06.

## 9. Shopify dropship — standing status and rules

Implemented and verified in the repository: product-source split, optional
Shopify config with safe defaults, API adapter, guarded dry-run/write sync,
mixed-cart grouping with separate checkout paths, webhook signature
verification with a read-only order mirror, and account/admin mirror
visibility. Production rollout is enabled (`SHOPIFY_DROPSHIP_ENABLED=true`,
sync write-guarded off); Neon production DB, webhook registration, scopes, and
tokens are in place; `pnpm shopify:dropship:doctor` reports all readiness
flags `true`.

Still external/manual (tracked as G-01…G-04, H-08): real supplier connection,
paid checkout test, fulfillment confirmation, CardCom credentials, SMS
credentials.

Operational helpers: `pnpm shopify:dropship:doctor -- --first 5`
(add `--register-orders-webhook --site-url https://elysia-jewellery.com` for
webhook/rollout checks); `pnpm shopify:dropship:sync -- --first 10` (dry-run;
`--write` only after the dry-run lists expected products);
`pnpm vercel:env:upsert -- --target production` (dry-run first).

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

Do not implement without explicit approval:

- Replacing local checkout with Shopify for `OWN` products.
- Removing CardCom or local payment support.
- Making Shopify required for local development or unrelated builds.
- Combining mixed carts into one fake total or one fake order.
- Processing Shopify product payments directly in Elysia.
- Writing local inventory ledgers for Shopify-owned inventory.
- Treating Shopify mirror orders as local orders that can be fulfilled,
  captured, refunded, or adjusted by existing local workflows.

## 10. Required owners

Every P0 item needs a directly-responsible owner, an acceptance owner, and a
target evidence date before work begins. Non-delegable: founder/brand
(positioning, claims, house codes), creative director (photography, art
direction), merchandising (assortment, pricing), operations (payment,
supplier, fulfillment, service), legal/privacy (entity, policies, consent,
claims), accessibility specialist (manual WCAG), security reviewer, and
analytics/research (field metrics, comparative studies). Engineering owns the
data model, implementation, reliability, tests, and observability.

## 11. Maintenance rules

- Delete completed items after acceptance checks and verification are recorded
  in commit, PR, release, or QA evidence (`docs/QA_EVIDENCE.md`).
- Move an item to implementable status only after benchmark evidence is
  recorded.
- Keep blocker language concrete: name the missing credential, provider
  action, operational proof, or environment condition.
- Add new items conservatively, with evidence from repository docs, route
  inventory, tests, provider checks, QA artifacts, or explicit product
  decisions.
- Keep this file synchronized when a route materially changes or an item
  closes; keep decision records in `docs/DECISIONS.md`, deferred decisions in
  `docs/PARKING_LOT.md`.
