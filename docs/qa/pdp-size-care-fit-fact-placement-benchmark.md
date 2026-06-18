# PDP Size, Care, and Fit Fact Placement Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-025 PDP Size, Care, and Fit Fact Placement
- `Status`: Supported and implemented

## Scope

This benchmark covers `/product/[slug]`, the purchase panel, size guidance,
fit confidence, care facts, warranty facts, delivery/returns reassurance, and
the relationship between the buy area and secondary product details.

## Gate Classification

- `Change Type`: PDP purchase-confidence clarity.
- `Route Context`: `/product/[slug]`.
- `Primary Lens`: Product detail and purchase confidence guidance from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                     | Observed Pattern                                                                                     | Weight |
| ------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                           | PDP purchase context keeps size guidance, service, care, and delivery reassurance near the CTA.      | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/                           | PDP purchase flows keep size help, item facts, delivery, returns, and care information nearby.       | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry/rings                      | Product detail keeps size selection, service links, delivery, and care confidence close to buy.      | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html            | Product pages keep purchase options, care/service support, and product facts before recommendations. | 1.5    |
| Messika       | https://www.messika.com/us_en/jewelry                            | PDP patterns surface sizing, service, delivery, and care reassurance without separating the CTA.     | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections    | Product detail keeps selection, delivery, returns, and care facts close to purchase confidence.      | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry/rings                       | PDP layouts keep size guide and product-care confidence available near the purchase decision.        | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/jewellery/rings                    | Product pages keep item facts and service support adjacent to purchase context.                      | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/              | Product detail exposes material, size guide, care/service, and add-to-bag context together.          | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/jewellery/categories/rings.html | Product shopping context keeps selected item facts and assistance near purchase controls.            | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html           | Product detail supports purchase decisions with service, sizing, delivery, and aftercare context.    | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. PDP care, warranty, size, and fit facts may be moved
  closer to the purchase decision when the change reuses existing product data,
  stays inside the current purchase-confidence area, and does not add a new
  content block before the CTA.

## Implementation Decision

Implement a narrow purchase-confidence pass:

- Keep gallery, product title, price, options, and primary CTA order unchanged.
- Keep size guidance inside the existing size/fit confidence pattern.
- Pass existing care and warranty data into the purchase panel.
- Append care and warranty facts to the existing service confidence item near
  the CTA.
- Do not add a new fact grid, accordion, hero section, exact public inventory
  count, or recommendation displacement.

## Acceptance Checks

- Size/fit guidance remains available before the purchase action.
- Care and warranty facts appear inside the existing purchase-confidence area.
- The detailed product commerce rows remain available below the buy area.
- The CTA and wishlist/save action keep their current order and visual weight.
- No new public commerce promise, support channel, or inventory precision is
  introduced.

## Verification

- `pnpm test -- src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/product-purchase-facts-placement.test.ts src/styles/service-trust-placement.test.ts`

## Residual Risk

This benchmark supports moving existing PDP facts into existing purchase
confidence only. Future changes that introduce new accordions, new service
promises, exact inventory counts, or layout changes above the CTA must run
through the public gate again.
