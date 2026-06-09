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
import { cookiePreferencesLink, policyLinks } from "../src/lib/legal-content";

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

  it("documents the supplier fixture route environment requirement", () => {
    const supplierRoute = getQaRouteInventory().find(
      (route) => route.path === "/product/elysia-supplier-silver-halo-ring",
    );

    expect(supplierRoute?.includeInVisualQa).toBe(true);
    expect(supplierRoute?.notes).toContain("E2E_CATALOG_FIXTURES=1");
    expect(supplierRoute?.notes).toContain("database-backed supplier product");
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
      if (knownRoutes.has(toRoutePath(href))) return false;
      if (approvedExternalHosts.some((host) => href.startsWith(host))) {
        return false;
      }

      return true;
    });

    expect(offenders).toEqual([]);
  });

  it("keeps footer route groups explicit, unique, and purpose-scoped", () => {
    const footer = readFileSync(
      path.join(process.cwd(), "src/components/site-footer.tsx"),
      "utf8",
    );
    const groups = {
      catalogLinks: extractFooterHrefLabels(footer, "catalogLinks"),
      commerceLinks: extractFooterHrefLabels(footer, "commerceLinks"),
      informationLinks: extractFooterHrefLabels(footer, "informationLinks"),
      policyLinks: [...policyLinks, cookiePreferencesLink],
    };
    const routeInventory = getQaRouteInventory({ includeAllProducts: true });
    const knownRoutes = new Set(
      routeInventory.flatMap((route) => [route.path, route.template]),
    );
    const allInternalLinks = Object.values(groups).flat();

    expect(groups.catalogLinks.map((link) => link.href)).toEqual([
      "/search",
      "/search?sort=newest",
      "/category/rings",
      "/category/necklaces",
      "/category/earrings",
      "/category/bracelets",
      "/gifts",
    ]);
    expect(groups.commerceLinks.map((link) => link.href)).toEqual([
      "/checkout",
      "/size-guide",
      "/service",
      "/faq",
    ]);
    expect(groups.informationLinks.map((link) => link.href)).toEqual([
      "/about",
      "/branches",
      "/account",
    ]);
    expect(groups.policyLinks.map((link) => link.href)).toEqual([
      "/terms",
      "/privacy",
      "/accessibility",
      "/shipping-returns",
      "/warranty",
      "/jewellery-care",
      "/privacy#cookie-preferences",
    ]);
    expect(new Set(allInternalLinks.map((link) => link.href)).size).toBe(
      allInternalLinks.length,
    );
    expect(new Set(allInternalLinks.map((link) => link.label)).size).toBe(
      allInternalLinks.length,
    );
    expect(
      allInternalLinks.every(
        (link) =>
          link.label.trim().length > 0 &&
          knownRoutes.has(toRoutePath(link.href)),
      ),
    ).toBe(true);
  });

  it("keeps production smoke roster representative across public, admin, API, and PWA routes", () => {
    const inventory = getQaRouteInventory({ includeAllProducts: true });
    const routeKinds = new Set(inventory.map((route) => route.kind));
    const visualRoutes = inventory
      .filter((route) => route.includeInVisualQa)
      .map((route) => route.path);
    const apiSmokeRoutes = inventory.filter(
      (route) => route.kind === "api" && route.coverage === "smoke",
    );
    const apiSmokeByCommand = new Map(
      apiSmokeRoutes.map((route) => [`${route.method} ${route.path}`, route]),
    );

    expect(routeKinds).toEqual(
      new Set(["account", "admin", "api", "dynamic", "public", "pwa"]),
    );
    expect(visualRoutes).toEqual(
      expect.arrayContaining([
        "/",
        "/search?q=venus",
        "/gifts",
        "/account",
        "/offline",
        "/category/rings",
        "/product/venus-line-ring",
        "/admin",
        "/admin/login",
      ]),
    );
    expect(
      apiSmokeRoutes.map((route) => `${route.method} ${route.path}`),
    ).toEqual([
      "GET /api/health",
      "GET /api/cart/count",
      "GET /api/wishlist/products",
      "POST /api/cart/items",
      "GET /account/privacy/export",
      "POST /api/chat",
      "POST /api/webhooks/cardcom",
      "POST /api/webhooks/cloudinary",
      "POST /api/webhooks/shopify/orders",
    ]);
    expect(apiSmokeByCommand.get("GET /api/health")?.expectedStatuses).toEqual([
      200,
    ]);
    expect(
      apiSmokeByCommand.get("GET /account/privacy/export")?.expectedStatuses,
    ).toEqual([401]);
    expect(apiSmokeByCommand.get("POST /api/chat")?.expectedStatuses).toEqual([
      400,
    ]);
    expect(
      apiSmokeByCommand.get("POST /api/cart/items")?.expectedStatuses,
    ).toEqual([400]);
    expect(
      apiSmokeRoutes.every(
        (route) => !route.includeInVisualQa && route.liveMode === "read-only",
      ),
    ).toBe(true);
  });
});

function extractFooterHrefLabels(source: string, constName: string) {
  const match = new RegExp(
    `const ${constName} = \\[([\\s\\S]*?)\\] as const;`,
    "u",
  ).exec(source);

  expect(match?.[1]).toBeDefined();

  return Array.from(
    (match?.[1] ?? "").matchAll(
      /\{\s*href:\s*"(?<href>[^"]+)",\s*label:\s*"(?<label>[^"]+)"/gu,
    ),
  ).map((entry) => ({
    href: entry.groups?.href ?? "",
    label: entry.groups?.label ?? "",
  }));
}

function toRoutePath(href: string) {
  return href.split(/[?#]/u)[0] ?? href;
}
