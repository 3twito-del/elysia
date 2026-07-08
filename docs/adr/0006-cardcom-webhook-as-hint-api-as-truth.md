# CardCom trust model: webhook-as-hint, API-as-truth

Status: accepted (2026-07-08)

The current adapter verifies an `x-cardcom-signature` HMAC scheme that no
CardCom documentation in our possession confirms — a speculative contract. We
decided the callback is **only a wake-up signal**: the system commits PAID
solely after a server-to-server verification call to CardCom returns the
authoritative transaction result. A forged webhook can only make our server ask
CardCom a question. *A webhook may wake the system up. It may not tell the
books what reality is.*

## Trusted flow

Callback (untrusted) → parse minimal identifiers (LowProfileCode, ReturnValue,
InternalDealNumber if present) to locate the local pending payment attempt →
server-to-server CardCom verification (documented endpoint, our credentials) →
match provider truth against local expectation (terminal identity, order
identifier, LowProfileCode, amount, currency, status, capture state, document
result) → only on match, commit the atomic ADR 0002 transaction (payment
update, order → PAID, `payment.captured` outbox row) → outbox consumer posts GL
idempotently.

- **Signature verification** is retained only as defense-in-depth **if** real
  CardCom docs prove a signing scheme — then timestamp mandatory, replay window
  enforced, algorithm and canonical payload pinned to their spec, and the
  current try-many-variants verifier removed. Verification of the hint never
  replaces API verification of the truth.
- **Polling-only is rejected** as primary path (latency, confirmation delay);
  polling remains as reconciliation backstop.

## Payment state machine (required)

Explicit states (aligned to CardCom semantics; names may follow existing domain
language): INITIATED → REDIRECT_CREATED → PENDING_PROVIDER_CONFIRMATION →
CAPTURED/PAID | FAILED | CANCELLED, plus REFUNDED / PARTIALLY_REFUNDED /
CHARGEBACK_OPENED / WON / LOST. Terminal-state rules: CAPTURED cannot be
downgraded by a later webhook (the current code lets a late FAILED callback
overwrite a CAPTURED payment — bug); REFUNDED is not casually revertible;
conflicting later provider messages create an audited reconciliation/security
exception, never an automatic downgrade. Every transition audited; provider
payloads retained for forensics; duplicate callbacks safe.

## Idempotency

Pinned to provider-stable identity — provider + terminal + stable transaction
identifier (InternalDealNumber / LowProfileCode as appropriate) + event type —
never to request timing, retry count, or callback arrival order. The ADR 0002
outbox row uses this key so duplicate reports, retries, refreshes, and manual
replays cannot duplicate paid orders or GL entries.

## Launch acceptance criteria

Webhook payload alone cannot mark PAID; PAID only after API verification with
full field matching; duplicate webhooks/verified results duplicate nothing;
terminal states protected; conflicts raise audited exceptions; sandbox tests
prove success, refusal, duplicate callback, forged callback, replay, provider
API timeout, provider mismatch, and late conflicting events.

## Named external dependency

**EXTERNAL-P0 — CardCom sandbox account + official integration documentation**:
correct verification endpoint, stable transaction identifier, response-code
semantics, retry behavior, existence of webhook signing and timestamp/replay
protection, refund/chargeback notification semantics, sandbox test cases.
Engineering builds the verify-by-API path against the adapter boundary now;
launch cannot honestly complete until the real contract is supplied.
