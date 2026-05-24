# PDP Benchmark

Generated: 2026-05-24T18:11:04.807Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 79%
- Metrics: 97 match, 26 mismatch, 0 not comparable
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

- product / desktop / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / desktop / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / desktop / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- product / desktop / interaction / buttonCount: Elysia=32; baseline=median 8; IQR 0-16; weight=19.5
- product / desktop / content / paragraphCount: Elysia=42; baseline=median 16; IQR 3-33; weight=19.5
- product / desktop / commerce / productLinkCount: Elysia=36; baseline=median 0; IQR 0-1; weight=19.5
- product / desktop / commerce / priceTextPresent: Elysia=true; baseline=false (10/19.5)
- product / tablet / chrome / heightPx: Elysia=7709; baseline=median 3830; IQR 900-5969; weight=19.5
- product / tablet / chrome / areaRatio: Elysia=8.4539; baseline=median 4.26; IQR 1-6.63; weight=19.5
- product / tablet / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / tablet / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / tablet / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- product / tablet / interaction / linkCount: Elysia=47; baseline=median 24; IQR 16-36; weight=19.5
- product / tablet / interaction / buttonCount: Elysia=32; baseline=median 13; IQR 0-18; weight=19.5
- product / tablet / content / paragraphCount: Elysia=42; baseline=median 13; IQR 3-39; weight=19.5
- product / tablet / media / imageCount: Elysia=14; baseline=median 56; IQR 18-95; weight=19.5
- product / tablet / commerce / productLinkCount: Elysia=36; baseline=median 0; IQR 0-1; weight=19.5
- product / mobile / chrome / heightPx: Elysia=10349; baseline=median 4767; IQR 844-5743; weight=19.5
- product / mobile / chrome / areaRatio: Elysia=11.9479; baseline=median 5.65; IQR 1-6.81; weight=19.5
- product / mobile / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- product / mobile / visual-tone / transparentBackground: Elysia=false; baseline=true (15/19.5)
- product / mobile / visual-tone / aquaAccentCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- product / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (13.5/19.5)
- product / mobile / content / textLength: Elysia=3425; baseline=median 15905; IQR 3447-29569; weight=19.5

## Lessons

- PDP should prioritize gallery, facts, availability, and purchasing controls.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
