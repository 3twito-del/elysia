# AI Stylist Benchmark

Generated: 2026-05-24T18:11:04.807Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 83%
- Metrics: 205 match, 41 mismatch, 0 not comparable
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

- ai / desktop / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- ai / desktop / interaction / linkCount: Elysia=9; baseline=median 27; IQR 16-95; weight=19.5
- ai / desktop / content / textLength: Elysia=865; baseline=median 11748; IQR 1057-17214; weight=19.5
- ai / desktop / media / imageCount: Elysia=0; baseline=median 18; IQR 1-70; weight=19.5
- ai / tablet / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- ai / tablet / interaction / linkCount: Elysia=9; baseline=median 24; IQR 16-36; weight=19.5
- ai / tablet / accessibility / ariaLabelCount: Elysia=6; baseline=median 38; IQR 12-86; weight=19.5
- ai / tablet / content / textLength: Elysia=865; baseline=median 11748; IQR 1581-34225; weight=19.5
- ai / tablet / media / imageCount: Elysia=0; baseline=median 56; IQR 18-95; weight=19.5
- ai / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (14/19.5)
- ai / mobile / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- ai / mobile / interaction / linkCount: Elysia=3; baseline=median 32; IQR 16-44; weight=19.5
- ai / mobile / interaction / focusableCount: Elysia=13; baseline=median 47; IQR 16-75; weight=19.5
- ai / mobile / accessibility / ariaLabelCount: Elysia=6; baseline=median 37; IQR 12-57; weight=19.5
- ai / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (13.5/19.5)
- ai / mobile / content / textLength: Elysia=865; baseline=median 15905; IQR 4184-29569; weight=19.5
- ai / mobile / media / imageCount: Elysia=0; baseline=median 56; IQR 18-95; weight=19.5
- ai / mobile / commerce / priceTextPresent: Elysia=false; baseline=true (13/19.5)
- ai / mobile / density / linksPer1000Px: Elysia=2.122; baseline=median 5.46; IQR 3.85-12.88; weight=19.5
- stylist / desktop / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- stylist / desktop / interaction / linkCount: Elysia=9; baseline=median 27; IQR 16-95; weight=19.5
- stylist / desktop / content / textLength: Elysia=914; baseline=median 11748; IQR 1057-17214; weight=19.5
- stylist / desktop / media / imageCount: Elysia=0; baseline=median 18; IQR 1-70; weight=19.5
- stylist / tablet / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)

## Lessons

- AI/stylist remains a demoted service capability with tool-first surfaces.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
