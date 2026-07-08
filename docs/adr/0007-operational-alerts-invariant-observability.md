# P0 observability: durable OperationalAlerts from class-aware invariant sweeps

Status: accepted (2026-07-08)

Before this decision the system had no alert delivery at all — `console.error`
into ephemeral function logs and a health route that only answers when asked.
We decided P0 observability means **business-invariant observability, not
generic logging**: logs are for developers; alerts are for violated business
reality; health pings prove the alerting system itself is alive.

## Model

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

## Launch acceptance criteria

OperationalAlert model exists; sweep runs in the per-minute tick; each listed
invariant creates its alert; dedup prevents storms; money alerts deliver
email+push with escalation; acknowledgment and resolution are distinct; period
close refuses while unresolved money alerts / unposted sales exist; `/api/health`
exposes heartbeats; external pinger active; tests prove violation → alert,
dedup under repetition, and resolution behavior.
