import { describe, expect, it } from "vitest";

import { assertDistinctEntities } from "./entities";

describe("assertDistinctEntities", () => {
  it("accepts two distinct entities", () => {
    expect(() => assertDistinctEntities("a", "b")).not.toThrow();
  });

  it("rejects the same entity on both sides", () => {
    expect(() => assertDistinctEntities("a", "a")).toThrow(
      "עסקה בין-חברתית מחייבת שתי ישויות שונות.",
    );
  });

  it("rejects a missing entity", () => {
    expect(() => assertDistinctEntities("", "b")).toThrow("יש לבחור שתי ישויות.");
  });
});
