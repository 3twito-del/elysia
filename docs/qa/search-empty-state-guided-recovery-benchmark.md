# Search Empty-State Guided Recovery Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-023 Search Empty-State Guided Recovery
- `Status`: Supported and implemented

> **Update 2026-07-07 (design-restraint pass):** the recovery affordance was
> de-duplicated. The descriptive `search-guided-recovery` text list and the
> redundant standalone first-category button were removed; the single
> **count-backed recovery-actions row** (each action shows its result total)
> remains as the recovery affordance, alongside filter reset and the category
> suggestions. This keeps the benchmark's core decision (route-backed,
> count-backed continuation) while cutting the empty state's button/text density.

## Scope

This benchmark covers `/search` zero-result states, query persistence, filter
recovery, and route-backed continuation links.

## Gate Classification

- `Change Type`: Public UX and commerce discovery recovery.
- `Route Context`: `/search`.
- `Primary Lens`: Public structure and commerce corpus from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                       | Weight |
| ------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | Discovery pages keep filters, result totals, and continuation controls close to the product grid.      | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | Listing/search recovery keeps result count, filters, reset, and product continuation before content.   | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Product discovery keeps no-result/filter recovery inside the listing control area.                     | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | PLP recovery stays task-first with constrained filter guidance and grid continuation.                  | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | Product listing exposes filters, online availability, and sort controls as recovery before products.   | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Combined sort/filter controls and result count guide users before product cards.                       | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | Filter and result summary stay adjacent to listing results and recovery.                               | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Listing recovery relies on filter and sort controls, not storytelling blocks.                          | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Listing exposes filter, clear-all, product count, and sort controls before products.                   | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Shop-by filters, apply action, and item totals guide continuation inside the discovery flow.           | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Discovery pages keep reset-all, filters, active selection, and product count near the product listing. | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Search zero-result recovery may add compact visible
  guidance when it is generated from existing route-backed recovery actions and
  remains inside the empty state.

## Implementation Decision

Implement a narrow recovery pass:

- Keep `/search` as a product-discovery page, not a content page.
- Make existing count-backed recovery action descriptions visible in the empty
  state instead of relying only on `title` text.
- Keep recovery actions as neutral secondary controls.
- Do not add service, size-guide, checkout, account, or editorial links to the
  search empty state.
- Do not add a new section below the empty state.

## Acceptance Checks

- Empty-state guidance appears only when count-backed recovery actions exist.
- Query/filter recovery links remain route-backed and deduped.
- Buttons still show the available result count.
- The recovery area remains compact and does not introduce public content blocks
  or unsupported commerce actions.

## Verification

- `pnpm test -- src/app/search/_lib/search-state.test.ts src/styles/search-empty-recovery.test.ts`

## Residual Risk

This benchmark supports visible guidance for existing recovery actions only.
Future changes that add new destinations, service escalation, editorial content,
or a different search layout must run through the public gate again.
