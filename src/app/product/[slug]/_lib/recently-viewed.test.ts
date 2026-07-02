import { describe, expect, it } from "vitest";

import { selectRecentlyViewedSlugs } from "./recently-viewed";

describe("selectRecentlyViewedSlugs", () => {
  it("de-duplicates while preserving first-seen order", () => {
    expect(
      selectRecentlyViewedSlugs({
        slugs: ["alpha", "beta", "alpha", "gamma"],
        limit: 5,
      }),
    ).toEqual(["alpha", "beta", "gamma"]);
  });

  it("drops excluded slugs (current product and rail duplicates)", () => {
    expect(
      selectRecentlyViewedSlugs({
        excludeSlugs: ["current", "rail-a"],
        slugs: ["current", "rail-a", "beta", "gamma"],
        limit: 5,
      }),
    ).toEqual(["beta", "gamma"]);
  });

  it("caps the result to the limit after filtering", () => {
    expect(
      selectRecentlyViewedSlugs({
        excludeSlugs: ["skip"],
        slugs: ["skip", "a", "b", "c", "d"],
        limit: 2,
      }),
    ).toEqual(["a", "b"]);
  });

  it("ignores empty slugs", () => {
    expect(
      selectRecentlyViewedSlugs({
        slugs: ["", "a", ""],
        limit: 5,
      }),
    ).toEqual(["a"]);
  });
});
