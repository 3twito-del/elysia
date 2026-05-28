# PLP Search Gifts Benchmark

Generated: 2026-05-28T01:56:41.211Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 83%
- Metrics: 240 match, 48 mismatch, 0 not comparable
- Active weight: 19.5; threshold weight: 9.75

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by David Yurman.
- Tiffany & Co. replaced by Mejuri.
- Bulgari replaced by Blue Nile.
- Harry Winston replaced by VRAI.
- Chaumet replaced by Aurate.
- Mikimoto replaced by Kendra Scott.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Swarovski (reserve; weight 1).
- Brilliant Earth (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).

## Top Mismatches

- category / desktop / interaction / linkCount: Elysia=59; baseline=median 27; IQR 6-55; weight=19.5
- category / desktop / interaction / buttonCount: Elysia=17; baseline=median 8; IQR 0-12; weight=19.5
- category / desktop / content / headingCount: Elysia=23; baseline=median 9; IQR 2-20; weight=19.5
- category / tablet / accessibility / ariaLabelCount: Elysia=47; baseline=median 30; IQR 0-41; weight=19.5
- category / tablet / content / headingCount: Elysia=23; baseline=median 8; IQR 2-20; weight=19.5
- category / mobile / content / textLength: Elysia=1745; baseline=median 11748; IQR 1972-29583; weight=19.5
- category / mobile / media / imageCount: Elysia=12; baseline=median 56; IQR 18-95; weight=19.5
- search / desktop / interaction / linkCount: Elysia=58; baseline=median 27; IQR 6-55; weight=19.5
- search / desktop / interaction / buttonCount: Elysia=59; baseline=median 8; IQR 0-12; weight=19.5
- search / desktop / interaction / focusableCount: Elysia=117; baseline=median 37; IQR 8-100; weight=19.5
- search / desktop / accessibility / ariaLabelCount: Elysia=164; baseline=median 17; IQR 0-47; weight=19.5
- search / desktop / content / headingCount: Elysia=50; baseline=median 9; IQR 2-20; weight=19.5
- search / desktop / content / formControlCount: Elysia=8; baseline=median 0; IQR 0-1; weight=19.5
- search / desktop / density / controlsPer1000Px: Elysia=27.764; baseline=median 11.01; IQR 2.62-24.95; weight=19.5
- search / tablet / chrome / heightPx: Elysia=7937; baseline=median 3473; IQR 900-4500; weight=19.5
- search / tablet / chrome / areaRatio: Elysia=8.7045; baseline=median 3.86; IQR 1-5; weight=19.5
- search / tablet / interaction / linkCount: Elysia=58; baseline=median 23; IQR 6-35; weight=19.5
- search / tablet / interaction / buttonCount: Elysia=60; baseline=median 10; IQR 0-18; weight=19.5
- search / tablet / interaction / focusableCount: Elysia=110; baseline=median 34; IQR 8-71; weight=19.5
- search / tablet / accessibility / ariaLabelCount: Elysia=164; baseline=median 30; IQR 0-41; weight=19.5
- search / tablet / content / headingCount: Elysia=50; baseline=median 8; IQR 2-20; weight=19.5
- search / mobile / chrome / heightPx: Elysia=11466; baseline=median 4767; IQR 844-5743; weight=19.5
- search / mobile / chrome / areaRatio: Elysia=13.2367; baseline=median 5.65; IQR 1-6.81; weight=19.5
- search / mobile / interaction / linkCount: Elysia=58; baseline=median 32; IQR 16-40; weight=19.5

## Lessons

- Listing routes should surface result summary, controls, and grids before editorial content.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.

