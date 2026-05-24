# Content Legal Benchmark

Generated: 2026-05-24T18:11:04.807Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 88%
- Metrics: 541 match, 74 mismatch, 0 not comparable
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
- about / tablet / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- about / tablet / interaction / buttonCount: Elysia=18; baseline=median 10; IQR 0-15; weight=19.5
- about / tablet / content / headingCount: Elysia=36; baseline=median 9; IQR 4-29; weight=19.5
- about / tablet / content / paragraphCount: Elysia=49; baseline=median 5; IQR 2-39; weight=19.5
- about / tablet / media / imageCount: Elysia=10; baseline=median 22; IQR 12-102; weight=19.5
- about / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (12.5/19.5)
- about / mobile / chrome / heightPx: Elysia=5834; baseline=median 4275; IQR 844-5743; weight=19.5
- about / mobile / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- about / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (15/19.5)
- about / mobile / content / headingCount: Elysia=36; baseline=median 8; IQR 3-33; weight=19.5
- about / mobile / media / imageCount: Elysia=10; baseline=median 45; IQR 12-102; weight=19.5
- about / mobile / commerce / priceTextPresent: Elysia=false; baseline=true (11.5/19.5)
- about / mobile / density / linksPer1000Px: Elysia=2.914; baseline=median 5.87; IQR 3.85-9.49; weight=19.5
- about / mobile / density / controlsPer1000Px: Elysia=3.085; baseline=median 9.49; IQR 3.85-26.67; weight=19.5
- faq / desktop / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- faq / desktop / media / imageCount: Elysia=0; baseline=median 12; IQR 1-56; weight=19.5
- faq / tablet / chrome / fullBleed: Elysia=false; baseline=true (16.5/19.5)
- faq / tablet / interaction / linkCount: Elysia=14; baseline=median 23; IQR 16-35; weight=19.5
- faq / tablet / media / imageCount: Elysia=0; baseline=median 22; IQR 12-102; weight=19.5
- faq / tablet / commerce / priceTextPresent: Elysia=false; baseline=true (12.5/19.5)

## Lessons

- Content and legal routes should stay compact, readable, and recoverable.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
