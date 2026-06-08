# Production Deployment Evidence Ledger

Status: active release evidence ledger.

Last updated: 2026-06-01.

This ledger records the latest production deployment evidence that is safe to
keep in the repository. It stores deployment URLs, aliases, command names, and
pass/fail results only. Do not add tokens, provider credentials, secret
environment values, customer data, or private dashboard screenshots.

Related documents:

- `docs/PROJECT_TASKS.md`
- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/ENGINEERING_CONVENTIONS.md`
- `scripts/smoke.mjs`

## Latest Production Evidence

| Field               | Evidence                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence date       | 2026-06-01                                                                                                                                                                       |
| Branch              | `qa/full-site-hardening`                                                                                                                                                         |
| Commit SHA          | Pending next production release update                                                                                                                                           |
| Vercel project      | `ariel-twitos-projects/elysia`                                                                                                                                                   |
| Deployment URL      | `https://elysia-ki7m92i44-ariel-twitos-projects.vercel.app`                                                                                                                      |
| Deployment ID       | `dpl_QpPFbYnWAFn2qteRhRiX3LmWNgd1`                                                                                                                                               |
| Target              | Production                                                                                                                                                                       |
| Status              | Ready                                                                                                                                                                            |
| Created             | 2026-06-01 05:11:23 Asia/Jerusalem                                                                                                                                               |
| Production alias    | `https://elysia-jewellery.com`                                                                                                                                                   |
| Additional aliases  | `https://elysia-ariel-twitos-projects.vercel.app`, `https://elysia-3twito-9803-ariel-twitos-projects.vercel.app`                                                                 |
| Smoke command       | `SMOKE_BASE_URL=https://elysia-jewellery.com pnpm smoke`                                                                                                                         |
| Smoke result        | PASS: 34 checks passed across health, public, checkout, account, API, and admin smoke routes                                                                                     |
| Health result       | PASS: `/api/health` returned 200 during smoke                                                                                                                                    |
| Error log scan      | PASS: `vercel logs https://elysia-ki7m92i44-ariel-twitos-projects.vercel.app --level error --since 1h --json` returned no error entries                                          |
| Error-log window    | PASS: clean 60-minute production error-log window after deployment alias verification                                                                                            |
| Marker checks       | PASS: `size-guide-product-return-context`, `size-guide-save-context`, `branches-online-service-continuity`, and `branches-online-recovery-links` were present in production HTML |
| Runtime data caveat | Smoke uses public/logged-out routes and documented unauthenticated API expectations only                                                                                         |
| Remaining risk      | Does not prove authenticated admin workflows, paid checkout, live supplier fulfillment, or provider secrets                                                                      |

## Required Release Evidence Fields

Every production release note or ledger update must record:

- Branch name.
- Commit SHA.
- Deployment URL.
- Deployment ID.
- Deployment target.
- Production alias URL.
- Alias verification result from `vercel inspect`.
- Health check result against the production alias.
- Smoke command and result.
- Error-log scan command and result.
- Minimum clean error-log window, currently `60 minutes` after production alias
  verification.
- Residual risk that remains outside repository verification.

## Verification Commands

Run these commands from the repository root when updating this ledger:

```powershell
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD
vercel ls --yes
vercel inspect https://elysia-ki7m92i44-ariel-twitos-projects.vercel.app
vercel logs https://elysia-ki7m92i44-ariel-twitos-projects.vercel.app --level error --since 1h --json
$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"; pnpm smoke
pnpm exec prettier --check docs/qa/production-deployment-evidence-ledger.md docs/PROJECT_TASKS.md
git diff --check
```

## Post-Deploy Error-Log Rule

Do not mark release evidence complete until the production deployment has a
clean Vercel error-log scan for at least `60 minutes` after the production
alias points at the inspected deployment. If an error appears, record the
command, the affected route or function if known, and rerun the clean window
after the fix is deployed.

Repeatable log scan command:

```powershell
vercel logs <deployment-url> --level error --since 1h --json
```

## Rollback Decision Tree

1. If the production alias points to a deployment with customer-visible 5xx
   errors, broken checkout, or provider webhook failures, run
   `vercel rollback <deployment-url>` to restore the last known-good production
   deployment.
2. If the candidate deployment is healthy but the alias still points to an older
   deployment, run `vercel promote <deployment-url>` and then repeat smoke,
   health, and log checks.
3. If the deployment failed before readiness or has build/runtime errors, fix
   the branch, redeploy, and start a new ledger entry instead of promoting or
   rolling back blindly.
4. Record the chosen action, operator, command, resulting alias target, and
   residual risk in this ledger or the release note.

## Smoke Route Summary

The latest production smoke command passed the following route groups:

| Route group               | Evidence                                                                      |
| ------------------------- | ----------------------------------------------------------------------------- |
| Health                    | `/api/health` returned 200                                                    |
| Public navigation         | `/`, `/branches`, `/gifts`, `/ai`, `/stylist`, `/about`, `/faq` returned 200  |
| Legal and accessibility   | `/privacy`, `/terms`, `/accessibility` returned 200                           |
| Discovery and commerce    | `/search`, filtered search, categories, one PDP, and `/checkout` returned 200 |
| Logged-out account        | `/account` returned 200 and `/account/privacy/export` returned 401            |
| API negative paths        | `/api/chat` returned 400 and `/api/webhooks/cardcom` returned 401             |
| Admin logged-out surfaces | Admin login and protected admin routes returned expected 200 responses        |

## Update Rules

- Update this ledger only after a production deployment has been inspected or a
  production smoke run has completed.
- Keep the production alias explicit so smoke evidence is tied to
  `https://elysia-jewellery.com`, not only to a generated deployment URL.
- Replace the deployment URL and ID together.
- Record only command names and pass/fail summaries; keep raw logs out of this
  file unless they are short and contain no secrets.
