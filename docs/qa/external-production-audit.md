# External Production Audit Notes

Date: 2026-05-27
Site: https://elysia-jewellery.com
Perspective: external shopper, production site

## Scope

Routes checked:

- `/`
- `/category/rings`
- `/gifts`
- `/search`
- `/search?q=טבעת`
- `/search?category=rings`
- `/service`
- `/product/bracelet-sivan-halo-174`

Additional routes checked in the follow-up pass:

- `/about`
- `/branches`
- `/faq`
- `/size-guide`
- `/ai`
- `/stylist`
- `/account`
- `/checkout`
- `/privacy`
- `/terms`
- `/accessibility`
- `/offline`
- `/admin/login`

Additional routes checked in the third pass:

- `/category/necklaces`
- `/category/earrings`
- `/category/bracelets`
- `/category/does-not-exist`
- `/product/does-not-exist`
- `/account/orders/does-not-exist`
- `/admin`
- `/admin/orders`
- `/admin/catalog`
- `/admin/inventory`
- `/admin/customers`
- `/admin/service`
- `/admin/appointments`
- `/admin/notifications`
- `/admin/integrations`
- `/admin/audit`
- `/manifest.webmanifest`
- `/robots.txt`
- `/sitemap.xml`
- Selected public API routes by GET: `/api/health`, `/api/cart/count`, `/api/search/reindex`, `/api/jobs/outbox`, `/api/chat`, `/api/pwa/sync`, `/api/push/*`, `/account/privacy/export`, `/category/rings/filters`

Viewports checked:

- Desktop: 1440 x 900
- Mobile: 390 x 844

## Working Tree Fixes

Fixed locally after this audit:

- Added `/robots.txt` and `/sitemap.xml` metadata routes.
- Added e2e coverage that verifies `robots.txt` and `sitemap.xml` return successful responses.
- Added an accessible name to the shared AI/stylist prompt textarea.
- Fixed the PWA manifest service shortcut copy typo.
- Added a branded product not-found state.
- Added a semantic H1 and not-found metadata for unknown category routes.
- Added `noindex` metadata to the admin login page.
- Preserved unauthenticated admin deep-link destinations in the login `next` value.
- Reconciled Typesense result pages against the local catalog and fall back to local search when the index page is stale, undersized, or out of range.
- Capped the `/gifts` initial PLP grid at 24 cards while keeping the full gift search link available.
- Added a mobile bottom-offset rule for the combined cookie-banner plus sticky-commerce-bar state.
- Aligned checkout empty-state copy, checkout item-count wording, and size-guide save-button accessible name with the public e2e contracts.
- Removed `networkidle` dependence from the mobile category-filter e2e reload path.
- Added targeted regression coverage for search page reconciliation, `/gifts` density, and combined floating chrome offsets.

Still open after the local fixes:

- Broader decision on whether `/branches` should remain a redirect/service alias or become a real branch page when physical branches are enabled.

## High Priority

### Search result count does not match rendered products

Status: fixed locally.

Evidence:

- `/search` reports `מציגים 1-24 מתוך 300 תוצאות`, but the DOM had only 1 product card/link.
- `/search?q=טבעת` reports `מציגים 1-24 מתוך 75 תוצאות`, but rendered 0 product cards and showed the empty state `לא נמצאו תוצאות`.
- `/search?category=rings` reports `מציגים 1-24 מתוך 75 תוצאות`, but the DOM had only 1 product card/link.
- `/category/rings` rendered 6 product cards correctly, so the catalog data itself is available.

User impact:

- Search looks unreliable because the count and visible results contradict each other.
- A shopper searching for rings can be told there are 75 matches while seeing an empty state.

Recommended fix:

- Audit search page pagination/rendering logic separately from category page logic.
- Add an e2e assertion that result count, product card count, and empty state are internally consistent for `/search`, `/search?q=טבעת`, and `/search?category=rings`.

### Gifts page renders the full catalog at once

Status: fixed locally.

Evidence:

- `/gifts` rendered 299 product cards and 299 product links.
- Mobile document height was about `137,004px`.
- Desktop document height was about `41,151px`.
- Most images were initially unloaded because the page is extremely long.

User impact:

- The page feels endless on mobile.
- It is hard to scan, compare, or recover position.
- It increases layout, memory, and image-loading pressure.

Recommended fix:

- Add pagination, "load more", or a curated first page.
- Consider gift-specific filters before listing the full result set.
- Keep the first view focused on a manageable set of recommended gifts.

### robots.txt and sitemap.xml are missing in production

Evidence:

- `/robots.txt` returns HTTP 404.
- `/sitemap.xml` returns HTTP 404.
- Both requests render the generic 404 HTML instead of crawler-oriented files.

User impact:

- Search engines and external SEO scanners cannot discover crawl rules or the canonical URL inventory.
- Product and category discovery depends only on normal page crawling.

Recommended fix:

- Add `src/app/robots.ts` and `src/app/sitemap.ts`, or static equivalents.
- Include core routes, category routes, important product routes, and exclude admin/internal routes.
- Add a production smoke check that asserts both URLs return HTTP 200 and the expected content types.

## Medium Priority

### Branches route points to personal-service content

Evidence:

- `/branches` returned HTTP 200 on desktop and mobile.
- The page title was `Personal service | Elysia` in Hebrew.
- The only H1 was `Personal service` in Hebrew.
- Forms on the page posted to `/service`, not to a branch or location endpoint.

User impact:

- Navigation or footer links labeled as branches can set the expectation of physical locations, opening hours, pickup points, or contact details.
- Instead, the shopper lands on the service flow, which looks like a different intent.

Recommended fix:

- If Elysia has physical branches or pickup locations, create branch-specific content for `/branches`.
- If there are no branches, rename links consistently to personal service and redirect or remove `/branches`.

### AI and stylist textareas are missing accessible labels

Evidence:

- `/ai` and `/stylist` both include a visible `textarea` named `message`.
- The textarea has a placeholder example, but no `id`, associated `label`, `aria-label`, or `aria-labelledby`.
- The issue appears on both desktop and mobile.

User impact:

- Screen-reader users may hear an unlabeled edit field, especially once placeholder text is no longer available.
- The AI/stylist entry point is less usable for assistive technology users.

Recommended fix:

- Add a visible label, or connect the existing prompt text with `aria-labelledby`.
- Keep the placeholder as an example only, not as the control name.

### Floating accessibility control overlaps commerce UI on mobile

Status: fixed locally for the cookie-banner plus sticky-commerce-bar offset case. Still worth validating visually on production after deployment.

Evidence:

- On mobile product pages, the accessibility button overlays product recommendation/price areas during scroll.
- The overlap is worse while the cookie banner is visible and the sticky purchase bar is active.

User impact:

- Important product details and actions compete for the same lower-right area.
- The page feels crowded at the exact point where users are evaluating or purchasing.

Recommended fix:

- Coordinate z-index and bottom offsets between accessibility, cookie, and purchase controls.
- Reserve a single floating-control lane on mobile.
- Re-test with the cookie banner visible and dismissed.

### 404 states are inconsistent and partially unbranded

Evidence:

- `/category/does-not-exist` returns HTTP 404 with visible Hebrew empty-state copy, but the document had no H1 and the title remained `Elysia collection | Elysia` in Hebrew.
- `/product/does-not-exist` returns HTTP 404 with the default English Next.js title `404: This page could not be found.`
- The product 404 page uses `404` as the H1 and English explanatory text.

User impact:

- Broken category and product links feel like different products rather than one coherent storefront.
- The category 404 has weaker accessibility semantics because the main empty-state title is not an H1.

Recommended fix:

- Add a branded product not-found state.
- Give category and product 404 pages clear Hebrew titles, H1s, and recovery actions.
- Keep `noindex` on 404 pages.

### Category tile images need explicit alt intent

Evidence:

- Home category tile images were detected without `alt`.

User impact:

- If meaningful, screen readers lose useful context.
- If decorative, screen readers may receive noisy image behavior.

Recommended fix:

- Use descriptive `alt` for meaningful category imagery, or `alt=""` for decorative images inside links that already contain the category name.

### Screen-reader intro is verbose

Evidence:

- Each page begins with a long hidden description: `Elysia היא בית תכשיטים...`
- It appears before normal navigation in extracted accessibility text.

User impact:

- The hidden intro may slow keyboard/screen-reader users before they reach useful controls.

Recommended fix:

- Shorten the hidden intro to a compact landmark description.
- Keep detailed brand copy in visible page content or metadata, not as repeated page-level screen-reader prose.

## Low Priority

### Public admin login exposure should be intentional

Evidence:

- `/admin/login` is publicly reachable and returns HTTP 200 on desktop and mobile.
- The page clearly identifies itself as the internal admin login.
- Protected admin subroutes redirected to the login page and did not expose admin content.
- The login page did not expose a `robots` meta value in the sampled DOM.
- Admin subroutes such as `/admin/orders` redirected to `/admin/login?next=/admin`, so the requested deep admin path is not preserved.

User impact:

- This may be expected, but it is an obvious admin surface to external scanners and curious visitors.
- Admin users who open a deep link may land on the admin root after login instead of the originally requested section.

Recommended fix:

- Confirm this route has rate limiting, lockout behavior, audit logging, and `noindex`.
- Consider whether the route should be hidden behind an additional access layer if the platform supports it.
- Preserve the original admin destination in `next` when redirecting unauthenticated admin subroutes.

### PWA manifest has a service shortcut copy typo

Evidence:

- `/manifest.webmanifest` returns HTTP 200 and valid manifest JSON.
- The `Service` shortcut description in Hebrew reads as a duplicated phrase: `request to service to service`.

User impact:

- Users who install the PWA may see a rough shortcut description in the app launcher or browser install UI.

Recommended fix:

- Change the shortcut description to a single clear phrase, for example `request personal service` in Hebrew.

### Mobile menu is functional but visually dense

Evidence:

- Mobile menu opens correctly and locks body scroll.
- It is readable, but combines quick icons, feature rows, and catalog links in a compact sheet.

User impact:

- Not broken, but the sheet can feel busy for a first-time shopper.

Recommended fix:

- Keep the current structure, but consider prioritizing search, catalog, and service before secondary links.

## Passed Checks

- No Next.js error overlay found on checked routes.
- No console errors found in the sampled routes.
- No 4xx/5xx responses found during the sampled route loads.
- Home, category, product, service, and gifts routes returned HTTP 200.
- `/api/health` previously returned `ok: true` after production deploy.
- Mobile navigation opens and closes the document scroll as expected.
- `/category/rings` renders product cards correctly.
- `/category/rings`, `/category/necklaces`, `/category/earrings`, and `/category/bracelets` each returned HTTP 200 and rendered 6 distinct product links in the sampled mobile pass.
- Product-to-checkout flow works in the sampled mobile path: selecting `XS`, adding to the selection, seeing cart count `1`, and opening `/checkout` preserved the item, size, delivery fee, and total.
- Additional content routes (`/about`, `/faq`, `/size-guide`, `/privacy`, `/terms`, `/accessibility`, `/offline`) returned HTTP 200 without console errors in the sampled pass.
- Public API checks behaved defensively: sensitive or method-specific routes returned 401 or 405, while `/api/health`, `/api/cart/count`, and `/category/rings/filters` returned expected JSON.
- Protected admin subroutes did not expose admin tables or operational data to an unauthenticated visitor.

## Suggested Regression Tests

- Search consistency:
  - `/search` should not show an empty state when count is positive.
  - `/search?q=טבעת` should render product cards if the reported count is positive.
  - `/search?category=rings` should render the expected page size or a count that matches the visible cards.
- Gifts density:
  - `/gifts` should cap initial rendered product cards.
  - Mobile document height should stay within a reasonable bound for the first page.
- Floating controls:
  - Product mobile viewport with cookie banner visible should not overlap purchase CTA, price, or favorite controls.
- Image accessibility:
  - Meaningful images should have non-empty `alt`; decorative images should have `alt=""`.
- Route semantics:
  - `/branches` should either render branch/location content or redirect to the service route with consistent link labels.
- SEO discovery:
  - `/robots.txt` should return HTTP 200 with `text/plain`.
  - `/sitemap.xml` should return HTTP 200 with XML and include public storefront URLs only.
- 404 consistency:
  - Unknown category and product URLs should show branded Hebrew 404 states with a clear H1 and recovery links.
- AI/stylist accessibility:
  - `/ai` and `/stylist` message textareas should have an accessible name.
- Admin routing:
  - Unauthenticated admin deep links should preserve the intended `next` path and admin login should be `noindex`.
- PWA manifest:
  - Shortcut names and descriptions should pass a copy lint or snapshot check.
- Commerce flow:
  - Product add-to-selection should update cart count and preserve selected item data on `/checkout`.

## Follow-Up Repo Search Notes

- Existing structure tests keep `/gifts` as a PLP route, but do not cap the number of initially rendered cards.
- Existing search UI includes an empty-state path, but no discovered test currently proves that visible product cards, result counts, and empty state agree with each other.
- Existing cookie and accessibility components are covered by targeted tests, but the overlap between cookie banner, accessibility widget, and sticky commerce controls should be tested as an integrated mobile state.
