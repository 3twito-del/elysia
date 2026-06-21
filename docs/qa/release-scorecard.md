# Release Scorecard

Status: tooling complete; the release is NOT READY.

Last updated: 2026-06-19.

This implements master-plan item `L-11`. The scorecard exists so that a release
cannot be labeled "Tiffany-surpassing" through prose while any required field is
missing, pending, or failing. Statuses are recorded from evidence and never
inferred from narrative.

## How it works

- Pure model: `scripts/lib/release-scorecard.ts`.
- CLI: `scripts/release-scorecard.ts` (`pnpm release:scorecard`).
- Slice gate: `scripts/release-slice-gate.ts` (`pnpm release:slice-gate`).
- Tests: `scripts/release-scorecard.test.ts`.

Every required field defaults to `MISSING`. A field only counts as satisfied
when its status is `PASS`. Any `MISSING`, `PENDING`, or `FAIL` keeps the overall
verdict at `NOT READY`.

`catalogCompleteness` and `mediaCompleteness` are derived directly from a
catalog-readiness audit artifact (`--catalog-readiness`) so the scorecard cannot
claim catalog or media completeness while `pnpm catalog:readiness` fails.

## Generate

```powershell
pnpm release:scorecard -- `
  --config docs/qa/release-scorecard-wave-0.json `
  --catalog-readiness artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json `
  --out-dir artifacts/qa/<date>-release-scorecard `
  --strict
```

`--strict` exits non-zero when the release is NOT READY, so the scorecard can be
wired into a release gate once the underlying fields can actually pass.

After owner-intake validation, owner-intake apply, scoped readiness, catalog
quality, and this scorecard all produce artifacts for the same release scope,
run:

```powershell
pnpm release:slice-gate -- --owner-intake-validation <validation.json> --owner-intake-apply <apply.json> --catalog-readiness <catalog-readiness.json> --catalog-quality <catalog-quality-report.json> --release-scorecard <release-scorecard.json> --strict
```

The slice gate is intentionally stricter than the scorecard alone: it requires
the owner-intake and catalog artifacts that prove the scoped product data was
validated, applied, and re-audited.

## Current verdict (Wave 0)

Source config: `docs/qa/release-scorecard-wave-0.json`.
Artifact: `artifacts/qa/2026-06-19-wave-0-release-scorecard/`.

| Field                | Status  |
| -------------------- | ------- |
| P0 blockers          | FAIL    |
| Catalog completeness | FAIL    |
| Media completeness   | FAIL    |
| Paid-flow proof      | MISSING |
| Supplier fulfillment | MISSING |
| Reconciliation       | MISSING |
| WCAG 2.2 AA          | MISSING |
| Core Web Vitals      | MISSING |
| Security review      | MISSING |
| Provider health      | MISSING |
| Visual matrix        | MISSING |
| Production smoke     | PASS    |
| Clean log window     | PENDING |
| Legal sign-off       | MISSING |
| Rollback readiness   | MISSING |

Required fields satisfied: `1/15`. Only production smoke is currently proven.

> Elysia is a technically mature, increasingly distinctive luxury-jewelry
> commerce product with several UX advantages. It has not yet proven complete
> brand, media, transaction, fulfillment, service, and customer-preference
> superiority over Tiffany.

## Gate position

Do not add `--strict` release scorecard to `pnpm check` or release gates yet;
the fields are owner/external-blocked and would fail every release without
producing evidence. Promote it into gating only once the underlying P0 fields
can pass.
