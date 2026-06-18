# Product Gallery Media Fallback and Thumbnail Clarity Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-034 Product Gallery Media Fallback and Thumbnail Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]` gallery selected-state clarity,
thumbnail controls, missing-media fallback, and image alt/status copy. It
evaluates whether the product gallery can become clearer without changing the
gallery-first PDP layout or adding decorative media.

## Gate Classification

- `Change Type`: Public PDP media and purchase confidence clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: Product detail and public media rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the same high-jewelry PDP evidence used for
`docs/qa/pdp-size-care-fit-fact-placement-benchmark.md`.

| Site          | Evidence URL                                          | Observed Pattern                                                                                        | Weight |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/rings/          | PDP media remains product-led with clear gallery navigation and purchase details beside or below media. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                | Product imagery, thumbnail selection, and purchase facts remain close without decorative detours.       | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings           | PDP media uses a stable product image sequence before service or editorial content.                     | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections/    | Product detail pages keep product photography dominant and selection controls visually bounded.         | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery               | Product image galleries keep media, detail, and purchase confidence in a compact product task.          | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html | Product discovery and detail media stay image-led with clear continuation controls.                     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings            | PDP/gallery surfaces emphasize current product imagery and visible selection context.                   | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                 | Product pages keep image sequences and product facts in a direct commerce flow.                         | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/   | Product media and detail controls stay factual, route-backed, and product specific.                     | 1.5    |
| Van Cleef     | https://www.vancleefarpels.com/us/en/collections.html | Product-led visual presentation avoids generic decorative media in shopping contexts.                   | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/jewelry         | Product media supports browsing and purchase confidence without obscuring product details.              | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. PDP gallery clarity may add visible selected-image
  status, stronger thumbnail selected markers, and a clearer missing-media
  fallback when all changes stay inside the existing gallery component.

## Implementation Decision

Implement a narrow gallery clarity pass:

- Keep the current gallery-first PDP structure unchanged.
- Add a visible and live selected-image status for multi-image galleries.
- Keep thumbnail controls keyboard reachable and mark the active thumbnail with
  a stable testable state.
- Keep the missing-media fallback inside the gallery frame and keep purchase
  details visible outside the gallery.
- Do not add decorative imagery, new media sections, service CTAs, checkout
  prompts, or editorial content.

## Acceptance Checks

- The gallery exposes a selected-image status for assistive technology and
  sighted users.
- Thumbnails retain `aria-current`, `aria-pressed`, keyboard navigation, and a
  stable selected-state marker.
- Main image alt text identifies the product and the active image index.
- Missing-media fallback remains compact and does not obscure the purchase
  panel.

## Verification

- `pnpm test -- src/styles/product-gallery-media-fallback-thumbnail-clarity.test.ts src/styles/product-led-media.test.ts src/styles/product-purchase-facts-placement.test.ts src/styles/service-trust-placement.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports clarity inside the existing gallery only. New gallery
layouts, new product media sources, decorative imagery, or cross-page media
systems must pass the public gate again.
