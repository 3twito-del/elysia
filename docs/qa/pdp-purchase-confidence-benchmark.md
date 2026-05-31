# PDP Purchase Confidence Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-008 PDP Purchase Confidence Pass
- `Status`: Supported and implemented

## Scope

This benchmark covers the public product detail route `/product/[slug]`,
including gallery, purchase panel, selected variant state, size guidance,
source-specific checkout expectations, delivery and return copy, service entry,
and recommendation placement.

## Gate Classification

- `Change Type`: Public PDP commerce confidence.
- `Route Context`: PDP.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Product detail and purchase-confidence rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                                                  | Observed Pattern                                                                                          | Weight |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/faq/shipping-delivery/                                          | Shipping timing, exceptions, order tracking, Client Relations support, returns, and exchanges are clear.  | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/rings/return-to-tiffany-sterling-silver-rings-1152181305.html | PDP exposes size guide, selected size, availability, add-to-cart, advisor contact, and store lookup.      | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/323537.html                                                     | PDP keeps size, customization return limits, delivery delay note, add-to-bag, gift, contact, and store.   | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs/shipping                                                    | Shipping and return guidance points to delivery options, carrier handling, and client service recovery.   | 1.5    |
| Messika       | https://www.messika.com/us_en/our-messika-services                                            | Services page combines deliveries, returns, secure payments, after-sales repair, gift packaging, support. | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                                                          | Jewelry commerce benefits include contact, delivery timing, secure payment, returns, exchanges, sizing.   | 1.5    |
| De Beers      | https://www.debeers.com/en-us/faqs.html                                                       | FAQ supports secure payment, product-page resizing advice, 30-day exchange/return, and client services.   | 1.5    |
| Pomellato     | https://www.pomellato.com/us_en/catene-ring-pac3010-o7000-00000                               | PDP exposes size guide, add-to-cart, boutique/appointment options, care, shipping, exchange, and payment. | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The PDP can add compact confidence copy near the
  purchase action when it clarifies selected variant state, size support,
  source-specific checkout expectations, and delivery/return handling without
  replacing product facts or adding exact public inventory counts.

## Implementation Decision

Implement a narrow PDP purchase-confidence pass:

- Keep gallery and purchase panel as the first-screen focus.
- Keep the primary CTA and wishlist action unchanged.
- Replace generic static trust copy with source-aware confidence rows generated
  from selected variant, product source, size kind, delivery promise, and return
  policy.
- Make supplier-backed products explicit about completing payment and delivery
  in the supplier checkout.
- Keep exact public inventory counts out of copy and tests.
- Keep service rows and recommendation rails below the purchase context.

## Acceptance Checks

- Confidence copy appears near the purchase CTA and before lower-page service
  content.
- Shopify supplier products explain supplier checkout expectations.
- Owned products explain verification before completion without public stock
  precision.
- Size guidance remains tied to size-aware categories.
- Delivery and return text uses product commerce data when available.
- The purchase panel remains task-first and does not add a marketing section.

## Verification

- `pnpm test -- src/app/product/[slug]/_components/product-purchase-utils.test.ts src/styles/service-trust-placement.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Visual smoke for an owned PDP and the Shopify fixture PDP.

## Residual Risk

The benchmark supports compact confidence rows, not a broad PDP redesign. Any
future change to first-screen hierarchy, gallery placement, product facts,
exact inventory visibility, or recommendation order must run through the public
gate again.
