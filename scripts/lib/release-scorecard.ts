// Release scorecard model for the "Elysia vs. Tiffany" master plan, item L-11,
// scoped by ADR 0013. Originally two sequential launch gates (L1 referral
// storefront with zero Elysia-processed money, then L2 own-commerce
// activation); merged 2026-07-15 into a single real-money launch gate once
// the owner confirmed World B (ADR 0009 — Elysia is merchant of record for
// dropship, not the supplier). Dropship is the entire launch capsule, so it
// needs CardCom capture, invoicing, and reconciliation from day one — there
// is no more zero-money phase to gate separately.
//
// This module is intentionally evidence-driven and pessimistic: the release
// can only be labeled ready when every required field is explicitly proven.
// Any field that is missing, pending, or failing keeps it NOT_READY. It
// never invents evidence and never upgrades a verdict from prose.

export type ReleaseScorecardStatus = "pass" | "fail" | "pending" | "missing";

export type ReleaseScorecardFieldKey =
  | "p0Blockers"
  | "catalogCompleteness"
  | "mediaCompleteness"
  | "dropshipPaidFlowProof"
  | "ownPaidFlowProof"
  | "supplierFulfillment"
  | "reconciliation"
  | "wcag"
  | "coreWebVitals"
  | "security"
  | "providerHealth"
  | "visualMatrix"
  | "productionSmoke"
  | "cleanLogWindow"
  | "legalSignOff"
  | "rollbackReadiness";

export type ReleaseScorecardFieldInput = {
  evidence?: string;
  note?: string;
  status?: ReleaseScorecardStatus;
};

export type ReleaseScorecardField = {
  evidence: string | null;
  key: ReleaseScorecardFieldKey;
  label: string;
  masterPlanRefs: readonly string[];
  note: string | null;
  satisfied: boolean;
  status: ReleaseScorecardStatus;
};

export type CatalogReadinessSummary = {
  productCount: number;
  publishReadyCount: number;
  ready: boolean;
  blocker?: number;
  high?: number;
};

export type ReleaseScorecardInput = {
  catalogReadiness?: CatalogReadinessSummary | null;
  commit?: string;
  deployment?: string;
  environment?: string;
  fields?: Partial<
    Record<ReleaseScorecardFieldKey, ReleaseScorecardFieldInput>
  >;
  generatedAt: string;
  release?: string;
};

export type ReleaseScorecard = {
  blockingFields: ReleaseScorecardFieldKey[];
  commit: string | null;
  deployment: string | null;
  environment: string | null;
  fields: ReleaseScorecardField[];
  generatedAt: string;
  ready: boolean;
  release: string | null;
  satisfiedCount: number;
  statement: string;
  totalCount: number;
};

type FieldDefinition = {
  key: ReleaseScorecardFieldKey;
  label: string;
  masterPlanRefs: readonly string[];
};

// Order matches the L-11 required-fields list plus the P0 commerce proofs
// that the Final Claim Checklist (section 21) treats as non-negotiable.
// Every field below now gates the single merged launch (ADR 0013,
// 2026-07-15) — there is no more separate zero-money phase.
const fieldDefinitions: readonly FieldDefinition[] = [
  {
    key: "p0Blockers",
    label: "No open P0 blocker",
    masterPlanRefs: ["L-11", "Section 21"],
  },
  {
    key: "catalogCompleteness",
    label: "Verified catalog facts for every published capsule product",
    masterPlanRefs: ["C-01", "C-03", "L-11", "ADR 0011"],
  },
  {
    key: "mediaCompleteness",
    label: "Required licensed media set for every published capsule product",
    masterPlanRefs: ["B-01", "B-02", "L-11", "ADR 0011"],
  },
  {
    key: "dropshipPaidFlowProof",
    label:
      "Real dropship payment proven end to end — Elysia as merchant of record, not a supplier click-out",
    masterPlanRefs: ["G-02", "ADR 0009 (World B)", "ADR 0013"],
  },
  {
    key: "supplierFulfillment",
    label: "Supplier fulfillment proven end to end",
    masterPlanRefs: ["G-03"],
  },
  {
    key: "wcag",
    label: "Statutory accessibility review passes on capsule routes",
    masterPlanRefs: ["J-01", "ADR 0014"],
  },
  {
    key: "coreWebVitals",
    label: "Production p75 Core Web Vitals meet target",
    masterPlanRefs: ["J-03"],
  },
  {
    key: "security",
    label: "Security review has no unresolved critical/high issue",
    masterPlanRefs: ["K-08", "ADR 0005"],
  },
  {
    key: "providerHealth",
    label: "Provider health (supplier, search, email) verified",
    masterPlanRefs: ["K-04", "K-06"],
  },
  {
    key: "visualMatrix",
    label: "Authenticated and full-state visual matrix passes",
    masterPlanRefs: ["F-11", "L-04"],
  },
  {
    key: "productionSmoke",
    label: "Production smoke passes on the released commit",
    masterPlanRefs: ["L-05"],
  },
  {
    key: "cleanLogWindow",
    label: "Post-alias clean error-log window observed",
    masterPlanRefs: ["L-05"],
  },
  {
    key: "legalSignOff",
    label: "Legal identity and all public policies approved and current",
    masterPlanRefs: ["J-08", "Section 21", "ADR 0014"],
  },
  {
    key: "rollbackReadiness",
    label: "Rollback runbook ready and tested",
    masterPlanRefs: ["K-03", "L-11", "ADR 0008"],
  },
  {
    key: "ownPaidFlowProof",
    label: "Real owned-inventory (branch stock) payment proven end to end",
    masterPlanRefs: ["G-04", "ADR 0002", "ADR 0006", "ADR 0013"],
  },
  {
    key: "reconciliation",
    label:
      "Payment/order/GL/document reconciliation operational, including the dropship supplier-payable/COGS leg",
    masterPlanRefs: ["G-09", "ADR 0002", "ADR 0009 (World B)", "ADR 0010"],
  },
];

function normalizeStatus(
  status: ReleaseScorecardStatus | undefined,
): ReleaseScorecardStatus {
  if (
    status === "pass" ||
    status === "fail" ||
    status === "pending" ||
    status === "missing"
  ) {
    return status;
  }

  return "missing";
}

// Derive catalog/media completeness directly from a catalog-readiness audit
// summary so the scorecard cannot claim completeness while the audit fails.
function deriveCatalogField(
  summary: CatalogReadinessSummary,
): ReleaseScorecardFieldInput {
  const complete =
    summary.ready &&
    summary.productCount > 0 &&
    summary.publishReadyCount === summary.productCount;

  const note = complete
    ? `Catalog readiness audit passed for all ${summary.productCount} audited products.`
    : `Catalog readiness audit: ${summary.publishReadyCount}/${summary.productCount} products publish-ready` +
      (typeof summary.blocker === "number"
        ? `, ${summary.blocker} blockers`
        : "") +
      (typeof summary.high === "number"
        ? `, ${summary.high} high findings`
        : "") +
      ".";

  return { status: complete ? "pass" : "fail", note };
}

export function buildReleaseScorecard(
  input: ReleaseScorecardInput,
): ReleaseScorecard {
  const overrides = input.fields ?? {};
  const derivedCatalog = input.catalogReadiness
    ? deriveCatalogField(input.catalogReadiness)
    : null;

  const fields: ReleaseScorecardField[] = fieldDefinitions.map((definition) => {
    const override = overrides[definition.key];

    // Catalog and media completeness are auto-derived from the readiness audit
    // unless the caller explicitly overrides the status. The audit is the source
    // of truth; an override can only be used to record a different scope.
    const derived =
      derivedCatalog &&
      (definition.key === "catalogCompleteness" ||
        definition.key === "mediaCompleteness") &&
      !override?.status
        ? derivedCatalog
        : null;

    const status = normalizeStatus(derived?.status ?? override?.status);
    const note = derived?.note ?? override?.note ?? null;

    return {
      key: definition.key,
      label: definition.label,
      masterPlanRefs: definition.masterPlanRefs,
      status,
      satisfied: status === "pass",
      evidence: override?.evidence ?? null,
      note,
    };
  });

  const blockingFields = fields
    .filter((field) => !field.satisfied)
    .map((field) => field.key);
  const satisfiedCount = fields.filter((field) => field.satisfied).length;
  const ready = blockingFields.length === 0;

  const statement = ready
    ? "All required release-scorecard fields are proven. The superiority claim is permitted subject to owner sign-off."
    : "Elysia is a technically mature, increasingly distinctive luxury-jewelry " +
      "commerce product with several UX advantages. It has not yet proven complete " +
      "brand, media, transaction, fulfillment, service, and customer-preference " +
      "superiority over Tiffany.";

  return {
    blockingFields,
    commit: input.commit ?? null,
    deployment: input.deployment ?? null,
    environment: input.environment ?? null,
    fields,
    generatedAt: input.generatedAt,
    ready,
    release: input.release ?? null,
    satisfiedCount,
    statement,
    totalCount: fields.length,
  };
}

const statusLabel: Record<ReleaseScorecardStatus, string> = {
  pass: "PASS",
  fail: "FAIL",
  pending: "PENDING",
  missing: "MISSING",
};

export function formatReleaseScorecardMarkdown(
  scorecard: ReleaseScorecard,
): string {
  const lines: string[] = [
    "# Release Scorecard",
    "",
    `Generated: ${scorecard.generatedAt}`,
    `Launch gate: ${scorecard.ready ? "READY" : "NOT READY"} — ${scorecard.satisfiedCount}/${scorecard.totalCount} fields satisfied`,
  ];

  if (scorecard.release) lines.push(`Release: ${scorecard.release}`);
  if (scorecard.commit) lines.push(`Commit: ${scorecard.commit}`);
  if (scorecard.deployment) lines.push(`Deployment: ${scorecard.deployment}`);
  if (scorecard.environment)
    lines.push(`Environment: ${scorecard.environment}`);

  lines.push(
    "",
    "This scorecard enforces master-plan item L-11 under ADR 0013's single",
    "merged launch gate (2026-07-15: World B collapsed the former L1/L2 split",
    "— dropship needs real Elysia-processed money from day one, so there is",
    "no separate zero-money phase left to gate). Launch-gate readiness means",
    "Elysia may legally take a customer's money and go public — not a lesser",
    'claim. A release cannot be labeled "Tiffany-surpassing" while any',
    "required field is MISSING, PENDING, or FAIL. Statuses are recorded from",
    "evidence, never inferred from prose.",
    "",
    "## Fields",
    "",
    "| Field | Master plan | Status | Evidence | Note |",
    "| --- | --- | --- | --- | --- |",
  );

  for (const field of scorecard.fields) {
    lines.push(
      `| ${field.label} | ${field.masterPlanRefs.join(", ")} | ${statusLabel[field.status]} | ${field.evidence ?? "—"} | ${field.note ?? "—"} |`,
    );
  }

  lines.push("", "## Verdict", "");

  if (scorecard.ready) {
    lines.push("All required fields are satisfied.", "");
  } else {
    lines.push("Blocking fields:", "");
    for (const key of scorecard.blockingFields) {
      const field = scorecard.fields.find((entry) => entry.key === key);
      lines.push(
        `- \`${key}\` — ${field?.label ?? key} (${statusLabel[field?.status ?? "missing"]})`,
      );
    }
    lines.push("");
  }

  lines.push("## Accurate Statement", "", `> ${scorecard.statement}`, "");

  return `${lines.join("\n")}\n`;
}
