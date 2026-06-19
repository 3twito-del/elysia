# Catalog Owner Intake Template

Status: owner-facing intake template for Wave 0 catalog remediation.

Last updated: 2026-06-19.

Use this template for the priority catalog slice defined in
`docs/qa/catalog-readiness-remediation-plan.md`. One row or filled copy is
required per product before engineering should mark facts, policies, or media as
verified.

Do not use this template to invent product facts. Unknown values remain blank
until a source owner verifies them.

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
| `altTextOwner`         | yes      | Accessibility / content           | Person responsible for decision-useful alt text.                                |

## CSV Header

Use this header when collecting rows in a spreadsheet:

```csv
productSlug,priorityTier,releaseScope,directOwner,acceptanceOwner,residualRisk,factSourceReference,factVerifiedBy,factVerifiedAt,countryOfManufacture,manufacturerOrImporter,materialDetails,measurements,stoneDetails,variantSkuMap,policySourceReference,policyVerifiedBy,policyVerifiedAt,deliveryPromise,returnPolicy,careInstructions,warranty,supplierOrderException,primaryMediaUrl,alternateMediaUrl,scaleMediaUrl,constructionMediaUrl,materialMediaUrl,contextMediaUrl,mediaSourceReference,mediaApprovedBy,mediaApprovedAt,altTextOwner
```

## Engineering Acceptance

Engineering should not mark a product ready until all of the following are true:

- Required owner fields are filled.
- Required product truth fields are filled and source-backed.
- Required policy fields are filled and legal/operations-approved.
- All six media roles are filled with exact-product assets.
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
