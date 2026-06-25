import { describe, expect, it } from "vitest";

import { pointsForAmount, resolveTier } from "./loyalty";

describe("resolveTier", () => {
  it("maps lifetime points to the right tier at each threshold", () => {
    expect(resolveTier(0)).toBe("BRONZE");
    expect(resolveTier(499)).toBe("BRONZE");
    expect(resolveTier(500)).toBe("SILVER");
    expect(resolveTier(1499)).toBe("SILVER");
    expect(resolveTier(1500)).toBe("GOLD");
    expect(resolveTier(4999)).toBe("GOLD");
    expect(resolveTier(5000)).toBe("PLATINUM");
  });
});

describe("pointsForAmount", () => {
  it("awards 1 point per 10 currency, floored", () => {
    expect(pointsForAmount(250)).toBe(25);
    expect(pointsForAmount(259)).toBe(25);
    expect(pointsForAmount(9)).toBe(0);
  });

  it("is zero for non-positive amounts", () => {
    expect(pointsForAmount(0)).toBe(0);
    expect(pointsForAmount(-100)).toBe(0);
  });
});
