# Search and Category Filter Density Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-007 Search and Category Filter Density
- `Status`: Supported and implemented

## Scope

This benchmark covers public commerce discovery routes: `/search`,
`/category/[slug]`, `/gifts`, filter sheets, active refinement summaries, sort
controls, reset behavior, and product-grid entry.

## Gate Classification

- `Change Type`: Public UX and commerce-control density.
- `Route Context`: PLP/search/gifts.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                       | Weight |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | Filter and sort controls appear before the grid, with item totals and load-progress summary.           | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Ring listing exposes result count, filters, empty recovery, and range summary before product cards.    | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Listing shows product count and a combined filters/sorting control before the grid.                    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP shows filters, product count, sort, and constrained filter guidance before products.               | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Jewelry listing exposes filter groups, item count, available-online control, and sort before products. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Listing uses a combined sort/filter sheet with clear action and result count before product cards.     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Ring listing exposes filters and result count before the product list.                                 | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing exposes filter button, product count, and sort select before products.                         | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                   | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Listing exposes shop-by filters, apply action, item totals, and page/range information.                | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Collection listing exposes sort/filter, reset-all, active availability selection, and product count.   | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. The change may proceed if it remains compact,
  task-first, and does not push filters, result count, sort, recovery, or grid
  below storytelling content.

## Implementation Decision

Implement a small refinement-summary pass rather than a large redesign:

- Add compact active-refinement summaries above active chips on `/search` and
  desktop `/category/[slug]`.
- Add a truncated active-refinement preview to the mobile category sticky bar.
- Keep chips tappable and individually removable.
- Keep filter and sort controls before product grids.
- Do not change `/gifts` behavior beyond documenting that it already satisfies
  the product-listing requirement with count and search recovery.

## Acceptance Checks

- Active refinement summaries are visible only when selections exist.
- Summaries remain compact and do not replace individual removable chips.
- Mobile category summary is truncated in a stable single line.
- Search and category result summaries, filters, sort controls, and grids remain
  before storytelling content.
- No exact public inventory count is introduced.

## Verification

- `pnpm test -- src/app/search/_lib/search-state.test.ts src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/discovery-filter-density.test.ts`
- Visual smoke for `/search` and `/category/earrings` with active filters before
  product grids.

## Residual Risk

The benchmark supports density and summary refinements, not a broad PLP
redesign. Future changes to filter placement, hero structure, or product-card
density must run through the gate again.
