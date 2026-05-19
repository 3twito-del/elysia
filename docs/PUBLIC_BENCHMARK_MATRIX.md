# Aphrodite Public Benchmark Matrix v3

Date: 2026-05-19

This matrix is the local source of truth for the v3 public design teardown.
It translates the selected 30-site global jewelry benchmark into enforceable
public UI decisions.

## Method

- Corpus: Cartier, Tiffany & Co., Van Cleef & Arpels, Bulgari, Harry Winston,
  Graff, Chopard, Boucheron, Chaumet, Piaget, Mikimoto, Messika, Buccellati,
  De Beers, Pomellato, David Yurman, Pandora, Swarovski, Mejuri, Brilliant
  Earth, Blue Nile, James Allen, Kay Jewelers, Zales, Jared, VRAI, Catbird,
  Aurate, Monica Vinader, Kendra Scott.
- Tier A luxury houses: first 15 sites, weight 1.5 each.
- Tier B commerce/digital jewelry leaders: remaining 15 sites, weight 1 each.
- Total weight: 37.5. Prominent keep threshold: 18.75.
- Mandatory exceptions: accessibility, legal, payment integrity, SEO
  structured data, cookie consent, and backend operational correctness.

## Element Decisions

| Element key | Weighted score | Decision | Public rule |
| --- | ---: | --- | --- |
| `homeEditorialHero` | 24.5 | Allow | Home may keep one product-led editorial hero. |
| `routeHeroMedia` | 17.5 | Remove prominent | Non-home route heroes must be text/task first; media is hidden or removed. |
| `heroMetrics` | 6.5 | Remove | No hero-side metric tiles or product-ratio blocks. |
| `categoryProductCount` | 29 | Allow | PLP/search may show result range/count near the grid. |
| `exactInventoryQuantity` | 5.5 | Remove | Never expose exact stock counts to customers. |
| `genericAvailability` | 31 | Allow | Use generic availability language only. |
| `filterOptionCounts` | 12 | Remove | Do not show facet option counts in filter lists. |
| `activeFilterChips` | 22 | Allow | Active refinements may be removable chips. |
| `sortControl` | 28 | Allow | Keep sort controls near results. |
| `collectionBadgePill` | 13 | Remove prominent | Do not place repeated collection badges on product media/cards. |
| `saleBadge` | 21 | Allow | Sale/discount badges are allowed when real price data exists. |
| `wishlist` | 21 | Allow | Wishlist/favorite is allowed as a secondary action. |
| `aiStylistPrimary` | 1 | Remove prominent | AI/stylist must not appear in primary nav, hero CTAs, PLP CTAs, or PDP CTAs. |
| `aiStylistServiceEntry` | 7 | Demote | AI route may exist but only as a non-primary service/help path. |
| `trustNearPurchase` | 24 | Allow | Trust/reassurance copy may sit near purchase or submit actions. |
| `serviceLinks` | 30 | Allow | Service/help links remain public and discoverable. |
| `footerDenseServiceLinks` | 23 | Allow | Footer may contain compact service/legal/catalog links. |
| `cookieAccessibilityChrome` | mandatory | Mandatory | Cookie and accessibility controls remain, with collision rules. |
| `motionEnhancedMedia` | 10 | Remove prominent | Motion outside the home hero is minimal and never continuous. |
| `relatedProducts` | 24 | Allow | Related product rails may remain after PDP purchase content. |
| `checkoutReassurance` | 26 | Allow | Checkout reassurance is allowed near submit/payment context. |

## Anchor Sources

- Baymard Jewelry & Watches UX Benchmark:
  https://baymard.com/blog/jewelry-and-watches-2025-benchmark
- Baymard Ecommerce UX Benchmark:
  https://baymard.com/ux-benchmark
- W3C WCAG 2.2:
  https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- web.dev Core Web Vitals:
  https://web.dev/articles/vitals
- Forbes Vetted online jewelry stores:
  https://www.forbes.com/sites/forbes-personal-shopper/article/best-online-jewelry-store/
- Estate Diamond Jewelry luxury brands:
  https://www.estatediamondjewelry.com/luxury-jewelry-brands/
- Top10 online jewelry stores:
  https://www.top10.com/online-jewelry-stores
