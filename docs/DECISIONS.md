# Elysia Decisions (ADR Register)

Status: the single architectural-decision register. Each section below is one
accepted decision record from the 2026-07-08 grilling session, preserved with
its original number. Decisions are append-only: a change of course is a new
ADR that supersedes an older one by explicit reference, never an edit of the
accepted text.

## Index

- [ADR 0001 — Pre-launch priority: irreversibility before ambition](#adr-0001)
- [ADR 0002 — Transactional outbox is the guarantee for money events; inline posting is only an accelerator](#adr-0002)
- [ADR 0003 — PRIN-010 rewritten: event-class latency SLOs over indiscriminate batch](#adr-0003)
- [ADR 0004 — Immutability enforced below the service layer: Postgres triggers now, role separation post-launch](#adr-0004)
- [ADR 0005 — Admin control plane: mandatory TOTP, edge middleware, 12-hour sessions, audited logins](#adr-0005)
- [ADR 0006 — CardCom trust model: webhook-as-hint, API-as-truth](#adr-0006)
- [ADR 0007 — P0 observability: durable OperationalAlerts from class-aware invariant sweeps](#adr-0007)
- [ADR 0008 — Database durability: PITR is a launch requirement, a tested restore is launch acceptance](#adr-0008)
- [ADR 0009 — Dropship merchant of record: World A default superseded 2026-07-15, owner confirmed World B (Elysia is merchant of record)](#adr-0009)
- [ADR 0010 — Every own sale issues a legal numbered document on capture; accountant is EXTERNAL-P0; adapter fallback pre-authorized](#adr-0010)
- [ADR 0011 — The launch catalog is a named capsule (floor 30, target 36), not 300 remediated products](#adr-0011)
- [ADR 0012 — Dropship display truth: scheduled sync as baseline, mandatory click-out verification as guarantee](#adr-0012)
- [ADR 0013 — Launch gate: superseded 2026-07-15, L1/L2 merged into one real-money gate (World B)](#adr-0013)
- [ADR 0014 — L1 legal/compliance package: lawyer EXTERNAL-P0, verified identity, consent proof, statutory a11y, replay off](#adr-0014)
- [ADR 0015 — High Jewelry Reference Gate site-list substitution: 8 unreachable Tier A sites replaced with verified-accessible maisons](#adr-0015)

---

<a id="adr-0001"></a>

## ADR 0001 — Pre-launch priority: irreversibility before ambition

Status: accepted (2026-07-08)

Elysia is pre-revenue (no live payment processing, no real products, one
online-only branch) while the repo carries two large programs: the customer
storefront (blocked on owner evidence — real products, verified facts, media,
legal identity) and the maximalist internal ERP/CRM suite
(`docs/ERP_CRM_MASTER_BLUEPRINT.md`). We decided that until first validated
commercial operations, engineering effort is governed by **irreversibility, not
ambition** — the only work that outranks everything else is work that becomes
materially harder after real money flows.

### Priority order (binding until launch)

- **P0 — Launch blockers:** money truth, ledger/audit immutability enforced
  below the service layer, admin authentication/isolation (MFA; no
  password-only access to GL/payroll/banking surfaces), a real event core
  (PRIN-010 must be implemented or honestly downgraded — no daily-cron
  "real-time"), webhook idempotency/replay safety, reconciliation, and failure
  visibility. Payment capture must never succeed while its accounting
  representation is silently lost: every money event gets a durable,
  reconcilable accounting representation.
- **P1 — Storefront launch readiness:** owner-independent NOW items only
  (performance, accessibility, checkout quality, search/filter mechanics,
  error states, SEO hygiene, observability, evidence-ingestion structure).
  Engineering must not fabricate business substance.
- **P2 — Owner evidence:** real products, verified facts, original media,
  legal identity, terms, supplier/stock truth. Sits with ownership, not the
  codebase.
- **P3 — ERP hardening of existing critical modules:** only where needed for
  launch or directly adjacent to money/order/inventory truth.
- **P4 — ERP breadth:** new Phase 7–10 expansion is paused. A new ERP module
  may be built pre-launch only by exception, against a named business event and
  a written justification, and only if it passes all three tests: (1) required
  for a specific launch-critical business event, (2) reduces rather than
  increases pre-launch operational risk, (3) does not distract from money
  truth, audit integrity, admin security, event reliability, or storefront
  readiness.

### Consequences

- The long-term "never leave the system" operating-system ambition is intact;
  already-built breadth modules are preserved as roadmap assets (schemas,
  stubs, feature-flagged surfaces), not deleted.
- The launch bar is explicit: when one customer pays for one real product, the
  business can tell the truth about that event permanently, securely, and
  reconciliably.

---

<a id="adr-0002"></a>

## ADR 0002 — Transactional outbox is the guarantee for money events; inline posting is only an accelerator

Status: accepted (2026-07-08)

By the time a CardCom capture webhook arrives, the money has already moved — the
system controls only whether it records, posts, retries, reconciles, and
escalates that event. We decided the durable money-event design is a
**transactional outbox** (option b), rejecting both strict synchronous GL
posting (option a — makes accounting bugs customer-visible after the card was
charged, and delegates correctness to CardCom's retry policy) and status-quo
plus reconciliation reports (option c — institutionalized manual repair).

### Invariant

A captured payment must never be committed into business state unless the same
database transaction also commits a durable obligation to represent that money
event in the books. The outbox row is that obligation. Logging is not a
recovery mechanism; a report is not a posting mechanism; a cron is not a
real-time event core.

### Design

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

### Launch acceptance criteria (P0 — current implementation fails these)

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

### Consequences

- The customer never suffers because the GL handler is temporarily broken, but
  the company is never allowed to forget that the money event happened.
- This decision is meaningless while the outbox consumer runs once a day at
  3 AM — the event-core cadence must make `payment.captured` an operational
  event, not next-day bookkeeping (see the PRIN-010 cadence decision).

---

<a id="adr-0003"></a>

## ADR 0003 — PRIN-010 rewritten: event-class latency SLOs over indiscriminate batch

Status: accepted (2026-07-08)

The blueprint's PRIN-010 ("Real-time over batch", blanket MUST) was false
relative to the running system — the entire outbox (money events, reservation
expiry, emails, reindexing, rollups) was swept by one daily 3 AM cron. Rather
than weakening the principle, we made it honest: **the system must process
events according to the business cost of delay**, with a declared convergence
window per event class, instrumented against reality.

### Latency classes

| Class                           | Examples                                                                          | Convergence                                                         | Enforcement                                                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| P0 money events                 | payment.captured, refund.created, chargeback, settlement                          | inline fast path + outbox guarantee; ≤ 5 min                        | alert at 15 min; period close refuses while unresolved                                                              |
| P0/P1 operational stock & order | reservation expiry, order status, fulfillment propagation, payment-failure emails | ≤ 5–15 min                                                          | operationally visible alerts; a 24 h expired hold on a one-of-a-kind piece is a destroyed sale, not technical delay |
| P1 customer communications      | order confirmation, receipts, security notices                                    | fast path + outbox retry                                            | alert when stuck beyond SLO; marketing/push is NOT this class                                                       |
| P2 projections                  | search reindex, cache/projection rebuilds                                         | near-real-time only where CX depends on it; hourly batch legitimate | stale projection must never corrupt source of truth                                                                 |
| P3 heavy analytics              | rollups, campaign aggregation, scheduled reports                                  | batch legitimate (hourly/daily)                                     | must not be described as real-time                                                                                  |

### Mechanism decision tree

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

### Required changes

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

---

<a id="adr-0004"></a>

## ADR 0004 — Immutability enforced below the service layer: Postgres triggers now, role separation post-launch

Status: accepted (2026-07-08)

Service-layer discipline alone cannot back SEC-005's tamper-resistance claim.
We chose mechanism (c): **BEFORE UPDATE/DELETE triggers shipped as a Prisma
migration** are the P0 launch control — they work with the single connection
string, need no provider-specific role plumbing, and block application bugs,
ORM misuse, console edits, and future code paths that forget the rule. They do
not defend against a hostile DBA (dropping triggers leaves DDL evidence); that
is explicitly not what this launch-stage control pretends to solve.
**Runtime/migration role separation** (runtime role loses UPDATE/DELETE on
protected tables) is a named post-launch hardening item — it depends on the
production Postgres provider, which is currently unknown; triggers remain as
defense-in-depth afterwards.

### Protected set

- **Fully immutable (no UPDATE, no DELETE):** `AuditLog`, `JournalLine`,
  `InventoryLedger`, `ConsentRecord`, `LoyaltyTransaction` — evidentiary
  tables; corrections are new rows / reversals / superseding records, never
  edits.
- **`JournalEntry` — column-restricted:** the only permitted mutation is the
  reversal transition `status: POSTED → REVERSED`. DELETE raises; mutating
  amounts, dates, references, source IDs, memo, entity/branch/currency,
  timestamps raises; `REVERSED → POSTED` raises; `POSTED → DRAFT` raises.
  Reversal metadata either updates only within the same POSTED→REVERSED
  transition, or lives in an append-only record — no "mostly immutable"
  convention.
- **`OutboxEvent` — excluded by design:** it is an operational state machine.
  Its mutability is still bounded: controlled status transitions,
  idempotency-protected event identity, no casual payload rewriting, no
  destructive production deletion.
- **`ItemCostLayer` — excluded (Design B):** landed-cost application mutates
  `unitCost`, so the layer is a working valuation table, not an evidentiary
  document. The immutable truth is the `LandedCost` record, the GL entry it
  posts, and `AuditLog`. The blueprint's append-only claim for it is corrected.
  (Design A — append-only adjustment layers — remains available if the
  valuation model is later redesigned.)

### Definition of done

DB integration tests prove each blocked mutation raises and each permitted
transition succeeds (full matrix in the decision record, including
`JournalEntry` status-transition cases and OutboxEvent mutability); a
verification check asserts the triggers exist; SEC-005 states tables,
blocked mutations, permitted transitions, exclusions with reasons, installing
migration, and proving tests.

---

<a id="adr-0005"></a>

## ADR 0005 — Admin control plane: mandatory TOTP, edge middleware, 12-hour sessions, audited logins

Status: accepted (2026-07-08)

Any surface that can alter money, books, users, roles, payroll, banking, audit
state, inventory truth, or customer-impacting operations is an **administrative
control plane**, not ordinary storefront functionality. The pre-decision state
— password-only admin login, no middleware in front of `/admin`, 30-day JWT
sessions, no rate limiting, failed logins leaving no trace — was ruled
unacceptable for launch.

### Decisions

1. **MFA: TOTP mandatory** for every admin including the bootstrap admin.
   Forced enrollment at next login before any console access. Recovery codes:
   generated once, shown once, hash-stored, single-use; regeneration
   invalidates unused codes. TOTP secrets protected at rest. **Email OTP is
   rejected** as an admin second factor (same channel as password reset = two
   steps through one compromised channel). **Passkeys/WebAuthn are post-launch
   additive hardening**, not the launch dependency. The daily operator friction
   is explicitly accepted: convenience does not outrank control-plane security.
2. **Isolation: path-based edge middleware now** (`src/proxy.ts`) —
   protects all `/admin` routes AND admin APIs, verifies admin authority,
   applies strict security headers; `/admin/login` and the narrow MFA-enrollment
   flow stay reachable. Defense in depth: middleware is the outer gate, never a
   replacement for per-procedure authorization and execution-time permission
   checks. **Admin subdomain** (host-based middleware, tighter cookie scope,
   stricter CSP) is named post-launch hardening. **Separate deployment is
   rejected** for launch.
3. **Sessions: admin ≤ 12 hours**, policy separate from customer sessions;
   admin authority revalidated against current server-side role state so a
   removed admin does not retain long-lived power; logout clears admin state.
   Long customer sessions are a usability decision; long admin sessions are a
   control failure.
4. **Abuse controls (launch requirements):** per-account + per-IP rate limiting
   on admin login, exponential lockout/delay (designed so the sole operator
   cannot be trivially locked out permanently), and audited security events for
   failed logins, successful logins, TOTP failures, recovery-code generation
   and use, MFA enrollment/reset, and role changes — with immutability
   equivalent to `AuditLog`. A failed admin login is security telemetry, not a
   rejected request.
5. **Step-up re-auth** (fresh password+TOTP within ~15–30 min) for destructive
   finance/authority actions — payment runs, refunds, period close, journal
   posting/reversal, payroll, banking, role changes, MFA reset, disabling
   admins — is the **first fast-follow**; pull into launch only if cheap while
   touching the auth layer.

### Launch acceptance criteria

Password alone cannot reach `/admin`; customer or non-admin accounts cannot
reach `/admin`; admin APIs are middleware-blocked (not UI-hidden); direct calls
to admin procedures fail without admin authority; admin session expires ≤ 12 h;
all listed security events are audited; rate limiting and lockout are active;
security headers applied; tests cover unauthenticated / customer / non-admin /
expired-session / missing-TOTP / failed-TOTP / successful-MFA paths.

---

<a id="adr-0006"></a>

## ADR 0006 — CardCom trust model: webhook-as-hint, API-as-truth

Status: accepted (2026-07-08)

The current adapter verifies an `x-cardcom-signature` HMAC scheme that no
CardCom documentation in our possession confirms — a speculative contract. We
decided the callback is **only a wake-up signal**: the system commits PAID
solely after a server-to-server verification call to CardCom returns the
authoritative transaction result. A forged webhook can only make our server ask
CardCom a question. _A webhook may wake the system up. It may not tell the
books what reality is._

### Trusted flow

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

### Payment state machine (required)

Explicit states (aligned to CardCom semantics; names may follow existing domain
language): INITIATED → REDIRECT_CREATED → PENDING_PROVIDER_CONFIRMATION →
CAPTURED/PAID | FAILED | CANCELLED, plus REFUNDED / PARTIALLY_REFUNDED /
CHARGEBACK_OPENED / WON / LOST. Terminal-state rules: CAPTURED cannot be
downgraded by a later webhook (the current code lets a late FAILED callback
overwrite a CAPTURED payment — bug); REFUNDED is not casually revertible;
conflicting later provider messages create an audited reconciliation/security
exception, never an automatic downgrade. Every transition audited; provider
payloads retained for forensics; duplicate callbacks safe.

### Idempotency

Pinned to provider-stable identity — provider + terminal + stable transaction
identifier (InternalDealNumber / LowProfileCode as appropriate) + event type —
never to request timing, retry count, or callback arrival order. The ADR 0002
outbox row uses this key so duplicate reports, retries, refreshes, and manual
replays cannot duplicate paid orders or GL entries.

### Launch acceptance criteria

Webhook payload alone cannot mark PAID; PAID only after API verification with
full field matching; duplicate webhooks/verified results duplicate nothing;
terminal states protected; conflicts raise audited exceptions; sandbox tests
prove success, refusal, duplicate callback, forged callback, replay, provider
API timeout, provider mismatch, and late conflicting events.

### Named external dependency

**EXTERNAL-P0 — CardCom sandbox account + official integration documentation**:
correct verification endpoint, stable transaction identifier, response-code
semantics, retry behavior, existence of webhook signing and timestamp/replay
protection, refund/chargeback notification semantics, sandbox test cases.
Engineering builds the verify-by-API path against the adapter boundary now;
launch cannot honestly complete until the real contract is supplied.

---

<a id="adr-0007"></a>

## ADR 0007 — P0 observability: durable OperationalAlerts from class-aware invariant sweeps

Status: accepted (2026-07-08)

Before this decision the system had no alert delivery at all — `console.error`
into ephemeral function logs and a health route that only answers when asked.
We decided P0 observability means **business-invariant observability, not
generic logging**: logs are for developers; alerts are for violated business
reality; health pings prove the alerting system itself is alive.

### Model

1. **Detection** — the per-minute worker tick (ADR 0003) both processes due
   outbox events and sweeps class-aware invariants: money/accounting (PAID
   without GL > 15 min, money events beyond SLO, dead-lettered money events,
   provider/internal mismatches, period-close blockers), outbox (oldest
   pending/failed by class vs SLO, dead-letter counts, stale worker lock),
   inventory (expired-but-unreleased reservations — one-of-a-kind stock
   especially, contradictory stock state), admin/security (unreviewed login
   failures, TOTP failures, recovery-code use, role changes, lockouts), and
   customer communications (order/payment/service emails stuck beyond SLO).
2. **Violations write a durable `OperationalAlert`** — not a log line — with
   dedup identity (alertKey), severity, class (MONEY, INVENTORY, SECURITY,
   CUSTOMER_COMMUNICATION, OUTBOX, ANALYTICS, SYSTEM), status
   (OPEN → ACKNOWLEDGED → RESOLVED, or SUPPRESSED), first/last seen,
   occurrenceCount, affected entity, invariant name, measured vs threshold
   values, remediation hint, and actor fields. **Acknowledgment ≠ resolution**:
   acknowledgment means the operator saw it; resolution means the invariant is
   no longer violated. Acknowledgment silences noise; only resolution closes.
3. **Delivery** — existing channels only (no new alerting vendor): email via
   the Resend/Brevo adapter, admin web push, and admin dashboard. Severity-
   aware: money = loud, email+push, repeating with escalating cooldowns
   (immediate, 15 min, 60 min, longer) until acknowledged; security = loud when
   thresholded/sensitive; inventory = loud when stale holds block sellable
   stock; marketing/analytics = dashboard-only. One stuck payment produces one
   alert with occurrence counting — never sixty emails an hour.
4. **Liveness sentinel** — one external uptime monitor pings `/api/health`:
   the first formal, justified exception to strict self-sufficiency, because a
   system cannot report the death of the scheduler/deployment/DB its own
   alerting depends on. PRIN-013 permits adapters; this is an adapter for
   liveness observation. Health exposes coarse public status; richer detail
   (last worker tick, last sweep, oldest pending P0 age, open P0 alert count,
   build id) stays private/admin. Worker and sweep record heartbeats so health
   can expose stale-scheduler state.
5. **APM (Sentry-class) deferred to post-launch** — exception aggregation is
   engineering telemetry, not the P0 primitive; it adds a vendor, noise, and
   retention questions without gating launch. Post-launch it complements, never
   replaces, invariant alerts.

### Launch acceptance criteria

OperationalAlert model exists; sweep runs in the per-minute tick; each listed
invariant creates its alert; dedup prevents storms; money alerts deliver
email+push with escalation; acknowledgment and resolution are distinct; period
close refuses while unresolved money alerts / unposted sales exist; `/api/health`
exposes heartbeats; external pinger active; tests prove violation → alert,
dedup under repetition, and resolution behavior.

---

<a id="adr-0008"></a>

## ADR 0008 — Database durability: PITR is a launch requirement, a tested restore is launch acceptance

Status: accepted (2026-07-08)

After ADR 0004, Postgres is the permanent truth container for the ledgers,
audit trail, payment/order state, outbox obligations, and alerts. Immutable
tables in a database that can be lost with no proven restore path are not a
control — "a financial system without a tested restore path is not durable; it
is merely intact so far." NFR-AVAIL-001 (RPO ≤ 5 min, RTO ≤ 1 h for financial
data) moves from asserted to demonstrated, the same standard applied to
SEC-005 (ADR 0004) and PRIN-010 (ADR 0003).

### Decisions

1. **PITR launch requirement.** Production Postgres must offer point-in-time
   recovery satisfying RPO ≤ 5 min. Acceptable outcomes: enable PITR / upgrade
   tier / migrate provider / (not recommended) explicitly downgrade
   NFR-AVAIL-001 before launch. Unacceptable: keep the claim with no restore
   path.
2. **Restore drill as launch acceptance.** A real restore of production to a
   point in time into an isolated scratch environment — not a dashboard
   screenshot. Verify on the restored copy: accounting integrity (trial balance
   balances, no orphan journal lines, PAID orders have GL entries),
   immutability controls survived the restore (protected-table triggers exist
   and raise), migration/FK/schema consistency, and operational boot — with the
   scratch environment provably unable to send real emails/push/payment calls.
   Record provider/tier, PITR window and granularity, measured RTO, validation
   output, failures, runbook version, operator, date.
3. **Migration safety rule.** `prisma migrate deploy` runs inside every
   production build — automatic schema change against live books. Destructive
   or financial-table migrations (drops, type/enum rewrites, identity or
   uniqueness/idempotency changes, trigger changes, anything touching
   JournalEntry/JournalLine/AuditLog/InventoryLedger/Payment/Order/OutboxEvent/
   OperationalAlert/ItemCostLayer/LandedCost) require: named pre-migration
   restore point, PITR confirmed active, written reversal note, affected-table
   list, data-loss and financial-impact analysis, post-migration verification,
   operator approval. Additive migrations stay low-friction. Minimum pre-launch
   bar if full gating is too heavy: no destructive migration on financial
   tables without written restore/reversal evidence; a CI/static check flags
   destructive operations.

### Open owner facts (P0 cannot close without them)

- **Fact A — Postgres provider/tier:** provider, plan, region, PITR
  support/window/granularity, restore method (branch/copy vs overwrite),
  expected RTO, restore permissions, self-serve vs support-mediated.
- **Fact B — Vercel plan:** per-minute cron permitted; worker route
  duration/concurrency limits fit the outbox workload; failed-invocation
  monitoring.

Infrastructure matrix: PITR ✓ + per-minute cron ✓ → no upgrades, implement
drill + cadence; missing either → one named P0 infra blocker each; missing
both → two. Daily 3 AM is not launchable for money-event convergence or
reservation expiry (ADR 0003).

---

<a id="adr-0009"></a>

## ADR 0009 — Dropship default: supplier is merchant of record; mirrored orders are non-financial

Status: **superseded by owner decision (2026-07-15) — World B confirmed.**
The store-ownership question this ADR was written to gate is answered:
**Elysia itself is the merchant of record** for dropship sales, not the
supplier. Confirmed directly by the owner, with the real consequence
restated and re-confirmed before recording (Elysia charges the customer,
issues the invoice, and owns refund/chargeback liability, in place of the
click-out-to-supplier-checkout flow this ADR's World-A default assumed).
§6 below is no longer a contingency — it is now the required launch-blocking
scope. The World-A text is kept below as the historical default this
decision replaces, not as current guidance.

Original status: accepted (2026-07-08) — World A default, pending owner confirmation

The repo cannot decide who legally sells a dropship item. The deciding facts
are external (store ownership, whose entity appears at checkout, who receives
settlement, who issues the invoice, who bears refund/chargeback/consumer-law
liability, what written agreement exists). Until those facts prove otherwise,
the system assumes **World A: the supplier owns the Shopify store and is the
merchant of record**; Elysia operates a referral/agency/assisted-commerce
layer. _If Elysia does not take the customer's money as seller, Elysia must not
book the customer's purchase as Elysia revenue._

### Consequences

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
6. **World B is confirmed** (Elysia owns the store): the following are now
   active launch blockers, not a contingency — Shopify-sourced orders must
   enter the financial system as Elysia sales with Israeli invoicing,
   payment/refund/chargeback and settlement reconciliation, and a supplier
   payable/COGS model, included in period close. Any public copy claiming
   "Elysia does not process funds" is now false and must be corrected before
   L1 (see D-04/C-01/C-04/G-07/G-08/G-10/J-08 in `docs/TASKS.md`).

### Open owner facts

~~Store ownership (World A vs B)~~ — **answered 2026-07-15: World B.** Elysia
is the merchant of record for dropship sales.

Still open: the supplier's **wholesale/COGS agreement** (Elysia now buys at
wholesale and sells at retail, rather than earning a referral commission) —
per-unit or tiered wholesale pricing, payment terms to the supplier,
who absorbs a customer refund/return at the supplier leg, and whether a
written agreement exists or is still informal. Until answered: the
supplier-payable/COGS side of the World-B ledger cannot be modeled, even
though the customer-facing sale itself can now move to `OWN_SALE`.

Real, current engineering reality this decision invalidates (found while
recording it, not assumed): `src/server/services/shopify-dropship-checkout.ts`
today does not create an Elysia `Order` or touch CardCom for dropship items
at all — it click-out redirects the customer to the **supplier's own Shopify
checkout URL**, and `shopify-order-mirror.ts` only mirrors the result
afterward, non-financially. Realizing World B requires replacing that
click-out flow with a real integrated checkout, which is new implementation
work, not a default/config flip — tracked as a new blocking item in
`docs/TASKS.md` rather than started without a scoped plan, given the
financial/legal stakes.

---

<a id="adr-0010"></a>

## ADR 0010 — Every own sale issues a legal numbered document on capture; accountant is EXTERNAL-P0; adapter fallback pre-authorized

Status: accepted (2026-07-08)

For own sales, payment capture creates a **document obligation**: "a paid own
sale without a legal numbered document is not launch-ready commerce; it is an
accounting incident waiting to happen." Today `issueCustomerInvoice` is
reachable only from admin AR, quote conversion, and subscription billing —
nothing issues a document when a customer pays.

### Decisions

1. **Auto-issue on capture.** The `payment.captured` consumer (ADR 0002)
   idempotently issues a חשבונית מס-קבלה (pending accountant approval of the
   document type) for qualifying orders, rendered Hebrew/RTL, delivered by
   email as a P1 communication (ADR 0003). The CustomerInvoice record is the
   legal source of truth; email is only delivery — failed delivery never rolls
   back an issued document. Issuance failure raises an OperationalAlert
   (ADR 0007). **Issuance condition matrix (all must hold):** financialTreatment
   = OWN_SALE; merchantOfRecord = Elysia; payment provider-verified (ADR 0006);
   valid tax configuration; legal-entity details present; accountant-approved
   document type; numbering series available; allocation requirement handled or
   deemed inapplicable. Supplier-MOR dropship orders never issue Elysia
   product-sale documents (ADR 0009).
2. **Transactional document-number allocator — not a vanilla Postgres
   sequence** (sequences leak numbers on rollback; legal series must not).
   `DocumentNumberSeries` per document type (and per legal entity / fiscal year
   if the accountant requires): one transaction locks the series row, reads
   nextNumber, creates the CustomerInvoice with it, increments, commits — a
   failed transaction consumes nothing. Issued documents are immutable
   evidentiary records under ADR 0004 semantics: no deletion, no edit;
   correction is a credit note (זיכוי) or corrective document, append-only.
   Unique constraints on (series, invoiceNumber) and on the source money event.
3. **EXTERNAL-P0 — Israeli רו"ח engagement** with a written checklist:
   document type for prepaid B2C; VAT rate and effective-dating; VAT-inclusive
   pricing; required document fields; digital-delivery (מסמכים ממוחשבים) and
   retention rules; cancellation/credit/refund/chargeback document flows;
   guest/foreign-customer treatment; shipping/discount/gift-card VAT treatment;
   חשבוניות ישראל allocation applicability; PCN874; SHAAM; and the D6 ruling —
   whether the internal system may legally issue documents and serve as the
   formal books, or whether registered software is mandatory. DOD-006 requires
   documented verification, not assumptions.
4. **Fallback adapter pre-authorized.** If the רו"ח rules internal issuance
   insufficient at launch: an approved Israeli invoicing/bookkeeping service
   issues the documents via adapter; CustomerInvoice becomes the internal
   mirror (external provider ID, number, PDF/link, status, reconciliation
   metadata); internal GL remains management books until approved. A deliberate
   PRIN-013 adapter exception: **legality outranks self-sufficiency** — launch
   does not wait for ideological purity.

### Launch acceptance criteria

No OWN_SALE paid order remains undocumented beyond SLO; duplicate processing
cannot double-issue; numbering is sequential, transactional, gap-free on
failure; corrections are append-only credit notes; document email retries via
outbox; issuance failures alert; period close refuses while paid own sales lack
documents; accountant checklist completed and stored; if external adapter used,
it is configured and tested before launch.

---

<a id="adr-0011"></a>

## ADR 0011 — The launch catalog is a named capsule (floor 30, target 36), not 300 remediated products

Status: accepted (2026-07-08)

0/300 publish-ready proved the inherited/mirrored catalog is not launchable as
a whole — it did not prove the business must remediate 300 products before
earning order #1. The launch gate becomes per-product: **a product may be
visible only if it individually passes publish-readiness; everything else is
unpublished** — not soft-flagged, not searchable, not indexed, not "coming
soon" without a deliberate merchandising reason. "The correct luxury posture is
reduction under truth, not abundance under fraud."

### Decisions

1. **Supplier-only capsule at launch** (own products don't physically exist);
   own products join post-launch through the same per-product gate plus
   own-sale requirements (physical possession, Elysia MOR treatment, invoice
   issuance, inventory truth, refund liability, own media, GL sale/COGS flow).
2. **Size: hard floor 30 publish-ready products, target 36.** The floor is
   subordinate to truth but not eliminated by it: 18 passing → launch waits;
   30 → may proceed; 70 → publish only the strongest set. No padding, no
   duplicate media to inflate count.
3. **Category shape:** floor 30 ≈ rings 6 / necklaces 6 / earrings 6 /
   bracelets 6 / sets–gifts 6; target 36 ≈ 8/8/8/6/6. **Navigation follows the
   capsule** — if supplier truth supports only three categories, navigation
   shrinks; category pages are not kept alive to display thinness.
4. **Capsule membership requires** (per product): supplier-confirmed real and
   sellable; republishable verified facts (material, purity, plating, stones,
   dimensions, origin, warranty constraints); availability mechanics;
   **explicit media rights** with a status (owned / supplier-licensed /
   manufacturer-licensed / stock-with-proof / unknown-blocked — unknown means
   unpublished: no image-rights proof, no product page); truthful seller/MOR
   disclosure per ADR 0009; contractually clear refund/return routing; defined
   economics. `legalPlaceholder` material values are banned from capsule
   members. Each product carries source-of-truth and last-verified-date.
5. **Scorecard re-scope:** release gate moves from "300 active products" to
   "capsule members" — reporting capsule count, blockers passed, category
   distribution, verified facts, licensed media, MOR confirmation,
   refund/warranty routing, agreement coverage, and blocked-with-reason. The
   0/300 metric remains as catalog-debt reporting only. New gate: 30/30
   capsule products publish-ready.

### Launch acceptance criteria

≥ 30 capsule products each passing the full audit; every non-capsule product
unpublished; navigation, search index, related-products modules, and
sitemap/SEO expose capsule products only; scorecard gates on capsule readiness;
own-product onboarding is post-launch under the same gate.

---

<a id="adr-0012"></a>

## ADR 0012 — Dropship display truth: scheduled sync as baseline, mandatory click-out verification as guarantee

Status: accepted (2026-07-08)

The supplier checkout is the money truth, but Elysia's display can still lie —
manual-only catalog sync meant unbounded price/availability drift between the
mirror and the supplier's Shopify checkout. "The checkout may be
supplier-owned, but the moment before handoff is Elysia-owned. That moment must
not lie."

### Decisions (all five accepted)

1. **Scheduled sync — freshness baseline.** Every 6 hours; freshness SLO:
   displayed capsule price/availability ≤ 12 hours old; violations raise
   OperationalAlerts. Sync records lastSyncedAt, supplier timestamps, status,
   errors; marks stale items; on severe uncertainty (API failure, missing
   variant, currency mismatch, deleted item) the capsule product moves to
   unavailable/blocked rather than pretending.
2. **Click-out verification — the guarantee, fail-closed.** Before every
   redirect to the supplier checkout: live variant-level verification of
   existence, `availableForSale`, current price, currencyCode = ILS, option
   match, and checkout-URL validity. Price drift → update display, show
   "המחיר עודכן על ידי הספק", require customer re-confirmation, record a drift
   event. Unavailable → block redirect with honest recovery (notify-me,
   similar items, support, remove, back to category). **Verification failure
   (API down, credentials, rate limit, ambiguous) blocks the redirect — failure
   to verify is not permission to proceed.**
3. **PDP availability honesty.** Supplier-unavailable capsule items stay
   reachable (shared/ad links) but show a truthful unavailable state with
   purchase controls disabled; structured data/SEO never claims false
   availability; category/search demote or filter per merchandising policy.
4. **Discount engine guard.** Elysia coupons, promotions, cart discounts,
   price rules, and Elysia-generated "sale" badges are structurally blocked
   from supplier-MOR items (`discountEligible: false`) — the display-side
   mirror of ADR 0009's ledger guard. Supplier promotions appear only as
   supplier-sourced prices (sync or live). "If the supplier checkout will not
   honor it, Elysia must not promise it."
5. **Currency invariant.** ILS end-to-end; non-ILS supplier items are blocked
   from the capsule, never converted or approximated. Multi-currency is a
   later project with its own pricing/FX/tax/refund review.

### Model implications

Mirror carries supplier identities (shop/product/variant/handle/checkout),
mirrored price/compare-at/availability, supplierLastSyncedAt,
lastLiveVerifiedAt, mirrorStatus (FRESH/STALE/UNAVAILABLE/BLOCKED/ERROR),
blockReason, priceSource (SUPPLIER_SYNC/SUPPLIER_LIVE), financialTreatment,
discountEligible. Drift events (PRICE_CHANGED, AVAILABILITY_CHANGED,
VARIANT_MISSING, CURRENCY_MISMATCH, LIVE_VERIFY_FAILED, SUPPLIER_API_ERROR)
are operational/catalog truth events, not GL events. Alert severity: capsule
checkout-blocking issues P0/P1; a capsule-visible stale price is never
dashboard-only.

### Launch acceptance criteria

Scheduled sync live; variant-level mapping for every capsule product;
mandatory live verification with drift re-confirmation and fail-closed
behavior; truthful unavailable PDPs; discount blocking on supplier-MOR items;
ILS-only enforcement; alerts for staleness/drift/failures; tests for drift,
unavailability, stale data, discount blocking, currency mismatch.

---

<a id="adr-0013"></a>

## ADR 0013 — Launch is two named gates: L1 referral storefront, L2 own commerce activation

Status: **superseded by owner decision (2026-07-15) — L1 and L2 merge into a
single real-money launch gate.** ADR 0009's World B (Elysia is merchant of
record for dropship — the entire L1 capsule per ADR 0011) breaks this ADR's
founding premise ("on the first public day Elysia processes zero customer
money"). Presented with the real options (rebuild the launch gate around
real money infrastructure vs. a temporary honest-referral transition vs.
something else), the owner chose explicitly: **there is no more
zero-money-day-one phase.** CardCom capture, invoicing, and reconciliation —
previously gating L2 only — now gate the first public launch itself,
because dropship needs them from day one. The original two-gate text below
is kept as the historical design this decision replaces, not current
guidance; see "What the merge means" beneath it for the current gate.

Original status: accepted (2026-07-08)

ADR 0009 (supplier is MOR) + ADR 0011 (supplier-only capsule) + ADR 0012
(supplier checkout is the money truth) mean that on the first public day Elysia
processes **zero customer money**. This does not weaken ADR 0001 — it clarifies
it: money controls must exist **before Elysia touches money**, and if L1 has no
Elysia customer-money event, CardCom capture and customer sales documents gate
L2, not L1. "L1 is public truth. L2 is money truth. They must be governed
separately."

### Gate L1 — Referral Storefront Launch (first public day) — historical, World-A text

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

### What the merge means (current, 2026-07-15)

The launch gate is now items 1–9 above **plus** the full Gate L2 checklist
below, all required before first public launch — with these corrections to
the World-A-era wording:

- Item 2 (display truth): "discounts blocked on supplier-MOR items" no
  longer applies as written — Elysia is not a supplier-MOR reseller of
  these items under World B. Discount truth is now a normal own-pricing
  question (compare-at accuracy against a real cost basis), blocked until
  the supplier wholesale/COGS agreement exists (`docs/TASKS.md` §5) so a
  true cost is known — tracked under C-04, not restated here as solved.
- Item 3 (MOR guards): "mirrored orders non-financial" is the opposite of
  what World B requires — dropship orders must post as `OWN_SALE`, not be
  refused by the ledger guard. The guard's *purpose* (no revenue posts
  without a declared, legitimate financial treatment) stands; its default
  assumption for dropship flips from `SUPPLIER_MOR_REFERENCE` to
  `OWN_SALE`.
- Item 4: reframed as the OWNER-P0 supplier wholesale/COGS agreement
  (`docs/TASKS.md` §5), not a commission agreement.
- Item 9: accountant engagement scope grows from "commission invoicing"
  to full customer-sale invoicing for dropship, matching Gate L2 item 4
  below.

**Not yet decided, flagged rather than assumed:** whether "own inventory +
reservation controls" (Gate L2 item 5 below) — which is specific to
Elysia's own physical stock (`InventoryItem`/branch model), not dropship —
remains a genuinely separate, later phase, or also collapses into this
merged gate. Nothing here currently forces owned-inventory commerce to
launch alongside dropship; treat that as still open until the owner says
otherwise.

**Known concrete follow-up, not yet done:** `scripts/lib/release-scorecard.ts`
hard-codes the `L1`/`L2` gate split as separate field lists (`ReleaseGate`
type, `gate: "L1"` / `gate: "L2"` per field) — the scorecard tool itself
needs a real code change to reflect the merge, not just this document.
Tracked as a new NOW-tagged item in `docs/TASKS.md`.

### Gate L2 — Own Commerce Activation (first shekel Elysia touches) — historical name, now folded into the single launch gate above

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

### L2-erosion mitigation (structural, not aspirational)

Ledger guard refuses non-OWN_SALE revenue; publication gate refuses own
products pre-L2; scorecard displays L1 and L2 readiness separately; admin UI
labels own commerce disabled; release language may not equate "live" (L1) with
"allowed to take money" (L2).

---

<a id="adr-0014"></a>

## ADR 0014 — L1 legal/compliance package: lawyer EXTERNAL-P0, verified identity, consent proof, statutory a11y, replay off

Status: accepted (2026-07-08)

L1 avoids customer-money obligations but not public-law obligations — a
referral storefront is still a legal surface: it collects personal data,
displays product claims, routes customers into a supplier checkout, presents
seller identity, uses licensed media, and creates reliance.

### Decisions

1. **Lawyer engagement — EXTERNAL-P0 for L1**, distinct from the רו"ח (who
   governs tax/invoices/books). Lawyer scope: referral/intake terms; Elysia's
   role vs supplier's; seller-identity and click-out disclosure wording;
   consumer-protection review; privacy policy under Israeli law incl.
   Amendment 13; cookie/consent language; media-licensing sanity;
   accessibility-statement wording; refund/return responsibility split. The
   key question the lawyer must answer: is Elysia a seller, marketplace,
   referral agent, marketing site, intake layer, or hybrid — and the public
   copy must match that answer.
2. **Legal identity truth — OWNER-P0.** Verified entity name, registration
   number, address, service contacts, privacy contact, accessibility contact,
   supplier/MOR identity where displayed — across footer, terms, privacy,
   accessibility statement, contact, checkout handoff, PDP seller block.
   `legal-placeholder-grid` dies or is filled with verified facts. Placeholders
   on legal surfaces are fabricated legal substance. **No verified legal
   identity, no L1.**
3. **Cookie/consent behavioral proof — Engineering NOW.** The banner is not
   the control; the evidence is: tests proving zero measurement events (and no
   replay) fire pre-consent; withdrawal stops collection; rejection is
   respected as a choice; decisions persist append-only in `ConsentRecord`,
   timestamped and attributable where lawful; no marketing/push subscription
   is created from mere browsing.
4. **Accessibility — statutory L1 matter.** Capsule-scoped public routes
   (home, capsule categories/PDPs, search, handoff, contact, legal pages,
   consent surfaces, account/login) conform to the statutory baseline
   (ת"י 5568); WCAG 2.2 AA remains the higher engineering target; the published
   הצהרת נגישות states what was tested, the standard claimed, known
   non-conformances, contact, and review date — an honest partial statement
   over a false perfect one. Widget stays but does not substitute for
   conformance; D-07 collision audit applies.
5. **Session replay: OFF at L1 (hard default).** rrweb replay serves no
   L1-critical purpose and creates privacy risk before a mature compliance
   function exists. Re-enable only post-launch with lawyer approval AND strict
   consent gating, field masking, no payment/sensitive capture, retention
   limit, access audit, deletion workflow, policy disclosure, and pre-consent
   tests.

### Acceptance criteria

Lawyer reviews complete across the scope; identity facts verified and
placeholders removed; consent tests green; statutory a11y review of capsule
routes with an honest statement; replay disabled or lawyer-approved
consent-gated.

---

<a id="adr-0015"></a>

## ADR 0015 — High Jewelry Reference Gate site-list substitution: 8 unreachable Tier A sites replaced with verified-accessible maisons

Status: accepted (2026-07-10)

The 15-site High Jewelry Reference Gate (`docs/DESIGN.md` Part I) exists to
give every public design decision real, checkable evidence. A site that this
repository's automated research tooling cannot reach cannot supply that
evidence — it can neither support nor block a score, which silently shrinks
the gate's real denominator below 15 and makes the 8-of-15 threshold harder
to reach than intended, for reasons unrelated to design merit.

### Trigger

While running the I-302 mobile PDP recommendation-rail density benchmark
(`docs/qa/mobile-pdp-rail-density-benchmark.md`), 8 of the 15 named sites —
Tiffany & Co., Van Cleef & Arpels, Bulgari, Harry Winston, Graff, Boucheron,
Chaumet, Piaget — were unreachable across two independent verification
passes using fresh, freshly-searched product URLs (not reused guesses). Every
failure was one of: HTTP `403` (bot-edge block), connection timeout, or
`ECONNRESET`. A Wayback Machine fallback also failed (the tool cannot reach
`web.archive.org` in this environment). This is a tooling ceiling, not a
one-off fluke or a bad URL — the same 4 sites failed identically on retry
with different, verified-live product pages.

### Decision

1. Replace each of the 8 unreachable sites with a comparable fine/high
   jewelry maison confirmed reachable by the same tooling, verified by
   fetching a real product page and observing real content (not a guess):
   Tiffany & Co. → Repossi, Van Cleef & Arpels → Garrard, Bulgari → Vhernier,
   Harry Winston → Verdura, Graff → Suzanne Kalan, Boucheron → Anna Sheffield,
   Chaumet → Jessica McCormack, Piaget → Roberto Coin.
2. Keep the 7 originally-reachable sites unchanged: Cartier, Chopard,
   Mikimoto (source URL corrected to `mikimotoamerica.com` — `mikimoto.com`
   redirects to the Japan site), Messika, Buccellati, De Beers, Pomellato.
3. Update the list of record in three places that must stay in sync:
   `docs/DESIGN.md` Part I (documentation), `src/lib/public-design-policy.ts`
   `tierALuxuryHouses` (the 15 names), and
   `src/lib/high-jewelry-reference-gate.ts` `referenceSiteUrls` (name → URL
   map consumed by `highJewelryReferenceSites`).
4. Historical evidence records in `docs/QA_EVIDENCE.md` that cite the
   original 8 sites for past, already-implemented decisions are untouched —
   they document what was true and reachable at the time of that research,
   not the gate's current site list.
5. If future tooling can reach the original 8 (different network path,
   different fetch tool, a real headless browser with residential exit),
   they may be restored. Until then, this replacement list is authoritative.

### Acceptance criteria

`pnpm test -- src/lib/high-jewelry-reference-gate.test.ts src/lib/public-design-policy.test.ts src/styles/high-jewelry-reference-gate.test.ts`
passes; `docs/DESIGN.md` Part I table, `tierALuxuryHouses`, and
`referenceSiteUrls` list the same 15 names; every replacement site was
verified reachable with a real fetched product page, not asserted from
memory.
