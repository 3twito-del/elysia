# Offline Page Install and PWA Recovery Priority Benchmark

- `Date`: 2026-06-01
- `Backlog Item`: I-037 Offline Page Install and PWA Recovery Priority
- `Status`: Supported and implemented

## Scope

This benchmark covers `/offline`, manifest shortcuts, install-context copy,
cached public route prioritization, retry behavior, and the boundary between
offline browsing and online-only checkout/payment completion.

## Gate Classification

- `Change Type`: PWA reliability and offline recovery clarity.
- `Route Context`: `/offline` and `src/app/manifest.ts`.
- `Primary Lens`: PWA, reliability, and public route rules in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Secondary Lens`: `docs/qa/production-deployment-evidence-ledger.md` and
  existing PWA route tests.
- `Required Gate`: `docs/PUBLIC_CHANGE_GATE.md`; high-jewelry gate threshold is
  `11.25`.

## Benchmark Evidence

High-jewelry references generally prioritize realistic recovery over offline
commerce promises: product discovery, sizing/help, support, and retry paths are
safe; checkout/payment completion remains online-only.

| Site          | Evidence URL                                                  | Observed Pattern                                                                                         | Weight |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ |
| Cartier       | https://www.cartier.com/en-us/jewelry/                        | Product discovery and service routes remain the primary safe recovery paths when commerce cannot finish. | 1.5    |
| Tiffany & Co. | https://www.tiffany.com/jewelry/                              | Discovery, service, and sizing/help paths are more appropriate than offline payment promises.            | 1.5    |
| Bulgari       | https://www.bulgari.com/en-us/jewelry                         | Jewelry browsing and service guidance are route-backed recovery paths; checkout requires live handling.  | 1.5    |
| Graff         | https://www.graff.com/us-en/jewellery-collections.html        | Product discovery and client service are safe continuations when a transaction cannot proceed.           | 1.5    |
| Chopard       | https://www.chopard.com/en-us/jewellery-jewellery-collections | Collection browsing and service information are prioritized before commerce completion.                  | 1.5    |
| Boucheron     | https://www.boucheron.com/us/jewelry/all-jewelry.html         | Listing discovery and help paths remain public, route-backed continuations.                              | 1.5    |
| Piaget        | https://www.piaget.com/us-en/jewelry                          | Product discovery, sizing/contact support, and retry are safe reliability continuations.                 | 1.5    |
| De Beers      | https://www.debeers.com/en-us/fine-jewellery/rings/           | Product discovery and delivery/support content are appropriate before live checkout resumes.             | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. Offline recovery may prioritize cached product
  discovery, gifts, sizing, service, and retry when it clearly states checkout,
  account, and payment completion require a restored connection.

## Implementation Decision

Implement a narrow PWA recovery pass:

- Add install-context copy that explains cached pages and installed-app behavior
  without promising full offline commerce.
- Prioritize recovery actions as discovery, gifts, sizing, service, then retry.
- Align manifest shortcut order with the same recovery priority.
- Keep service request sync copy realistic.
- Do not promise offline checkout, offline account mutation, or offline
  payment completion.

## Acceptance Checks

- Offline page states that install/cache can help reopen recently loaded public
  pages.
- Recovery actions prefer public discovery and sizing/service before retry.
- Manifest shortcuts use route-backed public URLs and avoid checkout.
- Checkout/payment/account completion remains explicitly online-only.

## Verification

- `pnpm test -- src/styles/offline-page-install-pwa-recovery-priority.test.ts src/styles/pwa-offline-recovery.test.ts src/app/manifest.test.ts src/app/serwist-route.test.ts`
- `pnpm typecheck`

## Residual Risk

This benchmark supports offline recovery copy, route order, and manifest
shortcut order only. Changes to service worker caching strategy, background
sync, install prompt mechanics, or offline checkout/payment behavior need
separate reliability verification.
