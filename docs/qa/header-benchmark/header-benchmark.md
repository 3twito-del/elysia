# Header Benchmark: High-Jewelry Alignment

Generated: 2026-05-24T18:11:04.807Z

## Summary

- Status: pass
- Active corpus: 12/12 sites produced enough data
- Alignment: 85%
- Metrics: 146 match, 25 mismatch, 0 not comparable
- Active weight: 16; threshold weight: 8

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- Cartier replaced by David Yurman.
- Tiffany & Co. replaced by Mejuri.
- Bulgari replaced by Aurate.
- Harry Winston replaced by Kendra Scott.

## Blocked Sites

- Cartier (canonical; weight 1.5).
- Tiffany & Co. (canonical; weight 1.5).
- Bulgari (canonical; weight 1.5).
- Harry Winston (canonical; weight 1.5).
- Chaumet (canonical; weight 1.5).
- Mikimoto (canonical; weight 1.5).
- Messika (canonical; weight 1.5).
- Swarovski (reserve; weight 1).
- Brilliant Earth (reserve; weight 1).
- Blue Nile (reserve; weight 1).
- VRAI (reserve; weight 1).
- Monica Vinader (reserve; weight 1).
- Pandora US (reserve; weight 1).

## Top Mismatches

- home / desktop / chrome / fullBleed: Elysia=false; baseline=true (14.5/16)
- home / desktop / chrome / hasBorder: Elysia=true; baseline=false (14.5/16)
- home / desktop / visual-tone / transparentBackground: Elysia=true; baseline=false (8.5/16)
- home / desktop / interaction / linkCount: Elysia=9; baseline=median 4; IQR 1-8; weight=16
- home / desktop / accessibility / hasAriaExpanded: Elysia=false; baseline=true (9/16)
- home / desktop / media / imageCount: Elysia=0; baseline=median 63; IQR 1-104; weight=16
- home / desktop / chrome / headerAtViewportTop: Elysia=true; baseline=false (9.5/16)
- home / desktop / brand / brandWordmarkOnly: Elysia=true; baseline=false (13/16)
- home / desktop / navigation / desktopNavVisible: Elysia=true; baseline=false (8.5/16)
- home / desktop / navigation / navVisibleLinkCount: Elysia=9; baseline=median 4; IQR 1-8; weight=16
- home / tablet / chrome / fullBleed: Elysia=false; baseline=true (13.5/16)
- home / tablet / chrome / hasBorder: Elysia=true; baseline=false (14.5/16)
- home / tablet / interaction / linkCount: Elysia=9; baseline=median 2; IQR 1-7; weight=16
- home / tablet / accessibility / hasAriaExpanded: Elysia=false; baseline=true (9/16)
- home / tablet / media / imageCount: Elysia=0; baseline=median 63; IQR 1-104; weight=16
- home / tablet / density / linksPer1000Px: Elysia=132.353; baseline=median 42.55; IQR 11.91-90.91; weight=16
- home / tablet / chrome / headerAtViewportTop: Elysia=true; baseline=false (9.5/16)
- home / tablet / brand / brandWordmarkOnly: Elysia=true; baseline=false (13/16)
- home / tablet / navigation / desktopNavVisible: Elysia=true; baseline=false (9.5/16)
- home / tablet / navigation / navVisibleLinkCount: Elysia=9; baseline=median 2; IQR 1-7; weight=16
- home / tablet / interaction / mobileNavTriggerVisible: Elysia=false; baseline=true (10.5/16)
- home / mobile / chrome / fullBleed: Elysia=false; baseline=true (13.5/15)
- home / mobile / chrome / hasBorder: Elysia=true; baseline=false (13.5/15)
- home / mobile / media / imageCount: Elysia=0; baseline=median 44; IQR 1-104; weight=15

## Lessons

- Header remains compact, utility-led, and measurable across three viewports.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
