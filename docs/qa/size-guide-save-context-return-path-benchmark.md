# Size Guide Save Context and Product Return Path Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-045 Size Guide Save Context and Product Return Path
- `Status`: Supported and implemented

## Scope

This benchmark covers `/size-guide`, PDP links into the size guide, saved-size
context, and route-backed return from the guide to the originating product.

## Gate Classification

- `Change Type`: Public UX and commerce-support clarity.
- `Route Context`: Size guide and product detail route.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: PDP and service support rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                               | Weight |
| ------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/services/jewelry/size-guide/rings/ | Ring sizing guidance is a support utility tied to purchase confidence rather than a standalone marketing page. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/size-guide/                              | Size guidance supports ring, bracelet, and necklace fit decisions with direct shopping context.                | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/services                           | Service content connects sizing, care, delivery, and client support as practical commerce assistance.          | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                             | Jewelry commerce guidance exposes sizing, delivery, contact, and service context near shopping decisions.      | 1.5    |
| De Beers      | https://www.debeers.com/en-us/faqs.html                          | FAQ guidance supports product-page sizing and customer-service recovery without exposing exact inventory.      | 1.5    |
| Pomellato     | https://www.pomellato.com/us_en                                  | Product support patterns include size guidance and service recovery near product selection.                    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/services                            | Service guidance includes appointment preparation, sizing support, and client-care recovery.                   | 1.5    |
| Messika       | https://www.messika.com/us_en/our-messika-services               | Service pages connect purchase support, delivery, returns, after-sales, and customer care.                     | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The size guide may clarify saved-size behavior and
  preserve a route-backed return to a product when entered from a PDP, provided
  it does not add checkout shortcuts, exact inventory, or unsupported account
  promises.

## Implementation Decision

Implement a narrow support pass:

- Add save-context copy inside the existing size guide tool.
- Preserve local-device saved-size behavior and existing account sync behavior.
- Add a safe `/product/[slug]` return context when the PDP supplied
  `returnTo`.
- Update PDP size-guide links to pass the product return context.
- Do not add checkout, appointment booking, exact stock, or provider claims.

## Acceptance Checks

- The size guide explains local save behavior before submit.
- Product-origin visits show a route-backed return action to `/product/[slug]`.
- Return URLs are constrained to product routes only.
- PDP size-guide links keep the selected size kind and product context.
- Existing saved-size validation and account sync behavior stay unchanged.

## Verification

- `pnpm test -- src/styles/size-guide-return-context.test.ts src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/product-purchase-facts-placement.test.ts`
- `pnpm lint`
- `pnpm typecheck`

## Residual Risk

This benchmark supports context and return-path clarity only. Future changes to
interactive measuring, appointment booking, checkout placement, or
inventory-aware size recommendations require a new benchmark.
