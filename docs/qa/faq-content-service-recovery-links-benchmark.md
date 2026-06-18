# FAQ and Content Service Recovery Links Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-027 FAQ and Content Route Service Recovery Links
- `Status`: Supported and implemented

## Scope

This benchmark covers `/faq`, `/terms`, `/privacy`, `/accessibility`, and
focused service recovery links for orders, privacy, accessibility, and general
questions.

## Gate Classification

- `Change Type`: Public content-route recovery.
- `Route Context`: FAQ, legal, privacy, and accessibility content routes.
- `Primary Lens`: Content/legal readability and service recovery guidance from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                     | Weight |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------ |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                    | FAQ and customer-care content route unresolved order, product, and service questions to client care. | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/faq                           | FAQ groups order, returns, account, care, privacy, and service recovery paths.                       | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html | Care/legal support pages connect sizing, maintenance, repair, and contact recovery.                  | 1.5    |
| Boucheron          | https://www.boucheron.com/us/faqs                           | FAQ separates account, orders, returns, and after-sales service with contact recovery.               | 1.5    |
| Chopard            | https://www.chopard.com/en-us/faq.html                      | FAQ explains shipping, returns, repairs, and customer-service escalation.                            | 1.5    |
| De Beers           | https://www.debeers.com/en-us/faqs.html                     | FAQ connects order support, returns, quality checks, privacy, and client services.                   | 1.5    |
| Cartier            | https://www.cartier.com/en-us/contact-us                    | Contact routes connect order, product, boutique, and service topics without crowding legal content.  | 1.5    |
| Piaget             | https://www.piaget.com/us-en/contact-us                     | Contact page routes inquiry topics to client-service recovery.                                       | 1.5    |
| Chaumet            | https://www.chaumet.com/us_en/contact-us                    | Contact/support content keeps assistance paths focused and task-first.                               | 1.5    |
| Graff              | https://www.graff.com/us-en/contact-us/                     | Contact route supports focused inquiries without adding unrelated content sections.                  | 1.5    |
| Buccellati         | https://www.buccellati.com/en_us/customer-service.html      | Customer-service content connects product, order, and after-sales questions to support.              | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. FAQ and legal/content routes may add compact recovery
  links to existing service topics when they preserve readable content density,
  use route-backed destinations, and do not add unsupported contact channels.

## Implementation Decision

Implement a narrow recovery-link pass:

- Add a general service recovery link to `/faq`.
- Add order-focused recovery from `/terms` to `/service?topic=order`.
- Add privacy/accessibility recovery from `/privacy` and `/accessibility` to
  `/service?topic=accessibility-privacy`.
- Keep existing phone and email contact cards unchanged.
- Do not add chat, WhatsApp, appointment booking, same-page anchor CTAs, or new
  content sections.

## Acceptance Checks

- Recovery links point to existing `/service` topic routes.
- Legal/privacy/accessibility content remains the primary content on the page.
- Existing mail and phone contact methods remain available.
- No unsupported service topic or contact channel is introduced.

## Verification

- `pnpm test -- src/styles/content-route-service-recovery.test.ts src/styles/service-trust-placement.test.ts src/styles/public-structure-enforcement.test.ts`

## Residual Risk

This benchmark supports compact recovery links only. Future changes that add
new legal flows, new service topics, live chat, WhatsApp, appointment booking,
or content-route layout changes must run through the public gate again.
