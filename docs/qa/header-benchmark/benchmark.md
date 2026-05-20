# Header Benchmark: High-Jewelry Alignment

Generated: 2026-05-19T20:37:39.838Z

## Summary

- Status: pass
- Active corpus: 12/12 sites produced enough data
- Alignment: 100%
- Metrics: 171 match, 0 mismatch, 0 not comparable
- Active weight: 16; threshold weight: 8

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by David Yurman.
- Tiffany & Co. replaced by Mejuri.
- Bulgari replaced by Aurate.
- Harry Winston replaced by Kendra Scott.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Messika (canonical; weight 1.5).
- Swarovski (reserve; weight 1).
- Brilliant Earth (reserve; weight 1).
- Blue Nile (reserve; weight 1).
- VRAI (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).

## Top Mismatches

- None in comparable metrics.

## Lessons

- Header remains compact, utility-led, and measurable across three viewports.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
