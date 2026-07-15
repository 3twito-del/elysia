import { describe, expect, it, vi } from "vitest";

const typesenseMocks = vi.hoisted(() => ({
  healthRetrieve: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: {
    NODE_ENV: "production",
    TYPESENSE_API_KEY: "typesense-key",
    TYPESENSE_HOST: "tdgkmbue18jz7xwap-1.a2.typesense.net",
    TYPESENSE_PORT: 443,
    TYPESENSE_PROTOCOL: "https",
  },
}));

vi.mock("typesense", () => ({
  Client: class {
    health = { retrieve: typesenseMocks.healthRetrieve };
  },
}));

vi.mock("~/server/ai/search-intent", () => ({
  resolveSemanticSearchIntent: vi.fn(),
}));

vi.mock("~/server/services/search-embeddings", () => ({
  calculateEmbeddingSimilarity: vi.fn(),
  embedSearchQuery: vi.fn(),
  ensureProductSearchEmbeddings: vi.fn(),
  getSearchEmbeddingConfig: vi.fn(),
  loadStoredProductSearchEmbeddings: vi.fn(),
}));

vi.mock("~/server/services/catalog", () => ({
  filterCatalogProducts: vi.fn(),
  getCatalogCategories: vi.fn(),
  getCatalogFacets: vi.fn(),
  listCatalogProducts: vi.fn(),
  searchCatalogProducts: vi.fn(),
}));

import { checkTypesenseConnectivity } from "./search";

describe("checkTypesenseConnectivity", () => {
  it("reports reachable when the health endpoint responds ok", async () => {
    typesenseMocks.healthRetrieve.mockResolvedValueOnce({ ok: true });

    await expect(checkTypesenseConnectivity()).resolves.toBe("reachable");
  });

  it("reports unreachable when the health endpoint responds not-ok", async () => {
    typesenseMocks.healthRetrieve.mockResolvedValueOnce({ ok: false });

    await expect(checkTypesenseConnectivity()).resolves.toBe("unreachable");
  });

  it("reports unreachable on a DNS/network failure -- the real production incident this guards", async () => {
    typesenseMocks.healthRetrieve.mockRejectedValueOnce(
      new Error("getaddrinfo ENOTFOUND tdgkmbue18jz7xwap-1.a2.typesense.net"),
    );

    await expect(checkTypesenseConnectivity()).resolves.toBe("unreachable");
  });

  it("reports unreachable rather than hanging when the provider never responds", async () => {
    typesenseMocks.healthRetrieve.mockImplementationOnce(
      () => new Promise(() => undefined),
    );

    await expect(checkTypesenseConnectivity(10)).resolves.toBe("unreachable");
  });

  it("reports not-configured without ever calling the provider when unconfigured", async () => {
    vi.resetModules();
    vi.doMock("~/env", () => ({
      env: {
        NODE_ENV: "development",
        TYPESENSE_API_KEY: undefined,
        TYPESENSE_HOST: undefined,
      },
    }));

    const { checkTypesenseConnectivity: checkUnconfigured } = await import(
      "./search"
    );

    typesenseMocks.healthRetrieve.mockClear();

    await expect(checkUnconfigured()).resolves.toBe("not-configured");
    expect(typesenseMocks.healthRetrieve).not.toHaveBeenCalled();

    vi.doUnmock("~/env");
    vi.resetModules();
  });
});
