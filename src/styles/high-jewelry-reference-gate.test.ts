import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("high jewelry reference gate documentation", () => {
  it("documents the gate, source list, threshold, and blocking protocol", () => {
    const doc = read("docs/DESIGN.md");

    expect(doc).toContain("HIGH_JEWELRY_REFERENCE_GATE");
    expect(doc).toContain("15 Tier A high jewelry sites");
    expect(doc).toContain("22.5");
    expect(doc).toContain("11.25");
    expect(doc).toContain("unsupported means no implementation");
    expect(doc).toContain("explicit exception");
    expect(doc).toContain("About copy reduction");
    expect(doc).toContain("Tier A-only high jewelry gate");
    expect(doc).toContain("DCH-041");
    expect(doc).toContain("High jewelry reference gate");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
