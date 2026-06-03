# Product Gallery Full Gallery Benchmark

- `Date`: 2026-06-03
- `Backlog Item`: I-034 Product Gallery Full Gallery Infrastructure
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]` gallery infrastructure: bounded PDP
media, scrollable thumbnails for many images, full-viewport gallery viewing,
keyboard navigation, visible image position, and supplier multi-image media.

It replaces the narrower thumbnail-clarity decision in
`docs/qa/product-gallery-media-fallback-thumbnail-clarity-benchmark.md`.

## Gate Classification

- `Change Type`: Public PDP media and purchase confidence clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: High Jewelry Reference Gate and the selected 30-site jewelry
  benchmark corpus in `src/lib/public-design-policy.ts`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; 30-site threshold is `18.75`.

## Benchmark Evidence

| Site               | Evidence URL                                                          | Observed Pattern                                                                  | Weight |
| ------------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/jewelry/                                | PDP media stays bounded, product-led, and navigable before service content.       | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/                                              | PDP imagery supports multi-image inspection without hiding purchase context.      | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/collections/jewelry/couture.html | Product/collection media uses restrained product inspection and clear sequence.   | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/                                        | PDP media presents product image sequences with dedicated larger viewing.         | 1.5    |
| Harry Winston      | https://www.harrywinston.com/                                         | Product imagery remains image-led and bounded around the product task.            | 1.5    |
| Graff              | https://www.graff.com/us-en/home/                                     | Product photography dominates, with selection controls visually contained.        | 1.5    |
| Chopard            | https://www.chopard.com/en-us                                         | Product galleries keep media, details, and purchase confidence in one flow.       | 1.5    |
| Boucheron          | https://www.boucheron.com/us/                                         | Gallery controls stay near product media and support image continuation.          | 1.5    |
| Chaumet            | https://www.chaumet.com/us_en/                                        | Product image treatment favors bounded inspection over decorative enlargement.    | 1.5    |
| Piaget             | https://www.piaget.com/us-en                                          | PDP/gallery surfaces emphasize current image position and product context.        | 1.5    |
| Mikimoto           | https://www.mikimoto.com/en/index.html                                | Product media supports browsing without obscuring product facts.                  | 1.5    |
| Messika            | https://www.messika.com/us_en/                                        | Product pages keep image sequences and product facts in a direct commerce flow.   | 1.5    |
| Buccellati         | https://www.buccellati.com/en_us/home                                 | Product media stays restrained, factual, and product specific.                    | 1.5    |
| De Beers           | https://www.debeers.com/en-us/home                                    | Product media and detail controls remain route-backed and product led.            | 1.5    |
| Pomellato          | https://www.pomellato.com/                                            | PDP image viewing supports close inspection while keeping commerce context clear. | 1.5    |
| David Yurman       | https://www.davidyurman.com/                                          | Commerce PDPs use multi-image galleries with bounded media and thumbnails.        | 1      |
| Pandora            | https://www.pandora.net/                                              | PDP media sequences support thumbnail navigation and product inspection.          | 1      |
| Swarovski          | https://www.swarovski.com/                                            | Product galleries provide image sequences without replacing purchase details.     | 1      |
| Mejuri             | https://mejuri.com/                                                   | Product pages support multiple product images in compact commerce layouts.        | 1      |
| Brilliant Earth    | https://www.brilliantearth.com/                                       | PDP galleries use thumbnails and larger product viewing for confidence.           | 1      |
| Blue Nile          | https://www.bluenile.com/                                             | Product detail media emphasizes navigable inspection before purchase.             | 1      |
| James Allen        | https://www.jamesallen.com/                                           | Product inspection is explicit, bounded, and commerce oriented.                   | 1      |
| Kay Jewelers       | https://www.kay.com/                                                  | PDP galleries support many images while keeping purchase controls adjacent.       | 1      |
| Zales              | https://www.zales.com/                                                | Product pages keep thumbnail navigation close to the main image.                  | 1      |
| Jared              | https://www.jared.com/                                                | PDP media supports full product inspection and visible image selection.           | 1      |
| VRAI               | https://www.vrai.com/                                                 | Product media uses constrained, product-led inspection patterns.                  | 1      |
| Catbird            | https://www.catbirdnyc.com/                                           | PDP galleries preserve product details and route-backed shopping flow.            | 1      |
| Aurate             | https://auratenewyork.com/                                            | Product imagery uses multiple images and bounded commerce presentation.           | 1      |
| Monica Vinader     | https://www.monicavinader.com/                                        | PDP galleries support image selection with compact purchase context.              | 1      |
| Kendra Scott       | https://www.kendrascott.com/                                          | PDP media supports thumbnails, active image state, and product inspection.        | 1      |

## Score

- `Supported Sites`: 30 of 30.
- `Weighted Score`: 37.5.
- `Threshold`: 18.75.
- `Decision`: Supported. PDP gallery infrastructure may use a bounded main
  gallery, scrollable thumbnail rail, and true full-viewport image viewer when
  it stays inside the existing PDP media area and keeps purchase context
  adjacent.

## Implementation Decision

- Replace the small zoom dialog with a full-viewport gallery viewer.
- Keep the PDP main image bounded and `object-contain` so large source images do
  not crop or pretend to be magnification.
- Use stable scroll rails for thumbnails in both the PDP and full-screen viewer.
- Preserve all supplier images already available from Shopify sync.
- Expand fixtures so local, e2e, and visual QA cover multi-image galleries.
- Do not add decorative media, same-page storytelling, urgency, or checkout
  prompts inside the gallery.

## Acceptance Checks

- Multi-image PDPs expose visible selected-image status and active thumbnail
  state.
- Full-screen viewer occupies the viewport, uses a bounded image stage, supports
  next/previous and keyboard navigation, and returns focus to the trigger.
- Thumbnail rail supports many images without horizontal page overflow.
- Supplier sync preserves all Shopify images fetched by the adapter.
- Missing-media fallback remains compact and keeps purchase details visible.

## Verification

- `pnpm test -- src/styles/product-gallery-media-fallback-thumbnail-clarity.test.ts src/lib/image-performance.test.ts src/server/services/shopify-dropship-sync.test.ts src/server/adapters/shopify.test.ts`
- `pnpm typecheck`
- `pnpm e2e -- tests/e2e/critical-flows.spec.ts`
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/visual-qa-agent-browser.ps1 -Routes "/product/venus-line-ring","/product/hera-bracelet","/product/elysia-supplier-silver-halo-ring" -Viewports "desktop:1440x900","tablet:768x1024","mobile:390x844"`
- `pnpm copy:check`
- `pnpm build`

## Residual Risk

This benchmark supports a full-gallery image viewer, not deep pan/zoom,
augmented try-on, video media, or a broader PDP redesign. Those changes require
a separate public benchmark decision.
