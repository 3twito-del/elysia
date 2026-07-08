import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("branches online-only service continuity", () => {
  it("keeps benchmark support evidence available", () => {
    const benchmark = read(
      "docs/QA_EVIDENCE.md",
    );

    expect(benchmark).toContain("I-046");
    expect(benchmark).toContain("Weighted Score`: 12.0");
    expect(benchmark).toContain("Decision`: Supported");
    expect(benchmark).toContain("Cartier");
    expect(benchmark).toContain("Boucheron");
  });

  it("adds route-backed continuity only to the online-only branch state", () => {
    const branchesPage = read("src/app/branches/page.tsx");

    expect(branchesPage).toContain("const onlineContinuitySteps = [");
    expect(branchesPage).toContain(
      'data-testid="branches-online-service-continuity"',
    );
    expect(branchesPage).toContain(
      'data-testid="branches-online-recovery-links"',
    );
    expect(branchesPage).toContain('href="/size-guide"');
    expect(branchesPage).toContain('href="/service?topic=general"');
    expect(indexOf(branchesPage, "hasPhysicalBranches ? (")).toBeLessThan(
      indexOf(branchesPage, 'data-testid="branches-online-service-continuity"'),
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function indexOf(source: string, pattern: string) {
  const index = source.indexOf(pattern);

  expect(index, pattern).toBeGreaterThanOrEqual(0);

  return index;
}
