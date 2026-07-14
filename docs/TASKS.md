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

- **A-01 Define the unmistakable house idea** · P1 · OWNER+MEASURE — one
  sentence of brand truth, promises, emotional territories, the owned tension.
  Acceptance: independent reviewers describe Elysia consistently, not as
  "Tiffany-like".
- **A-02 Recognizable visual code system** · P1 · BENCHMARK — image geometry,
  crop rules, signature framing, motion grammar, one restrained proprietary
  accent. Acceptance: five unbranded screens read as one house. Depends: A-01.
- **A-03 Bilingual voice system** · P1 · NOW+OWNER — when English is allowed,
  transliteration, punctuation direction, numerals/currency, CTA verb
  standards. Acceptance: Hebrew remains the primary reading path.
- **A-04 Evidence-backed house copy** · P1 · OWNER — rewrite public copy from a
  verified fact bank; unsupported superlatives absent.
- **A-05 Collection architecture** · P1 · OWNER+BENCHMARK — named collections,
  hero pieces, visual worlds, cross-sell logic; publication justified by
  distinct products and media.
- **A-06 Brand into ownership** · P2 · OWNER — packaging, gift note, order
  email, care card, repair/return communication; no provider-template feel.
- **A-07 Campaign and editorial cadence** · P2 · OWNER — storytelling changes
  because a real campaign exists, not for layout novelty.
- **A-08 Blind distinctiveness validation** · P0 (final claim) · MEASURE —
  unbranded recognition study; failures return to A-01/A-02.

### B — Product media and art direction

- **B-01 Replace duplicated catalog media** · P0 · OWNER — product-to-media
  manifest; no unrelated products share identical media hashes; missing assets
  unpublish the product.
- **B-02 Minimum media set per product** · P0 · OWNER — clean primary,
  alternate angle, scale-on-body, construction detail, material macro,
  packaging/context; P0/P1 products at 100%.
- **B-03 Media art-direction standards** · P1 · NOW+OWNER — background, shadow,
  color accuracy, crops, retouching; category grids read as one set.
- **B-04 Variant-media mapping** · P1 · NOW after assets — decide schema need;
  metal/stone change updates media without losing gallery position.
- **B-05 PDP inspection quality** · P1 · NOW after B-02 — zoom resolution,
  touch pan, sequencing, color fidelity; nothing blocks the purchase panel.
- **B-06 Truthful scale and fit media** · P1 · OWNER — on-body photography at
  defined measurements; reproducible scale claims.
- **B-07 Asset governance** · P1 · NOW — provenance, license, approval,
  mapping, alt, expiration in an asset manifest; generated assets labeled.

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
  reproducible. (Note: ADR 0012 structurally blocks all discounts on
  supplier-MOR items at L1.)
- **C-05 Collection merchandising controls** · P1 · NOW after A-05 — hero
  product, manual rank, launch status, availability-aware fallback.
- **C-06 Product relationship modeling** · P2 · NOW — same-family, complements,
  sets, alternatives; no implied personalization when logic is source-based.
- **C-07 Supplier provenance language** · P1 · BENCHMARK+OWNER — what source/
  fulfillment/warranty facts are public; premium tone without implying Elysia
  manufacture. (I-334)
### D — Homepage and global experience

- **D-01 Reduce homepage length and competing intent** · P1 · BENCHMARK — rank
  sections, remove duplicate paths, cap rails.
- **D-02 Unmistakable hero** · P1 · OWNER+BENCHMARK — approved house idea,
  uniquely-Elysia campaign/product image, one dominant action.
- **D-03 Homepage manual validation** · P0 (release claim) · MEASURE — full
  keyboard/screen-reader/contrast/touch/reduced-motion/device matrix, real CWV,
  Rich Results.
- **D-04 Factual homepage blockers** · P0 · OWNER — legal identity, approved
  policy phrasing, real social proof, real promotion rules; unverified claims
  stay absent.
- **D-05 Header taxonomy** · P1 · BENCHMARK — validate placement on desktop
  and mobile; AI stays out of primary navigation without an approved exception.
- **D-06 Footer density** · P2 · BENCHMARK — no second landing page.
- **D-07 Intrusive global chrome** · P1 · NOW — cookie/accessibility/sticky
  layers reviewed together on every core route; no floating element covers a
  focusable or purchasing control. Baseline evidence exists in the floating
  chrome collision audit (`docs/QA_EVIDENCE.md`).
- **D-08 Motion grammar — residual** · P2 · BENCHMARK — token/CSS layer is
  complete (one easing family, tokenized durations, no layout-animating
  transitions); remaining scope is subjective motion-feel changes, which need
  gate sign-off and visual-regression review.

### E — Discovery: search, categories, gifts

- **E-01 Taxonomy audit** · P1 · MEASURE+OWNER — customer-language evidence for
  every navigation and filter term.
- **E-02 Semantic search evaluation — residual** · P1 · NOW+MEASURE — the
  deterministic-path harness and labeled Hebrew corpus exist
  (`src/server/adapters/search-evaluation.ts`); remaining scope:
  transliteration/morphology corpus depth, semantic/AI path evaluation, and
  runs against the real catalog.
- **E-03 Merchandiser-aware ranking** · P1 · NOW — blend relevance,
  availability, collection priority; exact intent wins; ranking inspectable.
- **E-04 Filter and sort validation** · P1 · MEASURE — labels, counts, URL
  persistence, mobile sheet, keyboard/SR semantics against a realistic catalog.
- **E-05 Collection-led discovery** · P2 · BENCHMARK — restrained collection
  context that never scroll-gates products.
- **E-06 Gifts around decisions** · P1 · BENCHMARK+MEASURE — occasion,
  recipient, budget, material, urgency; shortlist with fewer decisions; no
  invented stock/delivery/suitability.
- **E-08 All-products visual consistency** · P1 · NOW — run all configured
  `--route-shard` shards and consolidate artifacts; every active product gets
  desktop and mobile evidence.
- **E-10 Discovery measurement** · P1 · NOW+MEASURE — query success,
  refinements, zero results, clickthrough; privacy-respecting, deduplicated.

### F — PDP and purchase authority

- **F-01 Class-specific PDP fact model** · P0 · NOW after C-01 — required and
  optional facts per class; decision-critical facts early.
- **F-02 Size and fit confidence** · P1 · OWNER+NOW — measured diagrams,
  conversion tables, saved sizes, return context; returning from the guide
  restores product and selection.
- **F-03 Personalization only when operationally real** · P1 · OWNER+EXTERNAL —
  otherwise the control stays absent.
- **F-04 Advisor/appointment continuity near purchase** · P1 · OWNER+EXTERNAL —
  product-aware contact with saved context and reliable confirmation.
- **F-05 Truthful availability and delivery resolution** · P0 · EXTERNAL+NOW —
  PDP, cart, checkout, email, account, and admin agree; no invented stock
  counts or delivery guarantees.
- **F-06 Product-specific care and warranty** · P1 · OWNER — material-sensitive
  care that never contradicts product guidance.
- **F-08 Comparison/shortlist support** · P2 · MEASURE+BENCHMARK — only if
  testing proves it reduces uncertainty.
- **F-09 Recommendations — residual owner decision** · P2 · OWNER — dedupe and
  disclosure are implemented and tested; the open question is hard-excluding
  unavailable items vs. the current disclose-and-demote behavior.
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
  0006 trust model. Gates L2, not L1 (ADR 0013). **Confirmed in code**
  (2026-07-12 K-08 webhook review, `docs/QA_EVIDENCE.md`
  "k-08-webhook-security-review"): `src/server/services/payment-webhooks.ts`
  currently commits `PAID`/`CAPTURED` and fires the GL/loyalty pipeline
  directly from `x-cardcom-signature`-gated webhook fields — ADR 0006's
  server-to-server verification call is not implemented. Not exploitable
  today (`OWN_COMMERCE_ENABLED` off, no CardCom credentials configured, so no
  order can reach `PENDING_PAYMENT` via this path), but the verify-then-commit
  flow must ship as part of this item, not assumed already done, before L2.
- **G-05 Complete order-confirmation state** · P0 · NOW after G-02/G-04 —
  source-aware confirmation; refresh and duplicate callbacks idempotent.
- **G-06 Checkout state matrix** · P0 · NOW+MEASURE — empty/own/supplier/mixed/
  coupon/unavailable/price-change/conflict/failure/timeout/mobile-keyboard/
  back/refresh; no fake combined payment.
- **G-07 Delivery promises from real operations** · P0 · OWNER+EXTERNAL — one
  rule used by PDP, checkout, policy, email, and service.
- **G-08 Gift options only when fulfilled** · P1 · OWNER+EXTERNAL.
- **G-09 Order and payment reconciliation** · P0 · NOW after providers —
  paid-without-order, order-without-payment, duplicates, stale pendings;
  remediation without manual DB edits. (See also ADR 0002/0006 acceptance.)
- **G-10 Refund/cancellation/return ownership** · P0 · OWNER+EXTERNAL — own vs
  supplier paths explicit; no unsupported actions on Shopify mirrors.
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
  fabricated or inferred from code. **Known cost, accepted deliberately**: the
  CSP's per-request nonce requires the root layout to read `headers()`, which
  forces every route (including previously-static marketing pages like
  `/checkout`, `/gifts`, `/warranty`) into dynamic rendering — confirmed via
  build output and a rejected hash-based alternative that broke Next's own
  RSC-streaming scripts (see `docs/QA_EVIDENCE.md`). Relevant to J-03/J-04 if
  Core Web Vitals regress after this ships.
- **G-12 Long-term payment architecture decision** · P2 · OWNER — own products
  local/CardCom vs Shopify vs split; one approved architecture and runbook.

### H — Service, appointments, ownership care

- **H-01 Service promise** · P0 · OWNER — channels, hours, response target,
  languages; every public claim maps to staffing and a queue.
- **H-02 Appointments as a real journey** · P1 · OWNER+EXTERNAL —
  mystery-shopper booking completes end to end.
- **H-03 Product-aware advisor handoff** · P1 · NOW after H-01 — context moves
  with the customer; minimized and consented.
- **H-04 Repair/resize/care intake** · P1 · OWNER+EXTERNAL — one real case
  completes with tracked status.
- **H-05 Service case timeline** · P1 · NOW — shared high-level state; private
  internal notes; protected attachments.
- **H-06 Order-aware return initiation** · P1 · NOW+OWNER — source-specific
  instructions; no unsupported self-service on Shopify mirrors.
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
- **I-05 Wishlist as a decision tool** · P1 · MEASURE+NOW — availability/price
  change cues, size memory, advisor handoff; survives guest-to-account merge;
  no fake scarcity.
- **I-06 Preference and consent governance** · P0 · NOW+OWNER — source,
  timestamp, withdrawal, retention. (ADR 0014 requires behavioral pre-consent
  proof; consent-surface unification is parked post-L1.)
- **I-07 Privacy export and deletion end to end** · P0 · MEASURE — legal
  sign-off and production-safe test.
- **I-08 Transactional communication governance** · P1 · NOW — template
  ownership, localization, fallback, idempotency; no duplicate or contradictory
  communication.
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
- **J-05 Technical SEO validation** · P1 · NOW+MEASURE — crawl, canonicals,
  sitemap, metadata uniqueness, structured data, redirects. (Language/SEO
  architecture decision itself is parked: Hebrew-only at L1.)
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
- **J-10 Content governance** · P1 · NOW — owner, source, review date,
  expiration, rollback for every public claim.
- **J-11 Social proof only when real** · P2 · OWNER.
- **J-12 Internationalization boundaries** · P2 · OWNER — no selectors for
  unsupported service; multi-currency is parked (ADR 0012, ILS-only).

### K — Operations, admin, security, reliability

- **K-04 SLOs and alert ownership — residual** · P1 · OWNER — the alert model,
  event-class SLOs, escalating email delivery to `OPERATIONS_EMAIL`, and the
  invariant sweep are shipped (ADR 0003/0007). Remaining scope: the owner
  names a human owner + escalation path per alert class beyond the single
  operations inbox.
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
- **K-06 Catalog and provider drift detection — residual** · P1 · NOW —
  the fail-closed click-out verification, price-drift re-confirmation, and the
  scheduled sync job are shipped (ADR 0012). Remaining scope: mirror-staleness
  alerting against the 12h freshness SLO (needs the 6h cadence unlocked by
  Fact B) and webhook-registration/token-scope drift checks.
- **K-07 Backups and recovery** · P0 · EXTERNAL+MEASURE — restore drill meets
  RPO/RTO. (ADR 0008: PITR is a launch requirement; drill is acceptance;
  blocked on owner Fact A — Postgres provider/tier.)
- **K-09 Privacy and retention implementation** · P0 · OWNER+MEASURE —
  retention matrix, deletion jobs, legal holds; policy and implementation
  agree.
- **K-10 Dashboard automation strategy** · P2 · DEFER — prefer Shopify API/CLI
  evidence; no release check depends on Cloudflare-blocked automation.
- **K-11 Windows prebuilt limitation** · P3 · DEFER — local
  `vercel build --prod` hits an `EPERM` symlink error; remote Vercel build is
  the supported path until a workaround is confirmed.
- **K-12 Physical boutique scope** · P2 · OWNER — keep the truthful online-only
  route or provide verified branch data; never imply boutiques that do not
  exist.

### L — QA, measurement, release proof

- **L-01 Outcome evidence over checklists** · P0 · NOW — every claim links to a
  current artifact, environment, commit, route, state, and residual risk.
- **L-02 Stable browser evidence collection** · P1 · NOW — maintained
  agent-browser/Playwright path; shard long runs; repeated runs complete within
  budget.
- **L-03 Visual regression with human approval boundaries** · P1 · NOW —
  deterministic fixtures; objective regressions fail automatically; subjective
  design never auto-approved.
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
  PDP, offline size-save, queued add-to-cart), and **search under Typesense
  unreachable** (real fixture catalog results + count, no invented/empty state).
  **Open gaps (named):** (1) authenticated-customer *local order placement* +
  own-checkout payment success + supplier click-out redirect — blocked on
  CardCom/Shopify credentials (G-01/G-02/G-04, EXTERNAL); (2) admin per-domain
  *WRITE*-gate e2e (K-15 split proven only at the mutation gate by unit/shape
  tests; needs a `FINANCE_READ`-without-`FINANCE_WRITE` fixture role to drive via
  UI); (3) empirical two-simultaneous-checkout concurrency proof (K-05 MEASURE);
  (4) provider-down for a live Shopify/CardCom error (no creds locally → mock
  path, EXTERNAL). Harness note: `signInAdminWithFixture` shares one fixture
  account per role, so admin tests can contend under parallel projects (shared
  TOTP secret) — verified serialized. Evidence: `docs/QA_EVIDENCE.md` →
  `l-04-full-state-matrix`.
- **L-05 Production deployment evidence refresh** · P0 · NOW after each
  release — commit SHA, deployment ID, alias, smoke, 60-minute clean-log
  window; recorded in `docs/QA_EVIDENCE.md`.
- **L-06 Real transaction canaries** · P0 · EXTERNAL — low-value own and
  supplier transactions with refund/void, cleanup, and alerting.
- **L-07 Product analytics definition** · P1 · NOW+OWNER — full funnel schema,
  deduplication, consent, attribution.
- **L-08 Experiment governance** · P2 · OWNER.
- **L-09 Comparative usability studies** · P0 (final claim) · MEASURE.
- **L-10 Trust and luxury perception research** · P0 (final claim) · MEASURE.
- **L-11 Release scorecard — residual** · P1 · OWNER/EXTERNAL —
  `pnpm release:scorecard` exists and enforces `NOT READY` on any missing
  field; the L1/L2 split is implemented. Remaining scope is turning the
  owner/external-blocked fields to `PASS` with real evidence.
- **L-12 Benchmark refresh cadence** · P2 · NOW, recurring — quarterly review
  of Tiffany and the 15-site gate sources; archive observations and access
  failures.

## 5. Launch gates and external/owner blockers

The two-gate launch model (ADR 0013) governs sequencing: L1 (referral
storefront, zero Elysia-processed money) then L2 (own commerce,
`OWN_COMMERCE_ENABLED`). Acceptance criteria live in `docs/DECISIONS.md`.
Named blockers that no engineering task can close:

- **EXTERNAL-P0 — CardCom sandbox + official integration documentation**
  (ADR 0006): verification endpoint, stable transaction identity, signing
  semantics, sandbox cases. Gates L2.
- **EXTERNAL-P0 — Israeli רו"ח engagement** (ADR 0010): document type, VAT,
  digital-document rules, PCN874/SHAAM, and the D6 ruling on internal issuance.
  Engaged at L1 for commission invoicing; gates L2 documents.
- **EXTERNAL-P0 — Lawyer engagement for the L1 package** (ADR 0014): referral
  terms, seller-identity wording, privacy (incl. Amendment 13), cookies,
  accessibility statement, refund split.
- **OWNER-P0 — Supplier commercial agreement + store ownership answer**
  (ADR 0009): World A vs B; commission terms. No agreement, no dropship launch.
- **OWNER-P0 — Verified legal identity** (ADR 0014): entity, registration
  number, contacts across all legal surfaces. No verified identity, no L1.
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
| **1** | House identity, collections, media | A-01…A-05, B-01…B-07, C-05/C-07                                                                                          |
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
