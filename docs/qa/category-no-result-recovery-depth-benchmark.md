# Category No-Result Recovery Depth Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-033 Category No-Result Recovery Depth
- `Status`: Supported and implemented

## Scope

This benchmark covers `/category/[slug]` zero-result states after filtering,
reset behavior, route-backed adjacent category continuation, and search
continuation from the category listing context.

## Gate Classification

- `Change Type`: Public UX and commerce-discovery recovery.
- `Route Context`: `/category/[slug]`.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the same PLP/search evidence recorded for
`docs/qa/category-active-filter-sort-clarity-benchmark.md` and
`docs/qa/search-empty-state-guided-recovery-benchmark.md`.

| Site          | Evidence URL                                                     | Observed Pattern                                                                                    | Weight |
| ------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | PLP recovery keeps filters, counts, and product-continuation controls close to the listing.         | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Listing recovery exposes result context, filters, reset, and category continuation before content.  | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Product discovery keeps no-result or filter recovery inside the listing-control area.               | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP recovery remains task-first with constrained filter guidance and product-grid continuation.     | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Product listing exposes filter groups, availability controls, and sort as immediate recovery tools. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Combined sort/filter controls and result count guide continuation before product cards.             | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Filter and result summaries stay adjacent to listing results and recovery.                          | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing recovery relies on filter and sort controls rather than storytelling blocks.                | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Shop-by filters, apply actions, and item totals guide continuation inside the discovery flow.       | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Discovery pages keep reset-all, filters, active selection, and product count near product listings. | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Category no-result recovery may add compact visible
  route-backed category continuations when those continuations are generated
  from current filtered counts and remain inside the empty state.

## Implementation Decision

Implement a narrow recovery pass:

- Keep `/category/[slug]` as a product-listing page, not a content page.
- Add up to two route-backed category continuations only when the current
  filter selection returns products in another category.
- Preserve reset and search continuation as the baseline recovery paths.
- Keep all recovery inside the existing empty state.
- Do not add service, size-guide, checkout, account, editorial, or unsupported
  commerce actions.

## Acceptance Checks

- Adjacent category actions appear only when they have filtered product counts.
- Category continuation links preserve the active category filters.
- Search continuation maps only supported category filters to `/search`.
- Reset remains available for filtered zero-result states.
- The recovery area remains compact and does not introduce new public content
  sections.

## Verification

- `pnpm test -- src/app/category/[slug]/_lib/category-filter-state.test.ts src/styles/category-no-result-recovery-depth.test.ts src/styles/category-active-filter-sort-clarity.test.ts src/styles/discovery-filter-density.test.ts src/styles/public-structure-enforcement.test.ts`

## Residual Risk

This benchmark supports route-backed category and search recovery inside the
existing empty state only. Future changes that add new destinations, service
escalation, editorial content, or a different PLP layout must run through the
public gate again.
