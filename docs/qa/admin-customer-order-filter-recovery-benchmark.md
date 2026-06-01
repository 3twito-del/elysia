# Admin Customer and Order Filter Recovery Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-041 Admin Customer and Order Filter Recovery Audit
- `Status`: Supported and implemented

## Scope

This benchmark covers `/admin/orders`, `/admin/customers`, `/admin/service`,
active filter summaries, filtered empty states, reset links, pagination recovery,
and audit-safe operational copy.

## Gate Classification

- `Change Type`: Protected admin operations recovery and table-state clarity.
- `Route Context`: Admin order, customer, and service queues.
- `Primary Lens`: Admin and operations guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: Existing admin empty-state, route error boundary, and
  outbox/job failure contract tests.
- `Required Gate`: Internal admin benchmark evidence; public gate is not
  required because the affected routes are protected admin surfaces.

## Benchmark Evidence

This item builds on existing admin empty-state evidence and common dashboard
recovery patterns: filtered table views should expose the active filter context,
keep reset links route-backed, and avoid hidden automation claims.

| Source                    | Evidence URL                                                        | Observed Pattern                                                                                    | Weight |
| ------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Existing admin audit      | `src/styles/admin-empty-state-contract.test.ts`                     | Admin table empty states already require reset actions on filtered queues.                          | 1.5    |
| Existing service queue    | `src/styles/admin-service-queue-filter-state.test.ts`               | Service queue normalizes filters, shows active filters, and distinguishes filtered/unfiltered data. | 1.5    |
| Existing route recovery   | `src/styles/route-error-boundary-recovery.test.ts`                  | Admin recovery paths route to supported safe destinations.                                          | 1.5    |
| Existing outbox contract  | `src/styles/search-outbox-job-failure-contract.test.ts`             | Operational failures stay sanitized and route-backed.                                               | 1.5    |
| Vercel admin template     | https://vercel.com/templates/next.js/admin-dashboard                | Dashboard templates organize operational data with tables and route-backed task navigation.         | 1.5    |
| shadcn table empty state  | https://www.shadcn.io/blocks/table-empty-01                         | Empty data tables benefit from clear search/filter recovery and direct next actions.                | 1.5    |
| Next.js on Vercel docs    | https://vercel.com/docs/frameworks/nextjs                           | Next.js route segments support loading/recovery states within the route tree.                       | 1.5    |
| Local admin route pattern | `src/app/admin/orders/page.tsx`, `src/app/admin/customers/page.tsx` | Order and customer tables already have route-backed filters and pagination.                         | 1.5    |

## Score

- `Supported Sources`: 8 of 8.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Admin order and customer filters may add active-filter
  summaries, distinct filtered empty states, and reset actions when they remain
  route-backed and do not add unsupported bulk actions, exports, or provider
  dashboard assumptions.

## Implementation Decision

Implement a narrow admin filter recovery pass:

- Add active-filter summaries to order and customer tables.
- Add filtered/unfiltered empty-state distinctions to order and customer views.
- Keep service queue recovery unchanged and covered.
- Keep reset actions on route-backed admin paths.
- Do not add bulk automation, exports, provider dashboard scraping, or private
  data beyond the existing protected tables.

## Acceptance Checks

- Order, customer, and service queues expose active filter recovery.
- Filtered empty states differ from unfiltered empty states.
- Reset links point to the current admin route without unsafe query reuse.
- Pagination recovery preserves only supported filter parameters.

## Verification

- `pnpm test -- src/styles/admin-customer-order-filter-recovery.test.ts src/styles/admin-empty-state-contract.test.ts src/styles/admin-service-queue-filter-state.test.ts src/styles/route-error-boundary-recovery.test.ts src/styles/search-outbox-job-failure-contract.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports protected admin filter recovery only. New exports, bulk
actions, provider dashboard automation, or customer data previews require a
separate privacy and operations review.
