# Footer Benchmark

Generated: 2026-05-24T15:23:49.078Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 85%
- Metrics: 104 match, 19 mismatch, 0 not comparable
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

- home / desktop / chrome / fullBleed: Elysia=false; baseline=true (17/19.5)
- home / desktop / visual-tone / roundedControlCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- home / desktop / visual-tone / pillLikeControlCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- home / desktop / interaction / focusableCount: Elysia=21; baseline=median 28; IQR 24-33; weight=19.5
- home / desktop / commerce / addToCartTextPresent: Elysia=true; baseline=false (15.5/19.5)
- home / desktop / commerce / checkoutTextPresent: Elysia=true; baseline=false (15.5/19.5)
- home / tablet / chrome / topPx: Elysia=3849; baseline=median 1028; IQR 27-3803; weight=19.5
- home / tablet / chrome / fullBleed: Elysia=false; baseline=true (17/19.5)
- home / tablet / visual-tone / roundedControlCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- home / tablet / visual-tone / pillLikeControlCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- home / tablet / commerce / addToCartTextPresent: Elysia=true; baseline=false (15.5/19.5)
- home / tablet / commerce / checkoutTextPresent: Elysia=true; baseline=false (15.5/19.5)
- home / mobile / chrome / fullBleed: Elysia=false; baseline=true (17/19.5)
- home / mobile / visual-tone / roundedControlCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- home / mobile / visual-tone / pillLikeControlCount: Elysia=2; baseline=median 0; IQR 0-0; weight=19.5
- home / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (10/19.5)
- home / mobile / commerce / addToCartTextPresent: Elysia=true; baseline=false (15.5/19.5)
- home / mobile / commerce / checkoutTextPresent: Elysia=true; baseline=false (15.5/19.5)
- home / mobile / density / controlsPer1000Px: Elysia=30.457; baseline=median 23.98; IQR 9.2-29.43; weight=19.5

## Lessons

- Footer should expose support, legal, and brand recovery links without card-heavy chrome.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
