import { describe, expect, it } from "vitest";

import { orderBlocks, slugifyPage, type PageBlockRow } from "./landing-pages";

describe("slugifyPage", () => {
  it("keeps Hebrew letters and dashes spaces", () => {
    expect(slugifyPage("מבצע קיץ 2026")).toBe("מבצע-קיץ-2026");
    expect(slugifyPage("Summer Sale!!")).toBe("summer-sale");
    expect(slugifyPage("   ")).toBe("page");
  });
});

describe("orderBlocks", () => {
  it("sorts blocks by sortOrder", () => {
    const blocks: PageBlockRow[] = [
      { id: "b", type: "TEXT", heading: null, body: null, imageUrl: null, linkUrl: null, sortOrder: 20 },
      { id: "a", type: "HERO", heading: null, body: null, imageUrl: null, linkUrl: null, sortOrder: 10 },
      { id: "c", type: "CTA", heading: null, body: null, imageUrl: null, linkUrl: null, sortOrder: 30 },
    ];
    expect(orderBlocks(blocks).map((block) => block.id)).toEqual(["a", "b", "c"]);
  });
});
