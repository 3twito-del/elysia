# Account Order Timeline Clarity Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-009 Account Order Timeline Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account`, `/account/orders/[id]`, local order status
sequencing, return context, shipment context, and read-only Shopify mirror
presentation.

## Gate Classification

- `Change Type`: Account order comprehension and self-service UX.
- `Route Context`: account and order detail.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Account, service, checkout, returns, and order guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site       | Evidence URL                                              | Observed Pattern                                                                                 | Weight |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Bulgari    | https://www.bulgari.com/en-us/account/orders/00812581     | Account order detail sits under order history with customer-care links for order information.    | 1.5    |
| Boucheron  | https://www.boucheron.com/us/faqs/your-order?glCountry=US | Logged-in clients can check order status in the My Orders section; guest tracking is separate.   | 1.5    |
| Chopard    | https://www.chopard.com/en-us/faq.html                    | FAQ explains shipping cadence, order-status email updates, and order-tracking page recovery.     | 1.5    |
| Cartier    | https://www.cartier.com/en-us/page-show?cid=faqHelp       | FAQ exposes check-order, delivery lead-time, return portal, quality-control, and status context. | 1.5    |
| Buccellati | https://www.buccellati.com/en_us/wishlist                 | Account benefits include real-time order monitoring from shipping through delivery.              | 1.5    |
| De Beers   | https://www.debeers.com/en-us/faqs.html                   | FAQ explains confirmation email, delivery tracking, returns, quality check, and client services. | 1.5    |
| Piaget     | https://www.piaget.com/us-en/faq                          | Account FAQ routes clients to My Orders for order status and client relations for questions.     | 1.5    |
| Bvlgari    | https://www.bulgari.com/en-us/account/orders/00820141     | Account order-detail pattern links back to order history and customer care routes.               | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Local account orders may show a compact status
  sequence when it uses existing order timestamps/statuses, stays read-only for
  supplier mirrors, and routes unresolved questions to service.

## Implementation Decision

Implement a narrow customer-order pass:

- Add a reusable local-order timeline helper for accepted, payment, preparation,
  handoff, completion, cancellation, and refund states.
- Show the current local-order timeline event on `/account` order cards.
- Show the full local-order timeline on `/account/orders/[id]`.
- Add a test marker to Shopify mirror status copy while keeping it read-only
  and service-routed only.
- Keep return forms, shipment cards, payment status labels, and service
  shortcuts unchanged.

## Acceptance Checks

- Timeline events are generated from existing local order status/date fields.
- Account order cards expose one current status cue, not a full dense timeline.
- Order detail exposes the full compact timeline before item/summary/support
  cards.
- Shopify mirror orders remain read-only and do not receive local order actions.
- Service/return shortcuts remain the supported recovery path.

## Verification

- `pnpm test -- src/app/account/_lib/order-timeline.test.ts src/styles/account-order-timeline.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for `/account` logged-out state and authenticated order detail
  when a seeded customer is available.

## Residual Risk

The benchmark supports status explanation only. Live carrier tracking, supplier
fulfillment events, automated return labels, customer notifications, and order
mutation actions still require provider readiness and separate benchmark
approval.
