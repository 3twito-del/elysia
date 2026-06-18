# Category Active Filter and Sort Clarity Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-024 Category Active Filter and Sort Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/category/[slug]`, the mobile filter sheet, active
refinement summary, reset behavior, sort clarity, and product-grid entry.

## Gate Classification

- `Change Type`: Public UX and commerce-control clarity.
- `Route Context`: `/category/[slug]`.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                       | Weight |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | Filter and sort controls appear before the grid, with item totals and load-progress summary.           | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Listing exposes result count, filters, empty recovery, and range summary before product cards.         | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Listing shows product count and a combined filters/sorting control before the grid.                    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP shows filters, product count, sort, and constrained filter guidance before products.               | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Jewelry listing exposes filter groups, item count, available-online control, and sort before products. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Listing uses a combined sort/filter sheet with clear action and result count before product cards.     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Listing exposes filters and result count before the product list.                                      | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing exposes filter button, product count, and sort select before products.                         | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                   | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Listing exposes shop-by filters, apply action, item totals, and page/range information.                | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Collection listing exposes sort/filter, reset-all, active availability selection, and product count.   | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Category filter and sort clarity may be strengthened
  when it remains compact, adjacent to the listing controls, and does not push
  the product grid below storytelling content.

## Implementation Decision

Implement a narrow clarity pass:

- Surface the current sort in the mobile sticky summary.
- Surface the current sort inside the desktop active-refinement summary.
- Use explicit reset copy for all active filter reset points.
- Keep sort as part of the existing filter controls; do not introduce a second
  standalone control row.
- Do not change product-card density, hero structure, or filter taxonomy.

## Acceptance Checks

- Active filter summary, reset, and sort copy are visible before the product
  grid.
- Mobile sticky summary stays compact and truncates active refinement preview.
- Reset copy clearly resets all active choices.
- No new content section, landing-page behavior, or unsupported commerce action
  is introduced.

## Verification

- `pnpm test -- src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts`

## Residual Risk

This benchmark supports clarity within the existing category listing controls
only. Future changes to the filter sheet structure, product-grid density, or
hero/listing order must run through the public gate again.
