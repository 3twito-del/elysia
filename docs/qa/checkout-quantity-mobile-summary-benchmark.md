# Cart Quantity Recovery and Mobile Checkout Summary Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-039 Cart Quantity Recovery and Mobile Checkout Summary Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/checkout` quantity controls, cart mutation recovery,
offline cart update copy, mobile sticky checkout summary, and split local/Shopify
checkout source context.

## Gate Classification

- `Change Type`: Public checkout cart recovery and mobile summary clarity.
- `Route Context`: `/checkout`.
- `Primary Lens`: Checkout and payment guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/checkout-delivery-confidence-benchmark.md` and
  `docs/qa/checkout-validation-payment-confidence-benchmark.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the checkout support and payment-confidence corpus used for
I-008 and I-035.

| Site          | Evidence URL                                                                                 | Observed Pattern                                                                                    | Weight |
| ------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/faq/shipping-delivery/                                         | Checkout-adjacent help keeps delivery, tracking, and client support clear before order completion.  | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/faq/shipping-returns-faq/                                            | Checkout support groups shipping, returns, advisor help, and order recovery.                        | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/faq/shipping/what-shipping-options-are-available-on-bulgaricom | Delivery expectations are documented before checkout completion.                                    | 1.5    |
| Graff         | https://www.graff.com/us-en/checkout-login/                                                  | Bag/checkout context groups totals, delivery, payment, returns, and help close to checkout actions. | 1.5    |
| Chopard       | https://www.chopard.com/en-us/faq.html                                                       | Checkout help explains delivery, returns, tracking, gift options, and payment-adjacent support.     | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs?glCountry=US                                               | Order support and after-sales help are grouped in customer service content.                         | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                                                         | Commerce benefits expose contact, delivery, secure payment, and returns in the shopping flow.       | 1.5    |
| Messika       | https://www.messika.com/us_en/services-demand                                                | Service content combines delivery, returns, secure payment, packaging, and client assistance.       | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/shipping-and-returns                                   | Shipping and returns content explains order limits, tracking, delays, and recovery.                 | 1.5    |
| De Beers      | https://www.debeers.com/en-us/delivery-and-returns.html                                      | Delivery and return support keeps payment/order expectations separate from unsupported guarantees.  | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/                                                               | Public commerce service copy exposes delivery, returns, secure payment, packaging, and support.     | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Checkout may add clearer quantity recovery and mobile
  summary context when split checkout ownership stays explicit and no payment,
  inventory, fulfillment, or offline-checkout claims are added.

## Implementation Decision

Implement a narrow checkout recovery pass:

- Add compact quantity recovery copy near cart item controls.
- Add a source-aware mobile summary line for local, supplier-only, and mixed
  carts.
- Keep local submit and Shopify supplier handoff unchanged.
- Keep offline cart mutation copy limited to queued cart updates.
- Do not add payment-provider claims, delivery guarantees, or offline checkout
  completion promises.

## Acceptance Checks

- Quantity controls remain button-based and capped by the existing limits.
- Mutation/offline recovery copy is visible near the cart controls.
- Mobile summary distinguishes local and supplier items.
- Split checkout source boundaries remain explicit.

## Verification

- `pnpm test -- src/styles/checkout-quantity-mobile-summary.test.ts src/styles/checkout-validation-payment-confidence.test.ts src/app/checkout/_components/checkout-display.test.ts src/styles/pwa-offline-recovery.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports UI copy and placement only. Inventory reservation,
payment capture, Shopify paid checkout, and offline checkout completion remain
outside this item.
