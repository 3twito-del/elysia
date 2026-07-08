# Dropship default: supplier is merchant of record; mirrored orders are non-financial

Status: accepted (2026-07-08) — World A default, pending owner confirmation

The repo cannot decide who legally sells a dropship item. The deciding facts
are external (store ownership, whose entity appears at checkout, who receives
settlement, who issues the invoice, who bears refund/chargeback/consumer-law
liability, what written agreement exists). Until those facts prove otherwise,
the system assumes **World A: the supplier owns the Shopify store and is the
merchant of record**; Elysia operates a referral/agency/assisted-commerce
layer. *If Elysia does not take the customer's money as seller, Elysia must not
book the customer's purchase as Elysia revenue.*

## Consequences

1. **Mirrored Shopify orders are non-financial by default.** They must never
   create Elysia product-sale revenue, customer AR, VAT output liability,
   COGS, payment-reconciliation obligations, or refund liability. Orders carry
   an explicit financial treatment (e.g. OWN_SALE / AGENCY_DROPSHIP /
   SUPPLIER_MOR_REFERENCE / COMMISSION_ONLY / UNKNOWN_BLOCKED); external
   mirrored orders default to SUPPLIER_MOR_REFERENCE / UNKNOWN_BLOCKED, and
   **the ledger refuses to post product-sale revenue for any order whose
   treatment is not OWN_SALE.**
2. **Elysia's dropship revenue, if any, is commission** under a written
   supplier agreement (rate/base, refund/chargeback clawback, settlement
   cadence, invoice flow, cost and liability allocation, permitted storefront
   language). **OWNER-P0 — supplier commercial agreement: no agreement, no
   dropship launch.** Commission recognition is blocked until it exists.
3. **Storefront truth matches legal truth.** Dropship PDPs, cart/split-checkout
   copy (who charges the card, who invoices, whose terms), confirmation copy
   ("we are tracking your supplier order", never "we received your payment"
   unless true), and refund/return terms disclose the seller honestly. Elysia
   may remain customer-facing intake; intake is not merchant status. The
   storefront may market; it may not falsify the seller.
4. **Reconciliation scope splits.** ADR 0002/0006 money reconciliation applies
   to own sales only. Supplier-MOR orders reconcile: mirror exists ↔ supplier
   paid/fulfilled/refunded status ↔ commission receivable/settlement per
   agreement ↔ support case closure. Reports separate Elysia revenue, supplier
   GMV, commission revenue, and commission receivable — supplier GMV is not
   Elysia revenue; influenced volume is not sales.
5. **Mirror safety guardrails.** External orders clearly typed/segregated,
   excluded from the sales-posting pipeline; GL posting checks merchant of
   record; admin UI labels supplier/MOR orders as such.
6. **If World B is proven** (Elysia owns the store): the opposite obligations
   activate as launch blockers — Shopify orders enter the financial system as
   Elysia sales with Israeli invoicing, payment/refund/chargeback and
   settlement reconciliation, supplier payable/COGS model, period-close
   inclusion — and "Elysia does not process funds" becomes false. World B
   cannot coexist with that claim; the owner must choose truth, not
   convenience.

## Open owner facts

Store ownership (World A vs B); if World A — the agreement's commercial terms
(commission %, base, settlement, refund/chargeback treatment, formalization
status). Until answered: dropship visible only where legally truthful; mirrored
orders non-financial; dropship GL posting disabled; commission disabled.
