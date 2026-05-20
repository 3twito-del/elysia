import { describe, expect, it } from "vitest";

import {
  buildHeaderBenchmarkMarkdown,
  createHeaderBenchmarkReport,
  HEADER_BENCHMARK_VIEWPORTS,
  HEADER_METRIC_DEFINITIONS,
  parseHeaderBenchmarkArgs,
  scoreDiscreteMetric,
  scoreNumericMetric,
  type HeaderMetricValue,
  type HeaderSiteSnapshot,
} from "./header-benchmark";
import { highJewelryReferenceSites } from "../src/lib/high-jewelry-reference-gate";

const desktop = HEADER_BENCHMARK_VIEWPORTS[0]!;
const tablet = HEADER_BENCHMARK_VIEWPORTS[1]!;

describe("header benchmark", () => {
  it("parses CLI options", () => {
    expect(
      parseHeaderBenchmarkArgs([
        "--base-url",
        "http://localhost:3010",
        "--out-dir=tmp/header",
        "--headed",
        "--skip-external",
      ]),
    ).toMatchObject({
      baseUrl: "http://localhost:3010",
      headed: true,
      outDir: "tmp/header",
      skipExternal: true,
    });
  });

  it("scores boolean and category metrics only with an 8-site majority", () => {
    const definition = {
      group: "chrome" as const,
      key: "headerFixedOrSticky",
      type: "boolean" as const,
    };

    expect(
      scoreDiscreteMetric({
        elysiaValue: true,
        definition,
        values: [
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          false,
          false,
          false,
        ],
        viewportName: "desktop",
      }).matchStatus,
    ).toBe("match");

    expect(
      scoreDiscreteMetric({
        elysiaValue: true,
        definition,
        values: [true, true, true, true, true, true, true, false, false],
        viewportName: "desktop",
      }).matchStatus,
    ).toBe("notComparable");
  });

  it("scores numeric metrics against IQR or median tolerance", () => {
    const definition = {
      group: "chrome" as const,
      key: "headerHeightPx",
      type: "number" as const,
    };

    expect(
      scoreNumericMetric({
        elysiaValue: 18,
        definition,
        values: [10, 12, 14, 16, 18, 20, 22, 24],
        viewportName: "desktop",
      }).matchStatus,
    ).toBe("match");

    expect(
      scoreNumericMetric({
        elysiaValue: 40,
        definition,
        values: [10, 12, 14, 16, 18, 20, 22, 24],
        viewportName: "desktop",
      }).matchStatus,
    ).toBe("mismatch");

    expect(
      scoreNumericMetric({
        elysiaValue: 70,
        definition,
        values: [64, 64, 64, 64, 64, 64, 64, 64],
        viewportName: "desktop",
      }).matchStatus,
    ).toBe("match");
  });

  it("marks live reports inconclusive when fewer than 12 references load", () => {
    const elysiaSnapshots = [
      snapshot("Elysia", "http://localhost:3000", desktop, {
        headerFound: true,
        headerHeightPx: 64,
      }),
      snapshot("Elysia", "http://localhost:3000", tablet, {
        headerFound: true,
        headerHeightPx: 64,
      }),
    ];
    const referenceSnapshots = highJewelryReferenceSites
      .slice(0, 11)
      .flatMap((site) => [
        snapshot(site.name, site.sourceUrl, desktop, {
          headerFound: true,
          headerHeightPx: 64,
        }),
        snapshot(site.name, site.sourceUrl, tablet, {
          headerFound: true,
          headerHeightPx: 64,
        }),
      ]);
    const report = createHeaderBenchmarkReport({
      elysiaSnapshots,
      referenceSnapshots,
      runAt: "2026-05-19T00:00:00.000Z",
      skipExternal: false,
    });

    expect(report.summary.status).toBe("inconclusive");
    expect(report.summary.referenceSitesEnoughData).toBe(11);
    expect(report.metrics).toHaveLength(
      elysiaSnapshots.length * HEADER_METRIC_DEFINITIONS.length,
    );
  });

  it("renders a markdown report with the agreed schema", () => {
    const report = createHeaderBenchmarkReport({
      elysiaSnapshots: [
        snapshot("Elysia", "http://localhost:3000", desktop, {
          headerFound: true,
          headerHeightPx: 64,
        }),
      ],
      referenceSnapshots: [],
      runAt: "2026-05-19T00:00:00.000Z",
      skipExternal: true,
    });
    const markdown = buildHeaderBenchmarkMarkdown(report);

    expect(report.summary.status).toBe("local-only");
    expect(markdown).toContain("# Header Benchmark: High-Jewelry Alignment");
    expect(markdown).toContain("`canonicalCorpus`, `activeCorpus`");
    expect(markdown).toContain("High Jewelry Reference Gate");
  });
});

function snapshot(
  siteName: string,
  sourceUrl: string,
  viewport: typeof desktop,
  overrides: Record<string, HeaderMetricValue>,
): HeaderSiteSnapshot {
  return {
    captured: true,
    enoughData: true,
    loadStatus: "ok",
    metrics: {
      ...Object.fromEntries(
        HEADER_METRIC_DEFINITIONS.map((definition) => [definition.key, null]),
      ),
      ...overrides,
    },
    siteName,
    sourceUrl,
    targetLabel: "fixture",
    targetUrl: sourceUrl,
    viewport,
    weight: siteName === "Elysia" ? 0 : 1.5,
  };
}
