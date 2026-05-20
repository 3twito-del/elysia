# Checkout Benchmark

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

- checkout / desktop / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- checkout / desktop / accessibility / ariaLabelCount: Elysia=3; baseline=median 30; IQR 12-86; weight=19.5
- checkout / desktop / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- checkout / desktop / content / textLength: Elysia=1593; baseline=median 15905; IQR 1735-39992; weight=19.5
- checkout / desktop / content / headingCount: Elysia=3; baseline=median 15; IQR 4-36; weight=19.5
- checkout / desktop / media / imageCount: Elysia=0; baseline=median 18; IQR 3-70; weight=19.5
- checkout / desktop / commerce / priceTextPresent: Elysia=false; baseline=true (11/19.5)
- checkout / tablet / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- checkout / tablet / interaction / linkCount: Elysia=9; baseline=median 24; IQR 16-49; weight=19.5
- checkout / tablet / accessibility / ariaLabelCount: Elysia=3; baseline=median 38; IQR 12-86; weight=19.5
- checkout / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- checkout / tablet / content / headingCount: Elysia=3; baseline=median 10; IQR 4-29; weight=19.5
- checkout / tablet / media / imageCount: Elysia=0; baseline=median 32; IQR 18-95; weight=19.5
- checkout / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (12.5/19.5)
- checkout / tablet / density / linksPer1000Px: Elysia=3.903; baseline=median 6.39; IQR 4.61-10.89; weight=19.5
- checkout / mobile / chrome / topPx: Elysia=118; baseline=median 0; IQR -2164-56; weight=19.5
- checkout / mobile / chrome / heightPx: Elysia=2678; baseline=median 4884; IQR 3479-6641; weight=19.5
- checkout / mobile / chrome / areaRatio: Elysia=3.1729; baseline=median 5.79; IQR 4.12-7.87; weight=19.5
- checkout / mobile / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- checkout / mobile / interaction / linkCount: Elysia=9; baseline=median 32; IQR 23-49; weight=19.5
- checkout / mobile / interaction / buttonCount: Elysia=5; baseline=median 17; IQR 8-30; weight=19.5
- checkout / mobile / accessibility / ariaLabelCount: Elysia=3; baseline=median 50; IQR 18-86; weight=19.5
- checkout / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- checkout / mobile / content / textLength: Elysia=1593; baseline=median 17214; IQR 3158-39594; weight=19.5

## Lessons

- Checkout is measured only through public cart and recovery surfaces, without payment submission.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
