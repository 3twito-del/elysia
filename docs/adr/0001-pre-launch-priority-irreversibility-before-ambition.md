# Pre-launch priority: irreversibility before ambition

Status: accepted (2026-07-08)

Elysia is pre-revenue (no live payment processing, no real products, one
online-only branch) while the repo carries two large programs: the customer
storefront (blocked on owner evidence — real products, verified facts, media,
legal identity) and the maximalist internal ERP/CRM suite
(`docs/ERP_CRM_MASTER_BLUEPRINT.md`). We decided that until first validated
commercial operations, engineering effort is governed by **irreversibility, not
ambition** — the only work that outranks everything else is work that becomes
materially harder after real money flows.

## Priority order (binding until launch)

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

## Consequences

- The long-term "never leave the system" operating-system ambition is intact;
  already-built breadth modules are preserved as roadmap assets (schemas,
  stubs, feature-flagged surfaces), not deleted.
- The launch bar is explicit: when one customer pays for one real product, the
  business can tell the truth about that event permanently, securely, and
  reconciliably.
