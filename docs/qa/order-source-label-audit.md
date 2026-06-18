# Order Source Label Audit

- `Date`: 2026-05-31
- `Backlog Item`: I-004 Order Source Label Audit
- `Status`: Passed for account/admin labeling and read-only Shopify mirror guardrails

## Scope

This audit covers customer account order lists, local account order detail,
admin order lists, local admin order detail, and Shopify order mirror records.
It verifies that local `Order` records and read-only `ShopifyOrderMirror`
records are visibly distinct and do not expose the wrong operational actions.

## Findings

- Account order cards now label local records as store orders and Shopify
  mirrors as supplier orders.
- Account Shopify mirror cards show read-only copy plus supplier payment and
  fulfillment status labels.
- Local account order detail is explicitly labeled as a store order.
- Admin local order rows now include a source column and a local-only action
  label.
- Admin Shopify mirror rows are in a dedicated read-only table, use translated
  supplier payment and fulfillment labels, and only expose a Shopify admin link
  when an external URL exists.
- Local-only filters such as status, fulfillment method, and physical branch now
  hide Shopify mirror rows instead of mixing local order filters with supplier
  records.
- Local admin order detail states that status, shipment, and refund actions are
  local operations only.

## Acceptance Checks

- Local and Shopify-backed orders have clear customer-facing source labels.
- Admin local order rows and Shopify mirror rows use separate source labels and
  distinct actions.
- Shopify mirror rows expose only read-oriented UI in Elysia; supplier
  fulfillment/refund/capture actions remain outside the local workflow.
- Local admin order detail remains the only page that renders local operational
  actions.
- Query search can still surface Shopify mirrors, while local-only filters do
  not imply that mirror rows share local order status or fulfillment semantics.

## Verification

- `pnpm test -- src/lib/commerce-labels.test.ts src/styles/order-source-labels.test.ts src/server/services/shopify-order-mirror.test.ts src/server/services/admin-operations.test.ts`
- `pnpm typecheck`

## Residual Risk

This audit validates labeling, action separation, and local UI guardrails. It
does not validate live Shopify admin permissions or supplier-side fulfillment
operations because those remain external to the current Elysia runtime.
