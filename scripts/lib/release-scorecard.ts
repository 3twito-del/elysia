// Release scorecard model for the "Elysia vs. Tiffany" master plan, item L-11,
// re-scoped by ADR 0013 into two named launch gates:
//
//   L1 — Referral Storefront Launch: the first public day. Supplier-MOR
//        capsule commerce with zero Elysia-processed customer money.
//   L2 — Own Commerce Activation: the first shekel Elysia touches as
//        merchant of record (CardCom, GL posting, legal documents).
//
// This module is intentionally evidence-driven and pessimistic: a gate can
// only be labeled ready when every one of its required fields is explicitly
// proven. Any field that is missing, pending, or failing keeps that gate at
// NOT_READY. It never invents evidence and never upgrades a verdict from
// prose. "L1 live" must never smuggle in "allowed to take money".

export type ReleaseScorecardStatus = "pass" | "fail" | "pending" | "missing";

export type ReleaseGate = "L1" | "L2";

export type ReleaseScorecardFieldKey =
  | "p0Blockers"
  | "catalogCompleteness"
  | "mediaCompleteness"
  | "supplierPaidFlowProof"
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
  gate: ReleaseGate;
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

export type ReleaseGateSummary = {
  blockingFields: ReleaseScorecardFieldKey[];
  ready: boolean;
  satisfiedCount: number;
  totalCount: number;
};

export type ReleaseScorecard = {
  blockingFields: ReleaseScorecardFieldKey[];
  commit: string | null;
  deployment: string | null;
  environment: string | null;
  fields: ReleaseScorecardField[];
  gates: Record<ReleaseGate, ReleaseGateSummary>;
  generatedAt: string;
  ready: boolean;
  release: string | null;
  satisfiedCount: number;
  statement: string;
  totalCount: number;
};

type FieldDefinition = {
  gate: ReleaseGate;
  key: ReleaseScorecardFieldKey;
  label: string;
  masterPlanRefs: readonly string[];
};

// Order matches the L-11 required-fields list plus the P0 commerce proofs that
// the Final Claim Checklist (section 21) treats as non-negotiable. Gate
// assignment follows ADR 0013: everything the first public day depends on is
// L1; everything that only matters once Elysia takes a customer's money as
// merchant of record is L2.
const fieldDefinitions: readonly FieldDefinition[] = [
  {
    key: "p0Blockers",
    gate: "L1",
    label: "No open P0 blocker",
    masterPlanRefs: ["L-11", "Section 21"],
  },
  {
    key: "catalogCompleteness",
    gate: "L1",
    label: "Verified catalog facts for every published capsule product",
    masterPlanRefs: ["C-01", "C-03", "L-11", "ADR 0011"],
  },
  {
    key: "mediaCompleteness",
    gate: "L1",
    label: "Required licensed media set for every published capsule product",
    masterPlanRefs: ["B-01", "B-02", "L-11", "ADR 0011"],
  },
  {
    key: "supplierPaidFlowProof",
    gate: "L1",
    label: "Real supplier (MOR) paid checkout proven end to end",
    masterPlanRefs: ["G-02", "ADR 0009", "ADR 0013"],
  },
  {
    key: "supplierFulfillment",
    gate: "L1",
    label: "Supplier fulfillment proven end to end",
    masterPlanRefs: ["G-03"],
  },
  {
    key: "wcag",
    gate: "L1",
    label: "Statutory accessibility review passes on capsule routes",
    masterPlanRefs: ["J-01", "ADR 0014"],
  },
  {
    key: "coreWebVitals",
    gate: "L1",
    label: "Production p75 Core Web Vitals meet target",
    masterPlanRefs: ["J-03"],
  },
  {
    key: "security",
    gate: "L1",
    label: "Security review has no unresolved critical/high issue",
    masterPlanRefs: ["K-08", "ADR 0005"],
  },
  {
    key: "providerHealth",
    gate: "L1",
    label: "Provider health (supplier, search, email) verified",
    masterPlanRefs: ["K-04", "K-06"],
  },
  {
    key: "visualMatrix",
    gate: "L1",
    label: "Authenticated and full-state visual matrix passes",
    masterPlanRefs: ["F-11", "L-04"],
  },
  {
    key: "productionSmoke",
    gate: "L1",
    label: "Production smoke passes on the released commit",
    masterPlanRefs: ["L-05"],
  },
  {
    key: "cleanLogWindow",
    gate: "L1",
    label: "Post-alias clean error-log window observed",
    masterPlanRefs: ["L-05"],
  },
  {
    key: "legalSignOff",
    gate: "L1",
    label: "Legal identity and all public policies approved and current",
    masterPlanRefs: ["J-08", "Section 21", "ADR 0014"],
  },
  {
    key: "rollbackReadiness",
    gate: "L1",
    label: "Rollback runbook ready and tested",
    masterPlanRefs: ["K-03", "L-11", "ADR 0008"],
  },
  {
    key: "ownPaidFlowProof",
    gate: "L2",
    label: "Real own (Elysia MOR) payment proven end to end",
    masterPlanRefs: ["G-04", "ADR 0002", "ADR 0006", "ADR 0013"],
  },
  {
    key: "reconciliation",
    gate: "L2",
    label: "Own-commerce payment/order/GL/document reconciliation operational",
    masterPlanRefs: ["G-09", "ADR 0002", "ADR 0010"],
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

function summarizeGate(
  fields: readonly ReleaseScorecardField[],
  gate: ReleaseGate,
): ReleaseGateSummary {
  const gateFields = fields.filter((field) => field.gate === gate);
  const blockingFields = gateFields
    .filter((field) => !field.satisfied)
    .map((field) => field.key);

  return {
    blockingFields,
    ready: blockingFields.length === 0,
    satisfiedCount: gateFields.filter((field) => field.satisfied).length,
    totalCount: gateFields.length,
  };
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
      gate: definition.gate,
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
  const gates: Record<ReleaseGate, ReleaseGateSummary> = {
    L1: summarizeGate(fields, "L1"),
    L2: summarizeGate(fields, "L2"),
  };

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
    gates,
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

const gateLabel: Record<ReleaseGate, string> = {
  L1: "L1 — Referral Storefront Launch",
  L2: "L2 — Own Commerce Activation",
};

export function formatReleaseScorecardMarkdown(
  scorecard: ReleaseScorecard,
): string {
  const lines: string[] = [
    "# Release Scorecard",
    "",
    `Generated: ${scorecard.generatedAt}`,
    `Gate L1 (referral storefront): ${scorecard.gates.L1.ready ? "READY" : "NOT READY"} — ${scorecard.gates.L1.satisfiedCount}/${scorecard.gates.L1.totalCount} fields satisfied`,
    `Gate L2 (own commerce): ${scorecard.gates.L2.ready ? "READY" : "NOT READY"} — ${scorecard.gates.L2.satisfiedCount}/${scorecard.gates.L2.totalCount} fields satisfied`,
    `Overall claim gate: ${scorecard.ready ? "READY" : "NOT READY"}`,
    `Required fields satisfied: ${scorecard.satisfiedCount}/${scorecard.totalCount}`,
  ];

  if (scorecard.release) lines.push(`Release: ${scorecard.release}`);
  if (scorecard.commit) lines.push(`Commit: ${scorecard.commit}`);
  if (scorecard.deployment) lines.push(`Deployment: ${scorecard.deployment}`);
  if (scorecard.environment)
    lines.push(`Environment: ${scorecard.environment}`);

  lines.push(
    "",
    "This scorecard enforces master-plan item L-11 under the ADR 0013 two-gate",
    "model. Gate L1 readiness means the referral storefront may go public; it",
    "never implies permission to take money. A release cannot be labeled",
    '"Tiffany-surpassing" while any required field is MISSING, PENDING, or FAIL.',
    "Statuses are recorded from evidence, never inferred from prose.",
    "",
    "## Fields",
    "",
    "| Gate | Field | Master plan | Status | Evidence | Note |",
    "| --- | --- | --- | --- | --- | --- |",
  );

  for (const field of scorecard.fields) {
    lines.push(
      `| ${field.gate} | ${field.label} | ${field.masterPlanRefs.join(", ")} | ${statusLabel[field.status]} | ${field.evidence ?? "—"} | ${field.note ?? "—"} |`,
    );
  }

  lines.push("", "## Verdict", "");

  for (const gate of ["L1", "L2"] as const) {
    const summary = scorecard.gates[gate];
    lines.push(`### ${gateLabel[gate]}`, "");
    if (summary.ready) {
      lines.push("All required fields are satisfied.", "");
      continue;
    }

    lines.push("Blocking fields:", "");
    for (const key of summary.blockingFields) {
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
