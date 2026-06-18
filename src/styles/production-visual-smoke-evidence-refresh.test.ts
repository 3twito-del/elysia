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

  it("keeps production visual artifacts named with route set and deployment id", () => {
    const evidence = read(
      "docs/qa/production-visual-smoke-evidence-refresh.md",
    );
    const script = read("scripts/visual-qa-agent-browser.ps1");

    expect(evidence).toContain(
      "artifacts/qa/<utc-timestamp>-<route-set>-<deployment-id>-agent-browser/",
    );
    expect(evidence).toContain("UTC timestamp");
    expect(evidence).toContain("Deployment ID");
    expect(evidence).toContain("Viewport set");
    expect(script).toContain("[string]$DeploymentId");
    expect(script).toContain("[string]$RouteSetName");
    expect(script).toContain("agent-browser-visual-qa-metadata.json");
    expect(script).toContain("ConsoleErrorBudget");
  });

  it("keeps deployment ledger evidence tied to alias, commit, and error logs", () => {
    const ledger = read("docs/qa/production-deployment-evidence-ledger.md");

    expect(ledger).toContain("Commit SHA");
    expect(ledger).toContain("Deployment ID");
    expect(ledger).toContain("Production alias URL");
    expect(ledger).toContain("Minimum clean error-log window");
    expect(ledger).toContain("60 minutes");
    expect(ledger).toContain("vercel inspect");
    expect(ledger).toContain("vercel logs");
  });

  it("keeps Shopify release notes split from deferred provider blockers", () => {
    const roadmap = read("docs/PROJECT_TASKS.md");

    expect(roadmap).toContain("Release note pattern");
    expect(roadmap).toContain("Actionable release tasks");
    expect(roadmap).toContain("Deferred supplier blockers");
    expect(roadmap).toContain("Deferred payment blockers");
    expect(roadmap).toContain("Deferred SMS blockers");
    expect(roadmap).toContain("Dashboard-access blockers");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
