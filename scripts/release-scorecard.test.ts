import { describe, expect, it } from "vitest";

import {
  buildReleaseScorecard,
  formatReleaseScorecardMarkdown,
} from "./lib/release-scorecard";
import {
  parseReleaseScorecardArgs,
  readCatalogReadinessSummary,
} from "./release-scorecard";

const generatedAt = "2026-06-19T00:00:00.000Z";

describe("release scorecard model", () => {
  it("is NOT READY when no field evidence is provided", () => {
    const scorecard = buildReleaseScorecard({ generatedAt });

    expect(scorecard.ready).toBe(false);
    expect(scorecard.satisfiedCount).toBe(0);
    expect(scorecard.blockingFields).toContain("p0Blockers");
    expect(scorecard.fields.every((field) => field.status === "missing")).toBe(
      true,
    );
    expect(scorecard.statement).toContain("has not yet proven complete");
  });

  it("treats pending and fail statuses as blocking", () => {
    const scorecard = buildReleaseScorecard({
      generatedAt,
      fields: {
        p0Blockers: { status: "pass" },
        wcag: { status: "pending" },
        security: { status: "fail" },
      },
    });

    expect(scorecard.ready).toBe(false);
    expect(scorecard.blockingFields).toContain("wcag");
    expect(scorecard.blockingFields).toContain("security");
    expect(scorecard.blockingFields).not.toContain("p0Blockers");
  });

  it("derives catalog/media completeness from a failing audit", () => {
    const scorecard = buildReleaseScorecard({
      generatedAt,
      catalogReadiness: {
        productCount: 300,
        publishReadyCount: 0,
        ready: false,
        blocker: 874,
        high: 2426,
      },
    });

    const catalog = scorecard.fields.find(
      (field) => field.key === "catalogCompleteness",
    );
    const media = scorecard.fields.find(
      (field) => field.key === "mediaCompleteness",
    );
    expect(catalog?.status).toBe("fail");
    expect(catalog?.note).toContain("0/300");
    expect(media?.status).toBe("fail");
  });

  it("derives a pass when the audit is fully ready", () => {
    const scorecard = buildReleaseScorecard({
      generatedAt,
      catalogReadiness: {
        productCount: 24,
        publishReadyCount: 24,
        ready: true,
      },
    });

    const catalog = scorecard.fields.find(
      (field) => field.key === "catalogCompleteness",
    );
    expect(catalog?.status).toBe("pass");
  });

  it("is READY only when every required field passes", () => {
    const fields = Object.fromEntries(
      buildReleaseScorecard({ generatedAt }).fields.map((field) => [
        field.key,
        { status: "pass" as const },
      ]),
    );

    const scorecard = buildReleaseScorecard({
      generatedAt,
      fields,
    });

    expect(scorecard.ready).toBe(true);
    expect(scorecard.blockingFields).toHaveLength(0);
    expect(scorecard.statement).toContain("superiority claim is permitted");
  });

  it("renders blocking fields in markdown", () => {
    const markdown = formatReleaseScorecardMarkdown(
      buildReleaseScorecard({
        generatedAt,
        fields: {
          p0Blockers: { status: "pass", evidence: "PROJECT_TASKS.md" },
        },
      }),
    );

    expect(markdown).toContain("Status: NOT READY");
    expect(markdown).toContain("PROJECT_TASKS.md");
    expect(markdown).toContain("`wcag`");
  });
});

describe("release scorecard CLI", () => {
  it("parses config, audit, output, and strict flags", () => {
    expect(
      parseReleaseScorecardArgs([
        "--config",
        "scorecard.json",
        "--catalog-readiness",
        "artifacts/catalog-readiness.json",
        "--out-dir",
        "artifacts/scorecard",
        "--strict",
      ]),
    ).toEqual({
      configPath: "scorecard.json",
      catalogReadinessPath: "artifacts/catalog-readiness.json",
      outDir: "artifacts/scorecard",
      strict: true,
    });
  });

  it("reduces a catalog readiness artifact to a summary", () => {
    const summary = readCatalogReadinessSummary(
      JSON.stringify({
        audit: {
          issueCounts: { blocker: 5, high: 9 },
          productCount: 10,
          publishReadyCount: 2,
          ready: false,
        },
      }),
    );

    expect(summary).toEqual({
      productCount: 10,
      publishReadyCount: 2,
      ready: false,
      blocker: 5,
      high: 9,
    });
  });

  it("rejects a malformed readiness artifact", () => {
    expect(() => readCatalogReadinessSummary("{}")).toThrow(/audit/u);
  });
});
