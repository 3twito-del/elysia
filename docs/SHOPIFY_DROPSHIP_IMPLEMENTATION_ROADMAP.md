# Shopify Dropshipping Implementation Roadmap

Status: architecture, execution roadmap, and implementation tracker.

Implemented in the repository:

- Product source split for `OWN` and `DROPSHIP_SHOPIFY`.
- Optional Shopify configuration and safe disabled defaults.
- Shopify API adapter for catalog reads, Client Credentials admin tokens, and
  Storefront cart checkout creation.
- Dry-run/write catalog sync command guarded by
  `SHOPIFY_DROPSHIP_SYNC_ENABLED`.
- Mixed-cart grouping with separate local and Shopify checkout paths.
- Shopify order webhook signature verification and read-only order mirror.
- Account privacy export, account order visibility, and admin mirror visibility.

Still external/manual:

- Real supplier app/channel connection inside Shopify.
- End-to-end paid test order through Shopify Checkout and the supplier
  fulfillment workflow.
- CardCom account credentials for local `OWN` product online payment.
- SMS provider credentials, if SMS delivery is required later.

Current execution status, checked on May 31, 2026:

- Local code verification passed with `pnpm verify:fast`.
- Release verification passed with `pnpm gate:coherence` and
  `pnpm gate:ship`; production smoke on `https://elysia-jewellery.com` passed.
- Shopify Admin API credentials are valid for
  `elysia-dropship.myshopify.com`.
- The Shopify Dev Dashboard app is CLI-linked through `shopify.app.toml`.
- Required Shopify scopes are approved:
  `read_products`, `write_products`, `read_orders`, `read_publications`,
  `write_publications`, `unauthenticated_read_product_listings`, and
  `unauthenticated_write_checkouts`.
- Storefront access token creation completed and the token is set locally and in
  Vercel Production/Preview.
- Shopify order webhook registration completed for
  `https://elysia-jewellery.com/api/webhooks/shopify/orders`.
- Four active Shopify supplier seed products were created, priced, published to
  the Online Store publication, and imported into the local database as
  `DROPSHIP_SHOPIFY`.
- `pnpm shopify:dropship:doctor -- --first 5 --register-orders-webhook --site-url https://elysia-jewellery.com`
  reports `localReady`, `catalogReady`, `checkoutReady`, `webhookReady`, and
  `rolloutReady` as `true`.
- Shopify Dashboard UI automation is blocked by Shopify login/Cloudflare
  verification in the agent browser.
- Local development database is available through PostgreSQL on
  `localhost:5432` with `.env.development.local`.
- Local Prisma migrations and seed completed successfully; the local database
  has 300 `OWN` products, 4 `DROPSHIP_SHOPIFY` products, and the Shopify schema
  is ready.
- Production database work is complete with Neon. Vercel Production and the
  current Preview branch have usable `DATABASE_URL`, Prisma migrations are
  applied, and 4 Shopify dropship products are present.
- Vercel Preview for the current branch has Shopify checkout enabled with
  `SHOPIFY_DROPSHIP_ENABLED=true`.
- Vercel Production is enabled for Shopify dropship checkout:
  `SHOPIFY_DROPSHIP_ENABLED=true`. Catalog write sync remains disabled with
  `SHOPIFY_DROPSHIP_SYNC_ENABLED=false`.
- `SITE_URL` is configured in Vercel as `https://elysia-jewellery.com`.
- Full provider readiness is still blocked by missing provider env values
  outside Shopify: `CARD_COM_TERMINAL`, `CARD_COM_API_NAME`,
  `CARD_COM_API_PASSWORD`, and `SMS_PROVIDER_API_KEY`.
  `STORE_FROM_EMAIL`, `STORE_FROM_NAME`, and `OPERATIONS_EMAIL` are now set in
  Vercel Production and Preview.
- A forced production-readiness check against the pulled Vercel Production env
  now fails only on those deferred CardCom and SMS values.
- `JOB_RUNNER_SECRET` and `CRON_SECRET` were generated and set in Vercel
  Production and the current Preview branch.
- `CARD_COM_WEBHOOK_SECRET` was generated and set in Vercel Production and the
  current Preview branch.
- Production env already includes usable Typesense, Brevo, Google AI,
  `JOB_RUNNER_SECRET`, and `CRON_SECRET` values.
- Production env now includes usable Neon `DATABASE_URL` and Upstash REST Redis
  values. Production Prisma migrations were applied to Neon and 4 Shopify
  dropship products were imported into the production database.
- Preview deployment
  `https://elysia-2ejcdaglq-ariel-twitos-projects.vercel.app` is active for
  Shopify checkout testing. The product page
  `/product/elysia-supplier-silver-halo-ring` shows the Shopify dropship item as
  available, adds it to the cart, and the checkout mutation returns a Shopify
  checkout URL on `elysia-dropship.myshopify.com`.
- Production deployment
  `https://elysia-23foioc4j-ariel-twitos-projects.vercel.app` is active and
  aliased to `https://elysia-jewellery.com`. Live production checks confirmed
  `/api/health`, core public/admin routes, and the Shopify seeded product page;
  `pnpm shopify:dropship:doctor -- --first 5 --register-orders-webhook --site-url https://elysia-jewellery.com`
  reports `localReady`, `catalogReady`, `checkoutReady`, `webhookReady`, and
  `rolloutReady` as `true`.
- Local `vercel build --prod` prebuilt packaging is blocked on this Windows
  machine by an `EPERM` symlink permission error in `.vercel/output/functions`.
  Production deployment was completed with a direct Vercel remote build instead.
- Dev server verification passed on `http://localhost:3000` for the home page
  and a seeded product page.
- Dropship production rollout has been enabled after explicit approval. The
  remaining live-order blocker is a real paid Shopify checkout test and supplier
  fulfillment confirmation.
- CardCom account setup is deferred. Until `CARD_COM_TERMINAL`,
  `CARD_COM_API_NAME`, and `CARD_COM_API_PASSWORD` are available, local `OWN`
  product online payment cannot be treated as production-ready. Shopify
  dropship checkout remains independent of CardCom.
- SMS provider setup is deferred. Until `SMS_PROVIDER_API_KEY` is available,
  production SMS delivery should be treated as unavailable; email and admin
  flows can still operate where configured.

Operational helper:

- Run `pnpm shopify:dropship:doctor -- --first 5` for a redacted setup
  diagnosis. Add `--register-orders-webhook --site-url https://elysia-jewellery.com`
  when verifying webhook and rollout readiness.
- After Shopify scopes exist, run
  `pnpm shopify:dropship:doctor -- --first 5 --create-storefront-token` to
  create a Storefront token into `.tmp/shopify-storefront-token.txt`.
- After `SITE_URL` and `read_orders` exist, run
  `pnpm shopify:dropship:doctor -- --register-orders-webhook --site-url https://elysia-jewellery.com`
  to register the orders webhook.
- Run `pnpm shopify:dropship:sync -- --first 10` for a dry-run against the
  Storefront API. Set `SHOPIFY_DROPSHIP_SYNC_ENABLED=true` for the command
  process and add `--write` only when the dry-run lists the expected products.
- Run `pnpm vercel:env:upsert -- --target production` for a dry-run of Vercel
  env values that would be synced from local env files. Add `--write` only
  after the dry-run shows correct non-empty values. The helper refuses to copy
  enabled Shopify rollout flags or localhost database URLs unless explicitly
  overridden.

Release note pattern:

- Actionable release tasks: list repository changes that can be implemented,
  tested, deployed, or rolled back by the current release owner.
- Verification evidence: list the local commands, production smoke commands,
  deployment URL, deployment ID, production alias, and clean error-log window.
- Deferred supplier blockers: list supplier app connection, paid Shopify test
  checkout, and supplier fulfillment confirmation separately from repository
  implementation debt.
- Deferred payment blockers: list CardCom terminal, API name, and API password
  separately from Shopify dropship checkout readiness.
- Deferred SMS blockers: list SMS provider credentials and delivery testing
  separately from email, admin, and Shopify order mirror readiness.
- Dashboard-access blockers: list Shopify dashboard or provider-dashboard
  login/verification blockers separately from API-level readiness when CLI or
  API checks already passed.
- Residual risk: state what has not been proven by the release, without turning
  blocked provider work into an actionable code task.

This roadmap defines how Elysia can add Shopify as a behind-the-scenes commerce
system for dropshipping supplier products while preserving the existing T3
storefront and all current local commerce behavior.

## Core Architecture

Elysia remains the primary customer-facing storefront. Shopify is introduced
only as a commerce backend for supplier dropshipping products.

Product ownership is split by source:

| Source             | Source of truth       | Cart                 | Checkout                | Order system                                |
| ------------------ | --------------------- | -------------------- | ----------------------- | ------------------------------------------- |
| `OWN`              | Local Elysia database | Existing local cart  | Existing local checkout | Existing local orders                       |
| `DROPSHIP_SHOPIFY` | Shopify               | Shopify-backed group | Shopify Checkout        | Shopify orders, optionally mirrored locally |

Mandatory rules:

- Existing local commerce functionality must not regress.
- Existing CardCom/local payment behavior must not be removed.
- Shopify is not a global replacement for the catalog, cart, payment, inventory,
  or order system.
- Shopify is authoritative only for products supplied by the dropshipping
  supplier connected to Shopify.
- Mixed carts are supported by splitting checkout into two groups.
- Mixed carts must not be blocked and must not be forced into one artificial
  unified payment.
- No Shopify app/plugin dependency should be introduced unless API, config, or
  code cannot reasonably cover the need.
- Manual setup should be limited to the minimum Shopify actions that cannot be
  performed safely from the repository.

## Phase 0: Prerequisites and Manual Shopify Setup

Goal: prepare the external Shopify side without changing Elysia behavior.

Manual-only Shopify actions:

- Create or identify the Shopify store that will act as the commerce backend.
- Connect the dropshipping supplier to Shopify using the supplier's normal
  supported workflow.
- Create a Dev Dashboard app with Admin API access for catalog sync.
- Add Storefront unauthenticated access scopes when cart and checkout
  operations are enabled.
- Use the Dev Dashboard Client ID and Client secret to request short-lived
  Admin API tokens programmatically.
- Configure order webhooks only when local account/admin order visibility is
  needed.
- Confirm which Shopify product handles, product IDs, variant IDs, inventory
  states, fulfillment statuses, and supplier metadata are available.

Repository preparation:

- Keep Shopify disabled by default until credentials and feature flags exist.
- Use mocks and fixtures for development until a real Shopify store is
  available.
- Document required secrets in `.env.example` only when implementation begins.
- Use `pnpm shopify:dropship:sync` for dry-run import planning, and add
  `--write` only after `SHOPIFY_DROPSHIP_SYNC_ENABLED=true` is intentionally
  configured.

Exit criteria:

- The supplier can create and fulfill Shopify orders independently of Elysia.
- Required Shopify credentials and webhook URLs are known or explicitly pending.
- No existing local checkout, payment, catalog, or admin behavior has changed.

## Phase 1: Product Source Split and Safe Feature Flags

Goal: introduce the internal concept needed to distinguish owned products from
dropshipping products.

Future data model intent:

- Add product source: `OWN | DROPSHIP_SHOPIFY`.
- Default every existing product to `OWN`.
- Store Shopify mapping only for `DROPSHIP_SHOPIFY` records.
- Keep local product slugs and public URLs stable.

Future Shopify mapping fields:

- External provider: `shopify`.
- Shopify product ID.
- Shopify variant ID.
- Shopify handle.
- Supplier key.
- Optional last synced timestamp.
- Optional raw sync checksum or source hash.

Feature flag intent:

- Shopify integration disabled by default.
- Dropshipping product display can be enabled separately from checkout.
- Shopify checkout redirect can be enabled separately from catalog sync.
- Shopify webhooks can be enabled separately from storefront behavior.
- `SHOPIFY_DROPSHIP_ENABLED` controls Shopify API usage.
- `SHOPIFY_DROPSHIP_SYNC_ENABLED` controls catalog writes.

Implementation constraints:

- Do not change public URLs such as `/product/[slug]`,
  `/category/[slug]`, `/search`, or `/gifts`.
- Do not remove local product, variant, inventory, cart, order, payment, wishlist,
  PWA, search, or admin behavior.
- Do not make Shopify credentials required for local development, test, build, or
  preview unless the relevant feature flag is enabled.

Exit criteria:

- Existing products are still treated as `OWN`.
- The application can represent Shopify-sourced products without routing them
  through local payment.
- Tests prove local checkout behavior remains unchanged for `OWN` carts.

## Phase 2: Shopify Catalog Sync or Import

Goal: bring supplier products from Shopify into Elysia's storefront without
turning Shopify into the full site.

Preferred approach:

- Use a local read model for storefront rendering, SEO, search, category pages,
  and product detail pages.
- Sync Shopify products into local product-like records marked
  `DROPSHIP_SHOPIFY`.
- Use Shopify IDs for commerce actions and local slugs for public routes.

Sync responsibilities:

- Product title, handle, description, media, vendor/supplier metadata, tags, and
  status.
- Variant ID, SKU, price, compare-at price, option names, option values, and
  availability.
- Inventory/availability display state where Shopify exposes it.
- Product images and alt text, with local image performance rules preserved.

Non-goals for Phase 2:

- No live Shopify fetch on every public page load.
- No replacement of existing local catalog APIs.
- No supplier fulfillment logic inside Elysia.
- No customer payment processing for Shopify products inside Elysia.

Failure behavior:

- If sync fails, existing `OWN` catalog remains unaffected.
- Shopify products may show stale-but-marked data or be hidden according to the
  future implementation's freshness policy.
- Production must fail clearly only when a Shopify-only operation is requested
  and required Shopify configuration is missing.

Exit criteria:

- Supplier products can appear in the existing storefront routes.
- Public SEO routes remain stable.
- Search, category, and product pages can identify each item source.

## Phase 3: Cart Grouping and Mixed-Cart Checkout UX

Goal: allow a cart to contain both owned and dropshipping products while making
the checkout split explicit.

Cart grouping contract:

- `OWN` group: products fulfilled and paid through Elysia.
- `DROPSHIP_SHOPIFY` group: products fulfilled and paid through Shopify.
- Mixed cart summary exposes both groups separately.
- Totals are not combined into a single payable total when sources differ.

Checkout page behavior:

- Owned items appear under a local checkout group.
- Dropshipping items appear under a supplier checkout group.
- Each group has its own subtotal, quantity summary, trust/recovery copy, and
  call to action.
- The local checkout form submits only the `OWN` group.
- The Shopify group creates a Shopify checkout and redirects to Shopify
  Checkout.

Customer messaging:

- Make the split clear without overexplaining implementation details.
- Explain that supplier items are completed securely through the supplier-backed
  checkout.
- Avoid implying one combined shipment, tax calculation, payment, or order when
  checkout is split.

Implementation constraints:

- Existing empty cart, loading, error, offline, coupon, gift wrap, and local
  validation states must continue to work for `OWN` items.
- PWA/offline queued cart mutations must not promise Shopify checkout while
  offline.
- Cart count may remain a total item count, but checkout must expose source
  grouping.

Exit criteria:

- Owned-only cart uses the existing checkout.
- Dropship-only cart uses Shopify checkout.
- Mixed cart shows two checkout groups and two separate completion paths.

## Phase 4: Shopify Checkout Creation and Redirect

Goal: create a Shopify checkout for dropshipping line items and redirect the
customer to Shopify Checkout.

Adapter boundary:

- Shopify API calls belong in `src/server/adapters`.
- Business flow and validation belong in `src/server/services`.
- tRPC/API routes validate input, rate-limit, call services, and preserve
  standardized response helpers.

Future checkout mutation shape:

- Input: cart session key or selected dropship line item IDs.
- Server validates that all selected items are `DROPSHIP_SHOPIFY`.
- Server maps local cart lines to Shopify variant IDs and quantities.
- Server calls Shopify Storefront API to create or update the Shopify cart.
- Server returns a `checkoutUrl`.

Security and correctness:

- Never trust client-provided prices.
- Never send `OWN` items to Shopify checkout.
- Never send Shopify items to local CardCom checkout.
- Rate-limit checkout creation.
- Treat missing Shopify configuration as a clear disabled-state error unless in
  a mocked development path.
- Do not expose Admin API tokens to the browser.

Exit criteria:

- Dropship checkout creation returns a Shopify checkout URL.
- Local checkout cannot accidentally include dropship items.
- Shopify checkout cannot accidentally include owned items.

## Phase 5: Shopify Order Webhook Mirror

Goal: mirror Shopify order state locally only as much as Elysia needs for
account, service, admin, and support visibility.

Mirror scope:

- Shopify order ID.
- Shopify order name or number.
- Customer email.
- Total and currency.
- Financial status.
- Fulfillment status.
- Line items and quantities.
- Supplier/source key.
- Created and updated timestamps.

Webhook requirements:

- Set `SHOPIFY_WEBHOOK_SECRET` from Shopify webhook configuration before
  production enablement.
- Register the Shopify order webhook topic against
  `/api/webhooks/shopify/orders`.
- Verify Shopify webhook signatures with `X-Shopify-Hmac-Sha256`.
- Store raw webhook receipt metadata through the existing webhook event pattern
  or an equivalent provider-scoped record.
- Process events idempotently by Shopify event/order identifiers.
- Avoid duplicate mirror records.
- Do not create local payment captures for Shopify-paid orders.
- Do not decrement local inventory for Shopify-sourced products.

Local mirror record:

- Use `ShopifyOrderMirror` as a read-only operational mirror, not a local
  `Order`.
- Keep `shopifyOrderId` unique for idempotent upserts.
- Store order name, customer email, financial status, fulfillment status,
  currency, total, line items, supplier key, redacted raw payload, and
  `processedAt`.
- Treat the mirror as account/admin visibility for dropship orders; fulfillment
  truth remains Shopify plus the supplier integration.

Failure behavior:

- Webhook failure should not break local order processing.
- Failed webhook processing should be retryable or visible through existing job
  or webhook status surfaces.
- Missing webhook configuration should disable only Shopify order mirroring.

Exit criteria:

- Shopify order completion can be reflected locally.
- Account/admin/service views can distinguish local orders from Shopify mirror
  orders.
- Supplier fulfillment remains handled through Shopify and the supplier's
  integration.

## Phase 6: Account and Admin Order Visibility

Goal: make split-source orders understandable to customers and operators.

Account behavior:

- Local orders remain visible as they are today.
- Shopify mirrored orders appear as supplier-backed orders when mirror data
  exists.
- Customer-facing labels distinguish checkout source without exposing confusing
  internal provider details.
- Support links guide customers to the correct service path.

Admin behavior:

- Admin order lists and details distinguish `OWN` orders from Shopify mirror
  orders.
- Admin cannot perform local refund, payment capture, inventory adjustment, or
  fulfillment actions against Shopify mirror orders unless a future integration
  explicitly supports it.
- Shopify order records link back to Shopify admin when a valid Shopify admin
  URL can be constructed.

Operational constraints:

- Existing local order workflows must remain unchanged.
- Existing audit and permission behavior must still apply to local admin
  actions.
- Shopify mirror actions must be read-first until operational write support is
  deliberately added.

Exit criteria:

- Customers and admins can understand which system owns each order.
- Local and Shopify order workflows do not overlap incorrectly.

## Phase 7: Hardening, QA, Rollout, and Monitoring

Goal: release the integration gradually without making Shopify a hard dependency
for the whole site.

Required tests:

- Existing `OWN` cart and checkout tests continue to pass.
- Product source defaults preserve local behavior.
- Dropship line items require Shopify variant IDs.
- Mixed cart grouping returns separate groups.
- Local checkout rejects dropship items.
- Shopify checkout creation rejects owned items.
- Shopify adapter uses mocked responses in tests.
- Webhook signature verification accepts valid Shopify signatures and rejects
  invalid signatures.
- Webhook processing is idempotent.

Required commands by implementation stage:

- Documentation-only: `pnpm format:check`.
- Schema or service changes: `pnpm verify:fast`.
- Prisma changes: `pnpm exec prisma validate` and the relevant migration review.
- Checkout UI changes: `pnpm e2e`.
- Public route or visual changes: `pnpm visual:qa` or `pnpm gate:runtime`.
- Release candidate: `pnpm gate:ship`.

Rollout sequence:

1. Land source fields and tests with Shopify disabled.
2. Land mocked Shopify adapter and service tests.
3. Enable catalog sync in a non-production or preview environment.
4. Import a small supplier product subset.
5. Enable dropship display without checkout.
6. Enable Shopify checkout for internal testing.
7. Enable Shopify checkout for selected products.
8. Enable webhooks and order mirror.
9. Expand supplier product coverage.

Monitoring checklist:

- Shopify API errors.
- Checkout creation failures.
- Redirect failures.
- Webhook verification failures.
- Webhook processing retries.
- Product sync freshness.
- Mixed-cart usage.
- Local checkout error rate.
- Customer service tickets related to split checkout.

Exit criteria:

- `OWN` commerce remains stable.
- Dropshipping checkout works end to end through Shopify.
- Operators can distinguish source-specific failures.
- Rollback can disable Shopify display, checkout, and mirror separately.

## Phase 8: Optional Future Direct Payment Without Shopify Checkout

This phase is deliberately deferred.

Direct T3 payment for dropshipping products would require Elysia to own more of
the commerce workflow:

- Payment authorization and capture.
- Tax and shipping calculation.
- Shopify order creation or draft order creation.
- Inventory reservation and reconciliation.
- Supplier order handoff.
- Refund and cancellation policy.
- Fraud and chargeback handling.
- Failure reconciliation between Elysia, Shopify, payment provider, and supplier.

This should be considered only if:

- The supplier confirms that orders created by API still trigger the required
  dropshipping automation.
- Shopify order creation can be tested end to end.
- Payment, tax, fulfillment, and refund responsibilities are explicitly owned.
- The business accepts the added operational risk.

Until then, Shopify Checkout remains the preferred and safer dropshipping
payment path.

## Future Interface Summary

Future code should converge on these interfaces:

- Product source: `OWN | DROPSHIP_SHOPIFY`.
- Shopify mapping exists only for `DROPSHIP_SHOPIFY` products and variants.
- Cart summaries expose source groups.
- Checkout actions are source-specific.
- Shopify checkout creation returns only a server-generated `checkoutUrl`.
- Shopify order mirror records are read-oriented support/account/admin records,
  not local payment or inventory records.

## Manual Setup Checklist

- [x] Shopify store exists.
- [ ] Real supplier is connected to Shopify.
- [x] Dev Dashboard app has Client ID and Client secret configured.
- [x] Storefront unauthenticated scope exists for Shopify Checkout.
- [x] Required webhook topics are selected.
- [x] Webhook signing secret is available.
- [x] Supplier product IDs, variant IDs, handles, and SKUs are confirmed for the
      seeded Shopify validation products.
- [x] Preview test product can create a Shopify checkout URL.
- [ ] Real supplier fulfillment behavior is confirmed with the supplier
      integration.
- [ ] Test product can complete paid Shopify Checkout.
- [ ] Supplier receives a Shopify-created test order through the normal
      integration.
- [ ] CardCom credentials are available for production local checkout.
- [ ] SMS provider credentials are available, if SMS is re-enabled.

## Do Not Implement Without Explicit Approval

- Replacing local checkout with Shopify for `OWN` products.
- Removing CardCom or local payment support.
- Making Shopify required for local development or unrelated builds.
- Combining mixed carts into one fake total or one fake order.
- Processing Shopify product payments directly in Elysia.
- Writing local inventory ledgers for Shopify-owned inventory.
- Treating Shopify mirror orders as local orders that can be fulfilled,
  captured, refunded, or adjusted by existing local workflows.
