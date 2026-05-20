# AI Stylist Benchmark

Generated: 2026-05-19T19:33:18.092Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 75%
- Metrics: 184 match, 62 mismatch, 0 not comparable
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

- ai / desktop / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- ai / desktop / interaction / linkCount: Elysia=12; baseline=median 32; IQR 16-94; weight=19.5
- ai / desktop / accessibility / ariaLabelCount: Elysia=6; baseline=median 30; IQR 12-86; weight=19.5
- ai / desktop / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- ai / desktop / content / textLength: Elysia=745; baseline=median 15905; IQR 1735-39992; weight=19.5
- ai / desktop / media / imageCount: Elysia=0; baseline=median 18; IQR 3-70; weight=19.5
- ai / desktop / commerce / priceTextPresent: Elysia=false; baseline=true (11/19.5)
- ai / tablet / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- ai / tablet / interaction / linkCount: Elysia=5; baseline=median 24; IQR 16-49; weight=19.5
- ai / tablet / interaction / focusableCount: Elysia=15; baseline=median 42; IQR 16-103; weight=19.5
- ai / tablet / accessibility / ariaLabelCount: Elysia=6; baseline=median 38; IQR 12-86; weight=19.5
- ai / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- ai / tablet / content / textLength: Elysia=745; baseline=median 15905; IQR 1057-39726; weight=19.5
- ai / tablet / media / imageCount: Elysia=0; baseline=median 32; IQR 18-95; weight=19.5
- ai / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (12.5/19.5)
- ai / mobile / chrome / topPx: Elysia=118; baseline=median 0; IQR -2164-56; weight=19.5
- ai / mobile / chrome / heightPx: Elysia=1415; baseline=median 4884; IQR 3479-6641; weight=19.5
- ai / mobile / chrome / areaRatio: Elysia=1.6765; baseline=median 5.79; IQR 4.12-7.87; weight=19.5
- ai / mobile / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- ai / mobile / interaction / linkCount: Elysia=5; baseline=median 32; IQR 23-49; weight=19.5
- ai / mobile / interaction / buttonCount: Elysia=7; baseline=median 17; IQR 8-30; weight=19.5
- ai / mobile / interaction / focusableCount: Elysia=15; baseline=median 53; IQR 27-102; weight=19.5
- ai / mobile / accessibility / ariaLabelCount: Elysia=6; baseline=median 50; IQR 18-86; weight=19.5
- ai / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)

## Lessons

- AI/stylist remains a demoted service capability with tool-first surfaces.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
