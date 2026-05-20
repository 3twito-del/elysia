# Footer Benchmark

Generated: 2026-05-19T21:12:44.943Z

## Summary

- Status: pass
- Active corpus: 14/14 sites produced enough data
- Alignment: 100%
- Metrics: 123 match, 0 mismatch, 0 not comparable
- Active weight: 18.5; threshold weight: 9.25

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by David Yurman.
- Tiffany & Co. replaced by Mejuri.
- Bulgari replaced by Brilliant Earth.
- Harry Winston replaced by VRAI.
- Chaumet replaced by Aurate.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Swarovski (reserve; weight 1).
- Blue Nile (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).
- Kendra Scott (reserve; weight 1).

## Top Mismatches

- None in comparable metrics.

## Lessons

- Footer should expose support, legal, and brand recovery links without card-heavy chrome.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
