# Route Evidence Ledger

Generated: 2026-05-31

Status: active QA evidence ledger for route-level product changes.

This ledger records the latest baseline route evidence for public, account,
admin, API, and PWA surfaces. Use it before accepting product-changing work that
touches route behavior, route structure, checkout/account/admin flows, provider
routes, or global QA coverage.

Related documents:

- `docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md`
- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/PUBLIC_CHANGE_GATE.md`
- `docs/ENGINEERING_CONVENTIONS.md`

## Latest Baseline

| Check                       | Command or artifact                                                                                                          | Result                                       | Remaining risk                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| App route template coverage | `pnpm qa:routes`                                                                                                             | PASS: 58 app route templates covered         | This verifies inventory coverage only; it does not render pages.           |
| Full seeded route inventory | `pnpm exec tsx scripts/qa-route-inventory.ts --check --all-products --out-dir artifacts/qa/2026-05-31-route-evidence-ledger` | PASS: 359 route entries, 0 missing templates | Artifact is local and ignored by git; regenerate when route shape changes. |
| Performance route set       | `pnpm exec tsx scripts/qa-route-inventory.ts --performance-routes`                                                           | PASS: 8 routes selected for performance QA   | This lists targets only; run `pnpm qa:performance` for runtime metrics.    |

Current full-seed inventory summary:

| Kind    | Count |
| ------- | ----: |
| Public  |    18 |
| Dynamic |   305 |
| Account |     2 |
| Admin   |    13 |
| API     |    20 |
| PWA     |     1 |

Coverage summary:

| Coverage type                  | Count |
| ------------------------------ | ----: |
| Browser-visible routes         |   339 |
| Documented or smoke API routes |    20 |
| Performance-audited routes     |     8 |
| Missing app templates          |     0 |

## Route Group Evidence

| Route group                                                                                                                                                  | Change class                                                | Current evidence                                                             | Last checked | Remaining risk                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Public brand and content routes: `/`, `/about`, `/faq`, legal, accessibility, branches                                                                       | Public UX and Brand                                         | Covered by route inventory and public benchmark docs                         | 2026-05-31   | Needs visual QA for layout, media, first viewport, and floating chrome changes.                                        |
| Commerce discovery routes: `/search`, `/gifts`, `/category/[slug]`, `/product/[slug]`                                                                        | Public UX and Brand; Commerce and Checkout                  | Covered by route inventory, seed catalog dynamic routes, and benchmark gates | 2026-05-31   | Needs benchmark evidence before public UX changes and runtime QA for layout or filter behavior changes.                |
| Checkout and account routes: `/checkout`, `/account`, `/account/orders/[id]`, `/account/privacy/export`                                                      | Commerce and Checkout; Accessibility, Privacy, and Security | Covered by route inventory; privacy export has smoke expectation             | 2026-05-31   | Needs flow-level tests for mutations, auth boundaries, payment paths, and source-specific checkout behavior.           |
| Admin operations routes: `/admin`, `/admin/orders`, `/admin/catalog`, `/admin/inventory`, `/admin/customers`, `/admin/integrations`, and related admin pages | Admin and Operations                                        | Covered by route inventory with protected-route expectations                 | 2026-05-31   | Needs authenticated admin checks and data-state fixtures for workflow changes.                                         |
| Provider and API routes: `/api/health`, cart count, chat, webhooks, push, PWA sync, search reindex, events, jobs, tRPC                                       | Backend, API, and Data                                      | Covered as smoke or documented protocol routes                               | 2026-05-31   | Needs route-specific negative-path tests for signatures, auth, rate limits, provider failures, and payload validation. |
| PWA and offline routes: `/offline`, `/serwist/[path]`, PWA sync APIs                                                                                         | Performance, PWA, and Reliability                           | Covered by route inventory and documented service-worker route               | 2026-05-31   | Needs browser/runtime verification for cache behavior, offline recovery, and queued mutation promises.                 |

## Update Rules

- Update the relevant route group when route structure, route ownership, or QA
  coverage changes.
- Add a new evidence entry when a route group gets a meaningful smoke, e2e,
  visual, performance, or provider negative-path result.
- Keep local artifact paths exact, but do not commit ignored artifact output.
- If a route changes public structure or public commerce controls, record the
  benchmark decision before marking the route group as implementation-ready.
