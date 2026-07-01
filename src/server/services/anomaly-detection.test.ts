import { describe, expect, it } from "vitest";

import { detectAnomalies, mean, stdDev } from "./anomaly-detection";

describe("mean + stdDev", () => {
  it("computes basic statistics", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(stdDev([2, 4, 6])).toBeCloseTo(1.633, 2);
    expect(stdDev([5, 5, 5])).toBe(0);
  });
});

describe("detectAnomalies", () => {
  it("flags outliers with direction", () => {
    const series = [
      { label: "d1", value: 100 },
      { label: "d2", value: 105 },
      { label: "d3", value: 95 },
      { label: "d4", value: 100 },
      { label: "d5", value: 400 }, // spike
    ];
    const anomalies = detectAnomalies(series, 1.5);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0]?.label).toBe("d5");
    expect(anomalies[0]?.direction).toBe("SPIKE");
  });

  it("returns nothing for a flat series", () => {
    expect(detectAnomalies([{ label: "a", value: 10 }, { label: "b", value: 10 }])).toEqual([]);
  });
});
