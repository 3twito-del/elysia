import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const authMock = vi.hoisted(() => vi.fn());
const adminAccessMocks = vi.hoisted(() => ({
  getAdminFromSession: vi.fn(),
  hasAdminPermission: vi.fn(),
}));
const searchMocks = vi.hoisted(() => ({
  indexProducts: vi.fn(),
}));
const outboxMocks = vi.hoisted(() => ({
  enqueueOutboxEvent: vi.fn(),
}));

vi.mock("~/server/auth", () => ({
  auth: authMock,
}));

vi.mock("~/server/auth/admin-access", () => ({
  getAdminFromSession: adminAccessMocks.getAdminFromSession,
  hasAdminPermission: adminAccessMocks.hasAdminPermission,
}));

vi.mock("~/server/adapters/search", () => ({
  searchProvider: {
    indexProducts: searchMocks.indexProducts,
  },
}));

vi.mock("~/server/services/outbox", () => ({
  BUSINESS_EVENTS: {
    searchReindexRequested: "search.reindex_requested",
  },
  enqueueOutboxEvent: outboxMocks.enqueueOutboxEvent,
}));

import { POST } from "./route";

describe("search reindex route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();

    authMock.mockResolvedValue({
      user: {
        id: "user_1",
        adminUserId: "admin_1",
      },
    });
    adminAccessMocks.getAdminFromSession.mockResolvedValue({
      id: "admin_1",
      email: "admin@example.com",
      name: "Admin",
      roleName: "Catalog",
      permissions: ["CATALOG_WRITE"],
    });
    adminAccessMocks.hasAdminPermission.mockReturnValue(true);
    searchMocks.indexProducts.mockResolvedValue({
      embedded: 12,
      embeddingDimension: 768,
      embeddingModel: "google/gemini-embedding-001",
      indexed: 42,
      engine: "local",
      semantic: true,
    });
    outboxMocks.enqueueOutboxEvent.mockResolvedValue({ id: "outbox_1" });
  });

  it("reindexes products for catalog admins and records an outbox event", async () => {
    const response = await POST(createReindexRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      audit: {
        enqueued: true,
        eventId: "outbox_1",
      },
      embedded: 12,
      embeddingDimension: 768,
      embeddingModel: "google/gemini-embedding-001",
      indexed: 42,
      engine: "local",
      semantic: true,
    });
    expect(searchMocks.indexProducts).toHaveBeenCalledTimes(1);
    expect(outboxMocks.enqueueOutboxEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "search.reindex_requested",
        aggregateType: "SearchIndex",
        aggregateId: "products",
        payload: {
          requestedBy: "admin_1",
          embedded: 12,
          embeddingDimension: 768,
          embeddingModel: "google/gemini-embedding-001",
          indexed: 42,
          engine: "local",
          semantic: true,
        },
      }),
    );
  });

  it("returns a standardized rate-limit response before expensive work", async () => {
    let response = await POST(createReindexRequest());

    for (let attempt = 0; attempt < 10; attempt += 1) {
      response = await POST(createReindexRequest());
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Too many search reindex requests.",
    });
    expect(searchMocks.indexProducts).toHaveBeenCalledTimes(10);
  });

  it("returns a redacted 503 when the search provider fails", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    searchMocks.indexProducts.mockRejectedValueOnce(
      new Error("Typesense API key leaked"),
    );

    try {
      const response = await POST(createReindexRequest());

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        error: "Search reindex provider is unavailable.",
      });
      expect(outboxMocks.enqueueOutboxEvent).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("returns a redacted 503 when the search audit event cannot be recorded", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    outboxMocks.enqueueOutboxEvent.mockRejectedValueOnce(
      new Error("database password leaked"),
    );

    try {
      const response = await POST(createReindexRequest());

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        error: "Search reindex audit is unavailable.",
      });
      expect(searchMocks.indexProducts).toHaveBeenCalledTimes(1);
    } finally {
      errorSpy.mockRestore();
    }
  });
});

function createReindexRequest() {
  return new Request("http://localhost/api/search/reindex", {
    method: "POST",
    headers: {
      "x-forwarded-for": "203.0.113.40",
    },
  });
}
