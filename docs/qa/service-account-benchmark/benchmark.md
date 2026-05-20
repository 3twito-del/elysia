# Service Account Benchmark

Generated: 2026-05-19T19:33:18.092Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 89%
- Metrics: 330 match, 39 mismatch, 0 not comparable
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

- service / desktop / visual-tone / aquaAccentCount: Elysia=6; baseline=median 0; IQR 0-0; weight=18
- service / desktop / accessibility / hasAriaCurrent: Elysia=true; baseline=false (13/18)
- service / desktop / accessibility / hasAriaExpanded: Elysia=true; baseline=false (13/18)
- service / desktop / content / formControlCount: Elysia=33; baseline=median 2; IQR 1-19; weight=18
- service / tablet / visual-tone / aquaAccentCount: Elysia=6; baseline=median 0; IQR 0-0; weight=19.5
- service / tablet / accessibility / hasAriaCurrent: Elysia=true; baseline=false (13/19.5)
- service / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (14.5/19.5)
- service / tablet / content / formControlCount: Elysia=33; baseline=median 2; IQR 1-19; weight=19.5
- service / tablet / density / linksPer1000Px: Elysia=3.425; baseline=median 5.88; IQR 4.02-6.82; weight=19.5
- service / mobile / chrome / topPx: Elysia=118; baseline=median 20; IQR 0-77; weight=19.5
- service / mobile / visual-tone / aquaAccentCount: Elysia=6; baseline=median 0; IQR 0-0; weight=19.5
- service / mobile / accessibility / hasAriaCurrent: Elysia=true; baseline=false (14.5/19.5)
- service / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (14.5/19.5)
- service / mobile / content / formControlCount: Elysia=33; baseline=median 2; IQR 1-19; weight=19.5
- service / mobile / density / linksPer1000Px: Elysia=2.398; baseline=median 5.46; IQR 3.85-7.68; weight=19.5
- account / desktop / visual-tone / aquaAccentCount: Elysia=6; baseline=median 0; IQR 0-0; weight=18
- account / desktop / accessibility / hasAriaExpanded: Elysia=true; baseline=false (13/18)
- account / desktop / content / textLength: Elysia=376; baseline=median 1151; IQR 577-11758; weight=18
- account / desktop / density / linksPer1000Px: Elysia=19.561; baseline=median 5.85; IQR 3.51-12.7; weight=18
- account / tablet / visual-tone / aquaAccentCount: Elysia=6; baseline=median 0; IQR 0-0; weight=19.5
- account / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (14.5/19.5)
- account / mobile / chrome / topPx: Elysia=118; baseline=median 20; IQR 0-77; weight=19.5
- account / mobile / visual-tone / aquaAccentCount: Elysia=6; baseline=median 0; IQR 0-0; weight=19.5
- account / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (14.5/19.5)

## Lessons

- Service and account routes should expose task surfaces early.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
