# Product Card Quick Facts Density Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-007 Product Card Quick Facts Density
- `Status`: Supported and implemented

## Scope

This benchmark covers product cards on `/category/[slug]`, `/search`,
`/gifts`, home featured products, related products, and recommendation rails.

## Gate Classification

- `Change Type`: Product-listing card UX.
- `Route Context`: PLP/search/gifts/product recommendations.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: PLP, search, gifts, product-card, and PDP guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                                                      | Observed Pattern                                                                                  | Weight |
| ------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                                                            | Listing cards show material/stone, price, size/add-to-bag availability, and restrained badges.    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/joaillerie/jewelry-category/bracelets.html                           | Listing cards expose product name, reference, price, saved-list action, and availability filters. | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/jewelry                                                     | Listing cards include collection, product name, SKU, price, wishlist action, and details link.    | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery.html?cat=335210&category=101&country=int&materials=195 | Listing pages use material/stone filters and compact product name, price, wishlist rows.          | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/necklaces/yellow-gold                                       | Category listing is material-scoped and keeps price/product facts compact.                        | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/sterling-silver/                                                  | Material-scoped listing groups silver jewelry with compact product entries.                       | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/piaget-rose/rose-gold-diamond-necklace-g37ub600              | Product facts identify product type, metal, stones, and add-to-bag context.                       | 1.5    |
| De Beers      | https://www.debeers.com/en-us/lotus-by-de-beers-white-gold-diamond-ring/R104124.html              | Product detail exposes material, diamond facts, size guide, price, and add-to-bag context.        | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Product cards may expose one quiet line of useful
  quick facts when it reuses existing data, remains text-only, does not add
  visual badges or overlays, and preserves scan speed.

## Implementation Decision

Implement a narrow product-card pass:

- Keep the existing single `product-card-attributes` text line.
- Extend that line from material/stone only to material/stone, public
  availability label, and a supplier source fact only for supplier-backed
  products.
- Keep the existing image badge budget, price line, favorite action, and PDP
  CTA unchanged.
- Do not use `commerceHighlights`, collection marketing text, match reasons,
  discount badges, or extra product-card rows.

## Acceptance Checks

- Product cards still render one quiet metadata line.
- The line is truncated to one text slot and uses existing catalog data.
- No additional `<Badge>` component, overlay, add-to-cart action, or checkout
  link is introduced.
- Supplier source is visible only when the product source is
  `DROPSHIP_SHOPIFY`.
- The product title, price or consultation label, favorite control, and PDP link
  remain unchanged.

## Verification

- `pnpm test -- src/styles/product-card-overlays.test.ts src/styles/mobile-commerce-density.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for category/search listing routes.

## Residual Risk

The benchmark supports only one text-line expansion on existing product cards.
Any visual comparison chips, sale badges, inventory counts, collection rails,
or card-level checkout action still requires a separate benchmark.
