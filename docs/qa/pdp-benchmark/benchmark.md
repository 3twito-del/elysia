# PDP Benchmark

Generated: 2026-05-27T16:02:09.958Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 82%
- Metrics: 101 match, 22 mismatch, 0 not comparable
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

- product / desktop / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / desktop / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / desktop / interaction / buttonCount: Elysia=17; baseline=median 10; IQR 0-13; weight=19.5
- product / desktop / commerce / productLinkCount: Elysia=9; baseline=median 0; IQR 0-1; weight=19.5
- product / tablet / chrome / heightPx: Elysia=6489; baseline=median 3803; IQR 900-5952; weight=19.5
- product / tablet / chrome / areaRatio: Elysia=7.1164; baseline=median 4.23; IQR 1-6.61; weight=19.5
- product / tablet / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / tablet / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / tablet / media / imageCount: Elysia=11; baseline=median 45; IQR 12-95; weight=19.5
- product / tablet / commerce / productLinkCount: Elysia=9; baseline=median 0; IQR 0-0; weight=19.5
- product / tablet / density / linksPer1000Px: Elysia=3.082; baseline=median 4.84; IQR 4.02-10.89; weight=19.5
- product / mobile / chrome / heightPx: Elysia=7116; baseline=median 4767; IQR 844-5743; weight=19.5
- product / mobile / chrome / areaRatio: Elysia=8.2151; baseline=median 5.65; IQR 1-6.81; weight=19.5
- product / mobile / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / mobile / visual-tone / transparentBackground: Elysia=false; baseline=true (16/19.5)
- product / mobile / interaction / linkCount: Elysia=14; baseline=median 32; IQR 16-40; weight=19.5
- product / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (14.5/19.5)
- product / mobile / content / textLength: Elysia=1967; baseline=median 11748; IQR 1972-29583; weight=19.5
- product / mobile / media / imageCount: Elysia=11; baseline=median 56; IQR 18-95; weight=19.5
- product / mobile / commerce / productLinkCount: Elysia=9; baseline=median 0; IQR 0-0; weight=19.5
- product / mobile / density / linksPer1000Px: Elysia=1.967; baseline=median 5.46; IQR 3.85-10.03; weight=19.5
- product / mobile / density / controlsPer1000Px: Elysia=3.794; baseline=median 8.87; IQR 3.85-18.46; weight=19.5

## Lessons

- PDP should prioritize gallery, facts, availability, and purchasing controls.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.

