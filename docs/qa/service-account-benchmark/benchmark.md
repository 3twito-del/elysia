# Service Account Benchmark

Generated: 2026-05-24T15:23:49.078Z

## Summary

- Status: pass
- Active corpus: 15/15 sites produced enough data
- Alignment: 87%
- Metrics: 317 match, 46 mismatch, 6 not comparable
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

- service / desktop / chrome / fullBleed: Elysia=false; baseline=true (12/18)
- service / desktop / interaction / focusableCount: Elysia=35; baseline=median 10; IQR 4-30; weight=18
- service / desktop / content / paragraphCount: Elysia=27; baseline=median 3; IQR 2-18; weight=18
- service / desktop / content / formControlCount: Elysia=21; baseline=median 1; IQR 1-1; weight=18
- service / tablet / chrome / fullBleed: Elysia=false; baseline=true (11/19.5)
- service / tablet / interaction / focusableCount: Elysia=35; baseline=median 10; IQR 2-30; weight=19.5
- service / tablet / content / paragraphCount: Elysia=27; baseline=median 3; IQR 0-13; weight=19.5
- service / tablet / content / formControlCount: Elysia=21; baseline=median 1; IQR 1-1; weight=19.5
- service / tablet / commerce / addToCartTextPresent: Elysia=true; baseline=false (10.5/19.5)
- service / tablet / commerce / checkoutTextPresent: Elysia=true; baseline=false (10.5/19.5)
- service / mobile / chrome / fullBleed: Elysia=false; baseline=true (12/19.5)
- service / mobile / accessibility / hasAriaExpanded: Elysia=true; baseline=false (17/19.5)
- service / mobile / content / paragraphCount: Elysia=27; baseline=median 3; IQR 0-13; weight=19.5
- service / mobile / content / formControlCount: Elysia=21; baseline=median 1; IQR 0-2; weight=19.5
- service / mobile / commerce / addToCartTextPresent: Elysia=true; baseline=false (11.5/19.5)
- service / mobile / commerce / checkoutTextPresent: Elysia=true; baseline=false (11.5/19.5)
- account / desktop / chrome / fullBleed: Elysia=false; baseline=true (12/18)
- account / desktop / content / formControlCount: Elysia=3; baseline=median 1; IQR 1-1; weight=18
- account / tablet / chrome / fullBleed: Elysia=false; baseline=true (11/19.5)
- account / tablet / content / paragraphCount: Elysia=15; baseline=median 3; IQR 0-13; weight=19.5
- account / tablet / content / formControlCount: Elysia=3; baseline=median 1; IQR 1-1; weight=19.5
- account / tablet / commerce / addToCartTextPresent: Elysia=true; baseline=false (10.5/19.5)
- account / tablet / commerce / checkoutTextPresent: Elysia=true; baseline=false (10.5/19.5)
- account / tablet / density / linksPer1000Px: Elysia=9.298; baseline=median 4.96; IQR 0-6.03; weight=19.5

## Lessons

- Service and account routes should expose task surfaces early.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
