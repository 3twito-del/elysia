import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("blog search layout", () => {
  it("reserves space for the search icon on the RTL inline-start edge", () => {
    const source = readFileSync("src/app/blog/page.tsx", "utf8");

    expect(source).toContain('className="ps-10"');
    expect(source).not.toContain('className="pe-10"');
  });
});
