# Route-Status and Sharded Visual Audit

Status: Wave 0 QA harness upgrade added for I-305, I-307, E-08/E-09/L-02.

Generated: 2026-06-19.

## What Exists

- Route inventory carries `expectedStatuses` for visual routes.
- `/category/not-a-real-category` is recorded as an intentional recovery-state
  route with expected status `404`.
- `qa-site-audit` suppresses only the expected primary route response for the
  audited route. Same-origin asset, API, image, script, or unrelated route
  failures still count as objective findings.
- Long visual reviews can be split with `--route-shard <index>/<total>`, for
  example `--route-shard 1/4`.
- Sharding is route-based: each selected shard still runs every requested
  browser, viewport, repeat, and screenshot mode for its route subset.

## Verification

```powershell
pnpm exec vitest run scripts/qa-site-audit.test.ts scripts/qa-route-inventory.test.ts
pnpm typecheck
```

## Example Commands

Representative recovery-aware audit:

```powershell
pnpm exec tsx scripts/qa-site-audit.ts --base-url http://localhost:3000 --browsers chromium --viewports mobile --screenshots failures
```

All-product visual review split across four shards:

```powershell
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 1/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-1
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 2/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-2
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 3/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-3
pnpm exec tsx scripts/qa-site-audit.ts --all-products --route-shard 4/4 --browsers chromium --viewports desktop,tablet,mobile --screenshots all --out-dir artifacts/qa/<date>-all-products-shard-4
```
