# Design Failure Audit

**Gate: inactive.**

**Policy: every failure or group of failures that can be handled well in one prompt must be presented for user approval first. After approval or rejection, update the status, implement or skip only that group, verify it, and then move to the next group. No other project change is allowed until every design finding is either verified or rejected.**

Baseline commit: `8cbd142`  
Audit date: `2026-05-12`  
Gate config: `docs/qa/design-gate.json`  
Gate command: `pnpm design:gate`

## Coverage

- Viewports: mobile `390x844`, tablet `768x1024`, desktop `1366x768`, wide `1920x1080`.
- Public routes: home, search, no-results search, all catalog categories, product detail, checkout, account, gifts, branches, AI, stylist, about, FAQ, privacy, terms, accessibility, and admin login.
- Interactive states: mobile navigation sheet, category filter sheet, accessibility widget, and cookie/consent surface where locally visible.
- Authenticated admin routes: overview, orders, catalog, inventory, customers, appointments, integrations, and audit.
- Evidence output: `.codex-logs/design-audit/` local screenshots and raw JSON, intentionally not committed.

## Findings

| ID    | Severity | Route / viewport                                                                                  | Failure or suspected failure                                                                                                                                                                                                        | Evidence                                                                                                                                                                                                                          | Approval group                   | Status   |
| ----- | -------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | -------- |
| D-001 | High     | `/search`, `/ai`, `/stylist`, `/product/venus-line-ring`, `/category/earrings`; mobile and tablet | Floating accessibility/search chrome overlaps real content after the hero. It covers the search submit area, section headings, and product-card media, making normal reading and tapping feel unreliable.                           | Original: `.codex-logs/design-audit/route-search-mobile.png`, `route-ai-mobile.png`, `route-stylist-mobile.png`, `route-product-venus-line-ring-mobile.png`, `route-category-earrings-tablet.png`. Verified: `.codex-logs/g-01/`. | G-01 floating chrome containment | verified |
| D-002 | Medium   | mobile navigation and category filter sheets                                                      | Floating controls remain visible above or beside sheet backdrops. The underlying accessibility/search controls compete visually with the active modal surface and may remain clickable depending on stack order.                    | Original: `.codex-logs/design-audit/mobile-nav-root-mobile.png`, `category-filter-sheet-category-earrings-mobile.png`, `accessibility-widget-root-mobile.png`. Verified: `.codex-logs/g-01/`.                                     | G-01 floating chrome containment | verified |
| D-003 | Medium   | authenticated admin shell; mobile                                                                 | Admin mobile navigation exposes only the first operational sections in the viewport and relies on horizontal scrolling without a clear affordance. Customers, appointments, integrations, and audit can look absent to an operator. | `.codex-logs/design-audit/admin-auth-admin-orders-mobile.png`. Verified: `.codex-logs/g-02/`.                                                                                                                                     | G-02 admin mobile navigation     | verified |

## Proposed Approval Groups

| Group                            | Findings     | Recommended one-prompt scope                                                                                                                                                                                                                                                      | Status   |
| -------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| G-01 floating chrome containment | D-001, D-002 | Unify floating controls into one collision-aware mobile stack, reserve bottom/side spacing where needed, and lower or hide floating controls while sheets/dialogs are open. Verify search, AI, stylist, product, category, mobile nav, category filter, and accessibility widget. | verified |
| G-02 admin mobile navigation     | D-003        | Replace the horizontal-only admin nav with a clearer mobile pattern: wrapped segmented grid or sheet/dropdown with all sections visible and an active state. Verify every authenticated admin route on mobile and desktop.                                                        | verified |

## Status Rules

- `pending-approval`: documented and waiting for explicit user approval or rejection.
- `approved`: approved by the user and ready for implementation.
- `rejected`: intentionally not implemented.
- `implemented`: code changes are in place, but verification is not complete.
- `verified`: implementation passed the relevant checks and screenshots.

## Verification Log

- `2026-05-12` - `G-01 floating chrome containment` approved by the user and implemented. Verified with `pnpm check`, plus browser checks at mobile `390x844` and tablet `768x1024` for `/search`, `/ai`, `/stylist`, `/product/venus-line-ring`, `/category/earrings`, mobile navigation sheet, category filter sheet, and cookie banner state. Screenshots are stored locally under `.codex-logs/g-01/`.
- `2026-05-13` - `G-02 admin mobile navigation` approved by the user and implemented. Verified with `pnpm design:gate`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `prettier --check` for the touched files, agent-browser load/error checks for `/admin/login`, the existing authenticated admin-shell Playwright e2e, and authenticated browser checks at mobile `390x844` and desktop `1366x768` for `/admin`, `/admin/orders`, `/admin/catalog`, `/admin/inventory`, `/admin/customers`, `/admin/appointments`, `/admin/integrations`, and `/admin/audit`. Screenshots are stored locally under `.codex-logs/g-02/`.

## Completion Rule

The gate can be disabled only after every row in `Findings` is `verified` or `rejected`. When complete, set `active` to `false` in `docs/qa/design-gate.json` and remove the `design:gate` step from `pnpm verify` unless the user chooses to keep it as an inactive documentation check.
