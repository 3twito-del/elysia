import { describe, expect, it } from "vitest";

import {
  computeFinishedUnitCost,
  explodeBom,
  planKitDisassembly,
} from "./manufacturing";

describe("planKitDisassembly", () => {
  it("consumes the finished kit and yields components", () => {
    const plan = planKitDisassembly(
      "kit",
      [
        { componentVariantId: "a", quantity: 2 },
        { componentVariantId: "b", quantity: 1 },
      ],
      3,
    );
    expect(plan.finished).toEqual({ variantId: "kit", delta: -3 });
    expect(plan.components).toEqual([
      { variantId: "a", delta: 6 },
      { variantId: "b", delta: 3 },
    ]);
  });
});

describe("explodeBom", () => {
  it("multiplies each component quantity by the units produced", () => {
    expect(
      explodeBom(
        [
          { componentVariantId: "c1", quantity: 2 },
          { componentVariantId: "c2", quantity: 3 },
        ],
        5,
      ),
    ).toEqual([
      { componentVariantId: "c1", totalQuantity: 10 },
      { componentVariantId: "c2", totalQuantity: 15 },
    ]);
  });

  it("truncates fractional production quantities", () => {
    expect(
      explodeBom([{ componentVariantId: "c1", quantity: 2 }], 3.9),
    ).toEqual([{ componentVariantId: "c1", totalQuantity: 6 }]);
  });
});

describe("computeFinishedUnitCost", () => {
  it("sums component cost contributions per finished unit", () => {
    expect(
      computeFinishedUnitCost([
        { qtyPerUnit: 2, unitCost: 5 },
        { qtyPerUnit: 3, unitCost: 4 },
      ]),
    ).toBe(22);
  });

  it("is zero with no components", () => {
    expect(computeFinishedUnitCost([])).toBe(0);
  });
});
