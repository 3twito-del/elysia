import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

type ReleaseSliceGateStageKey =
  | "ownerIntakeValidation"
  | "ownerIntakeApply"
  | "catalogReadiness"
  | "catalogQuality"
  | "releaseScorecard";

type ReleaseSliceGateOptions = {
  allowDryRunApplyPlan: boolean;
  catalogQualityPath?: string;
  catalogReadinessPath?: string;
  ownerIntakeApplyPath?: string;
  ownerIntakeValidationPath?: string;
  outDir?: string;
  releaseScorecardPath?: string;
  strict: boolean;
};

type ReleaseSliceGateIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
  stage: ReleaseSliceGateStageKey;
};

type ReleaseSliceGateStage = {
  evidencePath: string | null;
  issueCount: number;
  issues: ReleaseSliceGateIssue[];
  key: ReleaseSliceGateStageKey;
  label: string;
  ready: boolean;
  summary: string;
};

export type ReleaseSliceGate = {
  generatedAt: string;
  issueCounts: Record<"error" | "warning", number>;
  issues: ReleaseSliceGateIssue[];
  ready: boolean;
  stages: ReleaseSliceGateStage[];
};

type OwnerIntakeValidationArtifact = {
  validation?: {
    issueCounts?: { error?: number; warning?: number };
    productCount?: number;
    ready?: boolean;
  };
};

type OwnerIntakeApplyArtifact = {
  plan?: {
    issueCounts?: { error?: number; warning?: number };
    mode?: "apply" | "dry-run";
    productCount?: number;
    ready?: boolean;
    replaceMedia?: boolean;
  };
};

type CatalogReadinessArtifact = {
  audit?: {
    issueCounts?: { blocker?: number; high?: number };
    productCount?: number;
    publishReadyCount?: number;
    ready?: boolean;
  };
};

type CatalogQualityArtifact = {
  report?: {
    productCount?: number;
    publishReadyCount?: number;
    ready?: boolean;
    totalBlockers?: number;
    totalHigh?: number;
  };
};

type ReleaseScorecardArtifact = {
  blockingFields?: string[];
  ready?: boolean;
  satisfiedCount?: number;
  totalCount?: number;
};

const stageLabels: Record<ReleaseSliceGateStageKey, string> = {
  catalogQuality: "Catalog quality report",
  catalogReadiness: "Scoped catalog readiness",
  ownerIntakeApply: "Owner intake apply",
  ownerIntakeValidation: "Owner intake validation",
  releaseScorecard: "Release scorecard",
};

export function parseReleaseSliceGateArgs(
  args: readonly string[],
): ReleaseSliceGateOptions {
  const options: ReleaseSliceGateOptions = {
    allowDryRunApplyPlan: false,
    strict: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === "--") {
      continue;
    } else if (arg === "--owner-intake-validation" && next) {
      options.ownerIntakeValidationPath = next;
      index += 1;
    } else if (arg === "--owner-intake-apply" && next) {
      options.ownerIntakeApplyPath = next;
      index += 1;
    } else if (arg === "--catalog-readiness" && next) {
      options.catalogReadinessPath = next;
      index += 1;
    } else if (arg === "--catalog-quality" && next) {
      options.catalogQualityPath = next;
      index += 1;
    } else if (arg === "--release-scorecard" && next) {
      options.releaseScorecardPath = next;
      index += 1;
    } else if (arg === "--out-dir" && next) {
      options.outDir = next;
      index += 1;
    } else if (arg === "--allow-dry-run-apply-plan") {
      options.allowDryRunApplyPlan = true;
    } else if (arg === "--strict") {
      options.strict = true;
    }
  }

  return options;
}

export function buildReleaseSliceGate(input: {
  allowDryRunApplyPlan?: boolean;
  catalogQuality?: { artifact: CatalogQualityArtifact; path: string } | null;
  catalogReadiness?: {
    artifact: CatalogReadinessArtifact;
    path: string;
  } | null;
  generatedAt: string;
  ownerIntakeApply?: {
    artifact: OwnerIntakeApplyArtifact;
    path: string;
  } | null;
  ownerIntakeValidation?: {
    artifact: OwnerIntakeValidationArtifact;
    path: string;
  } | null;
  releaseScorecard?: {
    artifact: ReleaseScorecardArtifact;
    path: string;
  } | null;
}): ReleaseSliceGate {
  const stages = [
    buildOwnerIntakeValidationStage(input.ownerIntakeValidation ?? null),
    buildOwnerIntakeApplyStage(input.ownerIntakeApply ?? null, {
      allowDryRunApplyPlan: Boolean(input.allowDryRunApplyPlan),
    }),
    buildCatalogReadinessStage(input.catalogReadiness ?? null),
    buildCatalogQualityStage(input.catalogQuality ?? null),
    buildReleaseScorecardStage(input.releaseScorecard ?? null),
  ];
  const issues = stages.flatMap((stage) => stage.issues).sort(compareIssues);
  const issueCounts = countIssues(issues);

  return {
    generatedAt: input.generatedAt,
    issueCounts,
    issues,
    ready: stages.every((stage) => stage.ready) && issueCounts.error === 0,
    stages,
  };
}

export function formatReleaseSliceGateMarkdown(gate: ReleaseSliceGate) {
  const lines = [
    "# Release Slice Gate",
    "",
    `Generated: ${gate.generatedAt}`,
    `Status: ${gate.ready ? "READY" : "BLOCKED"}`,
    "",
    "This gate ties together the owner-intake, catalog-readiness, catalog-quality,",
    "and release-scorecard artifacts. It does not infer missing evidence from",
    "prose and it does not execute database writes.",
    "",
    "## Stages",
    "",
    "| Stage | Ready | Issues | Evidence | Summary |",
    "| --- | --- | ---: | --- | --- |",
    ...gate.stages.map(
      (stage) =>
        `| ${stage.label} | ${stage.ready ? "yes" : "no"} | ${stage.issueCount} | ${stage.evidencePath ? `\`${stage.evidencePath}\`` : "-"} | ${stage.summary} |`,
    ),
    "",
    "## Issues",
    "",
    ...(gate.issues.length === 0
      ? ["None."]
      : gate.issues.map(
          (issue) =>
            `- **${issue.severity.toUpperCase()}** \`${issue.stage}:${issue.code}\`: ${issue.message}`,
        )),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function buildOwnerIntakeValidationStage(
  input: { artifact: OwnerIntakeValidationArtifact; path: string } | null,
): ReleaseSliceGateStage {
  const issues = createMissingIssues("ownerIntakeValidation", input);
  const validation = input?.artifact.validation;

  if (validation) {
    if (!validation.ready) {
      issues.push({
        code: "OWNER_INTAKE_VALIDATION_FAILED",
        message: `Owner-intake validation is not ready: ${validation.issueCounts?.error ?? 0} errors, ${validation.issueCounts?.warning ?? 0} warnings.`,
        severity: "error",
        stage: "ownerIntakeValidation",
      });
    }
    if (!validation.productCount || validation.productCount <= 0) {
      issues.push({
        code: "OWNER_INTAKE_EMPTY",
        message: "Owner-intake validation artifact contains no product rows.",
        severity: "error",
        stage: "ownerIntakeValidation",
      });
    }
  }

  return createStage({
    evidencePath: input?.path,
    issues,
    key: "ownerIntakeValidation",
    ready: Boolean(validation?.ready && validation.productCount),
    summary: validation
      ? `${validation.productCount ?? 0} products; ${validation.issueCounts?.error ?? 0} errors; ${validation.issueCounts?.warning ?? 0} warnings.`
      : "Missing owner-intake validation artifact.",
  });
}

function buildOwnerIntakeApplyStage(
  input: { artifact: OwnerIntakeApplyArtifact; path: string } | null,
  options: { allowDryRunApplyPlan: boolean },
): ReleaseSliceGateStage {
  const issues = createMissingIssues("ownerIntakeApply", input);
  const plan = input?.artifact.plan;

  if (plan) {
    if (!plan.ready) {
      issues.push({
        code: "OWNER_INTAKE_APPLY_PLAN_BLOCKED",
        message: `Owner-intake apply plan is blocked: ${plan.issueCounts?.error ?? 0} errors, ${plan.issueCounts?.warning ?? 0} warnings.`,
        severity: "error",
        stage: "ownerIntakeApply",
      });
    }
    if (plan.mode !== "apply" && !options.allowDryRunApplyPlan) {
      issues.push({
        code: "OWNER_INTAKE_NOT_APPLIED",
        message:
          "Owner-intake apply artifact is dry-run. Release gate requires an applied artifact unless --allow-dry-run-apply-plan is passed.",
        severity: "error",
        stage: "ownerIntakeApply",
      });
    }
    if (!plan.replaceMedia) {
      issues.push({
        code: "MEDIA_REPLACEMENT_NOT_APPLIED",
        message:
          "Owner-intake apply artifact did not replace governed media roles.",
        severity: "error",
        stage: "ownerIntakeApply",
      });
    }
    if (!plan.productCount || plan.productCount <= 0) {
      issues.push({
        code: "OWNER_INTAKE_APPLY_EMPTY",
        message: "Owner-intake apply artifact contains no products.",
        severity: "error",
        stage: "ownerIntakeApply",
      });
    }
  }

  const ready = Boolean(
    plan?.ready &&
    plan.productCount &&
    plan.replaceMedia &&
    (plan.mode === "apply" || options.allowDryRunApplyPlan),
  );

  return createStage({
    evidencePath: input?.path,
    issues,
    key: "ownerIntakeApply",
    ready,
    summary: plan
      ? `${plan.mode ?? "unknown"}; ${plan.productCount ?? 0} products; replace media: ${plan.replaceMedia ? "yes" : "no"}.`
      : "Missing owner-intake apply artifact.",
  });
}

function buildCatalogReadinessStage(
  input: { artifact: CatalogReadinessArtifact; path: string } | null,
): ReleaseSliceGateStage {
  const issues = createMissingIssues("catalogReadiness", input);
  const audit = input?.artifact.audit;

  if (audit) {
    const productCount = audit.productCount ?? 0;
    const publishReadyCount = audit.publishReadyCount ?? 0;
    if (!audit.ready) {
      issues.push({
        code: "CATALOG_READINESS_FAILED",
        message: `Catalog readiness failed: ${publishReadyCount}/${productCount} products ready, ${audit.issueCounts?.blocker ?? 0} blockers, ${audit.issueCounts?.high ?? 0} high findings.`,
        severity: "error",
        stage: "catalogReadiness",
      });
    }
    if (productCount <= 0) {
      issues.push({
        code: "CATALOG_READINESS_EMPTY",
        message: "Catalog readiness artifact contains no products.",
        severity: "error",
        stage: "catalogReadiness",
      });
    }
    if (publishReadyCount !== productCount) {
      issues.push({
        code: "CATALOG_READINESS_PARTIAL",
        message: `Only ${publishReadyCount}/${productCount} audited products are publish-ready.`,
        severity: "error",
        stage: "catalogReadiness",
      });
    }
  }

  return createStage({
    evidencePath: input?.path,
    issues,
    key: "catalogReadiness",
    ready: Boolean(
      audit?.ready &&
      audit.productCount &&
      audit.publishReadyCount === audit.productCount,
    ),
    summary: audit
      ? `${audit.publishReadyCount ?? 0}/${audit.productCount ?? 0} products ready.`
      : "Missing catalog readiness artifact.",
  });
}

function buildCatalogQualityStage(
  input: { artifact: CatalogQualityArtifact; path: string } | null,
): ReleaseSliceGateStage {
  const issues = createMissingIssues("catalogQuality", input);
  const report = input?.artifact.report;

  if (report) {
    if (!report.ready) {
      issues.push({
        code: "CATALOG_QUALITY_FAILED",
        message: `Catalog quality failed: ${report.totalBlockers ?? 0} blockers, ${report.totalHigh ?? 0} high findings.`,
        severity: "error",
        stage: "catalogQuality",
      });
    }
    if (!report.productCount || report.productCount <= 0) {
      issues.push({
        code: "CATALOG_QUALITY_EMPTY",
        message: "Catalog quality artifact contains no products.",
        severity: "error",
        stage: "catalogQuality",
      });
    }
  }

  return createStage({
    evidencePath: input?.path,
    issues,
    key: "catalogQuality",
    ready: Boolean(report?.ready && report.productCount),
    summary: report
      ? `${report.publishReadyCount ?? 0}/${report.productCount ?? 0} products ready; ${report.totalBlockers ?? 0} blockers.`
      : "Missing catalog quality artifact.",
  });
}

function buildReleaseScorecardStage(
  input: { artifact: ReleaseScorecardArtifact; path: string } | null,
): ReleaseSliceGateStage {
  const issues = createMissingIssues("releaseScorecard", input);
  const scorecard = input?.artifact;

  if (scorecard) {
    if (!scorecard.ready) {
      issues.push({
        code: "RELEASE_SCORECARD_BLOCKED",
        message: `Release scorecard is blocked by ${scorecard.blockingFields?.length ?? 0} fields.`,
        severity: "error",
        stage: "releaseScorecard",
      });
    }
    if (scorecard.satisfiedCount !== scorecard.totalCount) {
      issues.push({
        code: "RELEASE_SCORECARD_INCOMPLETE",
        message: `Release scorecard satisfied ${scorecard.satisfiedCount ?? 0}/${scorecard.totalCount ?? 0} required fields.`,
        severity: "error",
        stage: "releaseScorecard",
      });
    }
  }

  return createStage({
    evidencePath: input?.path,
    issues,
    key: "releaseScorecard",
    ready: Boolean(scorecard?.ready),
    summary: scorecard
      ? `${scorecard.satisfiedCount ?? 0}/${scorecard.totalCount ?? 0} required fields satisfied.`
      : "Missing release scorecard artifact.",
  });
}

function createMissingIssues<T>(
  stage: ReleaseSliceGateStageKey,
  input: T | null,
): ReleaseSliceGateIssue[] {
  if (input) return [];

  return [
    {
      code: "ARTIFACT_MISSING",
      message: `${stageLabels[stage]} artifact is required.`,
      severity: "error",
      stage,
    },
  ];
}

function createStage(input: {
  evidencePath?: string | null;
  issues: ReleaseSliceGateIssue[];
  key: ReleaseSliceGateStageKey;
  ready: boolean;
  summary: string;
}): ReleaseSliceGateStage {
  return {
    evidencePath: input.evidencePath ?? null,
    issueCount: input.issues.length,
    issues: input.issues.sort(compareIssues),
    key: input.key,
    label: stageLabels[input.key],
    ready:
      input.ready && input.issues.every((issue) => issue.severity !== "error"),
    summary: input.summary,
  };
}

function countIssues(issues: readonly ReleaseSliceGateIssue[]) {
  const counts: Record<"error" | "warning", number> = {
    error: 0,
    warning: 0,
  };

  for (const issue of issues) counts[issue.severity] += 1;

  return counts;
}

function compareIssues(
  left: ReleaseSliceGateIssue,
  right: ReleaseSliceGateIssue,
) {
  const severityRank: Record<"error" | "warning", number> = {
    error: 0,
    warning: 1,
  };

  return (
    severityRank[left.severity] - severityRank[right.severity] ||
    left.stage.localeCompare(right.stage) ||
    left.code.localeCompare(right.code)
  );
}

function readJsonArtifact<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readOptionalArtifact<T>(filePath: string | undefined) {
  return filePath
    ? { artifact: readJsonArtifact<T>(filePath), path: filePath }
    : null;
}

function createArtifactDir() {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
  return path.join(
    process.cwd(),
    "artifacts",
    "qa",
    `${stamp}-release-slice-gate`,
  );
}

function writeArtifacts(input: { gate: ReleaseSliceGate; outDir: string }) {
  mkdirSync(input.outDir, { recursive: true });
  writeFileSync(
    path.join(input.outDir, "release-slice-gate.json"),
    `${JSON.stringify(input.gate, null, 2)}\n`,
  );
  writeFileSync(
    path.join(input.outDir, "release-slice-gate.md"),
    formatReleaseSliceGateMarkdown(input.gate),
  );
}

function printHelp() {
  console.log(`Release slice gate

Usage:
  pnpm release:slice-gate -- [artifacts] [options]

Artifacts:
  --owner-intake-validation <path>  catalog-owner-intake-validation.json
  --owner-intake-apply <path>       catalog-owner-intake-apply.json
  --catalog-readiness <path>        catalog-readiness.json for the release scope
  --catalog-quality <path>          catalog-quality-report.json for the same scope
  --release-scorecard <path>        release-scorecard.json

Options:
  --out-dir <path>                  Write JSON and Markdown gate artifacts.
  --allow-dry-run-apply-plan        Permit dry-run owner-intake apply artifacts.
  --strict                          Exit non-zero when the gate is BLOCKED.
  --help                            Show this help.
`);
}

async function main(args = process.argv.slice(2)) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const options = parseReleaseSliceGateArgs(args);
  const generatedAt = new Date().toISOString();
  const gate = buildReleaseSliceGate({
    allowDryRunApplyPlan: options.allowDryRunApplyPlan,
    catalogQuality: readOptionalArtifact<CatalogQualityArtifact>(
      options.catalogQualityPath,
    ),
    catalogReadiness: readOptionalArtifact<CatalogReadinessArtifact>(
      options.catalogReadinessPath,
    ),
    generatedAt,
    ownerIntakeApply: readOptionalArtifact<OwnerIntakeApplyArtifact>(
      options.ownerIntakeApplyPath,
    ),
    ownerIntakeValidation: readOptionalArtifact<OwnerIntakeValidationArtifact>(
      options.ownerIntakeValidationPath,
    ),
    releaseScorecard: readOptionalArtifact<ReleaseScorecardArtifact>(
      options.releaseScorecardPath,
    ),
  });
  const outDir = options.outDir ?? createArtifactDir();

  writeArtifacts({ gate, outDir });
  console.log(
    JSON.stringify(
      {
        generatedAt,
        issueCounts: gate.issueCounts,
        outDir,
        ready: gate.ready,
        stages: gate.stages.map((stage) => ({
          issueCount: stage.issueCount,
          key: stage.key,
          ready: stage.ready,
        })),
      },
      null,
      2,
    ),
  );

  if (options.strict && !gate.ready) process.exitCode = 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
