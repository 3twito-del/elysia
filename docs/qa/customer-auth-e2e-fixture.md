# Customer Auth E2E Fixture

Status: reusable authenticated customer fixture added for Wave 0 / I-01.

Generated: 2026-06-19.

## What Exists

- Test-only route: `POST /api/e2e/customer-auth`.
- Enablement flag: `E2E_AUTH_FIXTURES=1`.
- Production guard: disabled on Vercel production even if the flag is present.
- Fixture data: customer profile, address, saved size, wishlist item, local
  shipped order, captured fixture payment, shipment, active return request,
  Shopify mirror order, and deterministic OTP challenge.
- Production E2E harness flag: `E2E_SKIP_SERWIST_BUILD=1`, used only to avoid
  the local Windows sandbox failure while account tests run with service
  workers blocked.
- Production E2E database source: `E2E_DATABASE_URL` when supplied, otherwise
  shell `DATABASE_URL`, otherwise `.env.development.local` `DATABASE_URL`.
- Managed production web server: `tests/e2e/global-setup.ts` starts
  `scripts/playwright-web-server.mjs`; `tests/e2e/global-teardown.ts` tears down
  the saved process tree for Windows Playwright runs.
- Playwright helper: `tests/e2e/helpers/customer-auth.ts`.
- E2E spec: `tests/e2e/authenticated-account.spec.ts`.

## Verification

Unit and guardrail checks:

```powershell
pnpm exec vitest run src/server/services/customer-auth-fixtures.test.ts scripts/qa-route-inventory.test.ts src/server/http/api-response-boundary.test.ts
pnpm lint
pnpm typecheck
pnpm copy:check
```

Browser E2E check:

```powershell
pnpm exec playwright test tests/e2e/authenticated-account.spec.ts --project=chromium-desktop
```

Result:

- The authenticated customer fixture test passed in Chromium desktop.
- The flow reached `/account`, verified local and Shopify order states,
  wishlist decision support, saved sizes, privacy export, and
  `/account/orders/[id]`.

## Known Harness Note

The default Playwright web server command now sets `E2E_SKIP_SERWIST_BUILD=1`
so authenticated account E2E can run through `next build && next start` without
calling Serwist's esbuild step. This is scoped to non-PWA E2E: Playwright blocks
service workers for these tests, and full service-worker production evidence
still requires a separate PWA build/smoke path without the skip flag. The
harness also injects a local E2E database URL before `next start` so `.env.local`
preview credentials do not override the same database used by `next dev`, and
uses global setup/teardown around a managed Node web-server wrapper instead of
Playwright's built-in `webServer` plugin, avoiding Windows shell teardown hangs.
