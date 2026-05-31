# Homepage Discovery-to-Commerce Balance Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-010 Homepage Discovery-to-Commerce Balance
- `Status`: Supported and implemented

## Scope

This benchmark covers `/`, the homepage hero, category entry points, search,
gifts, sizing, service, featured products, and the ordering of commerce
discovery before editorial support sections.

## Gate Classification

- `Change Type`: Homepage structure and discovery UX.
- `Route Context`: home.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Home, PLP, search, gifts, service, and route-structure
  guidance in `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                        | Observed Pattern                                                                                            | Weight |
| ------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/home                  | Homepage balances brand imagery with direct gift, jewelry, watch, care, tracking, and appointment paths.    | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us                       | Homepage leads with gifting and product discovery while keeping service, appointments, and care accessible. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/                            | Homepage exposes shop-by-category, product entries, gifting, and advisor appointment paths.                 | 1.5    |
| Boucheron     | https://www.boucheron.com/us/                       | Homepage includes product entries, saved-list creation, services, and store/appointment paths.              | 1.5    |
| Piaget        | https://www.piaget.com/us-en                        | Global home navigation exposes search, jewelry categories, wishlist, boutiques, and service paths.          | 1.5    |
| Chopard       | https://www.chopard.com/en-us/day-of-happiness.html | Homepage/gift landing patterns combine editorial modules with product carousels and shop links.             | 1.5    |
| De Beers      | https://www.debeers.com/en-us/home?region=true      | Homepage provides fine jewelry collection, new-arrival, product, wishlist, appointment, and contact paths.  | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/home               | Homepage structure keeps brand storytelling near shop, wishlist, store locator, and contact access.         | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The homepage may tighten commerce discovery when the
  change is restrained, routes to real search/category/gift/service utilities,
  and does not turn the hero into a dense control panel or a PLP.

## Implementation Decision

Implement a narrow homepage pass:

- Add a compact text-link shortcut rail immediately after the category grid.
- Link to existing real destinations: `/search`, `/gifts`, `/size-guide`, and
  `/service`.
- Preserve the current hero, category grid, quick-search form, featured product
  grid, and editorial sections.
- Avoid cards, pills, same-page anchors, extra hero CTAs, or product-card
  changes.

## Acceptance Checks

- Commerce shortcuts appear after categories and before material/editorial
  sections.
- The shortcut rail is text-only with underlines/borders, not a nested card or
  button cluster.
- The existing quick-search form still appears before featured products.
- The homepage hero remains the first viewport signal and is not converted into
  a control surface.
- Links route only to existing public tasks.

## Verification

- `pnpm test -- src/styles/homepage-discovery-commerce-balance.test.ts src/styles/mobile-commerce-density.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for `/` on desktop and mobile.

## Residual Risk

The benchmark supports a restrained shortcut rail only. Moving the quick-search
form above editorial content, adding a merchandising mega-panel, changing hero
composition, or introducing personalized recommendation controls still requires
a separate benchmark.
