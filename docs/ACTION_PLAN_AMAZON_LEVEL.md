# Aphrodite Strategic Commerce Roadmap

## Current State

Aphrodite is a Next.js App Router single-brand commerce application with the
local no-blocker track closed. The repository already has DB-first catalog
reads, cart and checkout orchestration, local outbox/job flows, admin and
customer account operations, product discovery, AI catalog-backed flows, search
fallbacks, and smoke/visual QA commands that run without production provider
access.

The current codebase is ready for local development and verification with the
existing environment. Remaining roadmap work is production rollout work that
depends on external providers, credentials, Vercel project configuration, or
operational decisions.

## Strategic Vision

Aphrodite should operate as an enterprise-grade Single Brand ecommerce platform
on Vercel Managed infrastructure. The production target is reliable checkout,
payments, search, notifications, queue-backed operations, observability,
security controls, and customer/admin workflows that can be monitored and
operated safely at scale.

## Open Requirements Only

- CardCom production checkout, payment capture, refunds, reconciliation, and
  signed webhook rollout using the live provider contract and credentials.
- Vercel Queues production consumers for transactional email, reservation
  expiry, search reindexing, payment reconciliation, and order-status
  notifications.
- Production email and SMS provider setup, including verified sender domains,
  approved message templates, retry policy, delivery monitoring, and operational
  escalation paths.
- Vercel Firewall/WAF, edge rate limiting, bot/challenge rules, and production
  security policy rollout for auth, checkout, chat, webhooks, and admin routes.
- Vercel Observability dashboards, traces, log drains, alerts, Speed Insights,
  and Web Analytics for checkout, payment, search, jobs, admin mutations, and
  conversion funnels.
- Production Typesense/search operations if hosted search credentials, index
  provisioning, indexing jobs, and production query monitoring are not yet
  configured.
- Production webhook and provider health checks, runbooks, incident response
  ownership, and operational readiness checks for payment, email, SMS, search,
  queues, and Vercel platform controls.

## Blocked Inputs

- Live CardCom terminal/API credentials, webhook signing details, refund
  contract behavior, and reconciliation requirements.
- Vercel project access, required plan features, production domains, Firewall
  configuration rights, Queues setup, Observability setup, and log drain
  destinations.
- Verified email sender domains, production email provider credentials, SMS
  vendor selection, sender approval, templates, billing approval, and API
  credentials.
- Production Typesense host/API credentials, index ownership, and operational
  monitoring expectations.

## Execution Rule

Future roadmap edits must add only open requirements or strategic constraints.
Finished implementation history belongs in git commits, tests, and release
notes, not in this roadmap.
