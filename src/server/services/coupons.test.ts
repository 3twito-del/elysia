import { describe, expect, it } from "vitest";

import { isCouponUsable, normalizeCouponCode } from "./coupons";

describe("coupon helpers", () => {
  it("normalizes coupon codes", () => {
    expect(normalizeCouponCode(" aph10 ")).toBe("APH10");
    expect(normalizeCouponCode("   ")).toBeNull();
  });

  it("validates active coupon windows and usage caps", () => {
    const now = new Date("2026-04-28T12:00:00.000Z");

    expect(
      isCouponUsable({
        isActive: true,
        startsAt: new Date("2026-04-01T00:00:00.000Z"),
        endsAt: new Date("2026-05-01T00:00:00.000Z"),
        maxUses: 10,
        usedCount: 9,
        now,
      }),
    ).toBe(true);
    expect(
      isCouponUsable({
        isActive: true,
        startsAt: new Date("2026-04-01T00:00:00.000Z"),
        endsAt: new Date("2026-05-01T00:00:00.000Z"),
        maxUses: 10,
        usedCount: 10,
        now,
      }),
    ).toBe(false);
  });
});
