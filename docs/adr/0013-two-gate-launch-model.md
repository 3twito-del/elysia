# Launch is two named gates: L1 referral storefront, L2 own commerce activation

Status: accepted (2026-07-08)

ADR 0009 (supplier is MOR) + ADR 0011 (supplier-only capsule) + ADR 0012
(supplier checkout is the money truth) mean that on the first public day Elysia
processes **zero customer money**. This does not weaken ADR 0001 — it clarifies
it: money controls must exist **before Elysia touches money**, and if L1 has no
Elysia customer-money event, CardCom capture and customer sales documents gate
L2, not L1. "L1 is public truth. L2 is money truth. They must be governed
separately."

## Gate L1 — Referral Storefront Launch (first public day)

1. **Capsule readiness** (ADR 0011): supplier-only, ≥30 verified products
   (target 36), no legalPlaceholder claims, no unlicensed media, everything
   else unpublished; navigation/search/sitemap capsule-scoped.
2. **Display truth** (ADR 0012): scheduled sync (6 h / 12 h SLO), fail-closed
   click-out verification, drift re-confirmation, ILS-only, discounts blocked
   on supplier-MOR items.
3. **MOR guards** (ADR 0009): mirrored orders non-financial; ledger refuses
   non-OWN_SALE revenue; GMV ≠ revenue in analytics; seller truth in copy.
4. **Supplier agreement + media rights** (OWNER-P0): checkout ownership and
   MOR confirmed; commission model; refund/consumer-law allocation; media and
   fact republication rights; approved seller-identity language.
5. **Admin control plane** (ADR 0005) — console exists from day one.
6. **DB immutability** (ADR 0004) — audit/consent/mirrors are real data
   immediately.
7. **Worker cadence + alerting + external pinger** (ADR 0003/0007) — sync
   staleness, drift, security events, stuck emails, liveness are day-one
   concerns.
8. **PITR + restore drill** (ADR 0008) — immutable audit in an unrestorable DB
   is still theater before own commerce.
9. **L1 legal/compliance package** — accountant engagement stays L1 (B2B
   commission income must be legally documented from the first shekel of
   commission; manual/adapter invoices acceptable if approved), plus
   referral-model legality, MOR disclosure language, privacy/cookie
   obligations, intake-role terms, and material-claims review.

## Gate L2 — Own Commerce Activation (first shekel Elysia touches)

1. **`OWN_COMMERCE_ENABLED=false` by default** — a structural switch, not a UI
   toggle: own-sale product publication, CardCom checkout, GL sale posting, and
   document issuance all refuse while the L2 checklist is incomplete; no admin
   bypass without checklist proof; CI proves own-sale paths are blocked while
   the flag is false.
2. **Money-event transactional outbox** (ADR 0002) with idempotent consumer,
   15-minute PAID-without-GL alert, period-close refusal.
3. **CardCom trust model** (ADR 0006): sandbox + docs (EXTERNAL-P0), payment
   state machine, stable transaction identity, duplicate/replay/conflict tests.
4. **Legal sales documents** (ADR 0010): auto-issue, transactional numbering,
   credit notes, RTL, delivery, close refusal, adapter fallback if required.
5. **Own inventory + reservation controls**: expiry SLO, ledger truth, no
   stale holds.
6. **Own-commerce reconciliation**: CardCom captures ↔ PAID orders ↔ GL ↔
   documents ↔ refunds/chargebacks ↔ settlements ↔ bank deposits.

## L2-erosion mitigation (structural, not aspirational)

Ledger guard refuses non-OWN_SALE revenue; publication gate refuses own
products pre-L2; scorecard displays L1 and L2 readiness separately; admin UI
labels own commerce disabled; release language may not equate "live" (L1) with
"allowed to take money" (L2).
