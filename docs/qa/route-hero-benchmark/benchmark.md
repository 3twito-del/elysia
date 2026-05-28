# Route Hero Benchmark

Generated: 2026-05-28T01:48:27.017Z

## Summary

- Status: pass
- Active corpus: 13/13 sites produced enough data
- Alignment: 95%
- Metrics: 323 match, 17 mismatch, 8 not comparable
- Active weight: 17.5; threshold weight: 8.75

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by David Yurman.
- Tiffany & Co. replaced by Mejuri.
- Bulgari replaced by Blue Nile.
- Harry Winston replaced by Kendra Scott.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Swarovski (reserve; weight 1).
- Brilliant Earth (reserve; weight 1).
- VRAI (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).
- Aurate (reserve; weight 1).

## Top Mismatches

- category / desktop / chrome / topPx: Elysia=138; baseline=median 0; IQR -3731-125; weight=17.5
- category / tablet / chrome / topPx: Elysia=108; baseline=median 0; IQR -3536-56; weight=17.5
- category / mobile / chrome / semanticTag: Elysia="section"; baseline="main" (9.5/17.5)
- category / mobile / chrome / topPx: Elysia=104; baseline=median 0; IQR -3392-56; weight=17.5
- category / mobile / interaction / minTapTargetPx: Elysia=0; baseline=median 16; IQR 6-20; weight=17.5
- category / mobile / accessibility / ariaLabelCount: Elysia=0; baseline=median 32; IQR 12-57; weight=17.5
- search / tablet / chrome / topPx: Elysia=68; baseline=median 0; IQR -3536-56; weight=17.5
- search / mobile / chrome / semanticTag: Elysia="section"; baseline="main" (9.5/17.5)
- search / mobile / chrome / topPx: Elysia=64; baseline=median 0; IQR -3392-56; weight=17.5
- search / mobile / interaction / minTapTargetPx: Elysia=0; baseline=median 16; IQR 6-20; weight=17.5
- search / mobile / accessibility / ariaLabelCount: Elysia=0; baseline=median 32; IQR 12-57; weight=17.5
- service / mobile / chrome / semanticTag: Elysia="section"; baseline="main" (9.5/17.5)
- service / mobile / interaction / minTapTargetPx: Elysia=0; baseline=median 16; IQR 6-20; weight=17.5
- service / mobile / accessibility / ariaLabelCount: Elysia=0; baseline=median 32; IQR 12-57; weight=17.5
- privacy / mobile / chrome / semanticTag: Elysia="section"; baseline="main" (9.5/17.5)
- privacy / mobile / interaction / minTapTargetPx: Elysia=0; baseline=median 16; IQR 6-20; weight=17.5
- privacy / mobile / accessibility / ariaLabelCount: Elysia=0; baseline=median 32; IQR 12-57; weight=17.5

## Lessons

- Task routes should keep heroes compact and avoid adjacent same-page CTA noise.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.

