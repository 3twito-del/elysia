# Elysia Operational Runbooks

Status: the single operational-recovery document (K-03). Written so a second
operator can diagnose, contain, communicate, and recover without tribal
knowledge. Every command and route below exists in this repository today;
when a capability is not live yet (CardCom, PITR drill), the runbook says so
instead of pretending.

Shared first steps for every incident:

1. `GET /api/health` — public branch returns coarse `ok`; an authenticated
   admin (or any non-production environment) also gets per-provider checks,
   worker/sweep heartbeats, and the open P0 alert count.
2. Open `/admin/notifications` — the operational-alerts card lists violated
   business invariants (ADR 0007) with severity, class, occurrence count, and
   remediation hints. Acknowledge to silence escalation; alerts resolve only
   when the invariant holds again.
3. Vercel logs: `vercel logs <deployment-url>` (project `elysia`).

Job-runner authentication: manual job triggers need
`Authorization: Bearer $JOB_RUNNER_SECRET` (falls back to `CRON_SECRET`).
Scheduled crons (vercel.json): outbox worker 03:00 UTC, report schedules
05:00 UTC, dropship sync 02:30 UTC — all daily until owner Fact B confirms
sub-daily cron capability (ADR 0003/0008).

---

## 1. Payment outage (CardCom)

**Current posture:** pre-L2 there are no live Elysia payments —
`OWN_COMMERCE_ENABLED` is structurally off (ADR 0013) and own-sale paths
refuse. The public webhook `POST /api/webhooks/cardcom` answers 401 to
unauthenticated calls (smoke-checked).

- **Symptom:** once L2 is active — customers report charged-but-no-order, or
  a `money-paid-without-gl` P0 alert fires.
- **Verify:** webhook is a hint, the API is truth (ADR 0006): confirm the
  transaction server-to-server against CardCom before touching state; check
  `OutboxEvent` rows of type `payment.captured` and their `lastError`.
- **Contain:** never mark PAID from a webhook payload alone; conflicting
  provider messages create an audited reconciliation exception, never an
  automatic downgrade.
- **Recover:** run the worker (`POST /api/jobs/outbox`); the
  `payment.captured` consumer is idempotent — replays cannot double-post GL.
- **Evidence:** OperationalAlert + AuditLog + JournalEntry (immutable,
  ADR 0004).

## 2. Webhook delay or event backlog

- **Symptom:** `outbox-overdue:*` or `outbox-dead-letter:*` alerts; oldest
  pending event age exceeds its class SLO (MONEY 15m · OPERATIONAL/COMMS 30m ·
  PROJECTION 3h · ANALYTICS 48h — `src/server/services/event-classes.ts`).
- **Verify:** inspect `OutboxEvent` by `status` (`PENDING/FAILED` retry;
  `DEAD_LETTER` stopped) and `lastError`.
- **Contain:** nothing is lost — the outbox row is the durable obligation
  (ADR 0002). The daily cron cadence is a known launch blocker until Fact B.
- **Recover:** trigger `POST /api/jobs/outbox` manually (processes up to 25
  due events per call; repeat as needed). Dead letters: fix the handler or
  payload, then deliberately requeue (reset status to PENDING with a reason in
  the PR/note) — never delete the event.
- **Evidence:** JobRun rows (`operational-alert-sweep`, outbox runs) +
  alert history.

## 3. Supplier (Shopify dropship) failure

- **Symptom:** customers blocked at the supplier-checkout handoff with
  "לא הצלחנו לאמת..." — the click-out verification is fail-closed by design
  (ADR 0012): failure to verify is not permission to proceed.
- **Verify:** `pnpm shopify:dropship:doctor -- --first 5` (redacted
  diagnosis: localReady/catalogReady/checkoutReady/webhookReady); check
  Shopify status page; `dropship_clickout_blocked` analytics events show the
  block reasons (missing/unavailable/currency/verify_failed).
- **Contain:** nothing to switch off — verification already blocks redirects;
  the storefront keeps PDPs truthful (unavailable state, purchase disabled).
- **Recover:** when the Storefront API answers again, click-outs self-heal on
  the next attempt. Run `POST /api/jobs/dropship-sync` (or wait for the 02:30
  cron) to refresh mirrored prices/availability.
- **Evidence:** `ProductVariant.lastLiveVerifiedAt`, `Product.externalSyncedAt`.

## 4. Price mismatch / drift

- **Symptom:** `dropship_price_drift` analytics events; customer reports a
  different price at the supplier checkout.
- **Verify:** the click-out verifier compares the cart line price to the live
  Storefront price at redirect time; on drift it already updated the cart
  line + current Price row and asked the customer to re-confirm
  ("המחיר עודכן על ידי הספק").
- **Contain:** drift cannot reach the supplier checkout unconfirmed — the
  first attempt blocks with CONFLICT.
- **Recover:** run the dropship sync job to realign the whole mirror; audit
  the drifted SKUs in `/admin/catalog`.
- **Rule:** Elysia discounts are structurally blocked on supplier-MOR items
  (ADR 0012); if a "sale" badge appears on one, that is a bug, not a promo.

## 5. Oversell / inventory incident

- **Symptom:** `reservations-expired-unreleased` alert; contradictory stock
  numbers; a sold item still displayed available.
- **Verify:** `InventoryLedger` is the truth (immutable, ADR 0004);
  `InventoryItem.quantity` must equal the ledger sum (INV-C). Reservations:
  `InventoryReservation` rows with `releasedAt IS NULL AND expiresAt < now`.
- **Contain:** unpublish the affected product (draft-first activation gate
  keeps it truthful) rather than editing stock by hand.
- **Recover:** run the worker so the `inventory.reservation_expired` handler
  releases holds; reconcile with a cycle count in `/admin/erp` (writes an
  auditable `cycle_count_adjustment` ledger row) — never edit ledger rows
  (the database will refuse).
- **Evidence:** ledger rows + AuditLog + the alert lifecycle.

## 6. Email outage (Resend/Brevo)

- **Symptom:** `outbox-overdue:CUSTOMER_COMMUNICATION` alert; OTP or order
  emails not arriving; health `email` check shows `missing`/mock.
- **Verify:** `GET /api/health` (email provider name when operational);
  outbox `email.requested` events piling up with `lastError`.
- **Contain:** customer OTP login is affected — communicate through the
  service channel; do not bypass consent rules to reach customers another way.
- **Recover:** the outbox retries automatically (class SLO 15m); to switch
  provider set the other key (`RESEND_API_KEY` ⇄ `BREVO_API_KEY`) via
  `pnpm vercel:env:upsert -- --target production` (dry-run first, `--write`
  after review), redeploy, then run the worker to drain the queue.

## 7. AI provider outage

- **Symptom:** `/ai`, `/stylist`, or semantic search degraded; provider quota
  errors in logs.
- **Verify:** the quota-router falls back across providers (Google, Groq,
  Cerebras, Cloudflare); semantic search falls back deterministically and
  must not emit console noise (guarded by tests).
- **Contain:** nothing customer-blocking — AI surfaces are demoted by design
  and never gate catalog, PDP, checkout, or service tasks.
- **Recover:** quota exhaustion self-heals; a hard regression can be
  contained by disabling `AI_SEMANTIC_SEARCH_ENABLED` (runtime gate).

## 8. Search outage (Typesense)

- **Symptom:** search results empty or slow; health `search` shows
  `local-fallback`.
- **Verify:** Typesense credentials/host in env; the adapter falls back to
  the local catalog filter when the provider fails (silent fallback,
  test-guarded after the production 403 regression).
- **Recover:** restore credentials, then rebuild the index via
  `POST /api/search/reindex` (documented API route) or enqueue
  `search.reindex_requested` and run the worker.

## 9. Database outage / durability incident

- **Symptom:** health `database` check `down`; every surface degraded.
- **Verify:** Neon status + connection string; `vercel logs` for pool
  exhaustion vs provider outage.
- **Contain:** the app fails closed — money truth cannot be corrupted by a
  read outage; do not attempt manual writes during partial availability.
- **Recover:** restore connectivity, then verify controls survived:
  `pnpm db:verify:immutability` (proves the ADR 0004 trigger matrix in a
  rolled-back transaction) and `pnpm db:migrate` status.
- **Restore path:** PITR + a rehearsed restore drill are launch acceptance
  (ADR 0008) and remain **blocked on owner Fact A** (provider/tier
  confirmation). Until the drill has run, treat restore as unproven — that is
  a named launch blocker, not a footnote.

## 10. Credential rotation

- **Inventory:** `.env.example` is the authoritative variable list; secrets
  live in Vercel env (Production/Preview).
- **Procedure:** rotate in the provider → `pnpm vercel:env:upsert -- --target
production` dry-run → `--write` → redeploy → `pnpm smoke` against the
  production URL.
- **Notes:** rotating `AUTH_SECRET` invalidates every session (customers and
  admins — admins re-login within their 12h cap anyway, ADR 0005). Rotating
  `JOB_RUNNER_SECRET`/`CRON_SECRET` requires the Vercel cron header to match
  (Vercel injects `Authorization: Bearer $CRON_SECRET` automatically).
  Provider webhooks (`CARD_COM_WEBHOOK_SECRET`, `SHOPIFY_WEBHOOK_SECRET`)
  must be rotated on both sides in one maintenance window.

## 11. Customer data request (DSAR)

- **Export:** the authenticated customer self-serves via the account privacy
  export (`GET /account/privacy/export` — 401 unauthenticated, smoke-checked).
- **Deletion:** collect the request through the service flow; deletion
  end-to-end validation is open backlog item I-07 — do not improvise partial
  deletes: consent records are append-only evidence (ADR 0004/0014) and any
  legal-hold question goes to counsel (EXTERNAL-P0 lawyer engagement).
- **Evidence:** every fulfillment step lands in AuditLog.

## 12. Bad deploy / rollback

- **Verify first:** `pnpm verify:fast` locally; production symptoms via
  smoke (`SMOKE_BASE_URL=https://elysia-jewellery.com pnpm smoke`) and
  `vercel logs`.
- **Rollback:** promote the previous known-good deployment from the Vercel
  dashboard (project `elysia`) — deployments are immutable, so promotion is
  instant; then `git revert` the offending commit on `main` so the tree
  matches production.
- **Migrations:** the prebuild runs `prisma migrate deploy` (additive-only
  policy). A destructive or financial-table migration requires the ADR 0008
  gating (named restore point, written reversal note) **before** it ships —
  if one slipped through, stop and treat it as a durability incident (§9),
  not a code rollback.
- **After recovery:** record the incident in `docs/QA_EVIDENCE.md`
  (deployment ledger section) with commit, deployment ID, and the clean-log
  window.

## 13. Admin lockout / suspicious logins

- **Symptom:** `security-admin-login-failures` alert (5+ failed or
  rate-limited attempts in 60 minutes), or the operator is locked out.
- **Verify:** `/admin/audit` — `AdminAuth` events record every failed,
  rate-limited, and successful login with email + IP.
- **Lockout mechanics:** limits are windowed (5/15m per account, 20/15m per
  IP) — a locked-out legitimate operator waits out the window; there is no
  permanent lockout by design (ADR 0005).
- **Contain (suspected attack):** rotate the admin password; rotating
  `AUTH_SECRET` kills all live sessions immediately; admin authority expires
  within 12 hours regardless.
- **Follow-up:** mandatory TOTP is the remaining ADR 0005 launch scope —
  until it ships, treat password compromise as full control-plane compromise.
