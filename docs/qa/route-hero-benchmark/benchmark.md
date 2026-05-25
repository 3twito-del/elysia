# Route Hero Benchmark

Generated: 2026-05-25T19:58:14.597Z

## Summary

- Status: warn
- Active corpus: 14/14 sites produced enough data
- Alignment: 64%
- Metrics: 381 match, 219 mismatch, 15 not comparable
- Active weight: 18.5; threshold weight: 9.25

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by David Yurman.
- Tiffany & Co. replaced by Mejuri.
- Bulgari replaced by Brilliant Earth.
- Harry Winston replaced by Blue Nile.
- Chaumet replaced by Kendra Scott.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Swarovski (reserve; weight 1).
- VRAI (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).
- Aurate (reserve; weight 1).

## Top Mismatches

- home / desktop / chrome / heightPx: Elysia=800; baseline=median 2485; IQR 900-4970; weight=18.5
- home / desktop / chrome / areaRatio: Elysia=0.8889; baseline=median 2.76; IQR 1-5.52; weight=18.5
- home / desktop / interaction / linkCount: Elysia=1; baseline=median 35; IQR 16-92; weight=18.5
- home / desktop / interaction / focusableCount: Elysia=1; baseline=median 61; IQR 12-115; weight=18.5
- home / desktop / content / textLength: Elysia=99; baseline=median 15905; IQR 1057-30392; weight=18.5
- home / desktop / content / headingCount: Elysia=1; baseline=median 10; IQR 3-32; weight=18.5
- home / desktop / commerce / priceTextPresent: Elysia=false; baseline=true (9.5/18.5)
- home / desktop / commerce / addToCartTextPresent: Elysia=false; baseline=true (14/18.5)
- home / desktop / commerce / checkoutTextPresent: Elysia=false; baseline=true (14/18.5)
- home / desktop / density / linksPer1000Px: Elysia=1.25; baseline=median 10.69; IQR 2.62-22.13; weight=18.5
- home / desktop / density / controlsPer1000Px: Elysia=1.25; baseline=median 14.96; IQR 2.62-28; weight=18.5
- home / tablet / chrome / heightPx: Elysia=770; baseline=median 3473; IQR 900-4500; weight=18.5
- home / tablet / chrome / areaRatio: Elysia=0.8556; baseline=median 3.86; IQR 1-5; weight=18.5
- home / tablet / interaction / linkCount: Elysia=1; baseline=median 24; IQR 16-42; weight=18.5
- home / tablet / interaction / focusableCount: Elysia=1; baseline=median 42; IQR 12-71; weight=18.5
- home / tablet / accessibility / ariaLabelCount: Elysia=0; baseline=median 32; IQR 1-101; weight=18.5
- home / tablet / content / textLength: Elysia=99; baseline=median 15905; IQR 1057-34225; weight=18.5
- home / tablet / content / headingCount: Elysia=1; baseline=median 8; IQR 3-25; weight=18.5
- home / tablet / media / imageCount: Elysia=1; baseline=median 22; IQR 12-95; weight=18.5
- home / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (12.5/18.5)
- home / tablet / commerce / addToCartTextPresent: Elysia=false; baseline=true (14/18.5)
- home / tablet / commerce / checkoutTextPresent: Elysia=false; baseline=true (14/18.5)
- home / tablet / density / linksPer1000Px: Elysia=1.299; baseline=median 6; IQR 4.02-10.89; weight=18.5
- home / tablet / density / controlsPer1000Px: Elysia=1.299; baseline=median 11.31; IQR 3.13-23.98; weight=18.5

## Lessons

- Task routes should keep heroes compact and avoid adjacent same-page CTA noise.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
