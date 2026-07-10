# Mobile PDP Recommendation-Rail Density Benchmark

- `Date`: 2026-07-10
- `Backlog Item`: I-302 / E-07 Mobile PDP product-rail density reduction
- `Status`: Supported and implemented

## Scope

This benchmark checks whether Tier-A high jewelry e-commerce sites cap or
reduce product-recommendation-rail density on the product detail page (PDP),
especially on mobile, compared to Elysia's current baseline. Elysia's PDP
(`src/app/product/[slug]/page.tsx`, `ProductRecommendationRails`, backed by
`src/app/product/[slug]/_lib/product-recommendation-rails.ts`) can render up
to 3 stacked recommendation sections below the purchase panel — same
collection, same category, same material — each with its own eyebrow ("אולי
יעניין אותך גם"), title, reason copy, a continuation link, and up to 4 full
product cards (`rail.products.slice(0, 4)`). On mobile (`<640px`) the grid
(`sm:grid-cols-2 lg:grid-cols-4`) collapses to a single column, so worst case
is 3 sections × 4 cards = 12 full-size product cards stacked vertically,
followed by a separate `RecentlyViewedProducts` rail, all before the footer.

8 of the originally-named 15 Tier-A sites (Tiffany & Co., Van Cleef & Arpels,
Bulgari, Harry Winston, Graff, Boucheron, Chaumet, Piaget) proved unreachable
by this repository's fetch tooling across two independent verification
passes with fresh URLs (`403`, timeout, `ECONNRESET` — see "Sites Replaced"
below). Per ADR 0015 (`docs/DECISIONS.md`), each was replaced with a
comparable maison confirmed reachable by the same tooling, and the gate's
site list of record (`docs/DESIGN.md` Part I, `src/lib/public-design-policy.ts`,
`src/lib/high-jewelry-reference-gate.ts`) was updated accordingly. All 15
sites below reflect the current list of record.

## Gate Classification

- `Change Type`: PDP recommendation-rail density and mobile layout.
- `Route Context`: PDP (product detail).
- `Primary Lens`: High Jewelry Reference Gate in `docs/DESIGN.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25` (weight 1.5 per site, need support from >=8 of 15 sites).

## Benchmark Evidence

| Site | Evidence URL | Observed Pattern | Weight | Supports reduction? |
| --- | --- | --- | --- | --- |
| Cartier | https://www.cartier.com/en-us/jewelry/rings/love/love-unlimited-ring-CRB4247500.html | 1 recommendation section ("Cartier and Love: A Love Story Without Limits"), 3 items, single "Discover the collection" CTA, reads as a horizontal carousel, not a stacked grid. | 1.5 | Yes |
| Chopard | https://www.chopard.com/en-us/ring/@827702-5259.html | 1 section ("You may also like"), rendered as a single vertical block, not multiple stacked sections. Item count unconfirmed (client-side rendered tiles not present in fetched markdown). | 1.5 | Yes (fewer sections) |
| Mikimoto | https://www.mikimotoamerica.com/us_en/mikimoto-premium-akoya-cultured-pearl-necklace | 0 recommendation rails. Only an "At Your Service" appointment block and an empty/auto "Recently Viewed" section follow the product info. | 1.5 | Yes |
| Messika | https://www.messika.com/us_en/white-gold-pave-diamond-ring-move-classique-05630-wg | 0 recommendation/related-product rails; goes straight to brand storytelling and footer. | 1.5 | Yes |
| Buccellati | https://www.buccellati.com/en_us/hawaii-ring-jaurin023493.html | 0 recommendation/related-product sections; straight to policy/footer. | 1.5 | Yes |
| De Beers | https://www.debeers.com/en-us/lotus-by-de-beers-white-gold-diamond-ring/R104124.html | 2 sections, but both are broad collection-storytelling bands ("Lotus By DE BEERS," "Talisman") with a single "Discover the Collection" CTA each — not dense per-product grids — both horizontal-carousel in structure. | 1.5 | Yes |
| Pomellato | https://www.pomellato.com/us_en/nudo-classic-ring-paa1100-o6000-000oy | 0 recommendation rails; Add to Cart / Find in Boutique / Book an Appointment, then policy content and footer. | 1.5 | Yes |
| Repossi | https://intl.repossi.com/en-us/products/berbere-ring-in-platinum | 1 section ("You May Also Like"), 4 items (Berbere ring variants, Serti sur Vide ring, Antifer hoop earring, Antifer bracelet — cross-category, not a same-item-type grid), horizontal carousel/scroll. | 1.5 | Yes |
| Garrard | https://www.garrard.com/en-us/products/medium-oval-signet-ring-in-18ct-yellow-gold | 1 section ("You might also like"), 4 items (Wings Rising rings, Baby Bee gift items — cross-category), horizontal carousel, followed by a "View all" link. | 1.5 | Yes |
| Vhernier | https://www.vhernier.com/en-us/products/pirouette-ring-gold-0n0623a-110 | 0 recommendation/related-product sections. Only a same-product color-variant carousel ("Pirouette Ring Variants") appears, which is not a cross-sell rail. | 1.5 | Yes |
| Verdura | https://verdura.com/products/constellation-band-ring | 0 recommendation/related-product sections below product info. | 1.5 | Yes |
| Suzanne Kalan | https://suzannekalan.com/products/frenzy-diamond-ring | 0 recommendation/related-product sections; page goes to customization options, sizing, and shipping/returns policy. | 1.5 | Yes |
| Anna Sheffield | https://www.annasheffield.com/products/bea-suite-no-11 | Dense: a large "Pairs Well With" list of ~19 collection cross-links (stacked vertically, each with a "Shop Collection" link — collection-level, not per-product), plus a 4-item "New Arrivals" grid. This is denser and more stacked than the other verified sites. | 1.5 | **No** |
| Jessica McCormack | https://us.jessicamccormack.com/products/5-02ct-east-west-cushion-diamond-button-back-ring | 1 section ("You may also like") confirmed present; item count/layout could not be confirmed from fetched content (also a separate "Recently viewed" section noted). | 1.5 | Yes (fewer sections; density unconfirmed) |
| Roberto Coin | https://robertocoin.com/products/ring-diamonds-love-in-verona/ | 2 sections ("More Love in Verona" — 6 items, "More Rings" — 4 items) plus "Recently Viewed," all rendered as horizontal carousels, not vertical stacks. Rail count is comparable to Elysia's, but presentation is carousel-based, not a full vertical grid stack. | 1.5 | Partial (carousel, not stack) |

## Sites Replaced (ADR 0015)

The following 8 of the originally-named Tier A sites were replaced in the
gate's site list of record after failing two independent, fresh-URL
verification passes. Full failure detail:

- Tiffany & Co. — every attempted product/category URL returned HTTP 403 (bot-blocked at the edge). Retested with a fresh product URL: 403 again.
- Van Cleef & Arpels — every attempted product page timed out or reset the connection (JS-heavy Adobe Experience Manager shell). Retested: `ECONNRESET`.
- Bulgari — every attempted product URL (multiple locale/path formats) returned HTTP 403.
- Harry Winston — every attempted page timed out. Retested with a fresh product URL: timeout again.
- Graff — every attempted URL entered a redirect loop ("too many redirects exceeded 10").
- Boucheron — every attempted product/category URL returned HTTP 403.
- Chaumet — every attempted product/category URL returned HTTP 403.
- Piaget — every attempted page timed out or reset the connection. Retested with a fresh product URL: timeout again.

A Wayback Machine fallback was also tried for all 8 and failed (the fetch
tool cannot reach `web.archive.org` in this environment). These are
documented failures, not guesses — see `docs/DECISIONS.md` ADR 0015 for the
full replacement decision and rationale.

## Score

- `Supported Sites`: 12 of 15 (Cartier, Chopard, Mikimoto, Messika, Buccellati,
  De Beers, Pomellato, Repossi, Garrard, Vhernier, Verdura, Suzanne Kalan) —
  counting only unambiguous "Yes" support. Jessica McCormack and Roberto Coin
  are directionally supportive but not counted here (weak/partial evidence);
  Anna Sheffield actively does not support the change and is excluded from
  the supported count.
- `Weighted Score`: 18.0 (12 × 1.5).
- `Threshold`: 11.25.
- `Decision`: **Supported.** Even using the conservative count (excluding
  both partial-evidence sites and treating the one contrary site as
  non-support), the score clears the threshold by a wide margin. The pattern
  across verified sites is consistent: none approach Elysia's worst case of 3
  stacked sections × 4 cards (12 cards) plus a separate recently-viewed rail.
  Most show 0-1 rails; where a rail exists it reads as a horizontal
  carousel/scroll, not a full vertical stack. Anna Sheffield is a genuine
  counterexample and is reported as such, not smoothed over.

## Implementation Decision

Implement a narrow density reduction, not a removal of recommendations:

- Cap total recommendation rails shown on a PDP to **2** (was up to 3):
  collection and category take priority; material only shows if fewer than 2
  rails were already produced (mirrors the existing "popular" fallback
  pattern already in `getProductRecommendationRails`).
- Reduce cards per rail from 4 to **3**, uniformly across breakpoints (the
  existing grid has no clean mechanism for a mobile-only count without
  hiding rendered cards, which would add markup for no benefit) — matches
  the density most verified sites showed (Cartier: 3; Repossi/Garrard: 4 but
  cross-category, i.e. not a dense same-type grid).
- Keep `RecentlyViewedProducts` unchanged (it is a distinct, user-specific
  rail, not a merchandising rail, and none of the verified sites' "recently
  viewed" sections were counted against them either).
- Do not remove the "reason" copy or continuation link — sites like Cartier
  and De Beers keep a single clear continuation CTA per rail, which the
  existing implementation already does.

## Acceptance Checks

- `getProductRecommendationRails` never returns more than 2 rails.
- Each rail renders at most 3 product cards (`rail.products.slice(0, 3)`),
  uniformly across breakpoints.
- No rail loses its `reason`, `title`, or `continuationHref`.
- Recently-viewed rail is unaffected.

## Verification

- `pnpm test -- src/app/product/[slug]/_lib/product-recommendation-rails.test.ts src/styles/product-recommendation-rail-return-context.test.ts`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke: PDP at mobile viewport width, confirm at most 2 stacked
  rail sections and at most 3 cards each before "Recently Viewed."

## Residual Risk

Mobile-viewport carousel vs. vertical-stack presentation could not be
confirmed with a literal rendered screenshot for most sites (WebFetch returns
markdown/text, not a rendered viewport) — the carousel/stack read is inferred
from section/CTA structure for Cartier, De Beers, Repossi, Garrard, and
Roberto Coin. This benchmark supports rail/card **count** reduction with
higher confidence than it supports a specific carousel-vs-grid layout
mechanism; the implementation above keeps Elysia's existing grid presentation
(already responsive, already not the worst-case dense pattern once card count
drops) rather than introducing a new carousel component, which would be a
separate, larger UI change requiring its own scoped benchmark.
