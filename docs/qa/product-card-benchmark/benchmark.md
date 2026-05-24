# Product Card Benchmark

Generated: 2026-05-24T15:23:49.078Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 64%
- Metrics: 310 match, 178 mismatch, 4 not comparable
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

- home / desktop / chrome / elementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- home / desktop / chrome / visibleElementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- home / desktop / chrome / semanticTag: Elysia="div"; baseline="main" (10/19.5)
- home / desktop / chrome / topPx: Elysia=1686; baseline=median 0; IQR -8-166; weight=19.5
- home / desktop / chrome / areaRatio: Elysia=0.161; baseline=median 1; IQR 0.23-5.51; weight=19.5
- home / desktop / chrome / fullBleed: Elysia=false; baseline=true (14.5/19.5)
- home / desktop / chrome / hasShadow: Elysia=true; baseline=false (19.5/19.5)
- home / desktop / chrome / lowShadow: Elysia=false; baseline=true (19.5/19.5)
- home / desktop / visual-tone / transparentBackground: Elysia=false; baseline=true (14/19.5)
- home / desktop / content / headingCount: Elysia=0; baseline=median 4; IQR 2-32; weight=19.5
- home / desktop / commerce / productLinkCount: Elysia=12; baseline=median 0; IQR 0-0; weight=19.5
- home / desktop / commerce / priceTextPresent: Elysia=true; baseline=false (12.5/19.5)
- home / tablet / chrome / elementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- home / tablet / chrome / visibleElementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- home / tablet / chrome / semanticTag: Elysia="div"; baseline="main" (10/19.5)
- home / tablet / chrome / topPx: Elysia=2243; baseline=median 0; IQR 0-64; weight=19.5
- home / tablet / chrome / fullBleed: Elysia=false; baseline=true (14.5/19.5)
- home / tablet / chrome / hasShadow: Elysia=true; baseline=false (19.5/19.5)
- home / tablet / chrome / lowShadow: Elysia=false; baseline=true (19.5/19.5)
- home / tablet / visual-tone / transparentBackground: Elysia=false; baseline=true (14/19.5)
- home / tablet / content / headingCount: Elysia=0; baseline=median 4; IQR 2-25; weight=19.5
- home / tablet / commerce / productLinkCount: Elysia=12; baseline=median 0; IQR 0-0; weight=19.5
- home / tablet / density / linksPer1000Px: Elysia=15.519; baseline=median 6.03; IQR 4.21-13.97; weight=19.5
- home / mobile / chrome / elementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5

## Lessons

- Product cards should keep media, product facts, price/status, and actions scannable.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
