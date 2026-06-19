# Wave 0 Catalog Readiness Baseline

Status: failing baselines recorded before and after the Wave 0 schema foundation.

Generated: 2026-06-19.

Master workstreams:

- `B-01` Replace duplicated catalog media.
- `B-02` Define the minimum media set per product.
- `B-08` Add automated media-quality gates.
- `C-01` Complete verified product specifications.
- `C-03` Define product publish readiness.
- `L-01` Replace checklist completion with outcome evidence.

## Command

```powershell
pnpm catalog:readiness -- --source database --out-dir artifacts/qa/2026-06-19-wave-0-catalog-readiness
```

Strict release-candidate check:

```powershell
pnpm catalog:readiness -- --source database --strict --out-dir artifacts/qa/<release>-catalog-readiness
```

The strict command returns a non-zero exit code while any blocker or
high-severity finding remains.

## Baseline Result

Initial pre-schema result:

| Metric                           | Result |
| -------------------------------- | -----: |
| Active database products audited |    300 |
| Publish-ready products           |      0 |
| Blockers                         |    874 |
| High-severity findings           |  1,226 |
| Medium-severity findings         |      0 |

Finding breakdown:

| Severity | Code                                       | Count | Interpretation                                                                                       |
| -------- | ------------------------------------------ | ----: | ---------------------------------------------------------------------------------------------------- |
| Blocker  | `FACT_VERIFICATION_MISSING`                |   300 | Product facts have no governed source, verifier, and verification date.                              |
| Blocker  | `POLICY_VERIFICATION_MISSING`              |   300 | Product-level delivery, return, care, and warranty text has no governed approval evidence.           |
| Blocker  | `LOCAL_MEDIA_FILE_MISSING`                 |   274 | Raw database media URLs point to local files that do not exist.                                      |
| High     | `STRUCTURED_SPECIFICATIONS_MISSING`        |   300 | Country, manufacturer/importer, material detail, and measurements are not modeled as governed facts. |
| High     | `MEDIA_SET_INCOMPLETE`                     |   300 | Every active product has fewer than the required six decision-useful media items.                    |
| High     | `MEDIA_ROLES_UNVERIFIABLE`                 |   300 | The schema cannot prove primary, alternate, scale, construction, material, and context coverage.     |
| High     | `MEDIA_URL_SHARED_ACROSS_PRODUCTS`         |   300 | Every active product shares its stored media URL with another product.                               |
| High     | `MEDIA_CONTENT_DUPLICATED_ACROSS_PRODUCTS` |    26 | Local files with identical content hashes are mapped to different products.                          |

Full generated evidence:

- `artifacts/qa/2026-06-19-wave-0-catalog-readiness/catalog-readiness.md`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness/catalog-readiness.json`

Post-schema result:

| Metric                           | Result |
| -------------------------------- | -----: |
| Active database products audited |    300 |
| Publish-ready products           |      0 |
| Blockers                         |    874 |
| High-severity findings           |  2,426 |
| Medium-severity findings         |      0 |

The blocker count is unchanged because no owner fact was fabricated. Media role
reporting is now more precise: the migration classifies existing primary media,
and the audit reports 1,500 exact missing roles across the remaining five roles
per product. Evidence:

- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.md`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema/catalog-readiness.json`
- `artifacts/qa/2026-06-19-wave-0-catalog-readiness-schema-strict/catalog-readiness.md`

## Important Interpretation

`LOCAL_MEDIA_FILE_MISSING` describes raw database truth, not necessarily a
customer-visible broken image. `src/server/services/catalog-assets.ts` replaces
known legacy media patterns with current catalog imagery at display time. That
fallback protects rendering, but it also hides stale source records and cannot
prove that the fallback image depicts the actual product. The readiness audit
therefore keeps the source-record failure as a blocker.

Non-empty text is not treated as verified product truth. The seed catalog
contains complete-looking material, delivery, return, care, and warranty text,
but the current model has no fact source, verifier, approval date, or structured
specification ownership. The audit reports that absence instead of awarding
readiness for plausible text.

## Implemented in This Slice

- Pure readiness engine in `scripts/lib/catalog-readiness.ts`.
- Product, variant, policy, supplier-mapping, media-count, media-role, local-file,
  URL-duplication, and content-hash checks.
- Database and deterministic fixture sources.
- JSON and Markdown artifacts.
- Optional strict exit behavior for future release gating.
- Focused unit and CLI tests.
- `pnpm catalog:readiness` package command.
- Nullable governed product fields for origin, manufacturer/importer, material,
  measurements, stone detail, fact source, policy source, verifier, and date.
- Explicit `ProductMediaRole` values with safe primary-media backfill only.
- Admin entry and explicit fact/policy certification; verifier identity and
  timestamp are written server-side and audited.
- New admin and supplier products remain `DRAFT`; Shopify fact verification is
  cleared after supplier data changes.
- Activation is blocked until required facts, policies, verification, primary
  media, price, and supplier mapping pass.
- Public PDP specifications and product-level policy text render only after
  verification; unsupported PDP fallbacks and `[להשלמה]` rows were removed.
- Browser verification found and fixed a missing tRPC provider in the existing
  recently-viewed fetch path.

## Remaining Before the Gate Can Pass

1. Supply and approve owner facts and policy references for priority products.
2. Extend the current shared specification set with class-specific attributes.
3. Add policy versions/effective dates and central governed policy references.
4. Add media variant association where required.
5. Replace stale database media URLs.
6. Supply and approve at least six distinct, truthful media roles for priority
   products before expanding to the full catalog.
7. Resolve cross-product duplicate URLs and duplicate local content.
8. Run the strict audit against the release database and retain the artifact.

The audit is intentionally not part of `pnpm check` or the release gate yet.
Adding it now would make every build fail without fixing the underlying catalog.
It should become a required gate only after owner data and priority product
remediation are complete. Product activation is already guarded independently.
