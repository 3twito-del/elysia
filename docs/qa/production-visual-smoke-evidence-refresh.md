# Production Visual Smoke Evidence Refresh

- `Date`: 2026-06-01
- `Backlog Item`: I-047 Production Visual Smoke Evidence Refresh
- `Status`: Implemented as a repeatable evidence checklist

## Scope

This refresh records the production smoke and route evidence that should be
updated after the current batch of backlog-backed changes reaches production.

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
```

## Residual Risk

This refresh does not replace authenticated manual admin workflow checks,
provider-dashboard validation, paid Shopify checkout, or supplier fulfillment
confirmation.
