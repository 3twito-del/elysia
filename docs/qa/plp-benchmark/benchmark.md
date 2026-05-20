# PLP Search Gifts Benchmark

Generated: 2026-05-19T19:33:18.092Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 71%
- Metrics: 262 match, 107 mismatch, 0 not comparable
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

- category / desktop / accessibility / hasAriaCurrent: Elysia=true; baseline=false (14.5/19.5)
- category / desktop / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- category / desktop / content / headingCount: Elysia=2; baseline=median 15; IQR 4-36; weight=19.5
- category / desktop / content / formControlCount: Elysia=60; baseline=median 11; IQR 0-19; weight=19.5
- category / desktop / commerce / productLinkCount: Elysia=36; baseline=median 0; IQR 0-1; weight=19.5
- category / desktop / density / linksPer1000Px: Elysia=40.202; baseline=median 10.58; IQR 4.83-18.56; weight=19.5
- category / desktop / density / controlsPer1000Px: Elysia=47.361; baseline=median 13.8; IQR 5.92-30.42; weight=19.5
- category / tablet / accessibility / hasAriaCurrent: Elysia=true; baseline=false (13/19.5)
- category / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- category / tablet / content / headingCount: Elysia=2; baseline=median 10; IQR 4-29; weight=19.5
- category / tablet / content / formControlCount: Elysia=60; baseline=median 10; IQR 0-22; weight=19.5
- category / tablet / media / imageCount: Elysia=12; baseline=median 32; IQR 18-95; weight=19.5
- category / tablet / commerce / productLinkCount: Elysia=36; baseline=median 0; IQR 0-1; weight=19.5
- category / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (12.5/19.5)
- category / tablet / density / linksPer1000Px: Elysia=17.212; baseline=median 6.39; IQR 4.61-10.89; weight=19.5
- category / tablet / density / controlsPer1000Px: Elysia=22.949; baseline=median 9.71; IQR 5.7-16.03; weight=19.5
- category / mobile / chrome / topPx: Elysia=118; baseline=median 0; IQR -2164-56; weight=19.5
- category / mobile / accessibility / hasAriaCurrent: Elysia=true; baseline=false (14.5/19.5)
- category / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10.5/19.5)
- category / mobile / content / textLength: Elysia=1640; baseline=median 17214; IQR 3158-39594; weight=19.5
- category / mobile / content / headingCount: Elysia=2; baseline=median 20; IQR 6-33; weight=19.5
- category / mobile / content / formControlCount: Elysia=60; baseline=median 10; IQR 0-22; weight=19.5
- category / mobile / media / imageCount: Elysia=12; baseline=median 56; IQR 22-95; weight=19.5
- category / mobile / commerce / productLinkCount: Elysia=36; baseline=median 0; IQR 0-1; weight=19.5

## Lessons

- Listing routes should surface result summary, controls, and grids before editorial content.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
