# Checkout Delivery Confidence Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-008 Checkout Delivery Confidence Summary
- `Status`: Supported and implemented

## Scope

This benchmark covers `/checkout` delivery, fulfillment, local order, Shopify
supplier-only, mixed cart, and offline-adjacent recovery copy. It evaluates
whether checkout can show a compact delivery and fulfillment summary using only
currently supported data.

## Gate Classification

- `Change Type`: Public checkout commerce confidence.
- `Route Context`: Checkout.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Checkout, account, and service rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site          | Evidence URL                                                                                 | Observed Pattern                                                                                    | Weight |
| ------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/faq/shipping-delivery/                                         | Shipping timing, checkout estimates, exceptions, tracking, and client support are explained.        | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/faq/shipping-returns-faq/                                            | Shipping, tracking, returns, gift wrap, and advisor support are grouped as checkout help.           | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/faq/shipping/what-shipping-options-are-available-on-bulgaricom | Shipping options and checkout delivery expectations are available before order completion.          | 1.5    |
| Graff         | https://www.graff.com/us-en/checkout-login/                                                  | Shopping bag summarizes estimated shipping, secure delivery, returns, help, pickup, and payment.    | 1.5    |
| Chopard       | https://www.chopard.com/en-us/faq.html                                                       | FAQ explains complimentary delivery, gift options at checkout, returns, tracking, and signature.    | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs/shipping                                                   | Shipping FAQ explains delivery methods, timing, pickup, carrier handling, and support recovery.     | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                                                         | Commerce benefits list contact, delivery timing, secure payment, and returns/exchanges.             | 1.5    |
| Messika       | https://www.messika.com/us_en/services-demand                                                | Services combine delivery, returns, secure payment, gift packaging, and client assistance.          | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/shipping-and-returns                                   | Shipping and returns page explains delivery limits, signature, delays, tracking, and returns.       | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/                                                               | Public service copy exposes free shipping, free return, secure payment, packaging, and support.     | 1.5    |
| De Beers      | https://www.debeers.com/en-us/delivery-and-returns.html                                      | Delivery and returns page explains secure courier, signature, tracking, packaging, and support.     | 1.5    |
| Pomellato     | https://www.pomellato.com/us_en/shipping-and-returns                                         | Shipping and returns page explains processing, tracking, delivery timing, return labels, refund.    | 1.5    |
| Buccellati    | https://www.buccellati.com/en_us/faq                                                         | FAQ explains free shipping, alternate addresses, tracking, return authorization, and quality check. | 1.5    |

## Score

- `Supported Sites`: 13 of 15.
- `Weighted Score`: 19.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Checkout may show a compact delivery and fulfillment
  confidence summary when it is close to the order summary, source-aware, and
  does not imply one combined payment, exact supplier fulfillment, or a
  guaranteed delivery date.

## Implementation Decision

Implement a narrow checkout summary:

- Replace static local-only trust rows with dynamic source-aware rows.
- For local `OWN` items, summarize local approval, delivery address handling,
  and final verification before payment completion.
- For Shopify supplier items, state that payment, address, and delivery timing
  continue in Shopify Checkout.
- For mixed carts, keep local and supplier fulfillment separate and explicitly
  avoid a combined payment or delivery promise.
- Keep the primary local submit and Shopify checkout buttons unchanged.

## Acceptance Checks

- Local checkout shows delivery and verification confidence before submit.
- Supplier-only checkout shows delivery confidence without local delivery
  fields and without creating a local-order promise.
- Mixed checkout states the two fulfillment paths remain separate.
- Copy avoids exact public inventory counts, guaranteed delivery dates, and
  supplier fulfillment certainty while supplier confirmation remains blocked.

## Verification

- `pnpm test -- src/app/checkout/_components/checkout-display.test.ts src/styles/service-trust-placement.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports checkout copy and summary structure only. Real paid
Shopify checkout, supplier fulfillment confirmation, and CardCom production
credentials remain blocked in `docs/PROJECT_TASKS.md`.
