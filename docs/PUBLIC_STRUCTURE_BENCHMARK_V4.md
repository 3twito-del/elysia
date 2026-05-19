# PUBLIC_STRUCTURE_BENCHMARK_V4

Date: 2026-05-19

Scope: public Aphrodite routes only. Admin remains out of scope except for shared primitives that affect public UI.

This artifact replaces the v3 element-by-element benchmark with a structural benchmark. The implementation target is close structural imitation of the weighted market average: section order, density, first task position, grid start, filter/sort placement, CTA purpose, footer/service density, and floating chrome behavior.

The benchmark does not copy competitor trademarks, copy, imagery, or proprietary UI. Aphrodite keeps its own brand, Hebrew RTL, assets, accessibility, legal, payment integrity, SEO, and backend correctness.

## Corpus And Weighting

Threshold: 18.75 of 37.5 weighted points.

Tier A luxury houses have weight 1.5 each:

| Site | Weight | Primary structural surfaces |
| --- | ---: | --- |
| Cartier | 1.5 | home, jewelry PLP, PDP, gifts, service, account |
| Tiffany & Co. | 1.5 | home, jewelry PLP, gifts, PDP, account, service |
| Van Cleef & Arpels | 1.5 | home, e-boutique PLP, gifts, PDP, service |
| Bulgari | 1.5 | home, gifts PLP, jewelry PLP, PDP, service |
| Harry Winston | 1.5 | home, collections, service/content |
| Graff | 1.5 | home, jewelry collections, PDP inquiry, service |
| Chopard | 1.5 | home, jewelry PLP, PDP, account, cart |
| Boucheron | 1.5 | home, jewelry collections, PDP, service |
| Chaumet | 1.5 | home, jewelry collections, PDP, service |
| Piaget | 1.5 | home, jewelry PLP, PDP, service |
| Mikimoto | 1.5 | home, jewelry PLP, PDP, service |
| Messika | 1.5 | home, jewelry PLP, PDP, service |
| Buccellati | 1.5 | home, jewelry collections, service/content |
| De Beers | 1.5 | home, jewelry PLP, PDP, service |
| Pomellato | 1.5 | home, jewelry PLP, PDP, service |

Tier B commerce and digital jewelry leaders have weight 1 each:

| Site | Weight | Primary structural surfaces |
| --- | ---: | --- |
| David Yurman | 1 | PLP, PDP, gifts, service |
| Pandora | 1 | PLP/search, gifts, PDP, cart |
| Swarovski | 1 | PLP/search, gifts, PDP, cart |
| Mejuri | 1 | PLP, gifts, PDP, account |
| Brilliant Earth | 1 | PLP/search, PDP, checkout, education |
| Blue Nile | 1 | PLP/search, PDP, checkout, service |
| James Allen | 1 | PLP/search, PDP, checkout |
| Kay Jewelers | 1 | PLP/search, gifts, PDP, checkout |
| Zales | 1 | PLP/search, gifts, PDP, checkout |
| Jared | 1 | PLP/search, gifts, PDP, checkout |
| VRAI | 1 | PLP/search, PDP, checkout |
| Catbird | 1 | PLP/search, gifts, PDP |
| Aurate | 1 | PLP/search, gifts, PDP |
| Monica Vinader | 1 | PLP/search, gifts, PDP |
| Kendra Scott | 1 | PLP/search, gifts, PDP, checkout |

## Live Source Notes

Representative live official pages opened during the v4 pass:

| Source | Observed structural signal |
| --- | --- |
| https://www.bulgari.com/en-us/gifts | Gifts opens as a listing: title, product count, filters/sorting, product cards, and occasional editorial tiles inside the grid. |
| https://www.tiffany.com/jewelry/rings/ | Jewelry PLP exposes title, product count/range, product grid, prices, and gift/account navigation in global chrome. |
| https://www.vancleefarpels.com/us/en/e-boutique/category/rings.html | Luxury PLP starts with a compact title/description and product list, with editorial content after products. |
| https://www.chopard.com/en-us/jewellery-rings | PLP exposes category title, filters, sort/filter controls, product cards, wishlist, size selection, and PDP links. |
| https://mejuri.com/collections/rings | Digital jewelry PLP exposes category links, filters, count, sort, quick add, product grid, and compact merchandising tiles. |
| https://www.bluenile.com/jewelry/rings | High-consideration PLP exposes category title, filter taxonomy, result count, sort, shipping/date controls, product grid, and long-form support content after products. |
| https://baymard.com/blog/jewelry-and-watches-2025-benchmark | Research anchor for jewelry/watches benchmark methodology and route-level UX themes. |
| https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ | Mandatory accessibility exception source for focus/target/floating-control behavior. |
| https://web.dev/articles/vitals | Performance exception source for LCP, INP, and CLS constraints. |

When a page was inaccessible, geo-routed, or JS-hidden, the site remains in the corpus but that element is not counted for a narrow element denominator unless at least 25 weighted points remain observable. For this v4 pass, route archetypes are broad enough that the full 37.5 denominator is used.

## Structural Decisions

| Key | Score | Decision | Route impact |
| --- | ---: | --- | --- |
| `homeBrandHeroThenCommerceEntry` | 25.0 | Allow | Home may keep one editorial brand hero only if category/search/product entry follows immediately. |
| `plpTitleControlsGridFirst` | 32.0 | Allow | Category, search, and gifts prioritize title, result state, filters/sort, active refinements, recovery, and product grid. |
| `giftsAsProductListing` | 26.0 | Allow | Gifts is a PLP-like route, not a landing page gated by a local scroll button. |
| `adjacentSamePageHeroCta` | 3.0 | Remove | Hero buttons that only move to the next adjacent section are removed. |
| `heroCtaToRealControl` | 22.0 | Allow | A top action may open a real control such as filters, search, account login, checkout, or customer contact. |
| `crossRouteHeroAction` | 24.0 | Allow | Hero actions may navigate to a different task/page. |
| `pdpGalleryPurchaseFirst` | 31.0 | Allow | PDP starts with gallery and purchase panel; service/trust and related products are secondary. |
| `checkoutTaskFirst` | 28.0 | Allow | Checkout starts with cart/form; reassurance sits near submit/payment. |
| `serviceAccountTaskFirst` | 25.0 | Allow | Service and account start with form/login/order task content, not anchor menus. |
| `legalCompactReadableContent` | 30.0 | Allow | About/legal/accessibility use compact headers and readable content. |
| `floatingChromeNoCommerceOverlap` | 37.5 | Mandatory | Accessibility/cookie/filter/purchase chrome must never cover focusable commerce controls or product facts. |

## Route Archetypes

| Route | Archetype | Required first structure |
| --- | --- | --- |
| `/` | home | Brand hero followed by immediate category/search/product entry. |
| `/gifts` | PLP | Compact title/control summary, then gift product grid. No “למתנות” anchor. |
| `/category/[slug]` | PLP | Compact category title, sticky mobile filter/search control, desktop filter panel, result state, product grid. |
| `/search` | PLP | Search controls and result state before product grid. No “לתוצאות” anchor. |
| `/product/[slug]` | PDP | Gallery and purchase panel first, size/availability/price/CTA unobscured. |
| `/checkout` | checkout | Cart/form first; reassurance near submit. No “להמשך לקופה” anchor. |
| `/service` | service | Contact channels and service form first. No hero scroll CTA. |
| `/account` | account | Login or customer dashboard first. No hero anchor menu. |
| `/ai`, `/stylist` | AI service | Demoted tool route; tabs/chat first, explanatory content secondary. |
| `/about` | content | Compact brand content; cross-route actions allowed. |
| `/faq` | content | FAQ groups and contact content; no hero anchor menu. |
| `/terms`, `/privacy`, `/accessibility` | legal | Compact header, readable legal/accessibility text, mandatory contact/preference controls. |

## Anchor CTA Policy

Hero actions are allowed only when they navigate to a different public task/page or trigger a real control. Same-page hero anchors are removed when the target is adjacent, already within the first viewport, or simply advances to the next section.

Removed examples:

- `href="#gift-products"`
- `href="#category-products"`
- `href="#category-filters"`
- `href="#search-controls"`
- `href="#search-results-section"`
- `href="#checkout-form"`
- `href="#service-form"`
- `href="#faq-groups"`
- `href="#terms-section-1"`
- `href="#privacy-section-1"`
- `href="#accessibility-standard"`
- `href="#ai-stylist"`
- `href="#stylist-chat"`

Allowed examples:

- Cross-route commerce recovery, such as `/search`, `/category/rings`, `/service`, `/privacy`.
- Real controls, such as filter sheet triggers, search fields, login form submission, cart checkout submission, cookie preferences, and accessibility widget controls.

## Implementation Contracts

Code-level contracts live in `src/lib/public-structure-policy.ts`:

- `PublicRouteArchetype`
- `PublicStructureDecision`
- `PublicStructuralElementKey`
- `anchorCtaPolicy`
- `routeStructurePolicy`
- `benchmarkEvidenceUrl`
- `mandatoryExceptionReason`

Guardrails live in:

- `src/lib/public-structure-policy.test.ts`
- `src/styles/public-structure-enforcement.test.ts`
- `tests/e2e/critical-flows.spec.ts`

