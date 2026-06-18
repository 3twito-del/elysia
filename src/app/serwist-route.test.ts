import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getQaRouteInventory } from "../../scripts/qa-route-inventory";
import { GET, knownSerwistAssetPaths } from "./serwist/[path]/route";

const root = process.cwd();

describe("Serwist route", () => {
  it("loads the Next.js Serwist plugin only for production config", () => {
    const source = read("next.config.js");

    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('await import("@serwist/turbopack")');
    expect(source).not.toContain("import { withSerwist }");
  });

  it("does not duplicate automatically discovered public icon assets in the precache list", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain("additionalPrecacheEntries");
    expect(source).toContain('url: "/offline"');
    expect(source).not.toContain("/pwa/icons/");
  });

  it("does not assume git stdout exists when resolving the runtime revision", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain("stdout?.trim() || randomUUID()");
  });

  it("keeps the production service worker route static instead of forcing a runtime lambda", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain("return createSerwistRoute({");
    expect(source).not.toContain("Vercel prebuilt packaging");
  });

  it("keeps the precache ignore list limited to active local build sources", () => {
    const routeSource = read("src/app/serwist/[path]/route.ts");
    const configSource = read("next.config.js");

    expect(routeSource).toContain("serwistPrecacheIgnores");
    expect(routeSource).toContain('"**/node_modules/**/*"');
    expect(routeSource).not.toContain("elysia-aqua");
    expect(routeSource).not.toContain("cinematic/*.png");
    expect(routeSource).toContain("globIgnores: [...serwistPrecacheIgnores]");
    expect(configSource).not.toContain("maximumFileSizeToCacheInBytes");
  });

  it("keeps Serwist out of development route compilation", () => {
    const source = read("src/app/serwist/[path]/route.ts");

    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('await import("@serwist/turbopack")');
    expect(source).toContain("createDevelopmentSerwistRoute");
    expect(source).toContain("missingSerwistAssetStatus");
    expect(source).toContain('"Cache-Control": "no-store"');
  });

  it("keeps service worker runtime route patterns aligned with the QA route inventory", () => {
    const source = read("src/app/sw.ts");
    const inventory = getQaRouteInventory({ includeAllProducts: true });
    const expectedPublicInventoryRoutes = inventory
      .filter(
        (route) =>
          route.includeInVisualQa &&
          !route.requiresAuth &&
          ["dynamic", "public", "pwa"].includes(route.kind),
      )
      .map((route) => stripQuery(route.path));

    expect(source).toContain("publicPagePattern");
    expect(source).toContain("liveOnlyPattern");
    expect(source).toContain("category\\/");
    expect(source).toContain("product\\/");
    expect(source).toContain("search");
    expect(source).toContain("gifts");
    expect(source).toContain("branches");
    expect(source).toContain("about");
    expect(source).toContain("faq");
    expect(source).toContain("privacy");
    expect(source).toContain("terms");
    expect(source).toContain("accessibility");
    expect(source).toContain("shipping-returns");
    expect(source).toContain("warranty");
    expect(source).toContain("jewellery-care");
    expect(source).toContain("service");
    expect(source).toContain("ai");
    expect(source).toContain("stylist");
    expect(source).toContain("size-guide");
    expect(source).toContain("offline");
    expect(source).toContain("api\\/");
    expect(source).toContain("admin(?:\\/|$)");
    expect(source).toContain("account(?:\\/|$)");
    expect(source).toContain("checkout(?:\\/|$)");
    expect(source).toContain("NetworkFirst");
    expect(source).toContain("NetworkOnly");
    expect(source).toContain('runtimeCachePrefix = "elysia-v2"');
    expect(source).toContain("activeRuntimeCacheNames");
    expect(source).toContain("activateUpdatedServiceWorker");
    expect(source).toContain("deleteRetiredRuntimeCaches");
    expect(source).toContain("self.clients.claim()");
    expect(source).not.toContain("client.navigate(client.url)");
    expect(source).toContain('cacheName.startsWith("elysia-")');
    expect(expectedPublicInventoryRoutes).toEqual(
      expect.arrayContaining([
        "/",
        "/search",
        "/gifts",
        "/branches",
        "/about",
        "/faq",
        "/privacy",
        "/terms",
        "/accessibility",
        "/shipping-returns",
        "/warranty",
        "/jewellery-care",
        "/offline",
        "/category/rings",
        "/product/venus-line-ring",
      ]),
    );
  });

  it("documents known service worker asset paths for production smoke", () => {
    expect(knownSerwistAssetPaths).toEqual(["sw.js"]);
  });

  it("returns a safe miss for service worker assets outside production", async () => {
    const response = await GET(new Request("http://localhost/serwist/sw.js"), {
      params: Promise.resolve({ path: "sw.js" }),
    });

    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function stripQuery(route: string) {
  return route.split("?")[0] ?? route;
}
