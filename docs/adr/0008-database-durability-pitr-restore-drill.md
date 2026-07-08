# Database durability: PITR is a launch requirement, a tested restore is launch acceptance

Status: accepted (2026-07-08)

After ADR 0004, Postgres is the permanent truth container for the ledgers,
audit trail, payment/order state, outbox obligations, and alerts. Immutable
tables in a database that can be lost with no proven restore path are not a
control — "a financial system without a tested restore path is not durable; it
is merely intact so far." NFR-AVAIL-001 (RPO ≤ 5 min, RTO ≤ 1 h for financial
data) moves from asserted to demonstrated, the same standard applied to
SEC-005 (ADR 0004) and PRIN-010 (ADR 0003).

## Decisions

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

## Open owner facts (P0 cannot close without them)

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
