import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const dbMocks = vi.hoisted(() => ({
  productFindUnique: vi.fn(),
  productClickCreate: vi.fn(),
  productViewCreate: vi.fn(),
}));
const catalogFixtureMocks = vi.hoisted(() => ({
  getFixtureCatalogProductBySlug: vi.fn(),
  shouldUseCatalogFixtures: vi.fn(() => false),
}));

vi.mock("~/server/db", () => ({
  db: {
    product: {
      findUnique: dbMocks.productFindUnique,
    },
    productClickEvent: {
      create: dbMocks.productClickCreate,
    },
    productViewEvent: {
      create: dbMocks.productViewCreate,
    },
  },
}));

vi.mock("~/server/services/catalog-fixtures", () => ({
  getFixtureCatalogProductBySlug:
    catalogFixtureMocks.getFixtureCatalogProductBySlug,
  shouldUseCatalogFixtures: catalogFixtureMocks.shouldUseCatalogFixtures,
}));

import { POST as postProductClick } from "./product-click/route";
import { POST as postProductView } from "./product-view/route";

describe("product analytics routes", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
    catalogFixtureMocks.getFixtureCatalogProductBySlug.mockReturnValue(null);
    catalogFixtureMocks.shouldUseCatalogFixtures.mockReturnValue(false);
  });

  it("returns 400 for an empty product-view body", async () => {
    const response = await postProductView(
      new Request("http://localhost/api/events/product-view", {
        method: "POST",
        body: "",
      }),
    );

    expect(response.status).toBe(400);
    expect(dbMocks.productFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed product-click JSON", async () => {
    const response = await postProductClick(
      new Request("http://localhost/api/events/product-click", {
        method: "POST",
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(dbMocks.productFindUnique).not.toHaveBeenCalled();
  });

  it("standardizes product analytics rate-limit responses", async () => {
    let response = await postProductView(createProductViewRequest());

    for (let attempt = 0; attempt < 120; attempt += 1) {
      response = await postProductView(createProductViewRequest());
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Too many analytics events.",
    });
    expect(dbMocks.productFindUnique).not.toHaveBeenCalled();
  });

  it("accepts fixture product-view events without touching the database", async () => {
    catalogFixtureMocks.shouldUseCatalogFixtures.mockReturnValue(true);
    catalogFixtureMocks.getFixtureCatalogProductBySlug.mockReturnValue({
      slug: "hera-bracelet",
    });

    const response = await postProductView(
      new Request("http://localhost/api/events/product-view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: "hera-bracelet",
          sessionKey: "fixture-session-key",
          path: "/product/hera-bracelet",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(
      catalogFixtureMocks.getFixtureCatalogProductBySlug,
    ).toHaveBeenCalledWith("hera-bracelet");
    expect(dbMocks.productFindUnique).not.toHaveBeenCalled();
    expect(dbMocks.productViewCreate).not.toHaveBeenCalled();
  });

  it("returns 404 for missing fixture product-click events without touching the database", async () => {
    catalogFixtureMocks.shouldUseCatalogFixtures.mockReturnValue(true);

    const response = await postProductClick(
      new Request("http://localhost/api/events/product-click", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productSlug: "missing-product",
          query: "ring",
          position: 0,
          sessionKey: "fixture-session-key",
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(
      catalogFixtureMocks.getFixtureCatalogProductBySlug,
    ).toHaveBeenCalledWith("missing-product");
    expect(dbMocks.productFindUnique).not.toHaveBeenCalled();
    expect(dbMocks.productClickCreate).not.toHaveBeenCalled();
  });
});

function createProductViewRequest() {
  return new Request("http://localhost/api/events/product-view", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.20",
    },
    body: "{}",
  });
}
