import { describe, expect, it, vi } from "vitest";

import {
  getActiveCouponValue,
  isCouponUsable,
  normalizeCouponCode,
} from "./coupons";

describe("coupon helpers", () => {
  it("normalizes coupon codes", () => {
    expect(normalizeCouponCode(" ely10 ")).toBe("ELY10");
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

  it("returns active coupon values from a normalized lookup", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      amountOff: 50,
      code: "ELY10",
      endsAt: null,
      id: "coupon_1",
      isActive: true,
      maxUses: null,
      percentOff: 10,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      usedCount: 0,
    });

    await expect(
      getActiveCouponValue(" ely10 ", makeCouponClient(findUnique)),
    ).resolves.toEqual({
      code: "ELY10",
      id: "coupon_1",
      value: { amountOff: 50, percentOff: 10 },
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { code: "ELY10" } });
  });

  it("returns null for inactive, expired, or exhausted coupon records", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      amountOff: null,
      code: "OLD",
      endsAt: new Date("2026-01-01T00:00:00.000Z"),
      id: "coupon_1",
      isActive: true,
      maxUses: null,
      percentOff: 10,
      startsAt: new Date("2025-01-01T00:00:00.000Z"),
      usedCount: 0,
    });

    await expect(
      getActiveCouponValue("old", makeCouponClient(findUnique)),
    ).resolves.toBeNull();
  });
});

function makeCouponClient(findUnique: ReturnType<typeof vi.fn>) {
  return {
    coupon: { findUnique },
  } as unknown as Parameters<typeof getActiveCouponValue>[1];
}
