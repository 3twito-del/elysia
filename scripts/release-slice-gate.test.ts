import { describe, expect, it } from "vitest";

import {
  buildReleaseSliceGate,
  formatReleaseSliceGateMarkdown,
  parseReleaseSliceGateArgs,
} from "./release-slice-gate";

const generatedAt = "2026-06-21T00:00:00.000Z";

describe("release slice gate", () => {
  it("parses artifact paths and strict options", () => {
    expect(
      parseReleaseSliceGateArgs([
        "--owner-intake-validation",
        "artifacts/intake-validation.json",
        "--owner-intake-apply",
        "artifacts/intake-apply.json",
        "--catalog-readiness",
        "artifacts/catalog-readiness.json",
        "--catalog-quality",
        "artifacts/catalog-quality-report.json",
        "--release-scorecard",
        "artifacts/release-scorecard.json",
        "--out-dir",
        "artifacts/release-slice-gate",
        "--allow-dry-run-apply-plan",
        "--strict",
      ]),
    ).toEqual({
      allowDryRunApplyPlan: true,
      catalogQualityPath: "artifacts/catalog-quality-report.json",
      catalogReadinessPath: "artifacts/catalog-readiness.json",
      ownerIntakeApplyPath: "artifacts/intake-apply.json",
      ownerIntakeValidationPath: "artifacts/intake-validation.json",
      outDir: "artifacts/release-slice-gate",
      releaseScorecardPath: "artifacts/release-scorecard.json",
      strict: true,
    });
  });

  it("passes only when every release-slice artifact is ready", () => {
    const gate = buildReleaseSliceGate(createReadyInput());

    expect(gate.ready).toBe(true);
    expect(gate.issueCounts.error).toBe(0);
    expect(gate.stages.every((stage) => stage.ready)).toBe(true);
  });

  it("blocks dry-run apply artifacts by default", () => {
    const gate = buildReleaseSliceGate({
      ...createReadyInput(),
      ownerIntakeApply: {
        artifact: {
          plan: {
            issueCounts: { error: 0, warning: 0 },
            mode: "dry-run",
            productCount: 2,
            ready: true,
            replaceMedia: true,
          },
        },
        path: "apply.json",
      },
    });

    expect(gate.ready).toBe(false);
    expect(gate.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OWNER_INTAKE_NOT_APPLIED" }),
      ]),
    );
  });

  it("allows dry-run apply artifacts when explicitly requested", () => {
    const gate = buildReleaseSliceGate({
      ...createReadyInput(),
      allowDryRunApplyPlan: true,
      ownerIntakeApply: {
        artifact: {
          plan: {
            issueCounts: { error: 0, warning: 0 },
            mode: "dry-run",
            productCount: 2,
            ready: true,
            replaceMedia: true,
          },
        },
        path: "apply.json",
      },
    });

    expect(gate.ready).toBe(true);
  });

  it("blocks missing artifacts and renders markdown", () => {
    const gate = buildReleaseSliceGate({ generatedAt });

    expect(gate.ready).toBe(false);
    expect(gate.issueCounts.error).toBe(5);
    expect(formatReleaseSliceGateMarkdown(gate)).toContain("Status: BLOCKED");
  });
});

function createReadyInput() {
  return {
    catalogQuality: {
      artifact: {
        report: {
          productCount: 2,
          publishReadyCount: 2,
          ready: true,
          totalBlockers: 0,
          totalHigh: 0,
        },
      },
      path: "quality.json",
    },
    catalogReadiness: {
      artifact: {
        audit: {
          issueCounts: { blocker: 0, high: 0 },
          productCount: 2,
          publishReadyCount: 2,
          ready: true,
        },
      },
      path: "readiness.json",
    },
    generatedAt,
    ownerIntakeApply: {
      artifact: {
        plan: {
          issueCounts: { error: 0, warning: 0 },
          mode: "apply" as const,
          productCount: 2,
          ready: true,
          replaceMedia: true,
        },
      },
      path: "apply.json",
    },
    ownerIntakeValidation: {
      artifact: {
        validation: {
          issueCounts: { error: 0, warning: 0 },
          productCount: 2,
          ready: true,
        },
      },
      path: "validation.json",
    },
    releaseScorecard: {
      artifact: {
        blockingFields: [],
        ready: true,
        satisfiedCount: 15,
        totalCount: 15,
      },
      path: "scorecard.json",
    },
  };
}
