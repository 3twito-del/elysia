# Parking Lot

Unresolved issues that do not block immediate implementation. Each item names
its trigger — the event that pulls it out of the lot. Frozen from the
2026-07-08 grilling session (ADRs 0001–0014).

## Frozen mid-question

- **Language & SEO architecture (was Question 17, unanswered).** Working
  default until decided: Hebrew-only at L1 (`lang="he"`, `og:locale he_IL`, no
  hreflang, no i18n framework); bilingual (A-03 voice system) is a named
  post-launch project. Riders pending: production domain confirmation
  (`elysia-jewellery.com`?), structured-data seller wording (needs ADR 0014
  lawyer language). Trigger: owner answers, or first SEO-facing capsule PR.

## Deferred by decision (post-L1 / post-L2)

- **Admin subdomain isolation** (ADR 0005) — post-launch hardening. Trigger:
  custom domain confirmed + L1 shipped.
- **Runtime/migration DB role separation** (ADR 0004) — post-launch. Trigger:
  Postgres provider named (Fact A) + L1 shipped.
- **Passkeys/WebAuthn** (ADR 0005) — additive post-launch factor.
- **Step-up re-auth for destructive finance/security actions** (ADR 0005) —
  first fast-follow after the P0 auth package; pull into launch only if cheap
  while touching the auth layer.
- **QStash / always-on worker escalation** (ADR 0003) — only if Vercel cron
  granularity is unavailable (Fact B) or measured convergence violates SLO.
- **Sentry-class APM** (ADR 0007) — post-launch; never a substitute for
  invariant alerts.
- **Session-replay re-enablement** (ADR 0014) — requires lawyer approval,
  consent gating, masking, retention, access audit. Until then rrweb stays off.
- **Multi-currency** (ADR 0012) — own project: pricing policy, FX source,
  rounding, tax, refunds, copy. ILS-only until then.
- **ERP breadth resumption (Phases 7–10)** (ADR 0001) — after first validated
  commercial operations, or by named-business-event exception passing the
  three tests.

## Awaiting professionals (not blocking code)

- **D3 — inventory valuation FIFO vs weighted-average.** FIFO `ItemCostLayer`
  is built; blueprint recommends WA. Goes on the רו"ח checklist (ADR 0010).
  L2-adjacent: must be resolved before own-inventory COGS goes live.
- **ItemCostLayer Design A** (append-only adjustment layers) — optional future
  redesign; Design B (working valuation table, excluded from hard
  immutability) is the accepted launch model (ADR 0004).
- **Commission invoicing mechanics** (manual vs adapter, cadence, document
  type) — awaits רו"ח ruling (ADR 0013 L1 §9).
- **D1 — payroll build-vs-buy.** Paused with P4; blueprint recommendation
  (Buy) stands; `israeli-payroll.ts` remains a demo/roadmap asset. Trigger:
  first employee.

## Known cleanups (post-launch, not gating)

- **Discount-engine consolidation** — four mechanisms coexist (`coupons`,
  `promotions`, `pricing-rules`, `price-lists`); ADR 0012 structurally blocks
  all of them on supplier-MOR items at L1. Consolidation decision belongs to
  L2 own-commerce pricing. Trigger: L2 planning.
- **Consent-surface unification** — `PushSubscription` opt-in vs
  `ConsentRecord` channels vs cookie-consent value. ADR 0014 tests cover
  behavior; unifying the models is post-L1 cleanup.
- **Payment FAILED-after-CAPTURED downgrade bug** — superseded by the ADR 0006
  state machine (implemented in the L2 payment PR); until that PR lands the
  bug remains known and dormant (no live payments).
- **`OutboxEvent` unhandled-type behavior** — types without handlers should
  dead-letter visibly rather than skip silently; folded into the event-class
  registry work.
- **World B contingency** — if the Shopify store turns out Elysia-owned, the
  ADR 0009 §6 obligations activate as L1 blockers (financial ingestion,
  invoicing, reconciliation). Trigger: owner's store-ownership answer.
- **CWV field measurement** — requires real traffic; lab-only until L1 ships
  (plan items J-03/L-\*).
- **Own-product media/photography pipeline** — L2-adjacent owner work
  (ADR 0011 own-product gate).
