import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const dbMocks = vi.hoisted(() => ({
  productFindUnique: vi.fn(),
  productClickCreate: vi.fn(),
  productViewCreate: vi.fn(),
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

import { POST as postProductClick } from "./product-click/route";
import { POST as postProductView } from "./product-view/route";

describe("product analytics routes", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
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
