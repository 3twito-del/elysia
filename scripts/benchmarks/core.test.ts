import { describe, expect, it } from "vitest";

import {
  BENCHMARK_VIEWPORTS,
  createBenchmarkReport,
  scoreDiscreteMetric,
  scoreNumericMetric,
  type BenchmarkMetricValue,
  type BenchmarkPartConfig,
  type BenchmarkSnapshot,
} from "./core";
import { canonicalBenchmarkSites, reserveBenchmarkSites } from "./corpus";
import { publicSurfaceExtractor } from "./extractors/public-parts";

const desktop = BENCHMARK_VIEWPORTS[0]!;
const metricDefinitions = [
  { group: "fixture", key: "elementFound", type: "boolean" as const },
  { group: "fixture", key: "heightPx", type: "number" as const },
];
const fixtureConfig: BenchmarkPartConfig = {
  extractor: publicSurfaceExtractor,
  id: "fixture",
  lessons: ["Fixture lesson."],
  localTargets: [{ label: "fixture", path: "/" }],
  metricDefinitions,
  recommendations: ["Fixture recommendation."],
  title: "Fixture",
};

describe("benchmark core", () => {
  it("scores discrete metrics by weighted majority", () => {
    expect(
      scoreDiscreteMetric({
        elysiaValue: true,
        definition: metricDefinitions[0]!,
        samples: [
          { value: true, weight: 1.5 },
          { value: true, weight: 1.5 },
          { value: false, weight: 1 },
        ],
        thresholdWeight: 2.5,
      }).matchStatus,
    ).toBe("match");

    expect(
      scoreDiscreteMetric({
        elysiaValue: false,
        definition: metricDefinitions[0]!,
        samples: [
          { value: true, weight: 1.5 },
          { value: false, weight: 1 },
        ],
        thresholdWeight: 2,
      }).matchStatus,
    ).toBe("notComparable");
  });

  it("scores numeric metrics with weighted percentile baselines", () => {
    expect(
      scoreNumericMetric({
        activeWeight: 5,
        elysiaValue: 20,
        definition: metricDefinitions[1]!,
        samples: [
          { value: 10, weight: 1 },
          { value: 20, weight: 2 },
          { value: 30, weight: 2 },
        ],
      }).matchStatus,
    ).toBe("match");
  });

  it("treats higher directional numeric metrics as matching above baseline", () => {
    expect(
      scoreNumericMetric({
        activeWeight: 5,
        elysiaValue: 44,
        definition: {
          group: "fixture",
          key: "minTapTargetPx",
          numericComparison: "higherIsBetter",
          type: "number",
        },
        samples: [
          { value: 12, weight: 1 },
          { value: 18, weight: 2 },
          { value: 20, weight: 2 },
        ],
      }).matchStatus,
    ).toBe("match");
  });

  it("replaces blocked canonical sites in the active QA corpus", () => {
    const elysiaSnapshots = [
      snapshot("Elysia", "http://localhost:3000", 0, {
        elementFound: true,
        heightPx: 20,
      }),
    ];
    const canonicalSnapshots = canonicalBenchmarkSites
      .slice(0, 14)
      .map((site) =>
        snapshot(site.name, site.sourceUrl, site.weight, {
          elementFound: true,
          heightPx: 20,
        }),
      );
    const replacementSite = reserveBenchmarkSites[0]!;
    const replacementSnapshots = [
      snapshot(replacementSite.name, replacementSite.sourceUrl, 1, {
        elementFound: true,
        heightPx: 20,
      }),
    ];
    const report = createBenchmarkReport({
      elysiaSnapshots,
      canonicalSnapshots,
      config: fixtureConfig,
      replacementSnapshots,
      replacementSites: [replacementSite],
      runAt: "2026-05-19T00:00:00.000Z",
      skipExternal: false,
    });

    expect(report.substitutions).toHaveLength(1);
    expect(report.activeCorpus).toContainEqual(replacementSite);
    expect(report.blockedSites.map((site) => site.name)).toContain(
      canonicalBenchmarkSites[14]!.name,
    );
  });
});

function snapshot(
  siteName: string,
  sourceUrl: string,
  weight: number,
  overrides: Record<string, BenchmarkMetricValue>,
): BenchmarkSnapshot {
  return {
    captured: true,
    enoughData: true,
    loadStatus: "ok",
    metrics: {
      elementFound: null,
      heightPx: null,
      ...overrides,
    },
    siteName,
    sourceUrl,
    targetLabel: "fixture",
    targetUrl: sourceUrl,
    viewport: desktop,
    weight,
  };
}
