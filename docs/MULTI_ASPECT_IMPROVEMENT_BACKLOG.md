# Multi-Aspect Improvement Backlog

Status: active cross-product improvement tracker.

Last reviewed: 2026-06-01.

This document tracks practical Elysia improvements across product, commerce,
operations, reliability, accessibility, privacy, security, QA, and release
readiness. It complements, but does not replace:

- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/PUBLIC_CHANGE_GATE.md`
- `docs/ENGINEERING_CONVENTIONS.md`
- `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`

Use this backlog to choose work that is safe to start, to separate candidate
ideas from benchmark-approved work, and to keep external blockers explicit.
Update it when an item is started, completed, superseded, blocked, or unblocked.

## Item Schema

Every backlog item must include:

- `ID`
- `Aspect`
- `Status`
- `Priority`
- `Effort`
- `Source/Evidence`
- `Target Surface`
- `Improvement`
- `Acceptance Checks`
- `Verification`

Blocked items must also state the blocker and the exact unblock condition inside
the `Improvement` field.

Allowed statuses:

- `Actionable Now`
- `Needs Benchmark`
- `Blocked`
- `Deferred`

Allowed aspects:

- Public UX and Brand
- Commerce and Checkout
- Admin and Operations
- Backend, API, and Data
- Performance, PWA, and Reliability
- Accessibility, Privacy, and Security
- QA, Release, and Observability

Priority scale:

- `P0`: release-critical or data/payment/security correctness.
- `P1`: important product quality or operational confidence.
- `P2`: useful polish, evidence quality, or resilience improvement.

Effort scale:

- `S`: documentation, small audit, or narrow test.
- `M`: one focused subsystem or cross-route review.
- `L`: multi-subsystem work, provider coordination, or live rollout validation.

## Actionable Now

Deep review basis: `docs/FULL_PRODUCT_BENCHMARK.md`,
`docs/PUBLIC_CHANGE_GATE.md`, `scripts/qa-route-inventory.ts`,
`scripts/qa-site-audit.ts`, `docs/qa/*`, `src/app`, `src/components`,
`src/lib`, and `src/server`.

Completed items are intentionally removed from this active backlog. The
following 100 items are visible user-facing site improvements. For every item,
`Target Surface` states where a shopper sees the work, and `Improvement` states
how the change becomes visible in the interface. Public-facing implementation
work must still follow `docs/PUBLIC_CHANGE_GATE.md` before product code changes.

| ID    | Aspect                               | Status         | Priority | Effort | Source/Evidence                                                                                | Target Surface                   | Improvement                                                                                                         | Acceptance Checks                                                                 | Verification                             |
| ----- | ------------------------------------ | -------------- | -------- | ------ | ---------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------- |
| I-302 | Public UX and Brand                  | Actionable Now | P1       | M      | `src/app/page.tsx`                                                                             | Home hero CTA row                | Visible as two stable buttons: shop collection and get styling help, with no wrapping or overlap on narrow screens. | Primary and secondary CTAs remain distinct and tappable.                          | Browser smoke on `/` mobile and desktop. |
| I-304 | Public UX and Brand                  | Actionable Now | P1       | M      | `src/components/cinematic-hero-sequence.tsx`, `public/brand/v2`                                | Home hero fallback               | Visible as a branded still image and readable headline if cinematic media fails to load.                            | First viewport never becomes blank or text-only.                                  | Image failure smoke on `/`.              |
| I-307 | Public UX and Brand                  | Actionable Now | P2       | M      | `src/app/page.tsx`, `src/components/product-rail.tsx`                                          | Home product rails               | Visible as tab-like rail labels for new arrivals, gifts, and best sellers.                                          | Active rail label is obvious and product cards remain stable while switching.     | Component test plus browser smoke.       |
| I-309 | Performance, PWA, and Reliability    | Actionable Now | P2       | S      | `src/components/product-card.tsx`, `src/styles/globals.css`                                    | Home image loading               | Visible as stable skeleton blocks that match product-card image ratios before images appear.                        | No layout jump when product images load slowly.                                   | Mobile layout smoke.                     |
| I-310 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/app/page.tsx`, `src/styles/globals.css`                                                   | Home mobile hero text            | Visible as a two-line headline and short support line that never clips on 360px width.                              | Text remains readable and CTA row stays visible.                                  | 360px viewport smoke.                    |
| I-311 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/site-header.tsx`                                                               | Desktop header nav               | Visible as a restrained active underline on the current category or page.                                           | Active state appears once and follows route changes.                              | Header source test.                      |
| I-312 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/site-header.tsx`                                                               | Header search action             | Visible as a hover or focus tooltip naming search before the icon is clicked.                                       | Tooltip is keyboard reachable and does not cover adjacent icons.                  | Accessibility smoke.                     |
| I-313 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/components/cart-count-link.tsx`                                                           | Header cart icon                 | Visible as a distinct empty cart state and a numbered filled state.                                                 | Count badge is readable and does not shift header layout.                         | Component source test.                   |
| I-314 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/site-header.tsx`                                                               | Header service action            | Visible as a clearer service label or tooltip that differentiates help from branch information.                     | Service and branches are not both labeled the same.                               | Copy check and visual smoke.             |
| I-315 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/site-header.tsx`, `src/styles/globals.css`                                     | Sticky header                    | Visible as a smooth but non-distracting solid background after scroll.                                              | Header links remain legible over hero and page content.                           | Scroll smoke on `/`.                     |
| I-316 | Public UX and Brand                  | Actionable Now | P1       | M      | `src/components/mobile-nav.tsx`                                                                | Mobile navigation sheet          | Visible as grouped sections for quick actions, featured paths, collection, and service.                             | No route appears twice unless the duplicate is intentionally labeled differently. | Mobile nav source test.                  |
| I-317 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/mobile-nav.tsx`                                                                | Mobile nav active route          | Visible as a single active row treatment inside the open menu.                                                      | Current page state is obvious without relying only on color.                      | Accessibility guardrail.                 |
| I-318 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/components/mobile-nav.tsx`, `src/lib/recently-viewed.ts`                                  | Mobile nav commerce shortcut     | Visible as a recently viewed shortcut when the shopper has viewed products.                                         | Shortcut is hidden when empty and links to real product context.                  | Storage and route smoke.                 |
| I-319 | Accessibility, Privacy, and Security | Actionable Now | P1       | S      | `src/components/mobile-nav.tsx`, `src/components/ui/sheet.tsx`                                 | Mobile nav close control         | Visible as a close button that stays reachable while the sheet scrolls.                                             | Close target remains visible and focus returns to the menu trigger.               | Keyboard smoke.                          |
| I-320 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/site-footer.tsx`                                                               | Footer navigation groups         | Visible as clear headings for collection, service and order, information, and policy.                               | Labels are unique and routes are not ambiguous.                                   | Footer source test.                      |
| I-321 | Public UX and Brand                  | Actionable Now | P2       | M      | `src/components/newsletter-form.tsx`, `src/components/site-footer.tsx`                         | Footer newsletter                | Visible as an inline success or already-subscribed message after submission.                                        | Form state is readable without moving focus unexpectedly.                         | Form component test.                     |
| I-322 | Accessibility, Privacy, and Security | Actionable Now | P2       | S      | `src/components/site-footer.tsx`, `src/styles/globals.css`                                     | Footer legal links               | Visible as larger tap targets for terms, privacy, and accessibility links.                                          | Links meet mobile tap-size expectations and do not wrap awkwardly.                | Mobile visual smoke.                     |
| I-323 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/site-footer.tsx`                                                               | Footer social links              | Visible as named icon tooltips for Instagram and TikTok.                                                            | Tooltip text matches the social destination.                                      | Accessibility source test.               |
| I-324 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/app/category/[slug]/page.tsx`                                                             | Category page top area           | Visible as a compact breadcrumb above the category title.                                                           | Breadcrumb links back to home or collection without crowding filters.             | Category route smoke.                    |
| I-325 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/category/[slug]/page.tsx`, `src/app/category/[slug]/_components`                      | Category filters                 | Visible as active filter chips near the result count.                                                               | Chips can be removed one at a time and reset state is obvious.                    | Category filter tests.                   |
| I-326 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/category/[slug]/page.tsx`                                                             | Category result count            | Visible as an updating count that reflects current filters and search params.                                       | Count never contradicts the visible grid.                                         | Route state test.                        |
| I-327 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/category/[slug]/page.tsx`                                                             | Category sort control            | Visible as the selected sort label in the closed select trigger.                                                    | Invalid sort falls back to a visible default.                                     | Search/category state tests.             |
| I-328 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/components/product-card.tsx`                                                              | Product cards in category grids  | Visible as sale, source, and availability badges with a clear hierarchy.                                            | Badges do not cover product faces, title, or price.                               | Product-card overlay test.               |
| I-329 | Public UX and Brand                  | Actionable Now | P2       | M      | `src/app/category/[slug]/page.tsx`, `src/components/ui/empty-state.tsx`                        | Category empty state             | Visible as suggested categories and a reset filters button when no products match.                                  | Empty state has at least two real recovery paths.                                 | Category no-results smoke.               |
| I-330 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/category/[slug]/page.tsx`                                                             | Category pagination or load more | Visible as a loading state on the next-page control.                                                                | Button cannot be double-triggered and current grid remains stable.                | Browser interaction smoke.               |
| I-331 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/category/[slug]/_components`                                                          | Mobile filter sheet              | Visible as a sheet header summarizing active filters and result count.                                              | Applying filters closes or updates the sheet predictably.                         | Mobile category smoke.                   |
| I-332 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/category/[slug]/page.tsx`, `src/components/product-card.tsx`                          | Product material cues            | Visible as small material or color swatches on product cards where data exists.                                     | Swatches are labeled for screen readers and do not replace product names.         | Accessibility and visual smoke.          |
| I-333 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/category/[slug]/_components`                                                          | Price filter                     | Visible as min and max labels beside the price control.                                                             | Hebrew currency formatting stays correct in RTL layout.                           | Format and route tests.                  |
| I-334 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/app/category/[slug]/page.tsx`                                                             | Category editorial content       | Visible as a collapsed care or style note below the product grid.                                                   | Product grid stays the main first-screen content.                                 | Visual smoke.                            |
| I-337 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/search/page.tsx`, `src/lib/search-history.ts`                                         | Search history                   | Visible as recent queries below the search input for returning shoppers.                                            | Local history is capped and can be cleared.                                       | Storage test.                            |
| I-338 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/search/page.tsx`                                                                      | Search active filters            | Visible as a compact active-filter bar above results.                                                               | Filter chips mirror URL params and reset cleanly.                                 | Search state test.                       |
| I-340 | Performance, PWA, and Reliability    | Actionable Now | P2       | S      | `src/app/search/page.tsx`, `src/components/product-card.tsx`                                   | Search loading state             | Visible as product-card skeletons while search results resolve.                                                     | Skeleton count roughly matches the final grid and prevents layout shift.          | Visual smoke.                            |
| I-345 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/gifts/page.tsx`, `src/components/product-card.tsx`                                    | Gift bundles                     | Visible as paired product recommendations when gift data supports a set.                                            | Bundle card shows combined context without pretending to be a single SKU.         | Visual and data smoke.                   |
| I-346 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/gifts/page.tsx`                                                                       | Gift under-budget callout        | Visible as a small under-budget note on matching products.                                                          | Callout appears only when price data supports it.                                 | Product-card test.                       |
| I-347 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/app/gifts/page.tsx`, `src/components/ui/empty-state.tsx`                                  | Gifts empty state                | Visible as a return-to-all-gifts button when filters remove all products.                                           | Empty state never dead-ends.                                                      | Gifts no-results smoke.                  |
| I-348 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/app/product/[slug]/_components/product-gallery.tsx`                                       | Product gallery thumbnails       | Visible as a clear active border or underline on the selected thumbnail.                                            | Active state is visible without color alone.                                      | Gallery accessibility test.              |
| I-349 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/product/[slug]/_components/product-gallery.tsx`                                       | Product gallery zoom             | Visible as a zoom affordance or label on the primary image.                                                         | Zoom control is keyboard reachable and reversible.                                | PDP interaction smoke.                   |
| I-350 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/app/product/[slug]/page.tsx`                                                              | Product media caption            | Visible as a short material or styling caption near the gallery when data exists.                                   | Caption does not duplicate the product title.                                     | Product page source test.                |
| I-351 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/app/product/[slug]/page.tsx`                                                              | PDP price and availability row   | Visible as one compact row for price, availability, and source.                                                     | Price remains the strongest text in the purchase area.                            | PDP visual smoke.                        |
| I-352 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/product/[slug]/_components/product-purchase-panel.tsx`                                | PDP variant buttons              | Visible as disabled variant buttons with short reasons such as out of stock or unavailable.                         | Disabled reason is available to keyboard and screen-reader users.                 | Purchase panel test.                     |
| I-353 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/product/[slug]/_components/product-purchase-panel.tsx`, `src/app/size-guide/page.tsx` | PDP size help                    | Visible as an inline size-guide link next to size selection.                                                        | Link opens a relevant size guide without losing product context.                  | Route smoke.                             |
| I-354 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/product/[slug]/page.tsx`, `src/server/services/shipping.ts`                           | PDP delivery estimate            | Visible as a delivery estimate badge when shipping data is available.                                               | Estimate copy never overpromises supplier fulfillment.                            | Data and copy test.                      |
| I-355 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/product/[slug]/_components/product-purchase-panel.tsx`                                | Mobile PDP purchase              | Visible as a sticky add-to-cart bar after the purchase panel scrolls out of view.                                   | Sticky bar does not cover footer, cookie banner, or accessibility controls.       | Mobile visual smoke.                     |
| I-356 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/components/product-card-favorite-button.tsx`, `src/app/product/[slug]/page.tsx`           | Wishlist feedback                | Visible as saved and removed feedback near the favorite button.                                                     | Feedback is brief, announced, and does not shift card layout.                     | Accessibility test.                      |
| I-357 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/product/[slug]/page.tsx`                                                              | Related products rail            | Visible as reason labels such as same material, same category, or gift match.                                       | Reason label is truthful and data-backed.                                         | PDP rail test.                           |
| I-358 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/product/[slug]/_components/recently-viewed-products.tsx`                              | Recently viewed rail             | Visible as a clearly separated rail below PDP recommendations.                                                      | Current product is not repeated in the rail.                                      | Recently viewed test.                    |
| I-359 | Public UX and Brand                  | Actionable Now | P2       | M      | `src/app/product/[slug]/page.tsx`                                                              | Product details section          | Visible as accordions for materials, care, shipping, and returns.                                                   | Accordions retain headings and are keyboard operable.                             | Accessibility smoke.                     |
| I-360 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/app/product/[slug]/page.tsx`, `src/app/service/page.tsx`                                  | PDP support copy                 | Visible as a short service link for sizing, material, or delivery questions.                                        | Link includes product context when possible.                                      | Route and copy test.                     |
| I-361 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/components/product-card.tsx`                                                              | Product card hover media         | Visible as a secondary image on hover or focus where alternate media exists.                                        | Motion is disabled or simplified for reduced-motion users.                        | Card interaction smoke.                  |
| I-362 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/components/product-card.tsx`, `src/server/services/cart.ts`                               | Product card quick add           | Visible as a compact quick-add button for simple in-stock products.                                                 | Button is hidden when variant choice is required.                                 | Cart and card tests.                     |
| I-363 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/components/product-card-favorite-button.tsx`                                              | Product card favorite            | Visible as a filled or outlined favorite icon state.                                                                | State survives navigation and has an accessible label.                            | Wishlist storage test.                   |
| I-364 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/components/product-card.tsx`, `src/lib/format.ts`                                         | Product card sale price          | Visible as current price and previous price styling when sale data exists.                                          | Sale price remains readable and previous price is not mistaken for current.       | Product-card test.                       |
| I-365 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/components/product-card.tsx`                                                              | Product card material badge      | Visible as a small material badge such as gold, silver, or pearl.                                                   | Badge is optional and never replaces title or price.                              | Visual source test.                      |
| I-366 | Performance, PWA, and Reliability    | Actionable Now | P2       | S      | `src/components/product-card.tsx`, `src/styles/globals.css`                                    | Product grid stability           | Visible as image slots that keep a consistent aspect ratio before and after load.                                   | Grid does not jump when scrolling through products.                               | Layout-stability test.                   |
| I-367 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/components/product-card.tsx`, `src/server/services/inventory.ts`                          | Product stock cue                | Visible as a restrained low-stock badge only when inventory is genuinely low.                                       | Badge does not create false urgency.                                              | Inventory display test.                  |
| I-368 | Accessibility, Privacy, and Security | Actionable Now | P2       | S      | `src/components/product-card.tsx`, `src/styles/globals.css`                                    | Mixed RTL titles                 | Visible as product titles that wrap cleanly with Hebrew, English, numbers, and SKU fragments.                       | Titles do not clip or overlap price.                                              | RTL layout source test.                  |
| I-369 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/checkout/page.tsx`, `src/app/checkout/_components/cart-checkout-form.tsx`             | Checkout progress                | Visible as a simple progress indicator for cart, details, payment, and review.                                      | Current step is clear and completed steps are not clickable if unsafe.            | Checkout visual smoke.                   |
| I-370 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/checkout/_components/cart-checkout-form.tsx`                                          | Checkout cart summary            | Visible as editable quantity and remove controls inside the order summary.                                          | Edits update totals immediately and announce changes.                             | Checkout interaction test.               |
| I-371 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/checkout/_components/cart-checkout-form.tsx`                                          | Checkout address entry           | Visible as a manual address tab or fallback when autocomplete is unavailable.                                       | Manual entry remains complete and first-class.                                    | Checkout form test.                      |
| I-372 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/checkout/_components/cart-checkout-form.tsx`                                          | Shipping method section          | Visible as a short explanation under each shipping option.                                                          | Copy distinguishes pickup, delivery, and supplier constraints.                    | Copy and visual smoke.                   |
| I-373 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/app/checkout/_components/checkout-status.tsx`                                             | Payment status                   | Visible as a clear loading, retry, or unavailable payment state.                                                    | Failed payment state never implies a duplicate charge.                            | Payment state test.                      |
| I-374 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/app/checkout/_components/cart-checkout-form.tsx`, `src/server/services/coupons.ts`        | Coupon field                     | Visible as success, expired, ineligible, or unknown coupon messages.                                                | Coupon messages are specific and translated.                                      | Coupon tests.                            |
| I-375 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/checkout/_components/cart-checkout-form.tsx`                                          | Order note field                 | Visible as an optional note hint with examples for gift or delivery context.                                        | Hint does not encourage sensitive data entry.                                     | Privacy copy check.                      |
| I-376 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/lib/checkout-validation.ts`, `src/app/checkout/_components/cart-checkout-form.tsx`        | Checkout field validation        | Visible as inline field-level messages below invalid fields.                                                        | Messages appear near the field and summary focus remains predictable.             | Validation tests.                        |
| I-377 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/checkout/_components/cart-checkout-form.tsx`, `src/styles/globals.css`                | Mobile checkout total            | Visible as a sticky mobile total bar with the primary continue or pay action.                                       | Bar does not cover form fields or browser safe areas.                             | Mobile checkout smoke.                   |
| I-378 | Commerce and Checkout                | Actionable Now | P1       | S      | `src/app/checkout/page.tsx`                                                                    | Empty checkout                   | Visible as a cart recovery state with links to search, gifts, and categories.                                       | Empty checkout cannot proceed to payment.                                         | Checkout empty-state test.               |
| I-379 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/account/page.tsx`                                                                     | Account sign-in prompt           | Visible as a clear sign-in or continue-as-guest choice where applicable.                                            | Shopper understands what account unlocks without blocking browsing.               | Account route smoke.                     |
| I-380 | Commerce and Checkout                | Actionable Now | P1       | M      | `src/app/account/page.tsx`, `src/app/account/orders/[id]/page.tsx`                             | Account order cards              | Visible as order cards with status, date, total, and next action.                                                   | Status text matches order detail state.                                           | Account order tests.                     |
| I-381 | Accessibility, Privacy, and Security | Actionable Now | P1       | S      | `src/app/account/page.tsx`, `src/app/account/privacy/export/route.ts`                          | Account privacy export           | Visible as a privacy export CTA with authentication and rate-limit expectations.                                    | Copy avoids account-existence leaks and explains next step.                       | Privacy export test.                     |
| I-382 | Commerce and Checkout                | Actionable Now | P2       | M      | `src/app/account/page.tsx`, `src/lib/guest-wishlist.ts`                                        | Wishlist merge notice            | Visible as a short notice after sign-in when guest wishlist items are merged.                                       | Notice names count merged and avoids duplicate product cards.                     | Wishlist merge test.                     |
| I-383 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/account/page.tsx`, `src/components/status-message.tsx`                                | Account profile updates          | Visible as a success or failure status after profile edits.                                                         | Status remains near the edited form and is announced politely.                    | Account form test.                       |
| I-384 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/account/page.tsx`                                                                     | Empty account orders             | Visible as an empty-orders state with links to gifts and search.                                                    | Empty state is not confused with loading or auth failure.                         | Account empty-state smoke.               |
| I-386 | Accessibility, Privacy, and Security | Actionable Now | P1       | S      | `src/app/service/_components/service-request-form.tsx`, `src/lib/service-validation.ts`        | Service attachments              | Visible as accepted file type and size guidance near the upload control.                                            | Invalid file feedback appears before submission when possible.                    | Service validation test.                 |
| I-388 | Public UX and Brand                  | Actionable Now | P1       | M      | `src/app/service/page.tsx`, `src/server/services/service.ts`                                   | Service request success          | Visible as a confirmation number or reference after successful submission.                                          | Success state includes next steps and a safe contact path.                        | Service form test.                       |
| I-390 | Accessibility, Privacy, and Security | Actionable Now | P2       | S      | `src/app/faq/page.tsx`, `src/components/ui/accordion.tsx`                                      | FAQ accordions                   | Visible as open and closed states with clear icons and focus rings.                                                 | Accordion state is keyboard operable and screen-reader friendly.                  | Accessibility test.                      |
| I-391 | Public UX and Brand                  | Actionable Now | P2       | S      | `src/app/faq/page.tsx`, `src/app/service/page.tsx`                                             | FAQ service handoff              | Visible as a service CTA at the end of unresolved FAQ sections.                                                     | CTA carries enough topic context to the service route.                            | Route source test.                       |
| I-400 | Commerce and Checkout                | Actionable Now | P2       | S      | `src/app/size-guide/page.tsx`, `src/lib/format.ts`                                             | Size unit toggle                 | Visible as a unit toggle for cm, mm, and US or EU sizes where applicable.                                           | Toggle labels stay readable in RTL and values remain consistent.                  | Format and visual smoke.                 |

## Candidate Improvements

Candidate items are not implementable by default. Public-facing candidates must
pass `docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before
product code is edited.

No candidate improvements remain. New public-facing candidates must pass
`docs/PUBLIC_CHANGE_GATE.md` or `docs/FULL_PRODUCT_BENCHMARK.md` before product
code is edited.

## Blocked / Deferred

### I-011 Real Shopify Supplier Connection

- `ID`: I-011
- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Shopify supplier channel, product sourcing, fulfillment
- `Improvement`: Blocker: no real supplier connection has been confirmed inside
  Shopify. Unblock condition: the supplier is connected through its supported
  Shopify workflow and exposes confirmable product, inventory, and fulfillment
  behavior.
- `Acceptance Checks`: Supplier products can be identified in Shopify with
  real handles, product IDs, variant IDs, SKUs, inventory behavior, and supplier
  metadata.
- `Verification`: Run `pnpm shopify:dropship:doctor -- --first 5` and record
  supplier-side evidence outside the repository.

### I-012 Paid Shopify Checkout Test

- `ID`: I-012
- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Shopify Checkout, production checkout redirect, order
  completion
- `Improvement`: Blocker: a real paid Shopify Checkout test has not been
  completed. Unblock condition: a paid test product can complete Shopify
  Checkout end to end without breaking local Elysia commerce behavior.
- `Acceptance Checks`: Checkout creates a Shopify order, customer-facing
  completion behavior is valid, and local account/admin mirror behavior is
  observed if webhooks are enabled.
- `Verification`: Run `pnpm shopify:dropship:doctor` with `--first 5`,
  `--register-orders-webhook`, and
  `--site-url https://elysia-jewellery.com` before and after the paid test, then
  confirm the order in Shopify.

### I-013 Supplier Fulfillment Confirmation

- `ID`: I-013
- `Aspect`: Admin and Operations
- `Status`: Blocked
- `Priority`: P0
- `Effort`: L
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Supplier fulfillment workflow, Shopify order handoff,
  support operations
- `Improvement`: Blocker: supplier fulfillment behavior has not been confirmed
  for Shopify-created orders. Unblock condition: the supplier receives and can
  fulfill a Shopify-created test order through its normal integration.
- `Acceptance Checks`: Supplier receipt, fulfillment status, cancellation or
  failure path, and customer support handoff are documented.
- `Verification`: Confirm in Shopify Admin and supplier tooling; record
  operational evidence in the Shopify roadmap or a linked release note.

### I-014 CardCom Production Credentials

- `ID`: I-014
- `Aspect`: Commerce and Checkout
- `Status`: Blocked
- `Priority`: P0
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`,
  production readiness checks
- `Target Surface`: Local `OWN` product online payment, production readiness,
  provider health
- `Improvement`: Blocker: `CARD_COM_TERMINAL`, `CARD_COM_API_NAME`, and
  `CARD_COM_API_PASSWORD` are not available. Unblock condition: production and
  preview environments have valid CardCom credentials for local Elysia checkout.
- `Acceptance Checks`: Local `OWN` checkout can be treated as production-ready
  without relying on fallback or disabled payment behavior.
- `Verification`: Run `pnpm production:readiness` and any CardCom-specific
  smoke or webhook checks available at the time of credential setup.

### I-015 SMS Provider Credentials

- `ID`: I-015
- `Aspect`: Backend, API, and Data
- `Status`: Deferred
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`,
  production readiness checks
- `Target Surface`: SMS notifications, customer service notifications,
  provider readiness
- `Improvement`: Blocker: `SMS_PROVIDER_API_KEY` is not available and SMS is
  deferred. Unblock condition: SMS delivery is re-enabled as a product
  requirement and valid provider credentials are available in the relevant
  environments.
- `Acceptance Checks`: SMS-dependent flows either remain explicitly unavailable
  or pass provider readiness and delivery validation once re-enabled.
- `Verification`: Run `pnpm production:readiness` and provider-specific smoke
  checks once SMS credentials exist.

### I-016 Shopify Dashboard UI Automation

- `ID`: I-016
- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Shopify Dashboard UI verification through agent browser
- `Improvement`: Blocker: Shopify login and Cloudflare verification block
  dashboard UI automation in the agent browser. Unblock condition: a reliable,
  permitted dashboard automation path exists, or dashboard checks are replaced
  with API-backed verification.
- `Acceptance Checks`: Required Shopify operational facts can be verified
  repeatably without manual browser login friction.
- `Verification`: Prefer `pnpm shopify:dropship:doctor` and Shopify API checks;
  use dashboard evidence only when a human operator can complete login safely.

### I-017 Local Vercel Prebuilt Packaging

- `ID`: I-017
- `Aspect`: QA, Release, and Observability
- `Status`: Blocked
- `Priority`: P2
- `Effort`: M
- `Source/Evidence`: `docs/SHOPIFY_DROPSHIP_IMPLEMENTATION_ROADMAP.md`
- `Target Surface`: Local Windows prebuilt Vercel packaging,
  `.vercel/output/functions`
- `Improvement`: Blocker: local `vercel build --prod` prebuilt packaging fails
  on this Windows machine with an `EPERM` symlink permission error. Unblock
  condition: a Windows-safe packaging path, permissions fix, WSL path, or Vercel
  CLI workaround is confirmed.
- `Acceptance Checks`: Local prebuilt packaging can complete, or the release
  process explicitly documents remote Vercel build as the supported path for
  this environment.
- `Verification`: Retry local prebuilt packaging only after the environment or
  workflow changes; otherwise continue using direct Vercel remote builds.

## Interfaces and Compatibility

- This backlog introduces no runtime, API, schema, type, or product behavior
  change.
- The only new interface is the documentation schema defined above.
- `Needs Benchmark` is not implementable status for public product changes.
  Those items must first pass `docs/PUBLIC_CHANGE_GATE.md` or
  `docs/FULL_PRODUCT_BENCHMARK.md`.
- `Blocked` and `Deferred` items must not be treated as active implementation
  work until their unblock conditions are met.

## Maintenance Rules

- Remove completed items from this active backlog after the acceptance checks
  and verification are recorded in commit, PR, release, or QA evidence.
- Move an item from `Needs Benchmark` to `Actionable Now` only after benchmark
  evidence is recorded.
- Keep blocker language concrete: name the missing credential, provider action,
  operational proof, or environment condition.
- Add new items conservatively. Prefer evidence from repository docs, route
  inventory, tests, provider checks, QA artifacts, or explicit product decisions.
