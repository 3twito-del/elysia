# PDP Product Story Module Benchmark

- `Date`: 2026-07-10
- `Backlog Item`: I-328 / F-07 Concise product story module
- `Status`: Supported (existence, flexible placement) and implemented

## Scope

This benchmark checks whether Tier-A high jewelry e-commerce sites carry a
distinct narrative/editorial module on the product detail page (PDP) that
tells a short "why this piece" story about that specific product — design
inspiration, craftsmanship detail, the idea behind it, or styling context —
as opposed to (a) plain spec/description text, (b) general brand-history
copy, or (c) other-product recommendation-carousel copy.

Elysia's current PDP (`src/app/product/[slug]/page.tsx`) has a
purchase-focused top section (gallery, title, `product.shortDescription`,
price, trust block, `ProductPurchasePanel`, spec table), followed by a
`"מה חשוב לדעת לפני שמזמינים"` ("what's important to know before ordering")
section that renders `product.description` as a single plain paragraph
(`className="... hidden text-base leading-8 sm:block"` —
confirmed at line 408: this paragraph is `hidden` on mobile, i.e. it does not
render at all below the `sm` breakpoint) plus a functional FAQ accordion
(`ProductFaq`, lines 435-471), then `ProductRecommendationRails`
(lines 578-651) and `RecentlyViewedProducts`. There is no distinct
editorial/narrative "why this piece" block anywhere on the page — the
description is functional spec copy, not a story module, and on mobile it is
invisible.

15 Tier-A sites from the current gate list of record (`docs/DESIGN.md` Part
I) were checked. 14 of 15 were fetched successfully with a live in-stock
product page (the URLs given all worked on the first or second try, matching
the "worked in an earlier research pass" expectation). Buccellati could not
be fetched (see "Sites Not Verified").

## Gate Classification

- `Change Type`: PDP narrative/editorial content module.
- `Route Context`: pdp.
- `Primary Lens`: High Jewelry Reference Gate in `docs/DESIGN.md`.
- `Required Gate`: Tier A high-jewelry threshold `11.25` (weight 1.5 per
  site, need support from >=8 of 15 sites).

## Benchmark Evidence

| Site | Evidence URL | Observed Pattern | Weight |
| --- | --- | --- | --- |
| Cartier | https://www.cartier.com/en-us/jewelry/rings/love/love-unlimited-ring-CRB4247500.html | Distinct block titled "Cartier and Love: A Love Story Without Limits" (~25 words) about the LOVE collection concept this ring belongs to. Position: **after** price/Add to Cart, before gift-wrap/shipping info (no recommendation rail observed on this page). Text only, no imagery. Reads as collection-ideology copy rather than piece-specific craft detail — borderline on "about THAT product" vs. about the collection. | 1.5 |
| Repossi | https://intl.repossi.com/en-us/products/berbere-ring-in-platinum | Distinct "About the collection" accordion (~2 sentences) describing the Berbère design language (play of fullness/emptiness, repeated minimalist gold line). Position: **after** price/Add to Bag, **before** the "You May Also Like" carousel. Text only within the module itself; an adjacent separate "Savoir-faire" accordion carries a craftsmanship image. | 1.5 |
| Garrard | https://www.garrard.com/en-us/products/medium-oval-signet-ring-in-18ct-yellow-gold | Distinct 2-3 paragraph narrative on craftsmanship, "handmade by our master goldsmiths... as they have been for centuries," and the historical/personalization context of signet rings. Position: **before** price/Add to Cart (sits directly after gallery/title, ahead of the purchase panel). Text only. | 1.5 |
| Vhernier | https://www.vhernier.com/en-us/products/pirouette-ring-gold-0n0623a-110 | Distinct two-sentence (~45-word) tactile/design-language narrative ("cut in bias in the purest Vhernier tradition, the Pirouette curves with a soft, continuous gesture"). Position: **after** price, before a same-style variant carousel (not a cross-product recommendation rail). Text only. | 1.5 |
| Verdura | https://verdura.com/products/constellation-band-ring | Single-sentence historical-inspiration note ("Inspired by the iconic Constellation Bracelet first designed in 1944 and owned by Minnie Astor"). Position: between price and the Add to Cart button — i.e. **inside** the purchase block, not after it. No recommendation rail exists on this page at all. Text only, thinnest example found. | 1.5 |
| Chopard | https://www.chopard.com/en-us/ring/@827702-5259.html | Split pattern: a collection-history paragraph in the main description sits **adjacent to** the purchase panel (right after price/Add to Bag, before the spec rows), and a separate "Design Philosophy" section (cube geometry/symbolism) sits **after** the "You may also like" rail. Combined ~2-3 short paragraphs. Text only. | 1.5 |
| Suzanne Kalan | https://suzannekalan.com/products/frenzy-diamond-ring | One paragraph (3 sentences) of generic styling copy ("perfect addition to your everyday wardrobe... versatile and stylish accessory that will never go out of fashion") — reads as marketing description, not a design-inspiration story specific to this ring. Position: **before** Add to Bag. Text only. Borderline case. | 1.5 |
| Anna Sheffield | https://www.annasheffield.com/products/bea-suite-no-11 | Distinct paragraph inside a "Description & Details" section naming the specific stone pairing (emerald-cut black diamond "Bea" + "Calligraphic Curve" band) and bespoke-metal options. Position: **after** price/Add to Bag, **before** several image-led collection-recommendation blocks. Text only within the module itself. | 1.5 |
| Jessica McCormack | https://us.jessicamccormack.com/products/5-02ct-east-west-cushion-diamond-button-back-ring | Dedicated "Styling Advice" section (~3 paragraphs) on the Georgian cut-down setting technique, stone-proportion criteria, and bridal styling context ("a literal twist on a classic solitaire... for cool brides"). Position: **after** price/enquiry area, **before** Size Chart/Delivery tabs and the "You may also like" rail. Text only — the most substantial narrative found. | 1.5 |
| Mikimoto | https://www.mikimotoamerica.com/us_en/mikimoto-premium-akoya-cultured-pearl-necklace | **No distinct narrative module.** Only a short functional paragraph naming grading criteria ("Only a select few pearls... deemed MIKIMOTO PREMIUM," AA quality, 9x8.5mm, clasp engraving). No design-inspiration or styling story anywhere on the page. | 1.5 |
| Messika | https://www.messika.com/us_en/white-gold-pave-diamond-ring-move-classique-05630-wg | Narrative sentences are folded directly into the spec/description paragraph ("icon of Messika House, ideal to wear everyday or for a gift") rather than presented as a separate module. Position: right after price, before color/size selectors. No recommendation rail present on this page. Text only. Weak/borderline case. | 1.5 |
| Buccellati | https://www.buccellati.com/en_us/hawaii-ring-jaurin023493.html | Not verified — see "Sites Not Verified" below. | 1.5 |
| De Beers | https://www.debeers.com/en-us/lotus-by-de-beers-white-gold-diamond-ring/R104124.html | Distinct two-paragraph (~120-word) narrative on the lotus-plant design inspiration and symbolism ("A symbol of quiet strength, it is a signature meant to accompany every moment of life"), plus ethical-sourcing/hand-setting context. Position: **before** price/size selector/Add to Bag — i.e. ahead of the whole purchase panel, not after it. Text only. | 1.5 |
| Pomellato | https://www.pomellato.com/us_en/nudo-classic-ring-paa1100-o6000-000oy | Two-sentence narrative on the ring's iconic status and "nude stone" mix-and-match concept. Position: **before** price and Add to Cart (sits between gallery and material specs). Text only, brief. | 1.5 |
| Roberto Coin | https://robertocoin.com/products/ring-diamonds-love-in-verona/ | Distinct two-sentence narrative on the Verona/Romeo-and-Juliet design inspiration, framed as a "Love in Verona" collection module. Position: **after** Add to Cart/specs, **before** the related-products carousels. The only one of the 14 verified sites where the narrative block is paired with a large supporting hero image rather than being text-only. | 1.5 |

## Sites Not Verified

- **Buccellati** — `https://www.buccellati.com/en_us/hawaii-ring-jaurin023493.html`
  returned `HTTP 405 Method Not Allowed` on fetch. Retried with an alternate
  live in-stock product URL found via WebSearch
  (`https://www.buccellati.com/en_us/macri-eternelle-jauete007005.html`),
  which also returned `HTTP 405`. Per the task's retry guidance this was not
  pursued further. Note: an unrelated prior QA pass
  (`docs/qa/mobile-pdp-rail-density-benchmark.md`) did successfully fetch
  this exact Buccellati URL for a different question, so the block appears
  intermittent rather than permanent — a future pass may succeed.

## Preliminary Read

13 of the 14 verified sites (all except Mikimoto) carry some block of
product-adjacent narrative copy that goes beyond a plain spec table. But the
strength and specificity of that copy varies widely: about 9-10 sites
(Repossi, Garrard, Vhernier, Anna Sheffield, Jessica McCormack, De Beers,
Roberto Coin, and to a lesser extent Cartier and Chopard) give genuine
design-inspiration or craftsmanship detail specific to that piece or its
immediate micro-collection. A smaller group (Verdura, Suzanne Kalan,
Messika, Pomellato) is thin or borderline — a single sentence, or copy
folded into the spec paragraph, that reads closer to generic marketing
description than a real "story." Length across the board is short: one
sentence to at most three short paragraphs; no site runs long-form editorial
essays directly on the PDP. Supporting imagery inside the narrative block
itself is rare — only Roberto Coin's block was paired with a dedicated
image; everywhere else the module is text-only (imagery, where present,
lives in adjacent-but-separate sections like Repossi's "Savoir-faire").

Positioning relative to the purchase panel does **not** converge on a single
pattern. Re-scored directly against each site's own "Position" text in the
evidence table above (correcting one misclassification in the original
pass — Vhernier's narrative sits after price, not before):

- **After the purchase panel, before recommendations**: Cartier, Repossi,
  Vhernier, Chopard (both narrative blocks land after price/Add to Bag),
  Anna Sheffield, Jessica McCormack, Roberto Coin — **7 of 14**.
- **Before or inside the purchase panel**: Garrard, Verdura, Suzanne Kalan,
  Messika, De Beers, Pomellato — **6 of 14**.
- Mikimoto has no narrative module at all (supports neither).

## Score

- `Existence` (a distinct per-product narrative module exists somewhere on
  the PDP, position unspecified): 13 of 14 verified sites — weighted score
  19.5 (excluding Buccellati; even scored conservatively out of the full 15
  as if Buccellati doesn't support, 13 × 1.5 = 19.5 against threshold 11.25).
  **Clearly supported.**
- `"After purchase panel" placement specifically`: 7 of 14 — weighted score
  10.5. **Below threshold (11.25).**
- `"Before/inside purchase panel" placement specifically`: 6 of 14 —
  weighted score 9.0. **Below threshold.**
- `Decision`: **Supported for existence, not for either specific fixed
  position.** Neither "always after" nor "always before" the purchase panel
  independently clears 8-of-15 support — pinning the module to one fixed
  rule is not itself a Tier-A convention. What is clearly and strongly
  supported is that a distinct, product-specific narrative passage belongs
  on the PDP somewhere, visible on mobile (every verified site with a
  narrative module showed it in the normally-rendered page, not hidden below
  a breakpoint). Implementation therefore adds the story content without
  inventing a rigid site-wide position rule the evidence doesn't support.

## Implementation Decision

- Reuse the existing, already-verified `product.description` field — no new
  facts or copy are invented (ground rule: no fabricated claims).
- Fix the mobile-hidden bug: the description paragraph was
  `hidden ... sm:block` (invisible below 640px). None of the 13 verified
  sites with a narrative module hide it on mobile — remove the `hidden`
  class so it renders at every width.
- Give it a distinct identity separate from the plain spec/FAQ content: a
  small eyebrow label above the paragraph, and full (not muted) foreground
  text color so it reads as substantive editorial content rather than
  secondary meta text.
- Position: extend the existing `"מה חשוב לדעת לפני שמזמינים"` section
  (after the purchase panel) — the lower-risk, additive change matching the
  slightly larger of the two position groups (7/14) without restructuring
  the tight purchase-decision column above it.
- Do not add a second full `CommerceSectionHeader` — "concise" per the
  backlog item name; a lightweight eyebrow is enough.

## Acceptance Checks

- `product.description` renders at all viewport widths (no `hidden` class).
- The paragraph has a distinct eyebrow label and is not styled identically
  to the plain FAQ/spec text.
- No new copy is invented; only existing verified fields are used.

## Verification

- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- Browser smoke: PDP at mobile viewport, confirm the story paragraph is
  visible (light + dark).

## Residual Risk

This does not establish a fixed site-wide "story module position" rule —
the evidence explicitly does not support one. A future proposal to move
this content elsewhere, or to add supporting imagery (only Roberto Coin
paired the narrative with a dedicated image), would need its own benchmark
pass rather than reusing this record.
