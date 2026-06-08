# Project Tasks

Status: canonical task, roadmap, and implementation-tracker document.

Last consolidated: 2026-06-08.

This file replaces the previous standalone task and roadmap documents:

- `docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md`
- `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `docs/ELYSIA_BRAND_COMMERCE_UPGRADE.md`

`docs/FULL_PRODUCT_BENCHMARK.md`, `docs/PUBLIC_CHANGE_GATE.md`, and
`docs/ENGINEERING_CONVENTIONS.md` remain policy and benchmark references, not
active task lists.

## Task Status Rules

Allowed statuses:

- `Actionable Now`
- `Needs Benchmark`
- `Blocked`
- `Deferred`
- `Done`

Allowed aspects:

- Public UX and Brand
- Commerce and Checkout
- Admin and Operations
- Backend, API, and Data
- Performance, PWA, and Reliability
- Accessibility, Privacy, and Security
- QA, Release, and Observability

Priority scale:

- `P0`: release-critical or data/payment/security correctness.
- `P1`: important product quality or operational confidence.
- `P2`: useful polish, evidence quality, or resilience improvement.

Effort scale:

- `S`: documentation, small audit, or narrow test.
- `M`: one focused subsystem or cross-route review.
- `L`: multi-subsystem work, provider coordination, or live rollout validation.

Blocked and deferred items must name the blocker and the exact unblock
condition. They must not be treated as active implementation work until the
unblock condition is met.

## Actionable Now

Deep review basis: `docs/FULL_PRODUCT_BENCHMARK.md`,
`docs/PUBLIC_CHANGE_GATE.md`, `scripts/qa-route-inventory.ts`,
`scripts/qa-site-audit.ts`, `docs/qa/*`, `src/app`, `src/components`,
`src/lib`, and `src/server`.

Completed items are intentionally removed from this active list.

No active actionable items remain in this review batch.

The previous active items were completed and removed after focused
implementation and verification for product cards, coupon messaging, and guest
wishlist merge behavior. Evidence was recorded through:

- `pnpm test -- src/styles/product-card-overlays.test.ts src/app/api/cart/items/route.test.ts src/server/services/inventory.test.ts src/styles/public-palette.test.ts src/styles/visible-site-improvements.test.ts`
- `pnpm test -- src/server/services/coupons.test.ts src/server/services/cart.test.ts src/styles/visible-site-improvements.test.ts`
- `pnpm test -- src/app/account/actions.test.ts src/styles/guest-wishlist-saving.test.ts src/styles/account-wishlist-decision-support.test.ts`
- `pnpm typecheck`
- `pnpm qa:routes`
- `pnpm exec tsx scripts/qa-route-inventory.ts --check --all-products --out-dir artifacts/qa/2026-06-02-route-evidence-ledger`
- `pnpm check`
- `pnpm build`
- `pnpm format:check`
- `SMOKE_BASE_URL=http://localhost:3000 pnpm smoke` against fixture-backed local server
- `pnpm exec playwright test tests/e2e/critical-flows.spec.ts --project=chromium-desktop --grep "adds a product to cart and shows it in checkout"`
- `pnpm exec playwright test tests/e2e/critical-flows.spec.ts --project=chromium-desktop --grep "shows supplier-only checkout without local order fields|shows recoverable no-results and empty checkout states"`
- `pnpm exec playwright test tests/e2e/critical-flows.spec.ts --project=chromium-desktop --grep "renders empty checkout fallback without JavaScript|renders empty checkout content in the initial HTML"`

`pnpm e2e` was also attempted against a local dev server and timed out after
10 minutes with broad existing environment-sensitive failures; the focused
checkout/cart e2e paths above passed.

## Candidate Improvements

Candidate items are not implementable by default. Public-facing candidates must
pass `docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before
product code is edited.

No candidate improvements remain. New public-facing candidates must pass
`docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before product
code is edited.

## Blocked / Deferred

### I-011 Real Shopify Supplier Connection

- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
- `Target Surface`: Shopify supplier channel, product sourcing, fulfillment
- `Improvement`: Blocker: no real supplier connection has been confirmed inside
  Shopify. Unblock condition: the supplier is connected through its supported
  Shopify workflow and exposes confirmable product, inventory, and fulfillment
  behavior.
- `Acceptance Checks`: Supplier products can be identified in Shopify with
  real handles, product IDs, variant IDs, SKUs, inventory behavior, and supplier
  metadata.
- `Verification`: Run `pnpm shopify:dropship:doctor -- --first 5` and record
  supplier-side evidence outside the repository.

### I-012 Paid Shopify Checkout Test

- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
- `Target Surface`: Shopify Checkout, production checkout redirect, order
  completion
- `Improvement`: Blocker: a real paid Shopify Checkout test has not been
  completed. Unblock condition: a paid test product can complete Shopify
  Checkout end to end without breaking local Elysia commerce behavior.
- `Acceptance Checks`: Checkout creates a Shopify order, customer-facing
  completion behavior is valid, and local account/admin mirror behavior is
  observed if webhooks are enabled.
- `Verification`: Run `pnpm shopify:dropship:doctor` with `--first 5`,
  `--register-orders-webhook`, and
  `--site-url https://elysia-jewellery.com` before and after the paid test, then
  confirm the order in Shopify.

### I-013 Supplier Fulfillment Confirmation

- `Aspect`: Admin and Operations
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
- `Target Surface`: Supplier fulfillment workflow, Shopify order handoff,
  support operations
- `Improvement`: Blocker: supplier fulfillment behavior has not been confirmed
  for Shopify-created orders. Unblock condition: the supplier receives and can
  fulfill a Shopify-created test order through its normal integration.
- `Acceptance Checks`: Supplier receipt, fulfillment status, cancellation or
  failure path, and customer support handoff are documented.
- `Verification`: Confirm in Shopify Admin and supplier tooling; record
  operational evidence in this file or a linked release note.

### I-014 CardCom Production Credentials

- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
- `Target Surface`: Local `OWN` product online payment, production readiness,
  provider health
- `Improvement`: Blocker: `CARD_COM_TERMINAL`, `CARD_COM_API_NAME`, and
  `CARD_COM_API_PASSWORD` are not available. Unblock condition: production and
  preview environments have valid CardCom credentials for local Elysia checkout.
- `Acceptance Checks`: Local `OWN` checkout can be treated as production-ready
  without relying on fallback or disabled payment behavior.
- `Verification`: Run `pnpm production:readiness` and any CardCom-specific
  smoke or webhook checks available at the time of credential setup.

### I-015 SMS Provider Credentials

- `Aspect`: Backend, API, and Data
- `Status`: Deferred
- `Priority`: P2
- `Effort`: M
- `Target Surface`: SMS notifications, customer service notifications,
  provider readiness
- `Improvement`: Blocker: `SMS_PROVIDER_API_KEY` is not available and SMS is
  deferred. Unblock condition: SMS delivery is re-enabled as a product
  requirement and valid provider credentials are available in the relevant
  environments.
- `Acceptance Checks`: SMS-dependent flows either remain explicitly unavailable
  or pass provider readiness and delivery validation once re-enabled.
- `Verification`: Run `pnpm production:readiness` and provider-specific smoke
  checks once SMS credentials exist.

### I-016 Shopify Dashboard UI Automation

- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Target Surface`: Shopify Dashboard UI verification through agent browser
- `Improvement`: Blocker: Shopify login and Cloudflare verification block
  dashboard UI automation in the agent browser. Unblock condition: a reliable,
  permitted dashboard automation path exists, or dashboard checks are replaced
  with API-backed verification.
- `Acceptance Checks`: Required Shopify operational facts can be verified
  repeatably without manual browser login friction.
- `Verification`: Prefer `pnpm shopify:dropship:doctor` and Shopify API checks;
  use dashboard evidence only when a human operator can complete login safely.

### I-017 Local Vercel Prebuilt Packaging

- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Target Surface`: Local Windows prebuilt Vercel packaging,
  `.vercel/output/functions`
- `Improvement`: Blocker: local `vercel build --prod` prebuilt packaging fails
  on this Windows machine with an `EPERM` symlink permission error. Unblock
  condition: a Windows-safe packaging path, permissions fix, WSL path, or Vercel
  CLI workaround is confirmed.
- `Acceptance Checks`: Local prebuilt packaging can complete, or the release
  process explicitly documents remote Vercel build as the supported path for
  this environment.
- `Verification`: Retry local prebuilt packaging only after the environment or
  workflow changes; otherwise continue using direct Vercel remote builds.

## Shopify Dropship Status

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
- Production database work is complete with Neon. Vercel Production and the
  current Preview branch have usable `DATABASE_URL`, Prisma migrations are
  applied, and 4 Shopify dropship products are present.
- Vercel Production is enabled for Shopify dropship checkout:
  `SHOPIFY_DROPSHIP_ENABLED=true`. Catalog write sync remains disabled with
  `SHOPIFY_DROPSHIP_SYNC_ENABLED=false`.
- `SITE_URL` is configured in Vercel as `https://elysia-jewellery.com`.
- Full provider readiness is still blocked by missing provider env values
  outside Shopify: `CARD_COM_TERMINAL`, `CARD_COM_API_NAME`,
  `CARD_COM_API_PASSWORD`, and `SMS_PROVIDER_API_KEY`.
- `STORE_FROM_EMAIL`, `STORE_FROM_NAME`, `OPERATIONS_EMAIL`,
  `JOB_RUNNER_SECRET`, `CRON_SECRET`, and `CARD_COM_WEBHOOK_SECRET` are set in
  Vercel Production and Preview.
- Production env includes usable Typesense, Brevo, Google AI, Neon
  `DATABASE_URL`, and Upstash REST Redis values.
- Dropship production rollout has been enabled after explicit approval. The
  remaining live-order blocker is a real paid Shopify checkout test and
  supplier fulfillment confirmation.
- CardCom account setup is deferred. Shopify dropship checkout remains
  independent of CardCom.
- SMS provider setup is deferred. Email and admin flows can still operate where
  configured.

Operational helper:

- Run `pnpm shopify:dropship:doctor -- --first 5` for a redacted setup
  diagnosis.
- Add `--register-orders-webhook --site-url https://elysia-jewellery.com` when
  verifying webhook and rollout readiness.
- Run `pnpm shopify:dropship:sync -- --first 10` for a dry-run against the
  Storefront API. Set `SHOPIFY_DROPSHIP_SYNC_ENABLED=true` for the command
  process and add `--write` only when the dry-run lists the expected products.
- Run `pnpm vercel:env:upsert -- --target production` for a dry-run of Vercel
  env values that would be synced from local env files. Add `--write` only
  after the dry-run shows correct non-empty values.

Shopify roadmap tasks:

- Phase 0, prerequisites and manual Shopify setup: mostly complete, except the
  real supplier connection and supplier fulfillment proof remain blocked.
- Phase 1, product source split and safe feature flags: complete for current
  repository behavior. Existing products remain `OWN`, Shopify is optional, and
  local development does not require Shopify unless the feature is enabled.
- Phase 2, Shopify catalog sync or import: complete for the seeded validation
  products. Catalog write sync remains guarded by
  `SHOPIFY_DROPSHIP_SYNC_ENABLED`.
- Phase 3, cart grouping and mixed-cart checkout UX: complete for local,
  supplier-only, and mixed carts. Mixed carts stay split instead of pretending
  there is one combined payment.
- Phase 4, Shopify checkout creation and redirect: complete for dropship line
  items with server-generated Shopify checkout URLs. Real paid checkout remains
  externally blocked.
- Phase 5, Shopify order webhook mirror: implemented as a read-only mirror for
  account, service, admin, and support visibility.
- Phase 6, account and admin order visibility: implemented so local orders and
  Shopify mirror orders are distinguishable.
- Phase 7, hardening, QA, rollout, and monitoring: repository rollout is
  enabled and verified; live supplier and payment proof remain outside the
  repository.
- Phase 8, optional future direct payment without Shopify Checkout: deferred.
  Do not start without explicit approval, supplier proof, payment/tax ownership,
  and accepted operational risk.

Future interface summary:

- Product source remains `OWN | DROPSHIP_SHOPIFY`.
- Shopify mapping exists only for `DROPSHIP_SHOPIFY` products and variants.
- Cart summaries expose source groups.
- Checkout actions are source-specific.
- Shopify checkout creation returns only a server-generated `checkoutUrl`.
- Shopify order mirror records are read-oriented support/account/admin records,
  not local payment or inventory records.

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

Manual setup checklist:

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

Do not implement without explicit approval:

- Replacing local checkout with Shopify for `OWN` products.
- Removing CardCom or local payment support.
- Making Shopify required for local development or unrelated builds.
- Combining mixed carts into one fake total or one fake order.
- Processing Shopify product payments directly in Elysia.
- Writing local inventory ledgers for Shopify-owned inventory.
- Treating Shopify mirror orders as local orders that can be fulfilled,
  captured, refunded, or adjusted by existing local workflows.

## Brand Commerce Checklist

Brand commerce roadmap:

- Homepage should lead with a cinematic product/brand signal, clear H1, brand
  promise, direct collection entry, trust strip, category discovery, new or
  recommended products, materials/service, boutique story, and commerce CTA.
- Public copy should move from operational text toward material, light, body,
  gift, season, confidence, and styling context.
- Product pages should feel premium and useful without delaying the purchase
  task.
- Category pages should be search-aware, filterable, image-led where useful,
  and easy to scan.
- SEO should include Hebrew search intent for jewelry, rings, necklaces,
  earrings, bracelets, silver jewelry, gold plating, pearls, gifts for women,
  and delicate jewelry.

Standing direction:

- Keep the public experience quiet-luxury: ivory, ink, soft gold, delicate
  borders, large product photography, generous spacing, calm typography, and
  minimal noise.
- Public copy should speak about season, light, material, gift context, skin
  tone, metal tone, sizing, confidence before purchase, and styling use.
- Avoid generic, operational, or template-like copy on public pages.
- Navigation should stay short, commercial, and scannable: all jewelry, new,
  rings, necklaces, earrings, bracelets, gifts, favorites, size guide, about,
  and service.
- Product pages should expose gallery, name, short description, price,
  availability, material, stone, collection, delivery, returns, warranty, gift
  note, service contact, pre-order questions, and related items.
- Category pages should open with a focused H1, seasonal/material description,
  brand image when appropriate, trust strip, useful filters, breathable grid,
  and a styling or care cue.
- Trust details should appear before checkout: secure payment, shipping,
  returns, human service, gift packaging, and size guidance.

Implementation checklist:

- Keep `SITE_COPY_MAP` synced on every text change.
- Run `copy:check`, lint, typecheck, tests, and build before production.
- Ensure product cards include image, name, material, price, availability,
  favorites, and cart action only where supported.
- Ensure product pages present gift, service, returns, and size context before
  recommendation sections.

## Maintenance Rules

- Remove completed items from the active section after acceptance checks and
  verification are recorded in commit, PR, release, or QA evidence.
- Move an item from `Needs Benchmark` to `Actionable Now` only after benchmark
  evidence is recorded.
- Keep blocker language concrete: name the missing credential, provider action,
  operational proof, or environment condition.
- Add new items conservatively. Prefer evidence from repository docs, route
  inventory, tests, provider checks, QA artifacts, or explicit product
  decisions.
