# Product Recommendation Rail Relevance and Return Context Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-038 Product Recommendation Rail Relevance and Return Context
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]` recommendation rails, related-product
context labels, product-card context copy, and route-backed return links from a
search-origin PDP visit.

## Gate Classification

- `Change Type`: Public PDP recommendation and discovery continuation clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: PDP and product discovery guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the PDP and product-led discovery evidence recorded in
`docs/qa/pdp-size-care-fit-fact-placement-benchmark.md` and
`docs/qa/product-gallery-media-fallback-thumbnail-clarity-benchmark.md`.

| Site          | Evidence URL                                          | Observed Pattern                                                                               | Weight |
| ------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                | Product discovery keeps collection/filter continuation close to product-led shopping contexts. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/                      | Product and category browsing rely on direct product cards and service-backed continuation.    | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry                 | Product pages keep related discovery factual and route-backed rather than editorial-only.      | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections/    | Collections keep product-led continuation and clear collection context.                        | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery               | Product discovery uses compact category/collection continuation before broader content.        | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html | Listing and product continuation remain tied to category, collection, and product attributes.  | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                  | Jewelry discovery keeps visible category and product context in the shopping flow.             | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                 | Product browsing emphasizes related product context without checkout shortcuts in the rail.    | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/   | Related discovery stays product-specific and keeps service/commerce facts separate.            | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/jewelry         | Product recommendations are safest when they preserve product-card clarity and category paths. | 1.5    |
| Van Cleef     | https://www.vancleefarpels.com/us/en/collections.html | Collection discovery supports route-backed continuation from product contexts.                 | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. PDP recommendation rails may show compact reason copy,
  product-card context labels, and return-to-search/category links when the rail
  remains below product details and does not add checkout, urgency, or editorial
  content.

## Implementation Decision

Implement a narrow recommendation context pass:

- Add a short reason and route-backed continuation link to each rail.
- Add product-card context labels only when a caller passes context.
- Add search-origin return context when the PDP was reached from search.
- Keep recommendation rails below product details and service facts.
- Do not add checkout shortcuts, urgency copy, decorative media, or new content
  sections inside the recommendation area.

## Acceptance Checks

- Rails expose why products are related.
- Product cards can show a compact context label without affecting default
  product-card surfaces.
- Search return links preserve the originating query only.
- Recommendation continuation links point to `/category/[slug]` or `/search`.

## Verification

- `pnpm test -- src/styles/product-recommendation-rail-return-context.test.ts src/app/product/[slug]/_lib/product-recommendation-rails.test.ts src/styles/product-card-overlays.test.ts src/styles/public-structure-enforcement.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports context and routing copy only. Recommendation algorithm
changes, personalization, AI-ranked rails, or cross-session tracking require a
separate benchmark and data review.
