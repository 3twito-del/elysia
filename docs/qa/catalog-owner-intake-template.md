# Catalog Owner Intake Template

Status: owner-facing intake template for Wave 0 catalog remediation.

Last updated: 2026-06-19.

Use this template for the priority catalog slice defined in
`docs/qa/catalog-readiness-remediation-plan.md`. One row or filled copy is
required per product before engineering should mark facts, policies, or media as
verified.

Do not use this template to invent product facts. Unknown values remain blank
until a source owner verifies them.

## Generate From Audit

Use the repository helper to create a CSV scaffold from a catalog-readiness
artifact:

```powershell
pnpm catalog:intake -- --audit artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json --per-class 6 --include-named --release-scope wave-0-priority --out artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv
```

The generated file stays under `artifacts/qa/` by default and is not committed.
It pre-fills only `productSlug`, optional `releaseScope`, and residual audit
risk. Owners must fill the verification, policy, and media columns manually from
approved sources.

After owners complete the slice and engineering imports the approved fields,
audit the same scoped product list instead of claiming full-catalog readiness:

```powershell
pnpm catalog:intake:validate -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-catalog-owner-intake-validation
pnpm catalog:intake:apply -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --replace-media --out-dir artifacts/qa/<date>-catalog-owner-intake-apply-dry-run
pnpm catalog:intake:apply -- --file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --apply --replace-media --out-dir artifacts/qa/<date>-catalog-owner-intake-apply
pnpm catalog:readiness -- --source database --scope-file artifacts/qa/catalog-owner-intake/catalog-owner-intake.csv --strict --out-dir artifacts/qa/<date>-wave-0-priority-readiness-strict
```

Scoped readiness still compares product media against the full loaded catalog,
so shared URLs or duplicate local content outside the slice remain blockers for
the scoped products.

## Required Product Row

| Field             | Required | Owner role              | Notes                                                                             |
| ----------------- | -------- | ----------------------- | --------------------------------------------------------------------------------- |
| `productSlug`     | yes      | Merchandising           | Must match the database slug.                                                     |
| `priorityTier`    | yes      | Founder / merchandising | Suggested values: `hero`, `category-anchor`, `gift-anchor`, `essential`, `defer`. |
| `releaseScope`    | yes      | Product                 | Suggested values: `wave-0-priority`, `later`, `draft-until-ready`.                |
| `directOwner`     | yes      | Product                 | Person responsible for gathering complete facts.                                  |
| `acceptanceOwner` | yes      | Product / founder       | Person approving readiness for public use.                                        |
| `residualRisk`    | yes      | Product                 | Short note if anything remains unresolved.                                        |

## Product Truth Fields

| Field                    | Required    | Owner role                 | Acceptance rule                                                                              |
| ------------------------ | ----------- | -------------------------- | -------------------------------------------------------------------------------------------- |
| `factSourceReference`    | yes         | Merchandising              | Link, document ID, supplier reference, internal spec sheet, or approved source note.         |
| `factVerifiedBy`         | yes         | Merchandising              | Named verifier, not a system user.                                                           |
| `factVerifiedAt`         | yes         | Merchandising              | ISO date; must not be future-dated.                                                          |
| `countryOfManufacture`   | yes         | Merchandising / legal      | Public-ready country value or approved reason to withhold.                                   |
| `manufacturerOrImporter` | yes         | Merchandising / legal      | Public-ready manufacturer/importer value or approved reason to withhold.                     |
| `materialDetails`        | yes         | Merchandising              | Exact material, purity, plating, coating, and any care-relevant constraints.                 |
| `measurements`           | yes         | Merchandising              | Dimensions, chain length, diameter, width, drop, or class-appropriate measurement.           |
| `stoneDetails`           | conditional | Merchandising              | Required for stone-bearing products. Include type/status/treatment where known and approved. |
| `variantSkuMap`          | yes         | Merchandising / operations | All public variants and SKU mapping.                                                         |

## Policy Fields

| Field                    | Required    | Owner role            | Acceptance rule                                                            |
| ------------------------ | ----------- | --------------------- | -------------------------------------------------------------------------- |
| `policySourceReference`  | yes         | Legal / operations    | Approved policy source or version ID.                                      |
| `policyVerifiedBy`       | yes         | Legal / operations    | Named verifier.                                                            |
| `policyVerifiedAt`       | yes         | Legal / operations    | ISO date; must not be future-dated.                                        |
| `deliveryPromise`        | yes         | Operations / legal    | Must match checkout, shipping policy, and customer-service script.         |
| `returnPolicy`           | yes         | Legal / operations    | Must include exceptions for personalized or supplier orders if applicable. |
| `careInstructions`       | yes         | Merchandising / legal | Must match material facts.                                                 |
| `warranty`               | yes         | Legal / operations    | Must describe scope without unsupported guarantees.                        |
| `supplierOrderException` | conditional | Operations / legal    | Required for dropship/supplier products.                                   |

## Media Fields

| Field                  | Required | Owner role                        | Acceptance rule                                                                 |
| ---------------------- | -------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `primaryMediaUrl`      | yes      | Creative / catalog ops            | Exact product, clean primary view.                                              |
| `alternateMediaUrl`    | yes      | Creative / catalog ops            | Exact product, alternate angle.                                                 |
| `scaleMediaUrl`        | yes      | Creative / catalog ops            | Scale on body or measured context.                                              |
| `constructionMediaUrl` | yes      | Creative / catalog ops            | Closure, setting, clasp, back, underside, or construction detail.               |
| `materialMediaUrl`     | yes      | Creative / catalog ops            | Material or stone macro with color and finish fidelity.                         |
| `contextMediaUrl`      | yes      | Creative / catalog ops            | Packaging, styling, or use context without false implication.                   |
| `mediaSourceReference` | yes      | Creative / catalog ops            | Shoot ID, asset library reference, license/source, or approved internal source. |
| `mediaApprovedBy`      | yes      | Creative director / merchandising | Named approver.                                                                 |
| `mediaApprovedAt`      | yes      | Creative director / merchandising | ISO date; must not be future-dated.                                             |
| `primaryAltText`       | yes      | Accessibility / content           | Decision-useful alt text for the primary media.                                 |
| `alternateAltText`     | yes      | Accessibility / content           | Decision-useful alt text for the alternate media.                               |
| `scaleAltText`         | yes      | Accessibility / content           | Decision-useful alt text for the scale media.                                   |
| `constructionAltText`  | yes      | Accessibility / content           | Decision-useful alt text for the construction media.                            |
| `materialAltText`      | yes      | Accessibility / content           | Decision-useful alt text for the material media.                                |
| `contextAltText`       | yes      | Accessibility / content           | Decision-useful alt text for the context media.                                 |
| `altTextOwner`         | yes      | Accessibility / content           | Person responsible for decision-useful alt text.                                |

## CSV Header

Use this header when collecting rows in a spreadsheet:

```csv
productSlug,priorityTier,releaseScope,directOwner,acceptanceOwner,residualRisk,factSourceReference,factVerifiedBy,factVerifiedAt,countryOfManufacture,manufacturerOrImporter,materialDetails,measurements,stoneDetails,variantSkuMap,policySourceReference,policyVerifiedBy,policyVerifiedAt,deliveryPromise,returnPolicy,careInstructions,warranty,supplierOrderException,primaryMediaUrl,alternateMediaUrl,scaleMediaUrl,constructionMediaUrl,materialMediaUrl,contextMediaUrl,mediaSourceReference,mediaApprovedBy,mediaApprovedAt,primaryAltText,alternateAltText,scaleAltText,constructionAltText,materialAltText,contextAltText,altTextOwner
```

## Engineering Acceptance

Engineering should not mark a product ready until all of the following are true:

- Required owner fields are filled.
- Required product truth fields are filled and source-backed.
- Required policy fields are filled and legal/operations-approved.
- All six media roles are filled with exact-product assets.
- All six media roles have decision-useful alt text.
- `pnpm catalog:intake:validate -- --file <owner-intake.csv> --strict` passes.
- `pnpm catalog:intake:apply -- --file <owner-intake.csv> --replace-media`
  produces a dry-run plan with no blocker.
- The product has no blocker or high-severity finding in a fresh
  `pnpm catalog:readiness -- --source database --strict` artifact for the
  intended release scope.

## Repository Safety

Allowed in the repository:

- Public-approved copy.
- Redacted source reference IDs.
- Command names and pass/fail summaries.
- Artifact paths.

Not allowed in the repository:

- Supplier contracts.
- Private dashboard screenshots.
- Payment credentials or transaction payloads.
- Full customer identity.
- Unapproved legal counsel notes.
- Product facts that are plausible but not verified.
