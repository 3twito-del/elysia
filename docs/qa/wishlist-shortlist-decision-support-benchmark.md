# Wishlist Shortlist Decision Support Benchmark

- `Date`: 2026-05-31
- `Backlog Item`: I-006 Wishlist and Shortlist Decision Support
- `Status`: Supported and implemented

## Scope

This benchmark covers `/account`, saved wishlist review, saved product
decision cues, category continuation, sizing help, and service escalation from
saved pieces.

## Gate Classification

- `Change Type`: Account wishlist UX and public commerce decision support.
- `Route Context`: account.
- `Primary Lens`: High Jewelry Reference Gate in
  `docs/PUBLIC_CHANGE_GATE.md`.
- `Secondary Lens`: Account, wishlist, PLP, PDP, and service guidance in
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25`.

## Benchmark Evidence

| Site               | Evidence URL                                                | Observed Pattern                                                                                  | Weight |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| Cartier            | https://www.cartier.com/en-us/wishlist                      | Wishlist is an account-adjacent saved-selection area, with anonymous state expiring by session.   | 1.5    |
| Bulgari            | https://www.bulgari.com/en-us/account/wishlist              | Account navigation groups overview, order history, wishlist, profile, and Maison content.         | 1.5    |
| Boucheron          | https://www.boucheron.com/us/faqs/your-client-account       | Account FAQ supports saved-item lists, list creation, sharing, orders, addresses, and service.    | 1.5    |
| Van Cleef & Arpels | https://www.vancleefarpels.com/dk/en/secure/my-account.html | Account groups online orders, service tracking, Maison/contact paths, and wishlist.               | 1.5    |
| De Beers           | https://www.debeers.com/en-us/faqs.html?tabID=your-account  | Account benefits include order history, wishlist/favourites, contact details, and sharing.        | 1.5    |
| Piaget             | https://www.piaget.com/us-en/faq                            | Account FAQ links order following, wishlist review/editing, addresses, and client relations help. | 1.5    |
| Graff              | https://www.graff.com/us-en/login/                          | Login/register screen connects account access, order checking, contact help, and wishlist.        | 1.5    |
| Buccellati         | https://www.buccellati.com/en_us/wishlist                   | Wishlist login page frames saved favourites and real-time order monitoring as account benefits.   | 1.5    |

## Score

- `Supported Sites`: 8 of 15.
- `Weighted Score`: 12.0.
- `Threshold`: 11.25.
- `Decision`: Supported. The account wishlist may add compact shortlist
  interpretation and next-step links when the feature remains informational,
  routes to real category/search, sizing, or service destinations, and does not
  become a checkout prompt or product-card density increase.

## Implementation Decision

Implement a narrow account-wishlist pass:

- Add saved-item cues for category concentration, material/stone direction, and
  variant or sizing review.
- Add category continuation, size-guide, and service-prefill links above the
  saved item list.
- Keep the saved item list, product links, and remove action unchanged.
- Do not add add-to-cart, checkout, urgency, price comparison, or product-card
  highlights.

## Acceptance Checks

- Wishlist decision support appears only when there are saved items.
- Support remains above the saved-item rows and does not replace item-level
  product links or remove controls.
- Links route to `/category/[slug]` or `/search`, `/size-guide`, and `/service`
  with `topic=sizing`.
- No `/checkout` link or add-to-cart action is introduced.
- Product cards and cart behavior remain unchanged.

## Verification

- `pnpm test -- src/app/account/_lib/wishlist-shortlist.test.ts src/styles/account-wishlist-decision-support.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke for `/account` logged-out state.

## Residual Risk

The benchmark supports compact account-level shortlist help only. A dedicated
wishlist route, visual comparison table, item ranking, cart conversion module,
or supplier-aware availability promise still requires a separate benchmark and
provider-readiness review.
