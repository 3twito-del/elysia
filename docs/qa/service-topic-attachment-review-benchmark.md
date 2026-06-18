# Service Request Topic Routing and Attachment Review Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-040 Service Request Topic Routing and Attachment Review Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/service` topic selection, account/order prefilled
service links, selected-topic routing copy, attachment count review, attachment
constraints, and offline queued service requests.

## Gate Classification

- `Change Type`: Public service request recovery and support-routing clarity.
- `Route Context`: `/service`.
- `Primary Lens`: Service, account, and public form guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/service-response-contact-clarity-benchmark.md` and
  existing attachment UX tests.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the customer service evidence used for service response and
account recovery decisions.

| Site          | Evidence URL                                     | Observed Pattern                                                                                 | Weight |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------ |
| Cartier       | https://www.cartier.com/en-us/contact-us/        | Customer support routes customers through contact and service categories without extra channels. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/customer-service/        | Service support groups product care, order, and customer help in supported flows.                | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/contact-us         | Contact/service pages route support through explicit topics and supported contact paths.         | 1.5    |
| Graff         | https://www.graff.com/us-en/customer-service/    | Customer service content keeps order and product help inside official support routes.            | 1.5    |
| Chopard       | https://www.chopard.com/en-us/contact-us         | Support pages present service routing without hard SLA promises in the shopping surface.         | 1.5    |
| Boucheron     | https://www.boucheron.com/us/faqs?glCountry=US   | FAQ/customer service content groups order, care, after-sales, and contact recovery.              | 1.5    |
| Piaget        | https://www.piaget.com/us-en/contact-us          | Contact flows keep topic and customer help structured around supported service channels.         | 1.5    |
| Messika       | https://www.messika.com/us_en/contact            | Contact support centralizes service topics and customer assistance.                              | 1.5    |
| De Beers      | https://www.debeers.com/en-us/contact-us         | Client service keeps product/order support routed through official contact flows.                | 1.5    |
| Mikimoto      | https://www.mikimotoamerica.com/us_en/contact-us | Contact support routes customers through official service help and avoids unsupported channels.  | 1.5    |
| Chaumet       | https://www.chaumet.com/us_en/contact-us         | Customer service/contact routes keep questions and product help structured.                      | 1.5    |

## Score

- `Supported Sites`: 11 of 15.
- `Weighted Score`: 16.5.
- `Threshold`: 11.25.
- `Decision`: Supported. The service form may add selected-topic routing and
  attachment review copy when it uses existing topics, existing validation, and
  existing online/offline submission behavior only.

## Implementation Decision

Implement a narrow service-form clarity pass:

- Add selected-topic routing review inside the existing service form.
- Show attachment count review after file selection.
- Keep attachment type and size constraints unchanged.
- Keep offline service request copy limited to queued submission.
- Do not add new support channels, hard response-time promises, or admin-only
  data to the public form.

## Acceptance Checks

- Selected-topic review follows the current topic select value.
- Attachment review reflects selected file count without bypassing validation.
- Account/order default topic links continue to preselect existing topics.
- Online and offline submission paths remain unchanged.

## Verification

- `pnpm test -- src/styles/service-topic-attachment-review.test.ts src/styles/service-response-contact-clarity.test.ts src/styles/service-attachment-ux.test.ts src/styles/account-recovery-shortcuts.test.ts src/styles/offline-sync-response-contract.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports routing and review copy only. New support channels,
SLA commitments, attachment storage changes, or admin assignment workflows need
separate review.
