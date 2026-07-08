# Immutability enforced below the service layer: Postgres triggers now, role separation post-launch

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

## Protected set

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

## Definition of done

DB integration tests prove each blocked mutation raises and each permitted
transition succeeds (full matrix in the decision record, including
`JournalEntry` status-transition cases and OutboxEvent mutability); a
verification check asserts the triggers exist; SEC-005 states tables,
blocked mutations, permitted transitions, exclusions with reasons, installing
migration, and proving tests.
