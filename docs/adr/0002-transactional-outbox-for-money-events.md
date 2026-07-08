# Transactional outbox is the guarantee for money events; inline posting is only an accelerator

Status: accepted (2026-07-08)

By the time a CardCom capture webhook arrives, the money has already moved — the
system controls only whether it records, posts, retries, reconciles, and
escalates that event. We decided the durable money-event design is a
**transactional outbox** (option b), rejecting both strict synchronous GL
posting (option a — makes accounting bugs customer-visible after the card was
charged, and delegates correctness to CardCom's retry policy) and status-quo
plus reconciliation reports (option c — institutionalized manual repair).

## Invariant

A captured payment must never be committed into business state unless the same
database transaction also commits a durable obligation to represent that money
event in the books. The outbox row is that obligation. Logging is not a
recovery mechanism; a report is not a posting mechanism; a cron is not a
real-time event core.

## Design

1. Webhook → one DB transaction: idempotently record the payment event
   (CardCom's stable identifiers), idempotently mark the order PAID, and insert
   the `payment.captured` outbox row (unique idempotency key, e.g.
   provider + provider_transaction_id + event_type) — commit, then 2xx.
   5xx only when that local durable transaction fails.
2. After commit, optionally run the same handler inline as a low-latency fast
   path; success marks the outbox row processed, failure leaves it
   pending/failed with retry metadata. The outbox is the guarantee; the inline
   run is only an accelerator.
3. The GL posting handler is idempotent at the database level (unique
   constraint on the source money event), producing the same journal entry or a
   no-op under duplicate delivery, retry, crash, or concurrent workers — never
   duplicate revenue. Journal entries are balanced, immutable after posting
   (corrections by reversal), and traceable to payment/order/provider event.
4. Loyalty (and similar side effects) move out of the fragile inline chain and
   consume the same event independently. GL outranks loyalty: a failed loyalty
   credit is repairable later; silently failed accounting is not.

## Launch acceptance criteria (P0 — current implementation fails these)

- PAID cannot commit without the `payment.captured` outbox row in the same
  transaction (today the enqueue is outside the transaction).
- `payment.captured` has an idempotent consumer (today none exists).
- Outbox has retry scheduling, failure classification, dead-letter visibility.
- Alert/health invariant: every PAID order has a posted GL sale entry within
  N minutes.
- Period close refuses to close while any PAID order lacks its GL sale entry.
- Reconciliation can compare CardCom captures ↔ PAID orders ↔ GL entries ↔
  clearing accounts ↔ refunds/chargebacks/settlements.
- Tests prove: crash after commit cannot lose the accounting obligation;
  duplicate webhooks cannot duplicate GL entries; a failing handler retries to
  convergence; period close is blocked by unposted paid orders.

## Consequences

- The customer never suffers because the GL handler is temporarily broken, but
  the company is never allowed to forget that the money event happened.
- This decision is meaningless while the outbox consumer runs once a day at
  3 AM — the event-core cadence must make `payment.captured` an operational
  event, not next-day bookkeeping (see the PRIN-010 cadence decision).
