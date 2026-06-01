import { describe, expect, it } from "vitest";

import {
  createSmokeCheckUrl,
  evaluateSmokeCheck,
  protectedAdminPaths,
  smokeChecks,
} from "./smoke.mjs";
import { getQaRouteInventory } from "./qa-route-inventory.ts";

describe("smoke checks", () => {
  it("covers roadmap reliability entry points", () => {
    const paths = smokeChecks.map((check) => check.path);

    expect(paths).toEqual(
      expect.arrayContaining([
        "/api/health",
        "/",
        "/branches",
        "/gifts",
        "/ai",
        "/ai?tab=gifts",
        "/stylist",
        "/search",
        "/search?q=venus",
        "/category/rings",
        "/category/necklaces",
        "/category/earrings",
        "/category/bracelets",
        "/product/elysia-supplier-silver-halo-ring",
        "/checkout",
        "/account",
        "/api/webhooks/cardcom",
        "/admin/login?next=https://evil.example/admin",
      ]),
    );

    for (const path of protectedAdminPaths) {
      expect(paths).toContain(path);
    }
  });

  it("covers recent public decisions without authenticated data", () => {
    const healthCheck = smokeChecks.find((item) => item.path === "/api/health");
    const homeCheck = smokeChecks.find((item) => item.path === "/");
    const checkoutCheck = smokeChecks.find((item) => item.path === "/checkout");
    const accountCheck = smokeChecks.find((item) => item.path === "/account");

    expect(healthCheck?.includes).toEqual(['"ok":true', '"timestamp"']);
    expect(homeCheck?.includes).toEqual(
      expect.arrayContaining([
        'data-testid="home-commerce-shortcuts"',
        'href="/search"',
        'href="/gifts"',
        'href="/size-guide"',
        'href="/service"',
      ]),
    );
    expect(checkoutCheck?.includes).toEqual(
      expect.arrayContaining([
        'id="checkout-form"',
        'id="checkout-service"',
        'data-testid="cart-checkout-form"',
      ]),
    );
    expect(accountCheck?.includes).toEqual(
      expect.arrayContaining([
        'data-testid="account-otp-request-form"',
        'data-testid="account-identifier-input"',
        'id="identifier"',
      ]),
    );
  });

  it("keeps search smoke product-backed without depending on one seeded slug", () => {
    const check = smokeChecks.find((item) => item.path === "/search?q=venus");

    expect(check).toBeDefined();
    expect(check.includes).toEqual([
      'data-testid="search-form"',
      'data-testid="search-results-grid"',
    ]);
    expect(
      evaluateSmokeCheck(check, {
        body: `
          <form data-testid="search-form"></form>
          <section data-testid="search-results-grid">
            <a href="/product/elysia-supplier-silver-halo-ring">טבעת</a>
          </section>
        `,
        headers: {},
        status: 200,
      }).ok,
    ).toBe(true);
  });

  it("accepts protected admin redirects from either location or body", () => {
    const check = smokeChecks.find((item) => item.path === "/admin/orders");

    expect(check).toBeDefined();
    expect(
      evaluateSmokeCheck(check, {
        body: "",
        headers: { location: "/admin/login?next=%2Fadmin" },
        status: 307,
      }).ok,
    ).toBe(true);
    expect(
      evaluateSmokeCheck(check, {
        body: '<script>location.replace("/admin/login?next=/admin")</script>',
        headers: {},
        status: 200,
      }).ok,
    ).toBe(true);
  });

  it("reports missing body and pattern expectations", () => {
    const result = evaluateSmokeCheck(
      {
        path: "/category/earrings",
        statuses: [200],
        includes: ['data-testid="category-results-grid"'],
        matches: [/href="\/product\//],
      },
      {
        body: "<main>No products</main>",
        headers: {},
        status: 200,
      },
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      'body:"data-testid=\\"category-results-grid\\""',
      'body:/href="\\/product\\//',
    ]);
  });

  it("joins base URLs and paths without duplicate slashes", () => {
    expect(createSmokeCheckUrl("http://localhost:3002/", "/checkout")).toBe(
      "http://localhost:3002/checkout",
    );
    expect(createSmokeCheckUrl("http://localhost:3002", "account")).toBe(
      "http://localhost:3002/account",
    );
  });

  it("keeps smoke status expectations inside the route inventory contracts", () => {
    const inventory = getQaRouteInventory({ includeAllProducts: true });
    const inventoryByRoute = new Map(
      inventory.map((route) => [`${route.method} ${route.path}`, route]),
    );
    const missingRoutes = [];
    const statusMismatches = [];

    for (const check of smokeChecks) {
      const method = check.method ?? "GET";
      const key = `${method} ${check.path}`;
      const inventoryRoute = inventoryByRoute.get(key);

      if (!inventoryRoute) {
        missingRoutes.push(key);
        continue;
      }

      const unexpectedStatuses = check.statuses.filter(
        (status) => !inventoryRoute.expectedStatuses.includes(status),
      );

      if (unexpectedStatuses.length > 0) {
        statusMismatches.push(
          `${key}: smoke ${unexpectedStatuses.join(",")} not in inventory ${inventoryRoute.expectedStatuses.join(",")}`,
        );
      }
    }

    expect(missingRoutes).toEqual([]);
    expect(statusMismatches).toEqual([]);
  });
});
