# Checkout Benchmark

Generated: 2026-05-24T15:23:49.078Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 85%
- Metrics: 105 match, 18 mismatch, 0 not comparable
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

- checkout / desktop / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- checkout / desktop / interaction / linkCount: Elysia=13; baseline=median 27; IQR 16-92; weight=19.5
- checkout / desktop / content / paragraphCount: Elysia=37; baseline=median 16; IQR 3-33; weight=19.5
- checkout / desktop / content / formControlCount: Elysia=18; baseline=median 0; IQR 0-1; weight=19.5
- checkout / desktop / media / imageCount: Elysia=0; baseline=median 18; IQR 1-70; weight=19.5
- checkout / desktop / commerce / priceTextPresent: Elysia=true; baseline=false (10/19.5)
- checkout / tablet / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- checkout / tablet / interaction / linkCount: Elysia=13; baseline=median 23; IQR 16-35; weight=19.5
- checkout / tablet / content / formControlCount: Elysia=18; baseline=median 0; IQR 0-1; weight=19.5
- checkout / tablet / media / imageCount: Elysia=0; baseline=median 22; IQR 12-95; weight=19.5
- checkout / mobile / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- checkout / mobile / interaction / linkCount: Elysia=7; baseline=median 32; IQR 16-44; weight=19.5
- checkout / mobile / accessibility / ariaLabelCount: Elysia=3; baseline=median 38; IQR 12-57; weight=19.5
- checkout / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (13.5/19.5)
- checkout / mobile / content / textLength: Elysia=1711; baseline=median 15905; IQR 3468-29569; weight=19.5
- checkout / mobile / content / formControlCount: Elysia=18; baseline=median 0; IQR 0-1; weight=19.5
- checkout / mobile / media / imageCount: Elysia=0; baseline=median 56; IQR 18-95; weight=19.5
- checkout / mobile / density / linksPer1000Px: Elysia=2.628; baseline=median 5.46; IQR 3.85-10.03; weight=19.5

## Lessons

- Checkout is measured only through public cart and recovery surfaces, without payment submission.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
