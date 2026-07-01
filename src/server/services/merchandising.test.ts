import { describe, expect, it } from "vitest";

import { selectActiveBanners, type BannerRule } from "./merchandising";

const now = new Date("2026-06-27T00:00:00Z");

function banner(overrides: Partial<BannerRule>): BannerRule {
  return {
    id: "b",
    title: "banner",
    placement: "HOME_HERO",
    imageUrl: null,
    linkUrl: null,
    priority: 100,
    isActive: true,
    startsAt: null,
    endsAt: null,
    ...overrides,
  };
}

describe("selectActiveBanners", () => {
  it("filters by placement, active flag and date window, ordered by priority", () => {
    const result = selectActiveBanners(
      [
        banner({ id: "a", priority: 20 }),
        banner({ id: "b", priority: 10 }),
        banner({ id: "off", isActive: false }),
        banner({ id: "other", placement: "CHECKOUT" }),
        banner({ id: "future", startsAt: new Date("2026-07-01") }),
        banner({ id: "past", endsAt: new Date("2026-06-01") }),
      ],
      "HOME_HERO",
      now,
    );
    expect(result.map((b) => b.id)).toEqual(["b", "a"]);
  });
});
