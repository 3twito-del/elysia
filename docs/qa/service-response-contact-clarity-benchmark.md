# Service Response and Contact Clarity Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-026 Service Response Expectations and Contact Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/service`, visible contact methods, response
expectations, service-topic guidance, service request confirmation copy, and
recovery copy without adding unsupported contact channels.

## Gate Classification

- `Change Type`: Public service-contact clarity.
- `Route Context`: `/service`.
- `Primary Lens`: Service route guidance from
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                    | Weight |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                    | Client care groups contact methods, product help, order support, and response paths in one surface. | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/services                      | Service pages group contact, care, orders, appointments, and topic-specific guidance.               | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/contact-us--info.html         | Contact page keeps phone, email/message, and topic selection together with expectations.            | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html | Care and service content routes users to advisor contact and service topics without extra channels. | 1.5    |
| Boucheron          | https://www.boucheron.com/us/services                       | Services expose contact, sizing, appointment preparation, care, and after-sales paths compactly.    | 1.5    |
| Chopard            | https://www.chopard.com/en-us/faq.html                      | FAQ/service guidance explains order, returns, delivery, and customer-service recovery.              | 1.5    |
| De Beers           | https://www.debeers.com/en-us/faqs.html                     | Client services support contact, enquiries, delivery, returns, and care expectations.               | 1.5    |
| Cartier            | https://www.cartier.com/en-us/contact-us                    | Contact/service routes keep phone, email, boutique/service topics, and response context together.   | 1.5    |
| Piaget             | https://www.piaget.com/us-en/contact-us                     | Contact route groups topic selection, contact method, and client-service expectations.              | 1.5    |
| Chaumet            | https://www.chaumet.com/us_en/contact-us                    | Contact page keeps assistance routes and service expectations task-first.                           | 1.5    |
| Graff              | https://www.graff.com/us-en/contact-us/                     | Contact support presents inquiry context and response path without shifting to unrelated content.   | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. Service response and contact clarity may be
  strengthened when it stays compact, uses existing phone/email/form channels,
  and ties guidance to the selected topic rather than adding new contact
  promises.

## Implementation Decision

Implement a narrow service clarity pass:

- Add compact response expectation copy near the existing contact/service
  summary.
- Show the selected service topic description directly below the topic select.
- Update request success copy to confirm that Elysia will respond through the
  chosen contact preference.
- Keep phone, email, and the form as the only visible contact paths.
- Do not add WhatsApp, live chat, appointments, SLA timing, automation, or new
  provider-backed flows.

## Acceptance Checks

- Service users can see what happens after they choose a topic and submit.
- Topic guidance changes with the selected topic.
- Confirmation copy references the selected contact preference without
  guaranteeing a timing SLA.
- Existing validation, offline save, and attachment guidance remain intact.
- The service route remains compact and task-first.

## Verification

- `pnpm test -- src/styles/service-response-contact-clarity.test.ts src/styles/service-trust-placement.test.ts src/styles/service-attachment-ux.test.ts src/styles/form-error-recovery-contract.test.ts`

## Residual Risk

This benchmark supports clearer expectations only within existing service
channels. Future changes that add live chat, WhatsApp, appointment booking,
hard response-time SLAs, or a different service workflow must run through the
public gate again.
