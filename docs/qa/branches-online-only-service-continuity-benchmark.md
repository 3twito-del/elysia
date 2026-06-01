# Branches Online-Only Service Continuity Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-046 Branches Online-Only Service Continuity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/branches` when physical branches are disabled, including
online-only service copy, route-backed recovery, and avoidance of unsupported
store-location promises.

## Gate Classification

- `Change Type`: Public service and location clarity.
- `Route Context`: Branches and service route.
- `Primary Lens`: Public structure and service corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                         | Observed Pattern                                                                                         | Weight |
| ------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/contact-us             | Contact and client relations paths provide service continuity alongside boutique/service context.        | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/customer-service             | Customer service groups product help, appointments, orders, and contact routes.                          | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/contact-us--info.html  | Contact page separates call, message, and boutique/service recovery.                                     | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/contact-us.html | Client service routing supports online contact and boutique recovery without overpromising availability. | 1.5    |
| Boucheron          | https://www.boucheron.com/us/services                | Services connect remote support, appointment preparation, sizing, and after-sales paths.                 | 1.5    |
| Messika            | https://www.messika.com/us_en/our-messika-services   | Service page exposes delivery, returns, repair, gift packaging, and customer-care recovery.              | 1.5    |
| De Beers           | https://www.debeers.com/en-us/store-locator          | Store/service discovery remains explicit about available physical and contact paths.                     | 1.5    |
| Piaget             | https://www.piaget.com/us-en/contact-us              | Contact and service routing provide recovery when store interaction is not the immediate path.           | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The branches route may strengthen online-only service
  continuity when physical branches are unavailable, provided it does not imply
  store inventory, walk-in availability, or unsupported appointment operations.

## Implementation Decision

Implement a narrow online-only pass:

- Keep the existing online-only state and primary catalog/service actions.
- Add compact continuity steps that explain how shoppers continue through
  catalog, size guide, and service.
- Add route-backed size-guide and service links.
- Keep physical branch details gated behind real branch data.

## Acceptance Checks

- Online-only copy is visible only when physical branches are unavailable.
- Recovery links route to existing `/size-guide` and `/service` surfaces.
- No physical address, walk-in, or appointment promise is introduced without
  branch data.
- The branch list remains unchanged when physical branches exist.

## Verification

- `pnpm test -- src/styles/branches-online-service-continuity.test.ts src/styles/service-trust-placement.test.ts src/styles/public-structure-enforcement.test.ts`
- `pnpm lint`
- `pnpm typecheck`

## Residual Risk

This benchmark supports service continuity only. Real branch launch,
appointment availability, inventory-at-location, or store-hours behavior must be
verified with operational data before public release.
