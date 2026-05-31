# Account Recovery and Service Shortcuts Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-009 Account Recovery and Service Shortcuts
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account`, `/account/orders/[id]`, `/service`, account
order recovery, return and exchange recovery, supplier-backed order support,
and privacy/service escalation.

## Gate Classification

- `Change Type`: Account and service recovery UX.
- `Route Context`: account and service.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Account, service, and commerce recovery guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                       | Weight |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| Cartier            | https://www.cartier.com/en-us/page-show?cid=faqHelp         | Account and order help connect logged-in orders, returns portal, cancellation limits, and client care. | 1.5    |
| Tiffany & Co.      | https://www.tiffany.com/customer-service                    | Client care groups orders, returns, jewelry service, contact, and repair/sizing recovery.              | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/faq                           | FAQ groups order information, returns and exchanges, contact, account, services, care, and warranty.   | 1.5    |
| Boucheron          | https://www.boucheron.com/us/faqs?glCountry=US              | FAQ separates client account, orders, returns, and after-sales service.                                | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/us/en/care-and-services.html | Care and service flow exposes sizing, maintenance, repair, customization, and concierge recovery.      | 1.5    |
| Chopard            | https://www.chopard.com/en-us/faq.html                      | FAQ connects online orders, return authorization, customer service, repairs, and service contact.      | 1.5    |
| De Beers           | https://www.debeers.com/en-us/delivery-and-returns.html     | Delivery and returns guidance requires order number plus Client Services for exchange/return help.     | 1.5    |
| Pomellato          | https://www.pomellato.com/us_en/shipping-and-returns        | Account order area and Orders/Returns paths support return or replacement requests.                    | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Account and order pages may add compact recovery
  shortcuts when they route to real service or privacy flows, keep protected
  account content task-first, and do not introduce unsupported account features.

## Implementation Decision

Implement a narrow recovery pass:

- Add compact account-level shortcuts for order help, returns, supplier-backed
  order help, and privacy/data actions.
- Add order-detail shortcuts that prefill the service form with the current
  order number and topic.
- Add supplier mirror service links because supplier orders are read-only in
  Elysia and need a support path instead of unsupported local actions.
- Let `/service` accept `topic`, `orderNumber`, `productReference`, and
  `message` query params so account links open the right recovery context.
- Keep existing account cards, privacy export route, local return form, and
  service request submission behavior unchanged.

## Acceptance Checks

- Recovery shortcuts are visible but do not replace account order cards,
  wishlist, saved sizes, addresses, privacy actions, or service forms.
- Service links preselect a valid topic and optional order number.
- Shopify mirror orders remain read-only and route customers to service instead
  of local fulfillment/payment actions.
- Privacy shortcut routes to existing privacy actions.
- No new runtime schema, database, API response shape, or auth boundary is
  introduced.

## Verification

- `pnpm test -- src/app/account/_lib/account-recovery.test.ts src/styles/account-recovery-shortcuts.test.ts src/app/account/privacy/export/route.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- Browser smoke for `/account` logged-out state and `/service?topic=order`.

## Residual Risk

The benchmark supports compact recovery shortcuts and service prefill only. Any
future customer order timeline, supplier fulfillment workflow, return portal, or
live account automation must run through the gate or the relevant provider
readiness checks.
