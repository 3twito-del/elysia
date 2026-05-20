# PDP Benchmark

Generated: 2026-05-19T19:33:18.092Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 77%
- Metrics: 95 match, 28 mismatch, 0 not comparable
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

- product / desktop / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / desktop / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- product / desktop / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- product / desktop / content / formControlCount: Elysia=65; baseline=median 11; IQR 0-19; weight=19.5
- product / desktop / commerce / productLinkCount: Elysia=36; baseline=median 0; IQR 0-1; weight=19.5
- product / desktop / commerce / priceTextPresent: Elysia=false; baseline=true (11/19.5)
- product / tablet / chrome / heightPx: Elysia=7072; baseline=median 3830; IQR 900-5969; weight=19.5
- product / tablet / chrome / areaRatio: Elysia=7.8582; baseline=median 4.26; IQR 1-6.63; weight=19.5
- product / tablet / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / tablet / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- product / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- product / tablet / content / formControlCount: Elysia=65; baseline=median 10; IQR 0-22; weight=19.5
- product / tablet / media / imageCount: Elysia=14; baseline=median 32; IQR 18-95; weight=19.5
- product / tablet / commerce / productLinkCount: Elysia=36; baseline=median 0; IQR 0-1; weight=19.5
- product / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (12.5/19.5)
- product / mobile / chrome / topPx: Elysia=118; baseline=median 0; IQR -2164-56; weight=19.5
- product / mobile / chrome / heightPx: Elysia=9448; baseline=median 4884; IQR 3479-6641; weight=19.5
- product / mobile / chrome / areaRatio: Elysia=11.1941; baseline=median 5.79; IQR 4.12-7.87; weight=19.5
- product / mobile / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / mobile / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- product / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- product / mobile / content / textLength: Elysia=2658; baseline=median 17214; IQR 3158-39594; weight=19.5
- product / mobile / content / formControlCount: Elysia=65; baseline=median 10; IQR 0-22; weight=19.5
- product / mobile / media / imageCount: Elysia=14; baseline=median 56; IQR 22-95; weight=19.5

## Lessons

- PDP should prioritize gallery, facts, availability, and purchasing controls.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
