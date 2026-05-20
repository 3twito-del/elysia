# Floating Chrome Benchmark

Generated: 2026-05-19T23:22:09.923Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 66%
- Metrics: 162 match, 84 mismatch, 0 not comparable
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

- product / desktop / chrome / elementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- product / desktop / chrome / visibleElementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- product / desktop / chrome / semanticTag: Elysia="section"; baseline="main" (13.5/19.5)
- product / desktop / chrome / fullBleed: Elysia=false; baseline=true (19.5/19.5)
- product / desktop / visual-tone / roundedControlCount: Elysia=4; baseline=median 0; IQR 0-2; weight=19.5
- product / desktop / visual-tone / pillLikeControlCount: Elysia=4; baseline=median 1; IQR 0-3; weight=19.5
- product / desktop / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- product / desktop / interaction / buttonCount: Elysia=56; baseline=median 10; IQR 2-17; weight=19.5
- product / desktop / accessibility / ariaLabelCount: Elysia=91; baseline=median 30; IQR 12-86; weight=19.5
- product / desktop / content / paragraphCount: Elysia=72; baseline=median 26; IQR 3-67; weight=19.5
- product / desktop / commerce / productLinkCount: Elysia=72; baseline=median 0; IQR 0-1; weight=19.5
- product / desktop / commerce / priceTextPresent: Elysia=false; baseline=true (11/19.5)
- product / desktop / density / linksPer1000Px: Elysia=70.459; baseline=median 10.58; IQR 4.83-18.57; weight=19.5
- product / desktop / density / controlsPer1000Px: Elysia=101.774; baseline=median 13.8; IQR 5.92-30.42; weight=19.5
- product / tablet / chrome / elementCount: Elysia=17; baseline=median 1; IQR 1-1; weight=19.5
- product / tablet / chrome / visibleElementCount: Elysia=17; baseline=median 1; IQR 1-1; weight=19.5
- product / tablet / chrome / semanticTag: Elysia="section"; baseline="main" (13.5/19.5)
- product / tablet / chrome / topPx: Elysia=68; baseline=median 0; IQR -2986-56; weight=19.5
- product / tablet / visual-tone / pillLikeControlCount: Elysia=4; baseline=median 1; IQR 0-2; weight=19.5
- product / tablet / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- product / tablet / interaction / linkCount: Elysia=72; baseline=median 24; IQR 16-49; weight=19.5
- product / tablet / interaction / buttonCount: Elysia=56; baseline=median 13; IQR 2-21; weight=19.5
- product / tablet / interaction / focusableCount: Elysia=104; baseline=median 42; IQR 16-103; weight=19.5
- product / tablet / accessibility / ariaLabelCount: Elysia=91; baseline=median 38; IQR 12-86; weight=19.5

## Lessons

- Cookie, accessibility, and purchase chrome must avoid covering task controls.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
