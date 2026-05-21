# Header Benchmark: High-Jewelry Alignment

Generated: 2026-05-21T16:03:24.698Z

## Summary

- Status: local-only
- Active corpus: 0/0 sites produced enough data
- Alignment: 64%
- Metrics: 54 match, 30 mismatch, 87 not comparable
- Active weight: 0; threshold weight: 0

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- None.

## Blocked Sites

- None.

## Top Mismatches

- home / desktop / chrome / heightPx: Elysia=98; baseline=median 0; IQR 0-0; weight=0
- home / desktop / interaction / linkCount: Elysia=9; baseline=median 0; IQR 0-0; weight=0
- home / desktop / interaction / buttonCount: Elysia=4; baseline=median 0; IQR 0-0; weight=0
- home / desktop / interaction / focusableCount: Elysia=9; baseline=median 0; IQR 0-0; weight=0
- home / desktop / accessibility / ariaLabelCount: Elysia=3; baseline=median 0; IQR 0-0; weight=0
- home / desktop / content / textLength: Elysia=214; baseline=median 0; IQR 0-0; weight=0
- home / desktop / density / linksPer1000Px: Elysia=91.837; baseline=median 0; IQR 0-0; weight=0
- home / desktop / density / controlsPer1000Px: Elysia=91.837; baseline=median 0; IQR 0-0; weight=0
- home / desktop / chrome / headerHeightPx: Elysia=98; baseline=median 0; IQR 0-0; weight=0
- home / desktop / navigation / navVisibleLinkCount: Elysia=9; baseline=median 0; IQR 0-0; weight=0
- home / tablet / chrome / heightPx: Elysia=68; baseline=median 0; IQR 0-0; weight=0
- home / tablet / interaction / linkCount: Elysia=9; baseline=median 0; IQR 0-0; weight=0
- home / tablet / interaction / buttonCount: Elysia=4; baseline=median 0; IQR 0-0; weight=0
- home / tablet / interaction / focusableCount: Elysia=9; baseline=median 0; IQR 0-0; weight=0
- home / tablet / accessibility / ariaLabelCount: Elysia=3; baseline=median 0; IQR 0-0; weight=0
- home / tablet / content / textLength: Elysia=214; baseline=median 0; IQR 0-0; weight=0
- home / tablet / density / linksPer1000Px: Elysia=132.353; baseline=median 0; IQR 0-0; weight=0
- home / tablet / density / controlsPer1000Px: Elysia=132.353; baseline=median 0; IQR 0-0; weight=0
- home / tablet / chrome / headerHeightPx: Elysia=68; baseline=median 0; IQR 0-0; weight=0
- home / tablet / navigation / navVisibleLinkCount: Elysia=9; baseline=median 0; IQR 0-0; weight=0
- home / mobile / chrome / heightPx: Elysia=64; baseline=median 0; IQR 0-0; weight=0
- home / mobile / interaction / linkCount: Elysia=3; baseline=median 0; IQR 0-0; weight=0
- home / mobile / interaction / buttonCount: Elysia=3; baseline=median 0; IQR 0-0; weight=0
- home / mobile / interaction / focusableCount: Elysia=4; baseline=median 0; IQR 0-0; weight=0

## Lessons

- Header remains compact, utility-led, and measurable across three viewports.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.
