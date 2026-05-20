# Content Legal Benchmark

Generated: 2026-05-19T19:33:18.092Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 79%
- Metrics: 486 match, 129 mismatch, 0 not comparable
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

- about / desktop / chrome / heightPx: Elysia=5203; baseline=median 3935; IQR 900-5129; weight=19.5
- about / desktop / chrome / areaRatio: Elysia=5.7809; baseline=median 4.37; IQR 1-5.7; weight=19.5
- about / desktop / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- about / desktop / accessibility / hasAriaCurrent: Elysia=true; baseline=false (14.5/19.5)
- about / desktop / accessibility / hasAriaExpanded: Elysia=true; baseline=false (12/19.5)
- about / desktop / media / imageCount: Elysia=0; baseline=median 18; IQR 3-56; weight=19.5
- about / desktop / density / linksPer1000Px: Elysia=3.844; baseline=median 8.26; IQR 4.83-18.56; weight=19.5
- about / desktop / density / controlsPer1000Px: Elysia=3.844; baseline=median 11.01; IQR 5.92-30.42; weight=19.5
- about / tablet / chrome / heightPx: Elysia=6263; baseline=median 3815; IQR 900-5969; weight=19.5
- about / tablet / chrome / areaRatio: Elysia=6.9591; baseline=median 4.24; IQR 1-6.63; weight=19.5
- about / tablet / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5
- about / tablet / interaction / linkCount: Elysia=13; baseline=median 23; IQR 16-32; weight=19.5
- about / tablet / accessibility / hasAriaCurrent: Elysia=true; baseline=false (13/19.5)
- about / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (12/19.5)
- about / tablet / content / headingCount: Elysia=30; baseline=median 9; IQR 4-29; weight=19.5
- about / tablet / content / paragraphCount: Elysia=66; baseline=median 13; IQR 2-65; weight=19.5
- about / tablet / media / imageCount: Elysia=0; baseline=median 22; IQR 12-64; weight=19.5
- about / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (11/19.5)
- about / tablet / density / linksPer1000Px: Elysia=2.076; baseline=median 6.82; IQR 4.61-11.43; weight=19.5
- about / tablet / density / controlsPer1000Px: Elysia=2.235; baseline=median 9.71; IQR 5.7-16.03; weight=19.5
- about / mobile / chrome / topPx: Elysia=118; baseline=median 0; IQR -2164-56; weight=19.5
- about / mobile / chrome / heightPx: Elysia=9639; baseline=median 4767; IQR 3229-6641; weight=19.5
- about / mobile / chrome / areaRatio: Elysia=11.4202; baseline=median 5.65; IQR 3.83-7.87; weight=19.5
- about / mobile / visual-tone / aquaAccentCount: Elysia=4; baseline=median 0; IQR 0-0; weight=19.5

## Lessons

- Content and legal routes should stay compact, readable, and recoverable.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
