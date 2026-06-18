# Provider Negative-Path Review

- `Date`: 2026-05-31
- `Backlog Item`: I-006 Provider Negative-Path Review
- `Status`: Passed for route-level provider and webhook failure contracts

## Scope

This review covers provider-facing API routes where external systems can fail
or send invalid requests: CardCom webhooks, Shopify order webhooks, Cloudinary
webhooks, search reindexing, the outbox job runner, shared API response helpers,
rate-limit helpers, and provider signature adapters.

## Findings

- CardCom webhook processing failures now return a stable `503` JSON response
  instead of leaking provider exception text through an unhandled route error.
- Shopify order webhooks now record a received event before mirror processing,
  return a stable `503` if mirror processing fails, and only mark the webhook as
  processed after mirror work succeeds.
- Cloudinary invalid-signature callbacks now record a failed webhook event,
  matching the CardCom and Shopify audit behavior.
- Search reindex provider failures now return a stable `503` response and do
  not enqueue a misleading successful audit event.
- Search reindex audit/outbox failures now return a stable `503` response
  rather than exposing persistence details.
- Outbox job runner top-level processing failures now return a stable `503`
  response instead of a raw thrown error.
- Rate-limit responses continue to use the shared `{ ok: false, error }` shape
  and include `Retry-After`.

## Acceptance Checks

- Invalid webhook signatures return stable unauthorized JSON and do not run
  provider mutation work.
- Webhook provider-processing failures return generic service-unavailable JSON
  and keep secret-bearing exception text out of the public response.
- Rate-limited webhook and API routes include `Retry-After`.
- Search reindex and outbox job failures return generic service-unavailable JSON
  with route-specific wording.
- Production-only provider configuration checks remain covered by adapter and
  readiness tests; this review does not loosen those guards.

## Verification

- `pnpm test -- src/app/api/webhooks/cardcom/route.test.ts src/app/api/webhooks/shopify/orders/route.test.ts src/app/api/webhooks/cloudinary/route.test.ts src/app/api/search/reindex/route.test.ts src/app/api/jobs/outbox/route.test.ts src/server/http/api-response.test.ts src/server/services/rate-limit.test.ts src/server/adapters/payment.test.ts src/server/adapters/shopify.test.ts`
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`

## Residual Risk

This review validates local route contracts and mocked provider failures. It
does not replace live CardCom, Shopify, Cloudinary, Typesense, or outbox
delivery smoke tests after production credentials and provider dashboards are
available.
