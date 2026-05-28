# Product Card Benchmark

Generated: 2026-05-28T11:27:21.617Z

## Summary

- Status: pass
- Active corpus: 3/3 sites produced enough data
- Alignment: 81%
- Metrics: 388 match, 92 mismatch, 12 not comparable
- Active weight: 3.5; threshold weight: 1.75

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by Mejuri.
- Tiffany & Co. replaced by Aurate.

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
- Buccellati (canonical; weight 1.5).
- De Beers (canonical; weight 1.5).
- Pomellato (canonical; weight 1.5).
- David Yurman (reserve; weight 1).
- Swarovski (reserve; weight 1).
- Brilliant Earth (reserve; weight 1).
- Blue Nile (reserve; weight 1).
- VRAI (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).
- Kendra Scott (reserve; weight 1).

## Top Mismatches

- home / desktop / chrome / semanticTag: Elysia="div"; baseline="article" (2.5/3.5)
- home / desktop / chrome / topPx: Elysia=3187; baseline=median 1100; IQR -2815-2135; weight=3.5
- home / desktop / content / headingCount: Elysia=8; baseline=median 4; IQR 0-4; weight=3.5
- home / desktop / commerce / priceTextPresent: Elysia=true; baseline=false (2.5/3.5)
- home / desktop / commerce / addToCartTextPresent: Elysia=false; baseline=true (2.5/3.5)
- home / desktop / commerce / checkoutTextPresent: Elysia=false; baseline=true (2.5/3.5)
- home / tablet / chrome / semanticTag: Elysia="div"; baseline="article" (2.5/3.5)
- home / tablet / chrome / topPx: Elysia=4496; baseline=median 922; IQR -2678-1112; weight=3.5
- home / tablet / chrome / heightPx: Elysia=587; baseline=median 286; IQR 277-433; weight=3.5
- home / tablet / content / headingCount: Elysia=8; baseline=median 4; IQR 0-4; weight=3.5
- home / tablet / commerce / priceTextPresent: Elysia=true; baseline=false (2.5/3.5)
- home / tablet / commerce / addToCartTextPresent: Elysia=false; baseline=true (2.5/3.5)
- home / tablet / commerce / checkoutTextPresent: Elysia=false; baseline=true (2.5/3.5)
- home / tablet / density / linksPer1000Px: Elysia=6.818; baseline=median 14.42; IQR 13.97-87.78; weight=3.5
- home / mobile / chrome / topPx: Elysia=3887; baseline=median -3141; IQR -3141-1516; weight=2.5
- home / mobile / chrome / heightPx: Elysia=434; baseline=median 421; IQR 251-421; weight=2.5
- home / mobile / content / headingCount: Elysia=8; baseline=median 4; IQR 0-4; weight=2.5
- home / mobile / commerce / addToCartTextPresent: Elysia=false; baseline=true (2.5/2.5)
- home / mobile / commerce / checkoutTextPresent: Elysia=false; baseline=true (2.5/2.5)
- home / mobile / density / linksPer1000Px: Elysia=9.221; baseline=median 9.49; IQR 9.49-143.44; weight=2.5
- category / desktop / chrome / semanticTag: Elysia="div"; baseline="article" (2.5/3.5)
- category / desktop / chrome / heightPx: Elysia=585; baseline=median 376; IQR 370-549; weight=3.5
- category / desktop / content / headingCount: Elysia=12; baseline=median 4; IQR 0-4; weight=3.5
- category / desktop / commerce / priceTextPresent: Elysia=true; baseline=false (2.5/3.5)

## Lessons

- Product cards should keep media, product facts, price/status, and actions scannable.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.

