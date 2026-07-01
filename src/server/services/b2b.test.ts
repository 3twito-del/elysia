import { describe, expect, it } from "vitest";

import {
  availableCredit,
  b2bPrice,
  buyerWithinLimit,
  creditStatus,
} from "./b2b";

describe("b2bPrice", () => {
  it("applies the discount percent", () => {
    expect(b2bPrice(1000, 10)).toBe(900);
    expect(b2bPrice(250, 0)).toBe(250);
  });

  it("clamps the rate and floors the base", () => {
    expect(b2bPrice(100, 150)).toBe(0);
    expect(b2bPrice(-50, 10)).toBe(0);
  });
});

describe("availableCredit", () => {
  it("returns remaining headroom, never negative", () => {
    expect(availableCredit(10000, 3000)).toBe(7000);
    expect(availableCredit(5000, 6000)).toBe(0);
  });
});

describe("creditStatus", () => {
  it("classifies OK / NEAR_LIMIT / OVER_LIMIT", () => {
    expect(creditStatus(10000, 2000)).toBe("OK");
    expect(creditStatus(10000, 9000)).toBe("NEAR_LIMIT");
    expect(creditStatus(10000, 11000)).toBe("OVER_LIMIT");
    expect(creditStatus(0, 5000)).toBe("OK"); // no limit set
  });
});

describe("buyerWithinLimit", () => {
  it("treats a non-positive limit as unlimited", () => {
    expect(buyerWithinLimit(0, 999999)).toBe(true);
    expect(buyerWithinLimit(-1, 100)).toBe(true);
  });

  it("enforces a positive per-order limit", () => {
    expect(buyerWithinLimit(5000, 5000)).toBe(true);
    expect(buyerWithinLimit(5000, 5001)).toBe(false);
  });
});
