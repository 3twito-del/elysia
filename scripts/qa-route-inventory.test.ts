import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertQaRouteInventoryCoverage,
  getPerformanceQaRoutes,
  getQaRouteInventory,
  getVisualQaRoutes,
  qaRouteInventoryCadence,
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
    expect(routes).toEqual(
      expect.arrayContaining(["/product/elysia-supplier-silver-halo-ring"]),
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
    const performanceRoutes = getPerformanceQaRoutes();

    expect(performanceRoutes).toEqual(
      expect.arrayContaining([
        "/",
        "/search?q=venus",
        "/category/earrings",
        "/product/venus-line-ring",
        "/checkout",
        "/account",
        "/ai",
        "/service",
      ]),
    );
    expect(performanceRoutes).toHaveLength(8);
  });

  it("documents representative and all-product route inventory cadence", () => {
    const representativeEntry = qaRouteInventoryCadence.find(
      (entry) => entry.scope === "representative",
    );
    const allProductsEntry = qaRouteInventoryCadence.find(
      (entry) => entry.scope === "all-products",
    );

    expect(representativeEntry?.command).toBe("pnpm qa:routes");
    expect(allProductsEntry?.command).toContain("--all-products");
    expect(
      qaRouteInventoryCadence.every((entry) => entry.artifact.length > 0),
    ).toBe(true);
  });

  it("expands all-product inventory beyond representative product smoke", () => {
    const representativeProducts = getQaRouteInventory().filter(
      (route) => route.template === "/product/[slug]",
    );
    const allProducts = getQaRouteInventory({
      includeAllProducts: true,
    }).filter((route) => route.template === "/product/[slug]");

    expect(allProducts.length).toBeGreaterThan(representativeProducts.length);
    expect(allProducts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/product/elysia-supplier-silver-halo-ring",
          source: "catalog-fixture-full",
        }),
      ]),
    );
  });

  it("keeps footer links backed by known route inventory or approved external policies", () => {
    const footer = readFileSync(
      path.join(process.cwd(), "src/components/site-footer.tsx"),
      "utf8",
    );
    const routeInventory = getQaRouteInventory({ includeAllProducts: true });
    const knownRoutes = new Set(
      routeInventory.flatMap((route) => [route.path, route.template]),
    );
    const hrefs = Array.from(footer.matchAll(/href:\s*"(?<href>[^"]+)"/g))
      .map((match) => match.groups?.href)
      .filter((href): href is string => Boolean(href));
    const linkHrefs = Array.from(footer.matchAll(/href="(?<href>[^"]+)"/g))
      .map((match) => match.groups?.href)
      .filter((href): href is string => Boolean(href));
    const approvedExternalHosts = [
      "https://www.instagram.com/",
      "https://www.tiktok.com/",
    ];
    const offenders = [...hrefs, ...linkHrefs].filter((href) => {
      if (href === "/") return false;
      if (knownRoutes.has(href)) return false;
      if (approvedExternalHosts.some((host) => href.startsWith(host))) {
        return false;
      }

      return true;
    });

    expect(offenders).toEqual([]);
  });
});
