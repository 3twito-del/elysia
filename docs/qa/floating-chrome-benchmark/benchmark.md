# Floating Chrome Benchmark

Generated: 2026-05-28T01:30:32.830Z

## Summary

- Status: inconclusive
- Active corpus: 0/0 sites produced enough data
- Alignment: 88%
- Metrics: 138 match, 18 mismatch, 90 not comparable
- Active weight: 0; threshold weight: 0

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- None.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Van Cleef & Arpels (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Graff (canonical; weight 1.5).
- Chopard (canonical; weight 1.5).
- Boucheron (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Piaget (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Messika (canonical; weight 1.5).
- Buccellati (canonical; weight 1.5).
- De Beers (canonical; weight 1.5).
- Pomellato (canonical; weight 1.5).
- David Yurman (reserve; weight 1).
- Swarovski (reserve; weight 1).
- Mejuri (reserve; weight 1).
- Brilliant Earth (reserve; weight 1).
- Blue Nile (reserve; weight 1).
- VRAI (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).
- Aurate (reserve; weight 1).
- Kendra Scott (reserve; weight 1).

## Top Mismatches

- product / desktop / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- product / desktop / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- product / desktop / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- product / tablet / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- product / tablet / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- product / tablet / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- product / mobile / chrome / topPx: Elysia=678; baseline=median 0; IQR 0-0; weight=0
- product / mobile / chrome / heightPx: Elysia=40; baseline=median 0; IQR 0-0; weight=0
- product / mobile / density / controlsPer1000Px: Elysia=25; baseline=median 0; IQR 0-0; weight=0
- checkout / desktop / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- checkout / desktop / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- checkout / desktop / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- checkout / tablet / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- checkout / tablet / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- checkout / tablet / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- checkout / mobile / chrome / topPx: Elysia=678; baseline=median 0; IQR 0-0; weight=0
- checkout / mobile / chrome / heightPx: Elysia=40; baseline=median 0; IQR 0-0; weight=0
- checkout / mobile / density / controlsPer1000Px: Elysia=25; baseline=median 0; IQR 0-0; weight=0

## Lessons

- Cookie, accessibility, and purchase chrome must avoid covering task controls.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.

