# Catalog Readiness Remediation Plan

Status: Wave 0 remediation plan, not completion evidence.

Last updated: 2026-06-19.

Source evidence:

- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.md`
- `docs/qa/catalog-readiness-wave-0-baseline.md`

Owner intake:

- `docs/qa/catalog-owner-intake-template.md`
- `pnpm catalog:intake -- --audit <catalog-readiness.json> --per-class 6 --include-named --release-scope wave-0-priority --out artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv`
- `pnpm catalog:intake:validate -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-catalog-owner-intake-validation`
- `pnpm catalog:readiness -- --source database --scope-file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-wave-0-priority-readiness-strict`

This plan translates the current failing catalog-readiness audit into owner
work packages. It does not assert that the audited database is production truth;
it records the repository-verifiable state of the database source used for the
Wave 0 audit.

## Current Audit Snapshot

| Metric                      |                         Current result |
| --------------------------- | -------------------------------------: |
| Active products audited     |                                    300 |
| Publish-ready products      |                                      0 |
| Blockers                    |                                    874 |
| High-severity findings      |                                  2,426 |
| Medium findings             |                                      0 |
| Info findings               |                                      0 |
| Product source distribution |        300 `OWN`, 0 `DROPSHIP_SHOPIFY` |
| Media count distribution    | 300 products with exactly 1 media item |

## Finding Breakdown

| Severity | Code                                       | Count | Affected products | Primary owner role                  | Remediation route                                                                                                             |
| -------- | ------------------------------------------ | ----: | ----------------: | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Blocker  | `FACT_VERIFICATION_MISSING`                |   300 |               300 | Merchandising / product truth owner | Add governed source reference, verifier, and verification date for product facts.                                             |
| Blocker  | `POLICY_VERIFICATION_MISSING`              |   300 |               300 | Legal / operations owner            | Add governed source reference, verifier, and verification date for product-level delivery, return, care, and warranty policy. |
| Blocker  | `LOCAL_MEDIA_FILE_MISSING`                 |   274 |               274 | Creative / catalog operations       | Replace stale local media URLs or unpublish until truthful media exists.                                                      |
| High     | `MEDIA_ROLE_MISSING`                       | 1,500 |               300 | Creative / catalog operations       | Add the five missing non-primary media roles per product.                                                                     |
| High     | `MEDIA_SET_INCOMPLETE`                     |   300 |               300 | Creative / catalog operations       | Provide at least six decision-useful media items per product.                                                                 |
| High     | `MEDIA_URL_SHARED_ACROSS_PRODUCTS`         |   300 |               300 | Creative / catalog operations       | Ensure unrelated products do not share the same stored media URL.                                                             |
| High     | `STRUCTURED_SPECIFICATIONS_MISSING`        |   300 |               300 | Merchandising / product truth owner | Add country, manufacturer/importer, material details, measurements, and stone details where applicable.                       |
| High     | `MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS` |    26 |                26 | Creative / catalog operations       | Replace duplicated local content hash group with product-specific assets or quarantine affected products.                     |

## Product-Class Breakdown

| Product class from slug | Products | Local media missing | Duplicate content hash | Notes                                                                                                            |
| ----------------------- | -------: | ------------------: | ---------------------: | ---------------------------------------------------------------------------------------------------------------- |
| `bracelet`              |       74 |                  49 |                     25 | 25 bracelet products share content hash `2ca3b3893a96`; the other bracelet blockers are mostly stale local URLs. |
| `earrings`              |       74 |                  74 |                      0 | Every audited earrings product has stale local media plus the universal fact/policy/spec/media gaps.             |
| `necklace`              |       74 |                  74 |                      0 | Every audited necklace product has stale local media plus the universal fact/policy/spec/media gaps.             |
| `ring`                  |       74 |                  74 |                      0 | Every audited ring product has stale local media plus the universal fact/policy/spec/media gaps.                 |
| `hera`                  |        1 |                   0 |                      1 | `hera-bracelet` shares the duplicated bracelet content hash.                                                     |
| `muse`                  |        1 |                   1 |                      0 | Named product still has stale local media and universal fact/policy/spec/media gaps.                             |
| `selene`                |        1 |                   1 |                      0 | Named product still has stale local media and universal fact/policy/spec/media gaps.                             |
| `venus`                 |        1 |                   1 |                      0 | Named product still has stale local media and universal fact/policy/spec/media gaps.                             |

## Product Severity Shapes

| Product shape                | Count | Meaning                                                                                                                                                                                     |
| ---------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3 blockers / 8 high findings |   274 | Missing fact verification, policy verification, and local media file; also missing structured specs, complete media set, five non-primary media roles, unique URL, and related media proof. |
| 2 blockers / 9 high findings |    26 | Missing fact and policy verification; local file exists but content is duplicated across unrelated products, so media still cannot pass.                                                    |

## Required Media Roles

Every product must have truthful, product-specific media for all required
roles:

| Role           | Decision proof                                                           |
| -------------- | ------------------------------------------------------------------------ |
| `PRIMARY`      | Clean primary image that depicts the exact product.                      |
| `ALTERNATE`    | Alternate angle that resolves silhouette and profile.                    |
| `SCALE`        | Scale-on-body or measured context image.                                 |
| `CONSTRUCTION` | Closure, setting, clasp, back, underside, or construction detail.        |
| `MATERIAL`     | Material or stone macro with color and finish fidelity.                  |
| `CONTEXT`      | Packaging, styling, or use context that does not imply false properties. |

The current post-schema audit backfilled existing primary media only. That is
why each product is missing five roles, producing `1,500` role findings.

## Remediation Sequence

### R-01 Pick A Priority Catalog Slice

Owner: founder / merchandising.

Status: blocked on owner decision.

Do not try to remediate 300 products at once. Choose a first release slice and
freeze it before assets or copy are commissioned.

Minimum recommended slice:

- 6 rings.
- 6 necklaces.
- 6 earrings.
- 6 bracelets.
- The named products `venus-line-ring`, `selene-drop-earrings`,
  `selene-chain`, `muse-necklace`, `muse-pearl-earrings`, and `hera-bracelet`
  if they are still strategic and present in the audited catalog.

Exit criteria:

- Frozen slug list.
- Product owner and acceptance owner assigned.
- Public priority: hero, category anchor, gift anchor, or essential.
- Decision whether non-slice products stay public, move to draft, or remain
  visible with explicit readiness risk.
- Intake rows started in the `docs/qa/catalog-owner-intake-template.md` format.

### R-02 Complete Product Truth Intake

Owner: merchandising / product truth.

Status: blocked on verified facts.

For every product in the priority slice, collect:

- Exact material and purity/plating.
- Stone type, stone status, and stone details where applicable.
- Dimensions, weight where appropriate, chain length, closure, size range, and
  fit constraints.
- Country of manufacture.
- Manufacturer or importer.
- SKU and variant SKU mapping.
- Source reference and verifier identity.
- Verification date.

Exit criteria:

- `FACT_VERIFICATION_MISSING` is zero for the slice.
- `STRUCTURED_SPECIFICATIONS_MISSING` is zero for the slice.
- Public PDP fact rows render only from verified fields.
- Product truth fields from `docs/qa/catalog-owner-intake-template.md` are
  complete for every slice product.

### R-03 Complete Policy Verification

Owner: legal / operations.

Status: blocked on policy approval.

For every product in the priority slice, approve product-applicable policy
facts:

- Delivery promise and exclusions.
- Return or exchange eligibility.
- Care restrictions.
- Warranty scope.
- Personalized/custom-item exceptions.
- Supplier-order exceptions if relevant.
- Policy source reference, verifier, and verification date.

Exit criteria:

- `POLICY_VERIFICATION_MISSING` is zero for the slice.
- PDP, checkout, footer, emails, and policy pages do not contradict each other.
- Policy text has effective date and owner.
- Policy fields from `docs/qa/catalog-owner-intake-template.md` are complete
  for every slice product.

### R-04 Replace Stale And Duplicated Media

Owner: creative / catalog operations.

Status: blocked on assets.

First pass:

- Replace the 274 stale local media references.
- Resolve the 26-product duplicate content-hash group.
- Stop using shared category/lifestyle assets as product proof unless they
  depict the exact same product.

Second pass:

- Add all six required media roles for the priority slice.
- Add alt text that describes decision-useful product facts, not decorative
  mood.
- Record source/license/approval internally.

Exit criteria:

- `LOCAL_MEDIA_FILE_MISSING` is zero for the slice.
- `MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS` is zero for the slice.
- `MEDIA_URL_SHARED_ACROSS_PRODUCTS` is zero for unrelated products in the
  slice.
- `MEDIA_SET_INCOMPLETE` and `MEDIA_ROLE_MISSING` are zero for the slice.
- Media fields from `docs/qa/catalog-owner-intake-template.md` are complete for
  every slice product.

### R-05 Decide What Happens To Non-Ready Products

Owner: product / merchandising / legal.

Status: blocked on catalog policy.

Because the current audit has zero ready products, the team must decide how to
handle products outside the first remediation slice.

Allowed decisions:

- Keep visible but do not claim readiness or superiority.
- Move to draft until facts/media are approved.
- Keep category coverage but reduce claims to verified fields only.

Rejected decision:

- Fill database fields with plausible but unverified facts to satisfy the gate.

Exit criteria:

- Non-ready product policy is documented.
- Admin publish blockers and public rendering rules agree.
- Release notes do not imply full-catalog readiness.

### R-06 Re-Run The Strict Audit

Owner: engineering.

Status: ready after R-01 through R-05.

Command:

```powershell
pnpm catalog:intake:validate -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-catalog-owner-intake-validation
pnpm catalog:readiness -- --source database --scope-file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-wave-0-priority-readiness-strict
```

Exit criteria:

- Strict audit passes for the intended release scope. The scoped audit still
  compares media URLs and local content hashes against the full loaded catalog,
  so a release product cannot pass while sharing proof media with an
  out-of-scope active product.
- Owner-intake validation passes before any import, activation, or release note
  claims the slice is ready.
- Artifact is retained.
- `docs/qa/catalog-readiness-wave-0-baseline.md`,
  `docs/TIFFANY_SURPASS_MASTER_PLAN.md`, and `docs/PROJECT_TASKS.md` are
  updated with the new result.

## Owner Register

| Work package                     | Direct owner | Acceptance owner        | Target date             | Status  |
| -------------------------------- | ------------ | ----------------------- | ----------------------- | ------- |
| R-01 priority slice              | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-02 product truth intake        | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-03 policy verification         | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-04 media replacement and roles | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-05 non-ready product policy    | UNASSIGNED   | UNASSIGNED              | UNASSIGNED              | BLOCKED |
| R-06 strict audit rerun          | Engineering  | Product / release owner | After R-01 through R-05 | WAITING |

## Release Gate Position

The catalog readiness audit should not be added to `pnpm check` or release
gates yet. Doing that now would make every release fail without creating facts
or assets. The correct gate activation sequence is:

1. Priority slice selected.
2. Facts and policy evidence approved.
3. Media replaced and role-mapped.
4. Non-ready product policy decided.
5. Strict audit passes for the release scope.
6. Then promote strict catalog readiness into release gating.

Until this sequence is complete, the accurate status remains:

> Catalog readiness infrastructure exists, but catalog readiness itself has not
> been achieved.
