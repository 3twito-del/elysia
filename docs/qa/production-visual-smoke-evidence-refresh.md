# Production Visual Smoke Evidence Refresh

- `Date`: 2026-06-01
- `Backlog Item`: I-047 Production Visual Smoke Evidence Refresh
- `Status`: Implemented as a repeatable evidence checklist

## Scope

This refresh records the production smoke and route evidence that should be
updated after the current batch of backlog-backed changes reaches production.

## Refresh Cadence

- Refresh after every production deployment that changes public routes,
  checkout, account, admin chrome, floating controls, PWA behavior, or visual QA
  scripts.
- Refresh after deployment aliases change, even when the code commit is
  unchanged, so the evidence is tied to the active production domain.
- Keep one representative route-set artifact for every release candidate.
  Capture an all-products route-set artifact before releases that affect
  catalog routing, product fixtures, search, category filters, or PDP media.

## Artifact Naming

Use this production artifact pattern:

```text
artifacts/qa/<utc-timestamp>-<route-set>-<deployment-id>-agent-browser/
```

Required metadata for each visual evidence directory:

- UTC timestamp.
- Production base URL.
- Deployment ID or `local` for non-production checks.
- Route set name, either `representative`, `all-products`, or an explicitly
  named release subset.
- Viewport set.
- Route list.
- Console error budget.

## Evidence Targets

- `/product/elysia-supplier-silver-halo-ring?q=venus`
- `/checkout`
- `/service?topic=order`
- `/branches`
- `/size-guide?kind=ring&returnTo=/product/elysia-supplier-silver-halo-ring`
- `/admin/appointments`
- `/admin/inventory`
- `/admin/notifications`
- `/serwist/sw.js`

## Required Evidence

- Production deployment inspect output reports `READY`.
- `SMOKE_BASE_URL=https://elysia-jewellery.com pnpm smoke` passes.
- `/serwist/sw.js` returns `200`.
- Product, service, size guide, and branches pages expose their new route
  context markers in production HTML.
- Admin routes return expected protected-route responses in smoke; detailed
  admin UI state remains covered by source tests because production HTML is
  permission-dependent.
- Vercel error-log scan for the deployment returns no error entries for the
  post-deploy window.

## Verification Commands

```powershell
vercel inspect <deployment-url>
$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"; pnpm smoke
curl.exe -I https://elysia-jewellery.com/serwist/sw.js
vercel logs <deployment-url> --level error --since 1h --json
$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"
$env:VERCEL_DEPLOYMENT_ID = "<deployment-id>"
$env:QA_ROUTE_SET_NAME = "representative"
pnpm visual:qa
pnpm visual:qa -- -AllProducts
```

## Residual Risk

This refresh does not replace authenticated manual admin workflow checks,
provider-dashboard validation, paid Shopify checkout, or supplier fulfillment
confirmation.
