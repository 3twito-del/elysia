import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("production visual smoke evidence refresh", () => {
  it("keeps a repeatable post-deploy evidence checklist", () => {
    const evidence = read(
      "docs/qa/production-visual-smoke-evidence-refresh.md",
    );
    const ledger = read("docs/qa/production-deployment-evidence-ledger.md");

    expect(evidence).toContain("I-047");
    expect(evidence).toContain(
      "/product/elysia-supplier-silver-halo-ring?q=venus",
    );
    expect(evidence).toContain("/admin/appointments");
    expect(evidence).toContain("/admin/inventory");
    expect(evidence).toContain("/admin/notifications");
    expect(evidence).toContain("/serwist/sw.js");
    expect(evidence).toContain("SMOKE_BASE_URL");
    expect(ledger).toContain("https://elysia-jewellery.com");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
