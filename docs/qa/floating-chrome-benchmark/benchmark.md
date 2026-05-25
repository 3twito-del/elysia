# Floating Chrome Benchmark

Generated: 2026-05-25T19:58:14.597Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 69%
- Metrics: 168 match, 76 mismatch, 2 not comparable
- Active weight: 19.5; threshold weight: 9.75

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by David Yurman.
- Tiffany & Co. replaced by Mejuri.
- Bulgari replaced by Brilliant Earth.
- Harry Winston replaced by Blue Nile.
- Chaumet replaced by VRAI.
- Mikimoto replaced by Aurate.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Swarovski (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).

## Top Mismatches

- product / desktop / chrome / elementCount: Elysia=17; baseline=median 1; IQR 1-1; weight=19.5
- product / desktop / chrome / visibleElementCount: Elysia=17; baseline=median 1; IQR 1-1; weight=19.5
- product / desktop / chrome / semanticTag: Elysia="section"; baseline="main" (12/19.5)
- product / desktop / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / desktop / visual-tone / roundedControlCount: Elysia=4; baseline=median 0; IQR 0-2; weight=19.5
- product / desktop / visual-tone / pillLikeControlCount: Elysia=4; baseline=median 0; IQR 0-2; weight=19.5
- product / desktop / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- product / desktop / interaction / buttonCount: Elysia=56; baseline=median 8; IQR 0-16; weight=19.5
- product / desktop / accessibility / ariaLabelCount: Elysia=91; baseline=median 18; IQR 1-86; weight=19.5
- product / desktop / content / paragraphCount: Elysia=72; baseline=median 16; IQR 3-33; weight=19.5
- product / desktop / commerce / productLinkCount: Elysia=70; baseline=median 0; IQR 0-1; weight=19.5
- product / desktop / commerce / priceTextPresent: Elysia=true; baseline=false (10/19.5)
- product / desktop / density / linksPer1000Px: Elysia=54.721; baseline=median 8.26; IQR 3.51-18.51; weight=19.5
- product / desktop / density / controlsPer1000Px: Elysia=76.321; baseline=median 11.01; IQR 3.05-28; weight=19.5
- product / tablet / chrome / elementCount: Elysia=17; baseline=median 1; IQR 1-1; weight=19.5
- product / tablet / chrome / visibleElementCount: Elysia=17; baseline=median 1; IQR 1-1; weight=19.5
- product / tablet / chrome / semanticTag: Elysia="section"; baseline="main" (12/19.5)
- product / tablet / chrome / topPx: Elysia=68; baseline=median 0; IQR -2110-56; weight=19.5
- product / tablet / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / tablet / visual-tone / roundedControlCount: Elysia=4; baseline=median 0; IQR 0-2; weight=19.5
- product / tablet / visual-tone / pillLikeControlCount: Elysia=4; baseline=median 0; IQR 0-2; weight=19.5
- product / tablet / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- product / tablet / interaction / linkCount: Elysia=76; baseline=median 23; IQR 16-35; weight=19.5
- product / tablet / interaction / buttonCount: Elysia=56; baseline=median 10; IQR 0-18; weight=19.5

## Lessons

- Cookie, accessibility, and purchase chrome must avoid covering task controls.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
