# Route Hero Benchmark

Generated: 2026-05-20T00:05:08.489Z

## Summary

- Status: warn
- Active corpus: 14/14 sites produced enough data
- Alignment: 61%
- Metrics: 373 match, 242 mismatch, 0 not comparable
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

- home / desktop / chrome / semanticTag: Elysia="section"; baseline="main" (10/18.5)
- home / desktop / chrome / heightPx: Elysia=628; baseline=median 3935; IQR 900-5129; weight=18.5
- home / desktop / chrome / areaRatio: Elysia=0.6978; baseline=median 4.37; IQR 1-5.7; weight=18.5
- home / desktop / interaction / linkCount: Elysia=2; baseline=median 49; IQR 19-92; weight=18.5
- home / desktop / interaction / buttonCount: Elysia=2; baseline=median 10; IQR 6-17; weight=18.5
- home / desktop / interaction / focusableCount: Elysia=2; baseline=median 62; IQR 16-115; weight=18.5
- home / desktop / accessibility / ariaLabelCount: Elysia=0; baseline=median 31; IQR 12-101; weight=18.5
- home / desktop / content / textLength: Elysia=108; baseline=median 16207; IQR 1735-39992; weight=18.5
- home / desktop / content / headingCount: Elysia=1; baseline=median 15; IQR 4-34; weight=18.5
- home / desktop / content / paragraphCount: Elysia=1; baseline=median 16; IQR 2-52; weight=18.5
- home / desktop / commerce / priceTextPresent: Elysia=false; baseline=true (11/18.5)
- home / desktop / commerce / addToCartTextPresent: Elysia=false; baseline=true (15.5/18.5)
- home / desktop / commerce / checkoutTextPresent: Elysia=false; baseline=true (15.5/18.5)
- home / desktop / density / linksPer1000Px: Elysia=3.185; baseline=median 10.69; IQR 4.83-22.13; weight=18.5
- home / tablet / chrome / semanticTag: Elysia="section"; baseline="main" (10/18.5)
- home / tablet / chrome / heightPx: Elysia=598; baseline=median 3815; IQR 900-5969; weight=18.5
- home / tablet / chrome / areaRatio: Elysia=0.6644; baseline=median 4.24; IQR 1-6.63; weight=18.5
- home / tablet / interaction / linkCount: Elysia=2; baseline=median 32; IQR 19-49; weight=18.5
- home / tablet / interaction / buttonCount: Elysia=2; baseline=median 13; IQR 8-21; weight=18.5
- home / tablet / interaction / focusableCount: Elysia=2; baseline=median 53; IQR 16-103; weight=18.5
- home / tablet / accessibility / ariaLabelCount: Elysia=0; baseline=median 38; IQR 12-101; weight=18.5
- home / tablet / content / textLength: Elysia=108; baseline=median 17214; IQR 1581-39726; weight=18.5
- home / tablet / content / headingCount: Elysia=1; baseline=median 10; IQR 4-29; weight=18.5
- home / tablet / content / paragraphCount: Elysia=1; baseline=median 13; IQR 2-51; weight=18.5

## Lessons

- Task routes should keep heroes compact and avoid adjacent same-page CTA noise.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
