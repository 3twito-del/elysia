# Split Checkout UX Audit

- `Date`: 2026-05-31
- `Backlog Item`: I-003 Split Checkout UX and Copy Review
- `Status`: Passed for local UX, fixture checkout coverage, and service guardrails

## Scope

This audit covers checkout behavior for local `OWN` items, Shopify dropship
items, and mixed carts. It verifies that the UI does not imply one combined
payment path and that provider-specific checkout actions remain separated.

## Findings

- Supplier-only carts now skip the local customer, delivery, gift, coupon, and
  local submit sections.
- Supplier-only carts show a dedicated message explaining that payment and
  delivery details continue in the supplier checkout.
- Mixed carts keep the local order form for `OWN` items and label the local
  submit action as store-item approval.
- Checkout source grouping is exposed through stable test IDs for own and
  Shopify dropship groups.
- The local checkout service and Shopify dropship checkout service both keep
  negative-path guards so one source cannot be submitted through the other
  provider path.

## Acceptance Checks

- `OWN` cart: local checkout progress, local delivery fields, and local submit
  action remain present.
- Shopify-only cart: supplier message, supplier summary, Shopify checkout
  action, and Shopify source group are present; local progress steps, local
  delivery fields, and local submit action are absent.
- Mixed cart: local and supplier groups remain distinct; local summary and
  supplier checkout copy avoid a fake combined payment promise.
- Missing Shopify variant mapping or a local-only cart cannot create a Shopify
  dropship checkout.
- The supplier-only E2E flow can run without a live Shopify catalog by using a
  deterministic dropship fixture product.

## Verification

- `pnpm test -- src/server/services/cart-checkout.test.ts src/server/services/shopify-dropship-checkout.test.ts src/server/services/catalog-fixtures.test.ts src/app/product/[slug]/_components/product-purchase-utils.test.ts`
- `pnpm typecheck`
- `pnpm exec prettier --check src/app/checkout/_components/cart-checkout-form.tsx src/app/product/[slug]/_components/product-purchase-panel.tsx src/server/services/catalog-fixtures.ts src/server/services/shopify-dropship-checkout.test.ts tests/e2e/critical-flows.spec.ts`
- Agent-browser dev check on `http://localhost:3100/checkout`: page loaded,
  content rendered, no Next.js error overlay detected.
- `E2E_BASE_URL=http://localhost:3100 QA_ARTIFACT_DIR=.tmp/qa-playwright-supplier node node_modules/@playwright/test/cli.js test tests/e2e/critical-flows.spec.ts --project=chromium-desktop -g "supplier-only checkout" --reporter=list --timeout=45000 --global-timeout=90000`

## Residual Risk

The paid Shopify Checkout handoff is still blocked by live Shopify supplier
configuration and paid checkout test access. This audit verifies the local UI
split and service guardrails, not a real external payment completion.
