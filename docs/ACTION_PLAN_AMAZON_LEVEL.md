# Aphrodite Amazon-Level Strategic Roadmap

## Verdict

Aphrodite is not yet Amazon-level in its domain. The local product and
engineering baseline is strong, but the remaining gap is production operational
maturity: live payment reliability, queue-backed work, observability, edge
security, managed search, customer communication, incident response, runbooks,
and measurable service objectives.

The target is not Amazon marketplace breadth. The target is Amazon-level
reliability and operational discipline for a single-brand jewelry commerce
platform.

## Domain-Adjusted Amazon Standard

For Aphrodite, Amazon-level means customers can reliably discover jewelry,
trust inventory availability, complete checkout, receive status updates, manage
orders, and get support without operational guesswork. Admin operators must be
able to manage catalog, inventory, orders, payments, returns, customers, and
integrations with auditability and clear failure handling.

The production standard is:

- Checkout, payment, inventory reservation, and order creation are durable,
  idempotent, observable, and recoverable.
- Search and discovery are fast, relevant, monitored, and backed by a managed
  production index.
- Notifications are delivered through production email/SMS providers with
  retry, tracking, and escalation.
- AI recommendations and support flows are catalog-grounded, audited,
  rate-limited, and never invent products, prices, availability, or order facts.
- Security controls protect auth, checkout, chat, webhooks, admin routes, and
  customer data at both application and edge layers.
- Operators have dashboards, alerts, runbooks, ownership, and SLOs for critical
  customer and admin workflows.

## Current State

The repository is ready for local development and verification. It already has
DB-first catalog reads, cart and checkout orchestration, local outbox/job flows,
admin/account/product/search/AI flows, local development fallbacks, and
smoke/visual QA commands that run without production provider access. Production
provider readiness is checked separately from the build so strategic blockers do
not prevent preview or deployment builds.

The remaining roadmap is production rollout work. It depends on external
providers, credentials, Vercel project configuration, operational ownership, and
business decisions.

## Strategic Requirements

### Production Checkout and Payments

- Connect CardCom live checkout with production terminal/API credentials,
  provider idempotency, capture handling, refund handling, and reconciliation.
- Require signed CardCom webhooks in production, including replay protection,
  duplicate detection, raw-body validation, and operational failure logging.
- Define payment incident handling for checkout creation failures, capture
  mismatch, refund failure, stale pending payments, and provider downtime.

### Fulfillment and Order Operations

- Formalize the production order lifecycle from checkout through fulfillment,
  pickup/shipping, cancellation, return, refund, and closure.
- Add operational runbooks for manual intervention, failed payment callbacks,
  shipment updates, return approvals, and customer-visible order status changes.
- Ensure every admin mutation that affects customers, orders, refunds, or
  inventory is auditable and tied to an operator identity.

### Inventory Reliability

- Run reservation expiry, stock release, and inventory reconciliation through
  durable production jobs.
- Monitor stock conflicts, stale reservations, negative availability risks, and
  branch availability drift.
- Define operational ownership for correcting inventory mismatches and
  reconciling physical branch stock with the database.

### Search and Discovery

- Operate hosted Typesense with production credentials, index provisioning,
  schema ownership, indexing jobs, and index health checks.
- Monitor query latency, no-results rate, indexing failures, facet accuracy,
  click-through, and category/product discovery quality.
- Keep local fallback behavior out of production search paths.

### Customer Trust and Notifications

- Configure production transactional email and SMS providers with verified
  senders, approved templates, retry policy, delivery tracking, and alerting.
- Send reliable customer updates for checkout, payment status, order lifecycle,
  pickup/shipping status, appointment changes, returns, and refunds.
- Define fallback handling for bounced email, SMS delivery failure, duplicate
  sends, and delayed provider responses.

### AI Commerce

- Keep AI product recommendations, gift guidance, style profiling, and order
  support grounded in catalog/search/order tools.
- Store prompt version, model, tool usage, recommendation output, approval
  state, and safety/audit metadata for production review.
- Enforce production rate limits, tool approval where needed, PII redaction, and
  low-confidence fallback behavior.

### Security and Compliance

- Roll out Vercel Firewall/WAF rules, edge rate limiting, bot/challenge policy,
  and abuse monitoring for auth, checkout, chat, webhooks, and admin routes.
- Maintain strict production environment validation, secret governance, webhook
  signing, replay protection, and no-secret source control guardrails.
- Keep PII minimized in logs, audit customer-data access, and preserve customer
  export/delete workflows with operational review.

### Observability and Operations

- Configure Vercel Observability, traces, log drains, dashboards, alerts, Speed
  Insights, and Web Analytics for critical commerce flows.
- Define SLOs for checkout success, payment callback processing, job latency,
  notification delivery, search latency, admin mutation latency, and error rate.
- Create runbooks and incident ownership for payment, search, notifications,
  queues, inventory reservation, webhook, and platform-security incidents.

## Blocked Inputs

- Live CardCom terminal/API credentials, webhook signing details, refund
  contract behavior, reconciliation rules, and provider support contacts.
- Vercel project access, production domains, required plan features, Firewall
  permissions, Queues setup, Observability setup, and log drain destinations.
- Verified email sender domains, production email provider credentials, SMS
  vendor selection, sender approval, templates, billing approval, and API
  credentials.
- Production Typesense host/API credentials, index ownership, and operational
  monitoring expectations.
- Named operational owners for payment, fulfillment, inventory, search,
  notifications, security, observability, and incident response.

## Acceptance Criteria

Aphrodite can claim Amazon-level maturity in its domain only when all of the
following are true in production:

- A customer can complete a live CardCom checkout, receive confirmation, and see
  the order/payment state update from signed webhooks.
- Refund and return flows can be executed, audited, and reconciled with provider
  state.
- Queue-backed jobs process reservation expiry, email/SMS, search reindexing,
  payment reconciliation, and order notifications with retry and alerting.
- Search runs on a hosted production index with monitored indexing, query
  latency, facets, no-results rate, and click-through behavior.
- Production email/SMS delivery is tracked, retry-safe, and alerting on repeated
  delivery failure.
- WAF, edge rate limits, webhook replay protection, secret validation, and PII
  minimization are active and verified.
- Dashboards, traces, alerts, smoke checks, and runbooks exist for checkout,
  payment, search, notification, queue, admin, and webhook failures.
- SLOs are documented, measured, and owned by named operators.

## Execution Rule

Future roadmap edits must add only open requirements, blocked inputs,
acceptance criteria, or strategic constraints. Finished implementation history
belongs in git commits, tests, changelogs, and release notes, not in this
roadmap.
