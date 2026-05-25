import { describe, expect, it } from "vitest";

import {
  assertQaRouteInventoryCoverage,
  getPerformanceQaRoutes,
  getQaRouteInventory,
  getVisualQaRoutes,
} from "./qa-route-inventory";

describe("QA route inventory", () => {
  it("covers every App Router page and route handler template", () => {
    const coverage = assertQaRouteInventoryCoverage();

    expect(coverage.missing).toEqual([]);
    expect(coverage.ok).toBe(true);
  });

  it("includes seeded dynamic category and product examples", () => {
    const routes = getVisualQaRoutes();

    expect(routes).toEqual(expect.arrayContaining(["/category/rings"]));
    expect(routes).toEqual(expect.arrayContaining(["/category/necklaces"]));
    expect(routes).toEqual(expect.arrayContaining(["/category/earrings"]));
    expect(routes).toEqual(expect.arrayContaining(["/category/bracelets"]));
    expect(routes).toEqual(
      expect.arrayContaining(["/product/venus-line-ring"]),
    );
    expect(routes).toEqual(expect.arrayContaining(["/product/hera-bracelet"]));
    expect(routes).toEqual(
      expect.arrayContaining(["/product/muse-pearl-earrings"]),
    );
  });

  it("keeps unsafe API routes documented instead of browser-clicked", () => {
    const inventory = getQaRouteInventory();
    const documentedApis = inventory.filter(
      (route) => route.kind === "api" && route.coverage === "documented",
    );

    expect(documentedApis.length).toBeGreaterThan(0);
    expect(documentedApis.every((route) => !route.includeInVisualQa)).toBe(
      true,
    );
  });

  it("defines a focused performance route subset", () => {
    expect(getPerformanceQaRoutes()).toEqual(
      expect.arrayContaining([
        "/",
        "/search?q=venus",
        "/category/earrings",
        "/product/venus-line-ring",
        "/checkout",
      ]),
    );
  });
});
