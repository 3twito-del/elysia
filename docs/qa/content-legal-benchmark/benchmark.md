# Content Legal Benchmark

Generated: 2026-05-25T19:58:14.597Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 89%
- Metrics: 541 match, 69 mismatch, 5 not comparable
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

- about / desktop / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- about / desktop / interaction / buttonCount: Elysia=18; baseline=median 6; IQR 0-12; weight=19.5
- about / desktop / content / headingCount: Elysia=36; baseline=median 9; IQR 3-32; weight=19.5
- about / desktop / content / paragraphCount: Elysia=49; baseline=median 5; IQR 2-27; weight=19.5
- about / tablet / chrome / heightPx: Elysia=4812; baseline=median 3473; IQR 825-4225; weight=19.5
- about / tablet / chrome / areaRatio: Elysia=5.2774; baseline=median 3.86; IQR 0.92-4.69; weight=19.5
- about / tablet / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- about / tablet / interaction / buttonCount: Elysia=18; baseline=median 8; IQR 0-15; weight=19.5
- about / tablet / content / headingCount: Elysia=36; baseline=median 8; IQR 3-25; weight=19.5
- about / tablet / content / paragraphCount: Elysia=49; baseline=median 5; IQR 2-39; weight=19.5
- about / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (11/19.5)
- about / mobile / chrome / fullBleed: Elysia=false; baseline=true (15/18)
- about / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (13.5/18)
- about / mobile / content / headingCount: Elysia=36; baseline=median 7; IQR 3-25; weight=18
- about / mobile / media / imageCount: Elysia=10; baseline=median 22; IQR 12-102; weight=18
- about / mobile / commerce / priceTextPresent: Elysia=false; baseline=true (10/18)
- about / mobile / density / linksPer1000Px: Elysia=2.986; baseline=median 5.46; IQR 3.85-9.49; weight=18
- about / mobile / density / controlsPer1000Px: Elysia=3.161; baseline=median 9.49; IQR 3.85-26.67; weight=18
- faq / desktop / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- faq / desktop / media / imageCount: Elysia=0; baseline=median 12; IQR 1-56; weight=19.5
- faq / tablet / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- faq / tablet / media / imageCount: Elysia=0; baseline=median 18; IQR 8-64; weight=19.5
- faq / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (11/19.5)
- faq / mobile / chrome / fullBleed: Elysia=false; baseline=true (15/18)

## Lessons

- Content and legal routes should stay compact, readable, and recoverable.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
