# Account Dashboard Privacy Shortcut Clarity Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-036 Account Dashboard Data Recovery and Privacy Shortcut Clarity
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account` recovery shortcuts, protected dashboard empty
states, privacy export, privacy deletion, and service recovery links for account
and order support.

## Gate Classification

- `Change Type`: Protected account recovery and privacy action clarity.
- `Route Context`: `/account`.
- `Primary Lens`: Account, privacy, service, and auth-boundary guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/account-recovery-service-shortcuts-benchmark.md`.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

This item builds on the account/service evidence recorded in
`docs/qa/account-recovery-service-shortcuts-benchmark.md` and the privacy
control expectations already enforced by repository tests.

| Site          | Evidence URL                                  | Observed Pattern                                                                                    | Weight |
| ------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/contact-us/     | Account and service recovery route users to supported contact and protected account flows.          | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/customer-service/     | Customer service groups order, account, privacy, and contact recovery without exposing data.        | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/contact-us      | Service and privacy support are presented through supported contact/account routes.                 | 1.5    |
| Graff         | https://www.graff.com/us-en/customer-service/ | Account and order support is grouped through customer service and protected customer actions.       | 1.5    |
| Chopard       | https://www.chopard.com/en-us/contact-us      | Customer service provides account, order, and privacy-adjacent support without self-service claims. | 1.5    |
| Boucheron     | https://www.boucheron.com/us/contact-us       | Account help and privacy support route through clear service/contact destinations.                  | 1.5    |
| Piaget        | https://www.piaget.com/us-en/contact-us       | Service routes keep account and privacy support structured and protected.                           | 1.5    |
| Messika       | https://www.messika.com/us_en/contact         | Support flows centralize order and account help while keeping sensitive actions explicit.           | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The account dashboard may clarify privacy shortcuts
  and data actions when the grouping stays inside protected account UI and uses
  existing supported export/delete/service routes only.

## Implementation Decision

Implement a narrow account privacy clarity pass:

- Keep the existing account recovery shortcut rail and `#account-privacy`
  anchor.
- Add concise context above privacy actions explaining export, deletion, and
  service recovery.
- Keep export and deletion as the only direct privacy actions.
- Do not expose protected data in the shortcut rail.
- Do not add unsupported self-service account/order actions.

## Acceptance Checks

- Privacy shortcut remains anchored to `#account-privacy`.
- Privacy action context appears inside the protected account privacy card.
- Export and deletion remain explicit and separate.
- Service links remain routed through existing supported flows only.

## Verification

- `pnpm test -- src/styles/account-dashboard-privacy-shortcut-clarity.test.ts src/styles/account-recovery-shortcuts.test.ts src/styles/cookie-privacy-controls-contract.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports copy and grouping only. Any new privacy workflow,
identity challenge, data preview, or order/account mutation must be benchmarked
and verified against auth and privacy boundaries separately.
