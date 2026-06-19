# Catalog Quality Report

Status: tooling complete (master plan C-08). The catalog itself is still FAIL.

Last updated: 2026-06-19.

This implements master-plan item `C-08`. It turns a catalog-readiness audit
artifact into an owner-facing rollup so blockers can be routed to the right
owner — by finding code and by product class — before a customer encounters
them. It reorganizes existing audit findings only; it invents no facts.

## How it works

- Pure model: `scripts/lib/catalog-quality-report.ts`.
- CLI: `scripts/catalog-quality-report.ts` (`pnpm catalog:quality`).
- Tests: `scripts/catalog-quality-report.test.ts`.

## Generate

```powershell
pnpm catalog:readiness -- --source database --out-dir artifacts/qa/<date>-readiness
pnpm catalog:quality -- `
  --audit artifacts/qa/<date>-readiness/catalog-readiness.json `
  --out-dir artifacts/qa/<date>-catalog-quality `
  --strict
```

`--strict` exits non-zero while the audit is not ready, so the report can be
wired into an owner review without manually transcribing findings.

## Current rollup (Wave 0)

Source: `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json`.
Artifact: `artifacts/qa/2026-06-19-wave-0-catalog-quality/`.

300 products audited, 0 publish-ready, 874 blockers, 2,426 high findings. The
generated rollup matches the manually authored breakdown in
`docs/qa/catalog-readiness-remediation-plan.md`, so that breakdown is now
reproducible by command instead of by hand.

| Owner role                          | Blocking finding codes                                         |
| ----------------------------------- | -------------------------------------------------------------- |
| Merchandising / product truth owner | `FACT_VERIFICATION_MISSING`, `STRUCTURED_SPECIFICATIONS_MISSING` |
| Legal / operations owner            | `POLICY_VERIFICATION_MISSING`                                  |
| Creative / catalog operations       | `LOCAL_MEDIA_FILE_MISSING`, `MEDIA_*`                          |

The remaining work behind these findings is owner/asset debt (verified facts,
approved policy, real product media) and is not solvable by code.
