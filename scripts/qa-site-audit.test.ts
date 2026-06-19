import { describe, expect, it } from "vitest";

import {
  applyRouteShard,
  consoleErrorBudget,
  inpSensitiveControlAudit,
  isIgnorableConsoleError,
  isExpectedRouteStatusForAudit,
  parseRouteShard,
  qaArtifactStandard,
  routeShardAuditContract,
  scrollWarmedScreenshotEvidence,
} from "./qa-site-audit";
import { getQaRouteInventory } from "./qa-route-inventory";

describe("QA site audit contracts", () => {
  it("standardizes audit artifacts and required metadata", () => {
    expect(qaArtifactStandard.root).toBe("artifacts/qa");
    expect(qaArtifactStandard.directoryPattern).toContain("<iso-timestamp>");
    expect(qaArtifactStandard.files).toEqual(
      expect.arrayContaining([
        "qa-artifact-manifest.json",
        "route-inventory.json",
        "route-inventory.md",
        "site-audit.json",
        "site-audit.md",
        "design-review.md",
      ]),
    );
    expect(qaArtifactStandard.requiredMetadata).toEqual(
      expect.arrayContaining([
        "generatedAt",
        "baseUrl",
        "browsers",
        "viewports",
        "routeSet",
        "routeShard",
        "repeats",
        "screenshotMode",
        "warmScreenshots",
      ]),
    );
  });

  it("treats intentional recovery-route HTTP status as expected", () => {
    const recoveryRoute = getQaRouteInventory().find(
      (route) => route.source === "recovery-state",
    );

    expect(recoveryRoute?.expectedStatuses).toEqual([404]);
    expect(recoveryRoute?.notes).toContain("Intentional recovery-state route");
    expect(
      isExpectedRouteStatusForAudit({
        baseUrl: "http://localhost:3000",
        method: "GET",
        resourceType: "document",
        responseUrl: "http://localhost:3000/category/not-a-real-category",
        route: recoveryRoute!,
        status: 404,
      }),
    ).toBe(true);
    expect(
      isExpectedRouteStatusForAudit({
        baseUrl: "http://localhost:3000",
        method: "GET",
        resourceType: "image",
        responseUrl: "http://localhost:3000/missing-image.png",
        route: recoveryRoute!,
        status: 404,
      }),
    ).toBe(false);
  });

  it("supports deterministic route sharding for long visual audits", () => {
    expect(routeShardAuditContract.example).toBe("--route-shard 1/4");
    expect(parseRouteShard("2/3")).toEqual({ index: 2, total: 3 });
    expect(
      applyRouteShard(["a", "b", "c", "d", "e"], { index: 1, total: 2 }),
    ).toEqual(["a", "c", "e"]);
    expect(
      applyRouteShard(["a", "b", "c", "d", "e"], { index: 2, total: 2 }),
    ).toEqual(["b", "d"]);
    expect(() => parseRouteShard("0/2")).toThrow("--route-shard");
  });

  it("documents scroll-warmed screenshot evidence for long design reviews", () => {
    expect(scrollWarmedScreenshotEvidence.option).toBe("--warm-screenshots");
    expect(scrollWarmedScreenshotEvidence.purpose).toContain("lazy media");
    expect(scrollWarmedScreenshotEvidence.routeTypes).toEqual(
      expect.arrayContaining(["PDP", "search", "gifts"]),
    );
  });

  it("keeps production console errors at a zero-error budget", () => {
    expect(consoleErrorBudget.production).toBe("zero-console-errors");
    expect(
      isIgnorableConsoleError(
        "Download the React DevTools for a better development experience",
        "https://elysia-jewellery.com",
      ),
    ).toBe(false);
    expect(
      isIgnorableConsoleError(
        "Download the React DevTools for a better development experience",
        "http://localhost:3000",
      ),
    ).toBe(true);
    expect(
      isIgnorableConsoleError(
        "TypeError: checkout failed",
        "http://localhost:3000",
      ),
    ).toBe(false);
  });

  it("documents INP-sensitive control probes for performance runs", () => {
    expect(inpSensitiveControlAudit.routeSubset).toBe("performance");
    expect(inpSensitiveControlAudit.metric).toContain("INP");
    expect(inpSensitiveControlAudit.controls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          route: "/category/rings",
          selector: "[data-testid='category-filter-trigger']",
        }),
        expect.objectContaining({
          route: "/search?q=ring",
          selector: "[data-testid='mobile-search-filter-trigger']",
        }),
        expect.objectContaining({
          route: "/checkout",
          selector: "[data-testid='local-checkout-submit-button']",
        }),
      ]),
    );
  });
});
