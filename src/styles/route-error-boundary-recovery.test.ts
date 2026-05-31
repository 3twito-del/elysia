import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

const routeErrorBoundaries = [
  {
    file: "src/app/account/error.tsx",
    safeHref: 'href="/service"',
    testId: "account-error-boundary",
  },
  {
    file: "src/app/admin/error.tsx",
    safeHref: 'href="/admin/login?next=/admin"',
    testId: "admin-error-boundary",
  },
  {
    file: "src/app/category/[slug]/error.tsx",
    safeHref: 'href="/search"',
    testId: "category-error-empty-state",
  },
] as const;

describe("route error boundary recovery", () => {
  it.each(routeErrorBoundaries)(
    "keeps $file recoverable without raw provider detail",
    ({ file, safeHref, testId }) => {
      const source = read(file);

      expect(source).toContain("EmptyState");
      expect(source).toContain("reset: () => void");
      expect(source).toContain("onClick={reset}");
      expect(source).toContain('type="button"');
      expect(source).toContain("Button asChild");
      expect(source).toContain("<Link");
      expect(source).toContain(safeHref);
      expect(source).toContain(`testId="${testId}"`);
      expect(source).not.toContain("error.message");
      expect(source).not.toContain("error.digest");
      expect(source).not.toContain("provider");
      expect(source).not.toContain("process.env");
    },
  );

  it("keeps all route error boundaries covered by the recovery contract", () => {
    const coveredFiles = new Set(routeErrorBoundaries.map(({ file }) => file));
    const actualFiles = [
      "src/app/account/error.tsx",
      "src/app/admin/error.tsx",
      "src/app/category/[slug]/error.tsx",
    ];

    expect([...coveredFiles].sort()).toEqual(actualFiles.sort());
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
