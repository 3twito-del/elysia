# Product Card Benchmark

Generated: 2026-05-19T19:33:18.092Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 57%
- Metrics: 280 match, 212 mismatch, 0 not comparable
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
- home / desktop / chrome / semanticTag: Elysia="div"; baseline="main" (11.5/19.5)
- home / desktop / chrome / topPx: Elysia=1386; baseline=median 0; IQR 0-166; weight=19.5
- home / desktop / chrome / heightPx: Elysia=660; baseline=median 1520; IQR 726-5129; weight=19.5
- home / desktop / chrome / areaRatio: Elysia=0.1492; baseline=median 1.69; IQR 0.81-5.7; weight=19.5
- home / desktop / chrome / fullBleed: Elysia=false; baseline=true (16/19.5)
- home / desktop / chrome / hasBorder: Elysia=true; baseline=false (19.5/19.5)
- home / desktop / chrome / hasShadow: Elysia=true; baseline=false (19.5/19.5)
- home / desktop / visual-tone / transparentBackground: Elysia=false; baseline=true (14/19.5)
- home / desktop / interaction / minTapTargetPx: Elysia=40; baseline=median 15.34; IQR 1-22.39; weight=19.5
- home / desktop / content / textLength: Elysia=573; baseline=median 11748; IQR 675-39992; weight=19.5
- home / desktop / content / headingCount: Elysia=0; baseline=median 9; IQR 3-34; weight=19.5
- home / desktop / content / formControlCount: Elysia=20; baseline=median 0; IQR 0-17; weight=19.5
- home / desktop / commerce / productLinkCount: Elysia=12; baseline=median 0; IQR 0-0; weight=19.5
- home / tablet / chrome / elementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- home / tablet / chrome / visibleElementCount: Elysia=16; baseline=median 1; IQR 1-1; weight=19.5
- home / tablet / chrome / semanticTag: Elysia="div"; baseline="main" (11.5/19.5)
- home / tablet / chrome / topPx: Elysia=1844; baseline=median 0; IQR 0-64; weight=19.5
- home / tablet / chrome / heightPx: Elysia=727; baseline=median 3473; IQR 824-5949; weight=19.5
- home / tablet / chrome / areaRatio: Elysia=0.3681; baseline=median 3.86; IQR 0.92-6.61; weight=19.5
- home / tablet / chrome / fullBleed: Elysia=false; baseline=true (16/19.5)
- home / tablet / chrome / hasBorder: Elysia=true; baseline=false (19.5/19.5)
- home / tablet / chrome / hasShadow: Elysia=true; baseline=false (19.5/19.5)

## Lessons

- Product cards should keep media, product facts, price/status, and actions scannable.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
