# Tiffany Plus Visual QA - Mobile First

- `Status`: Implemented
- `Date`: 2026-06-10
- `Scope`: Home, Category, Search, Product, Checkout, Wishlist, Service
- `Mobile viewport`: 390x844
- `Desktop viewport`: 1440x900

## Checks

- Pages load without a Next.js error overlay.
- Primary commerce controls are visible without horizontal overflow.
- Product cards keep image, name, material cues, decision facts, price, wishlist, and quick action stable.
- Search view controls expose one active state and keep grid/list visually distinct.
- Checkout readiness, payment confidence, legal agreement, and action area remain in order.
- Footer trust layer is present on all public pages through `RootLayout`.
- No legacy aqua/turquoise UI colors are reintroduced.

## Browser Smoke Routes

- `/`
- `/category/necklaces`
- `/search?view=list`
- `/product/selene-chain`
- `/checkout`
- `/wishlist`
- `/service`

## Evidence Target

The implementation is considered complete when static guardrails pass, `pnpm build` passes, and browser smoke confirms no overflow or incoherent overlap on the mobile viewport.
