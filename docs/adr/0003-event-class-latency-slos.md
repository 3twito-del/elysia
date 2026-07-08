# PRIN-010 rewritten: event-class latency SLOs over indiscriminate batch

Status: accepted (2026-07-08)

The blueprint's PRIN-010 ("Real-time over batch", blanket MUST) was false
relative to the running system — the entire outbox (money events, reservation
expiry, emails, reindexing, rollups) was swept by one daily 3 AM cron. Rather
than weakening the principle, we made it honest: **the system must process
events according to the business cost of delay**, with a declared convergence
window per event class, instrumented against reality.

## Latency classes

| Class | Examples | Convergence | Enforcement |
|---|---|---|---|
| P0 money events | payment.captured, refund.created, chargeback, settlement | inline fast path + outbox guarantee; ≤ 5 min | alert at 15 min; period close refuses while unresolved |
| P0/P1 operational stock & order | reservation expiry, order status, fulfillment propagation, payment-failure emails | ≤ 5–15 min | operationally visible alerts; a 24 h expired hold on a one-of-a-kind piece is a destroyed sale, not technical delay |
| P1 customer communications | order confirmation, receipts, security notices | fast path + outbox retry | alert when stuck beyond SLO; marketing/push is NOT this class |
| P2 projections | search reindex, cache/projection rebuilds | near-real-time only where CX depends on it; hourly batch legitimate | stale projection must never corrupt source of truth |
| P3 heavy analytics | rollups, campaign aggregation, scheduled reports | batch legitimate (hourly/daily) | must not be described as real-time |

## Mechanism decision tree

1. Vercel cron every **1 minute** (or every 5 only if all P0/P1 SLOs still
   hold) replaces the daily 3 AM sweep; existing lock/rate-limit semantics
   kept; inline fast path kept as accelerator.
2. QStash is **not** adopted by default — with a transactional outbox, a fast
   path, and a 1–5 min sweep it improves no target SLO and adds a delivery
   surface, signing path, DLQ model, and vendor failure mode.
3. If the Vercel plan does not permit sub-daily cron: **named P0 infrastructure
   blocker** — either upgrade the plan or adopt QStash. Remaining on daily cron
   is not a launch option. (Plan capability still to be verified by owner.)
4. If measured convergence violates SLO after per-minute cron: escalate to
   QStash or a true always-on worker — but do not start there prematurely.

## Required changes

- Every outbox event type declares: class, target window, alert threshold,
  retry policy, dead-letter behavior, close-blocking (y/n), customer-visible
  (y/n), batch-acceptable (y/n).
- Class-aware observability: oldest pending event by class, pending/failed/
  retry/dead-letter counts, P95/P99 creation→processed, P95/P99 capture→GL
  posting, holds expired-but-unreleased, communications pending beyond SLO.
- Class-aware alerting: an unposted captured payment is loud; a stuck rollup is
  low severity.
- Launch acceptance tests per ADR 0002 plus: expired reservations released
  within operational SLO; daily batch used only by classes that permit it.

The architecture is not required to be maximally real-time. It is required to
be truthful about latency, ruthless about money, fast enough for operational
stock, and honest about what may remain batch.
