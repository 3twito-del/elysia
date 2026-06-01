# Production Deployment Evidence Ledger

Status: active release evidence ledger.

Last updated: 2026-06-01.

This ledger records the latest production deployment evidence that is safe to
keep in the repository. It stores deployment URLs, aliases, command names, and
pass/fail results only. Do not add tokens, provider credentials, secret
environment values, customer data, or private dashboard screenshots.

Related documents:

- `docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md`
- `docs/FULL_PRODUCT_BENCHMARK.md`
- `docs/ENGINEERING_CONVENTIONS.md`
- `scripts/smoke.mjs`

## Latest Production Evidence

| Field               | Evidence                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence date       | 2026-06-01                                                                                                                                                                       |
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
| Error log scan      | PASS: `vercel logs https://elysia-ki7m92i44-ariel-twitos-projects.vercel.app --level error --since 1h --json` returned no error entries                                          |
| Marker checks       | PASS: `size-guide-product-return-context`, `size-guide-save-context`, `branches-online-service-continuity`, and `branches-online-recovery-links` were present in production HTML |
| Runtime data caveat | Smoke uses public/logged-out routes and documented unauthenticated API expectations only                                                                                         |
| Remaining risk      | Does not prove authenticated admin workflows, paid checkout, live supplier fulfillment, or provider secrets                                                                      |

## Verification Commands

Run these commands from the repository root when updating this ledger:

```powershell
vercel ls --yes
vercel inspect https://elysia-ki7m92i44-ariel-twitos-projects.vercel.app
vercel logs https://elysia-ki7m92i44-ariel-twitos-projects.vercel.app --level error --since 1h --json
$env:SMOKE_BASE_URL = "https://elysia-jewellery.com"; pnpm smoke
pnpm exec prettier --check docs/qa/production-deployment-evidence-ledger.md docs/MULTI_ASPECT_IMPROVEMENT_BACKLOG.md
git diff --check
```

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
