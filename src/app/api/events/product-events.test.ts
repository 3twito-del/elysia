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

  it("records repeated product-view events as separate analytics observations", async () => {
    dbMocks.productFindUnique.mockResolvedValue({ id: "product_1" });
    const body = {
      path: "/product/venus-line-ring",
      productSlug: "venus-line-ring",
      sessionKey: "session-key-123456789",
    };

    await expect(
      postProductView(createJsonRequest("/api/events/product-view", body)),
    ).resolves.toMatchObject({ status: 200 });
    await expect(
      postProductView(createJsonRequest("/api/events/product-view", body)),
    ).resolves.toMatchObject({ status: 200 });

    expect(dbMocks.productFindUnique).toHaveBeenCalledTimes(2);
    expect(dbMocks.productViewCreate).toHaveBeenCalledTimes(2);
    expect(dbMocks.productViewCreate).toHaveBeenNthCalledWith(1, {
      data: {
        customerId: undefined,
        path: "/product/venus-line-ring",
        productId: "product_1",
        sessionKey: "session-key-123456789",
      },
    });
    expect(dbMocks.productViewCreate).toHaveBeenNthCalledWith(2, {
      data: {
        customerId: undefined,
        path: "/product/venus-line-ring",
        productId: "product_1",
        sessionKey: "session-key-123456789",
      },
    });
  });

  it("records repeated product-click events as separate analytics observations", async () => {
    dbMocks.productFindUnique.mockResolvedValue({ id: "product_1" });
    const body = {
      position: 2,
      productSlug: "venus-line-ring",
      query: "rings",
      sessionKey: "session-key-123456789",
    };

    await expect(
      postProductClick(createJsonRequest("/api/events/product-click", body)),
    ).resolves.toMatchObject({ status: 200 });
    await expect(
      postProductClick(createJsonRequest("/api/events/product-click", body)),
    ).resolves.toMatchObject({ status: 200 });

    expect(dbMocks.productFindUnique).toHaveBeenCalledTimes(2);
    expect(dbMocks.productClickCreate).toHaveBeenCalledTimes(2);
    expect(dbMocks.productClickCreate).toHaveBeenNthCalledWith(1, {
      data: {
        position: 2,
        productId: "product_1",
        query: "rings",
        sessionKey: "session-key-123456789",
      },
    });
    expect(dbMocks.productClickCreate).toHaveBeenNthCalledWith(2, {
      data: {
        position: 2,
        productId: "product_1",
        query: "rings",
        sessionKey: "session-key-123456789",
      },
    });
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

function createJsonRequest(pathname: string, body: unknown) {
  return new Request(`http://localhost${pathname}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}
