import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("high jewelry reference gate documentation", () => {
  it("documents the gate, source list, threshold, and blocking protocol", () => {
    const doc = read("docs/HIGH_JEWELRY_REFERENCE_GATE.md");
    const direction = read("docs/DESIGN_DIRECTION_BENCHMARK_GATE.md");
    const dch = read("docs/DESIGN_CHANGE_DECISIONS.md");

    expect(doc).toContain("HIGH_JEWELRY_REFERENCE_GATE");
    expect(doc).toContain("15 Tier A high jewelry sites");
    expect(doc).toContain("22.5");
    expect(doc).toContain("11.25");
    expect(doc).toContain("unsupported means no implementation");
    expect(doc).toContain("explicit exception");
    expect(doc).toContain("About copy reduction");
    expect(direction).toContain("HIGH_JEWELRY_REFERENCE_GATE");
    expect(direction).toContain("Tier A-only high jewelry gate");
    expect(dch).toContain("DCH-041");
    expect(dch).toContain("High jewelry reference gate");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
