import { describe, expect, it } from "vitest";

import {
  buildCustomerTraits,
  evaluateSegmentRule,
} from "./marketing-segments";

const traits = {
  lifetimeValue: 3000,
  orderCount: 5,
  recencyDays: 10,
  wishlistItems: 2,
  hasOrdered: true,
};

describe("evaluateSegmentRule", () => {
  it("evaluates numeric leaf comparisons", () => {
    expect(
      evaluateSegmentRule(
        { trait: "lifetimeValue", op: "gte", value: 2500 },
        traits,
      ),
    ).toBe(true);
    expect(
      evaluateSegmentRule(
        { trait: "orderCount", op: "lt", value: 3 },
        traits,
      ),
    ).toBe(false);
  });

  it("evaluates eq/neq including booleans", () => {
    expect(
      evaluateSegmentRule(
        { trait: "hasOrdered", op: "eq", value: true },
        traits,
      ),
    ).toBe(true);
    expect(
      evaluateSegmentRule(
        { trait: "hasOrdered", op: "neq", value: true },
        traits,
      ),
    ).toBe(false);
  });

  it("composes all / any / not", () => {
    expect(
      evaluateSegmentRule(
        {
          all: [
            { trait: "lifetimeValue", op: "gte", value: 2500 },
            { trait: "orderCount", op: "gte", value: 1 },
          ],
        },
        traits,
      ),
    ).toBe(true);

    expect(
      evaluateSegmentRule(
        {
          any: [
            { trait: "orderCount", op: "lt", value: 1 },
            { trait: "lifetimeValue", op: "gte", value: 2500 },
          ],
        },
        traits,
      ),
    ).toBe(true);

    expect(
      evaluateSegmentRule(
        { not: { trait: "hasOrdered", op: "eq", value: true } },
        traits,
      ),
    ).toBe(false);
  });

  it("treats empty/unknown rules as matching nobody", () => {
    expect(evaluateSegmentRule({}, traits)).toBe(false);
    expect(evaluateSegmentRule(null, traits)).toBe(false);
    expect(
      evaluateSegmentRule(
        { trait: "missing", op: "gte", value: 1 },
        traits,
      ),
    ).toBe(false);
  });
});

describe("buildCustomerTraits", () => {
  it("maps a metric snapshot and derives recency in days", () => {
    const asOf = new Date("2026-06-24T00:00:00.000Z");
    const lastOrderAt = new Date(asOf.getTime() - 20 * 24 * 60 * 60 * 1000);

    const result = buildCustomerTraits(
      {
        lifetimeValue: 1000,
        orderCount: 3,
        averageOrderValue: 333.33,
        wishlistItems: 1,
        serviceRequests: 0,
        appointments: 0,
        lastOrderAt,
      },
      asOf,
    );

    expect(result.lifetimeValue).toBe(1000);
    expect(result.orderCount).toBe(3);
    expect(result.recencyDays).toBe(20);
    expect(result.hasOrdered).toBe(true);
  });

  it("reports null recency when there is no order", () => {
    const result = buildCustomerTraits({
      lifetimeValue: 0,
      orderCount: 0,
      averageOrderValue: 0,
      wishlistItems: 0,
      serviceRequests: 0,
      appointments: 0,
      lastOrderAt: null,
    });

    expect(result.recencyDays).toBeNull();
    expect(result.hasOrdered).toBe(false);
  });
});
