# Floating Chrome Benchmark

Generated: 2026-05-28T11:27:21.617Z

## Summary

- Status: local-only
- Active corpus: 0/0 sites produced enough data
- Alignment: 88%
- Metrics: 138 match, 18 mismatch, 90 not comparable
- Active weight: 0; threshold weight: 0

This benchmark measures Elysia against the high-jewelry QA corpus. Reserve-site substitutions affect QA reports only and do not change the High Jewelry Reference Gate.

## Corpus Substitutions

- None.

## Blocked Sites

- None.

## Top Mismatches

- product / desktop / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- product / desktop / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- product / desktop / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- product / tablet / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- product / tablet / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- product / tablet / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- product / mobile / chrome / topPx: Elysia=678; baseline=median 0; IQR 0-0; weight=0
- product / mobile / chrome / heightPx: Elysia=40; baseline=median 0; IQR 0-0; weight=0
- product / mobile / density / controlsPer1000Px: Elysia=25; baseline=median 0; IQR 0-0; weight=0
- checkout / desktop / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- checkout / desktop / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- checkout / desktop / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- checkout / tablet / chrome / topPx: Elysia=714; baseline=median 0; IQR 0-0; weight=0
- checkout / tablet / chrome / heightPx: Elysia=44; baseline=median 0; IQR 0-0; weight=0
- checkout / tablet / density / controlsPer1000Px: Elysia=22.727; baseline=median 0; IQR 0-0; weight=0
- checkout / mobile / chrome / topPx: Elysia=678; baseline=median 0; IQR 0-0; weight=0
- checkout / mobile / chrome / heightPx: Elysia=40; baseline=median 0; IQR 0-0; weight=0
- checkout / mobile / density / controlsPer1000Px: Elysia=25; baseline=median 0; IQR 0-0; weight=0

## Lessons

- Cookie, accessibility, and purchase chrome must avoid covering task controls.

## Implementation Recommendations

- Treat mismatches as candidates for review through the Public Change Gate, not direct implementation instructions.
- Prioritize changes only when they improve task clarity, accessibility, or commerce completion without weakening luxury restraint.

## Schema

The JSON artifact contains `canonicalCorpus`, `activeCorpus`, `substitutions`, `blockedSites`, `activeWeight`, `thresholdWeight`, `viewports`, `sites`, `elysia`, `metrics`, and `summary`.
Each metric includes `key`, `group`, `targetLabel`, `viewport`, `elysiaValue`, `corpusBaseline`, `matchStatus`, `evidenceSiteCount`, and `evidenceWeight`.

