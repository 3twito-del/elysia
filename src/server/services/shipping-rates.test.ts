import { describe, expect, it } from "vitest";

import { selectShippingRate } from "./shipping-rates";

const rates = [
  { carrierId: "a", carrierName: "A", zone: "center", maxWeightKg: 5, price: 25 },
  { carrierId: "b", carrierName: "B", zone: "center", maxWeightKg: 5, price: 20 },
  { carrierId: "c", carrierName: "C", zone: "center", maxWeightKg: 2, price: 10 },
  { carrierId: "d", carrierName: "D", zone: "north", maxWeightKg: 10, price: 30 },
];

describe("selectShippingRate", () => {
  it("picks the cheapest rate covering the zone and weight", () => {
    // weight 3 → C (max 2) excluded; cheapest of A/B is B@20
    expect(selectShippingRate(rates, { zone: "center", weightKg: 3 })?.carrierId).toBe("b");
  });

  it("respects the weight ceiling", () => {
    // weight 2 → C eligible and cheapest @10
    expect(selectShippingRate(rates, { zone: "center", weightKg: 2 })?.carrierId).toBe("c");
  });

  it("returns null when nothing covers the zone/weight", () => {
    expect(selectShippingRate(rates, { zone: "south", weightKg: 1 })).toBeNull();
    expect(selectShippingRate(rates, { zone: "north", weightKg: 20 })).toBeNull();
  });
});
