# PLP Search Gifts Benchmark

Generated: 2026-05-25T19:58:14.597Z

## Summary

- Status: warn
- Active corpus: 15/15 sites produced enough data
- Alignment: 70%
- Metrics: 257 match, 109 mismatch, 3 not comparable
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

- category / desktop / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- category / desktop / interaction / buttonCount: Elysia=33; baseline=median 8; IQR 0-16; weight=19.5
- category / desktop / accessibility / hasAriaCurrent: Elysia=true; baseline=false (15.5/19.5)
- category / desktop / content / paragraphCount: Elysia=38; baseline=median 16; IQR 3-33; weight=19.5
- category / desktop / commerce / productLinkCount: Elysia=34; baseline=median 0; IQR 0-1; weight=19.5
- category / desktop / commerce / priceTextPresent: Elysia=true; baseline=false (10/19.5)
- category / desktop / density / linksPer1000Px: Elysia=35.044; baseline=median 8.26; IQR 3.51-18.51; weight=19.5
- category / desktop / density / controlsPer1000Px: Elysia=41.552; baseline=median 11.01; IQR 3.05-28; weight=19.5
- category / tablet / chrome / fullBleed: Elysia=false; baseline=true (18/19.5)
- category / tablet / interaction / linkCount: Elysia=49; baseline=median 23; IQR 16-35; weight=19.5
- category / tablet / interaction / buttonCount: Elysia=34; baseline=median 10; IQR 0-18; weight=19.5
- category / tablet / accessibility / hasAriaCurrent: Elysia=true; baseline=false (14/19.5)
- category / tablet / accessibility / hasAriaExpanded: Elysia=true; baseline=false (13.5/19.5)
- category / tablet / commerce / productLinkCount: Elysia=34; baseline=median 0; IQR 0-1; weight=19.5
- category / tablet / density / linksPer1000Px: Elysia=17.836; baseline=median 6.03; IQR 4.21-10.89; weight=19.5
- category / tablet / density / controlsPer1000Px: Elysia=22.932; baseline=median 9.71; IQR 4.61-15.93; weight=19.5
- category / mobile / chrome / fullBleed: Elysia=false; baseline=true (16.5/18)
- category / mobile / interaction / buttonCount: Elysia=33; baseline=median 14; IQR 8-31; weight=18
- category / mobile / accessibility / ariaLabelCount: Elysia=58; baseline=median 30; IQR 12-57; weight=18
- category / mobile / accessibility / hasAriaCurrent: Elysia=true; baseline=false (14.5/18)
- category / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (12/18)
- category / mobile / content / textLength: Elysia=2771; baseline=median 15905; IQR 5518-29569; weight=18
- category / mobile / media / imageCount: Elysia=12; baseline=median 45; IQR 18-95; weight=18
- category / mobile / commerce / productLinkCount: Elysia=34; baseline=median 0; IQR 0-0; weight=18

## Lessons

- Listing routes should surface result summary, controls, and grids before editorial content.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
