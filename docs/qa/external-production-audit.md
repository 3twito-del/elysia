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

## Production Update

Deployment:

- Commit: `a7e0ae8` (`Fix public QA regressions`)
- Branch: `qa/full-site-hardening`
- Vercel deployment: `dpl_5xya518u26oVdxsPim1vUgKQnHKQ`
- Deployment URL: `https://elysia-hyjhtoopj-ariel-twitos-projects.vercel.app`
- Production alias: `https://elysia-jewellery.com`
- Status: `READY`

Production smoke after deployment:

- `/robots.txt`: HTTP 200, `text/plain`
- `/sitemap.xml`: HTTP 200, `application/xml`
- `/gifts`: HTTP 200, 24 product links rendered
- `/search?q=טבעת`: HTTP 200, 24 product links rendered, no empty state
- `/product/does-not-exist`: HTTP 404 with branded HTML
- `/admin/login`: HTTP 200
- Vercel error logs for the new deployment: no errors found in the sampled window

Follow-up production deployment:

- Commit: `5ce0888` (`Resolve branch and accessibility audit follow-ups`)
- Branch: `qa/full-site-hardening`
- Vercel deployment: `dpl_3JwvUJVfUddrfQrckL9nWD6BTwyj`
- Deployment URL: `https://elysia-meq43gpyu-ariel-twitos-projects.vercel.app`
- Production alias: `https://elysia-jewellery.com`
- Status: `READY`

Follow-up production smoke:

- `/branches`: HTTP 200, H1 `חנות אונליין`, online-only state rendered.
- `/`: HTTP 200, category link `aria-label` for `טבעות: טבעות ליום ולערב.` rendered.
- `/product/hera-bracelet`: HTTP 200.
- `/admin/login`: HTTP 200 and `noindex` still present.
- Vercel error logs for the follow-up deployment: no error logs found in the sampled window.

Admin hardening production deployment:

- Commit: `ce274bf` plus local audit hardening changes.
- Branch: `qa/full-site-hardening`.
- Vercel deployment: `dpl_BJqxgexnxQT2hMsvhtH7mADBjC4f`.
- Deployment URL: `https://elysia-l99otkeje-ariel-twitos-projects.vercel.app`.
- Production alias: `https://elysia-jewellery.com`.
- Status: `READY`.
- Migration applied during remote production build: `20260527120000_admin_user_disable_lockout`.

Admin hardening production smoke:

- `/api/health`: HTTP 200, `application/json`.
- `/admin/login`: HTTP 200, `text/html`.
- `/robots.txt`: HTTP 200, `text/plain`.
- `/sitemap.xml`: HTTP 200, `application/xml`.
- Vercel error logs for the admin hardening deployment: no error logs found in the sampled 30-minute window.

## Deployed Fixes

Fixed, committed, pushed, and deployed after this audit:

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

## Follow-Up Deployed Fixes

Fixed, pushed, deployed, and smoke-tested after the branch and accessibility decisions on 2026-05-27:

- `/branches` no longer redirects away when no physical branches exist. It now renders an online-only service state while preserving the physical branch-list path for future enabled branches.
- Mobile navigation no longer labels the future branch path as physical `סניפים`; the quick action now reads `אונליין`, and the sheet is shorter by removing a duplicate search feature row and tightening spacing.
- Home category imagery now has meaningful image `alt` text, while the enclosing category link has a concise `aria-label` to avoid repeated screen-reader names.
- The repeated hidden site-header introduction was shortened to a compact landmark description.
- Admin login now records audit events for successful, invalid-credential, and rate-limited login attempts using hashed email identifiers instead of raw email.
- Added unit coverage for admin-login audit metadata.

Manual mobile pass after the follow-up fixes:

- Local production server: `http://127.0.0.1:3050` with `E2E_CATALOG_FIXTURES=1` and `CATALOG_DB_ERROR_FALLBACK=1`.
- `/branches`: HTTP 200; H1 `חנות אונליין`; visible state `אין סניפים פיזיים בשלב זה`; no console or page errors.
- Home category tiles: screen-reader link names are concise, for example `טבעות: טבעות ליום ולערב.`
- Mobile menu: opens correctly; quick actions show `חיפוש`, `אונליין`, `הבחירה`, `אזור אישי`; no physical-branch wording.
- Product mobile pass with cookie banner visible: accessibility button sits above the cookie banner; fixed/sticky element overlap check returned no intersections.

Production mobile pass after deployment:

- `/branches`: H1 `חנות אונליין`, state `אין סניפים פיזיים בשלב זה`, and no console/page errors.
- Mobile menu: quick action `אונליין` appears in place of physical-branch wording.
- `/product/hera-bracelet`: fixed/sticky element overlap check returned no intersections with the cookie banner and accessibility control visible.
- Production browser console and page-error checks were clean in the sampled pass.

Verification after the final local changes:

- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`: 116 files, 463 tests passed
- `pnpm.cmd format:check`
- `pnpm.cmd build`
- `pnpm.cmd e2e tests/e2e/critical-flows.spec.ts --project=chromium-mobile --grep "opens mobile navigation|keeps /branches inside the viewport width|keeps the cinematic hero reserved"` with `E2E_BASE_URL=http://127.0.0.1:3050`: 3 passed

Additional admin hardening implemented after closure:

- Added an `AdminUser.disabledAt` account-disable lockout field with a production migration.
- Disabled admin users are rejected during login and when resolving existing admin sessions.
- Disabled admin login attempts are audited as `admin_login_disabled` with hashed email metadata.
- Added unit coverage for admin account status and disabled-login audit metadata.

Closure status after the follow-up production deploy:

- No unresolved issue remains from the approved follow-up set.
- Account-disable lockout hardening has been migrated, deployed, and smoke-tested in production in addition to the existing rate-limit-based lockout.

## High Priority

### Search result count does not match rendered products

Status: fixed in production.

Production verification:

- `/search?q=טבעת` returned HTTP 200.
- The sampled production HTML rendered 24 product links.
- The sampled production HTML did not include the no-results empty state.

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

Status: fixed in production.

Production verification:

- `/gifts` returned HTTP 200.
- The sampled production HTML rendered 24 product links instead of the previous 299.

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

Status: fixed in production.

Production verification:

- `/robots.txt` returned HTTP 200 with `text/plain`.
- `/sitemap.xml` returned HTTP 200 with `application/xml`.

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

Status: fixed in production.

Evidence:

- `/branches` returned HTTP 200 on desktop and mobile.
- The page title was `Personal service | Elysia` in Hebrew.
- The only H1 was `Personal service` in Hebrew.
- Forms on the page posted to `/service`, not to a branch or location endpoint.

User impact:

- Navigation or footer links labeled as branches can set the expectation of physical locations, opening hours, pickup points, or contact details.
- Instead, the shopper lands on the service flow, which looks like a different intent.

Recommended fix:

- Keep `/branches` as the future branch infrastructure route.
- While there are no physical branches, render the online-only state and avoid physical-branch wording in navigation.
- When `physicalBranchesEnabled` is true and approved public branches exist, render the branch list with address, phone, services, and opening-hour text.

### AI and stylist textareas are missing accessible labels

Status: fixed in production.

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

Status: fixed in production.

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

Status: fixed in production for unknown product and unknown category recovery states.

Production verification:

- `/product/does-not-exist` returned HTTP 404 with branded HTML.

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

Status: fixed in production.

Evidence:

- Home category tile images were detected without `alt`.

User impact:

- If meaningful, screen readers lose useful context.
- If decorative, screen readers may receive noisy image behavior.

Recommended fix:

- Use descriptive `alt` for meaningful category imagery.
- Keep category link accessible names concise with `aria-label` so the image alt does not duplicate the visible heading and copy.

### Screen-reader intro is verbose

Status: fixed in production.

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

Status: fixed in production for the confirmed policy. Additional account-disable lockout hardening is deployed in production. The admin login page is `noindex`, unauthenticated admin deep links preserve the requested `next` path, login attempts are rate-limited, disabled admin accounts are blocked by the new implementation, and login attempts are audited with hashed email identifiers. The current rate-limit behavior is 5 attempts per admin email per 15 minutes.

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

- Confirm this route has rate limiting, account-disable lockout behavior, audit logging, and `noindex`.
- Consider whether the route should also be hidden behind an infrastructure access layer if the platform supports it.
- Preserve the original admin destination in `next` when redirecting unauthenticated admin subroutes.

### PWA manifest has a service shortcut copy typo

Status: fixed in production.

Evidence:

- `/manifest.webmanifest` returns HTTP 200 and valid manifest JSON.
- The `Service` shortcut description in Hebrew reads as a duplicated phrase: `request to service to service`.

User impact:

- Users who install the PWA may see a rough shortcut description in the app launcher or browser install UI.

Recommended fix:

- Change the shortcut description to a single clear phrase, for example `request personal service` in Hebrew.

### Mobile menu is functional but visually dense

Status: fixed in production.

Evidence:

- Mobile menu opens correctly and locks body scroll.
- It is readable, but combines quick icons, feature rows, and catalog links in a compact sheet.

User impact:

- Not broken, but the sheet can feel busy for a first-time shopper.

Recommended fix:

- Keep the current structure, but consider prioritizing search, catalog, and service before secondary links.

## Passed Checks

- Latest follow-up deployment `dpl_3JwvUJVfUddrfQrckL9nWD6BTwyj` is `READY` and aliased to `https://elysia-jewellery.com`.
- Follow-up production smoke confirmed `/branches`, `/`, `/product/hera-bracelet`, and `/admin/login`.
- Follow-up manual production mobile pass found no fixed/sticky overlap between the accessibility control and cookie banner on `/product/hera-bracelet`.
- Previous production deployment `dpl_5xya518u26oVdxsPim1vUgKQnHKQ` was `READY` and aliased to `https://elysia-jewellery.com`.
- Previous production smoke confirmed `/robots.txt`, `/sitemap.xml`, `/gifts`, `/search?q=טבעת`, `/product/does-not-exist`, and `/admin/login`.
- `/gifts` now renders 24 initial product links in the sampled production HTML.
- `/search?q=טבעת` now renders 24 product links and no empty state in the sampled production HTML.
- Vercel logs for the new deployment had no sampled error entries.
- No Next.js error overlay found on checked routes.
- No console errors found in the sampled routes.
- No unexpected 4xx/5xx responses found during the sampled route loads; explicit not-found routes returned expected 404 responses.
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
  - `/branches` should render the online-only state while no physical branches are enabled.
  - Public navigation should avoid physical-branch wording while the online-only state is active.
- SEO discovery:
  - `/robots.txt` should return HTTP 200 with `text/plain`.
  - `/sitemap.xml` should return HTTP 200 with XML and include public storefront URLs only.
- 404 consistency:
  - Unknown category and product URLs should show branded Hebrew 404 states with a clear H1 and recovery links.
- AI/stylist accessibility:
  - `/ai` and `/stylist` message textareas should have an accessible name.
- Admin routing:
  - Unauthenticated admin deep links should preserve the intended `next` path and admin login should be `noindex`.
  - Disabled admin accounts should be rejected during login and existing session resolution.
- PWA manifest:
  - Shortcut names and descriptions should pass a copy lint or snapshot check.
- Commerce flow:
  - Product add-to-selection should update cart count and preserve selected item data on `/checkout`.

## Follow-Up Repo Search Notes

- Structure tests now keep `/gifts` as a PLP route and assert the 24-card initial cap.
- Search adapter tests now cover stale, undersized, out-of-range, final-page, and genuinely empty Typesense pages.
- Floating chrome contract tests now cover the combined cookie-banner plus sticky-commerce-bar mobile offset.
- E2E coverage now includes `robots.txt`, `sitemap.xml`, branded category/product not-found states, admin deep-link preservation, checkout empty-state copy, and size-guide save-button naming.
- `/branches` product/IA decision is resolved for the current business state: online-only service is active until physical branches are enabled and approved for public display.
- Admin account-disable lockout is implemented and deployed with `AdminUser.disabledAt`, auth/session enforcement, audit metadata, and unit tests.
