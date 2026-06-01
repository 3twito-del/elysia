import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const authMock = vi.hoisted(() => vi.fn());
const dbMocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
  customerFindUnique: vi.fn(),
  shopifyOrderMirrorFindMany: vi.fn(),
}));

vi.mock("~/server/auth", () => ({
  auth: authMock,
}));

vi.mock("~/server/db", () => ({
  db: {
    auditLog: {
      create: dbMocks.auditLogCreate,
    },
    customer: {
      findUnique: dbMocks.customerFindUnique,
    },
    shopifyOrderMirror: {
      findMany: dbMocks.shopifyOrderMirrorFindMany,
    },
  },
}));

import { GET } from "./route";

describe("customer privacy export route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();

    authMock.mockResolvedValue({
      user: {
        id: "user_1",
      },
    });
    dbMocks.customerFindUnique.mockResolvedValue(createCustomerExport());
    dbMocks.shopifyOrderMirrorFindMany.mockResolvedValue([]);
    dbMocks.auditLogCreate.mockResolvedValue({ id: "audit_1" });
  });

  it("rejects unauthenticated and admin sessions", async () => {
    authMock.mockResolvedValueOnce(null);

    const unauthenticated = await GET();

    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.headers.get("Cache-Control")).toBe("no-store");
    expect(unauthenticated.headers.get("Link")).toBe('</account>; rel="login"');
    expect(unauthenticated.headers.get("X-Content-Type-Options")).toBe(
      "nosniff",
    );
    await expect(unauthenticated.json()).resolves.toEqual({
      ok: false,
      error: "Unauthorized.",
      recovery: {
        href: "/account",
        rel: "account-sign-in",
      },
    });
    expect(dbMocks.customerFindUnique).not.toHaveBeenCalled();

    authMock.mockResolvedValueOnce({
      user: {
        id: "admin_user_1",
        adminUserId: "admin_1",
      },
    });

    const admin = await GET();

    expect(admin.status).toBe(401);
    await expect(admin.json()).resolves.toEqual({
      ok: false,
      error: "Unauthorized.",
      recovery: {
        href: "/account",
        rel: "account-sign-in",
      },
    });
    expect(dbMocks.customerFindUnique).not.toHaveBeenCalled();
  });

  it("exports customer data with no-store download headers and an audit entry", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toContain(
      'filename="elysia-customer-customer_1.json"',
    );
    await expect(response.json()).resolves.toMatchObject({
      customer: {
        id: "customer_1",
        email: "dana@example.com",
        shopifyOrderMirrors: [],
      },
    });
    expect(dbMocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        action: "customer_data_exported",
        entity: "Customer",
        entityId: "customer_1",
        metadata: {
          customerId: "customer_1",
          userId: "user_1",
        },
      },
    });
  });

  it("rate-limits repeated privacy exports before loading customer data", async () => {
    let response = await GET();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      response = await GET();
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Too many privacy export requests.",
    });
    expect(dbMocks.customerFindUnique).toHaveBeenCalledTimes(5);
    expect(dbMocks.auditLogCreate).toHaveBeenCalledTimes(5);
  });
});

function createCustomerExport() {
  return {
    id: "customer_1",
    email: "dana@example.com",
    addresses: [],
    appointments: [],
    carts: [],
    giftProfiles: [],
    orders: [],
    recommendationSessions: [],
    savedSizes: [],
    styleProfile: null,
    tryOnSessions: [],
    wishlist: null,
  };
}
