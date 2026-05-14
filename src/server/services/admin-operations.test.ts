import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAdminPageInfo,
  createIntegrationSummary,
  recordAdminCustomerDataAccess,
} from "./admin-operations";

const dbMocks = vi.hoisted(() => ({
  auditLogCreate: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    auditLog: {
      create: dbMocks.auditLogCreate,
    },
  },
}));

describe("admin operations helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates stable pagination metadata", () => {
    expect(
      createAdminPageInfo({ page: 2, pageSize: 25, totalItems: 80 }),
    ).toEqual({
      hasNextPage: true,
      hasPreviousPage: true,
      page: 2,
      pageSize: 25,
      totalItems: 80,
      totalPages: 4,
    });
  });

  it("clamps requested pages above the final page", () => {
    expect(
      createAdminPageInfo({ page: 9, pageSize: 10, totalItems: 21 }),
    ).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
      page: 3,
      totalPages: 3,
    });
  });

  it("marks configured integrations as ready", () => {
    expect(
      createIntegrationSummary({
        capabilities: ["checkout"],
        configured: true,
        configuredDetail: "ready",
        fallback: false,
        fallbackDetail: "fallback",
        missingDetail: "missing",
        name: "CardCom",
      }),
    ).toEqual({
      capabilities: ["checkout"],
      detail: "ready",
      name: "CardCom",
      status: "configured",
    });
  });

  it("prefers local fallback before missing-secret in development flows", () => {
    expect(
      createIntegrationSummary({
        capabilities: ["email"],
        configured: false,
        configuredDetail: "ready",
        fallback: true,
        fallbackDetail: "mock",
        missingDetail: "missing",
        name: "Email",
      }).status,
    ).toBe("local-fallback");
  });

  it("audits admin customer data access without storing raw customer queries", async () => {
    dbMocks.auditLogCreate.mockResolvedValue({ id: "audit_1" });

    await recordAdminCustomerDataAccess({
      adminUserId: "admin_1",
      page: 2,
      pageSize: 25,
      query: "dana@example.com",
      resultCount: 3,
      totalItems: 80,
    });

    const payload = dbMocks.auditLogCreate.mock.calls[0]?.[0] as {
      data: {
        metadata: Record<string, unknown>;
      };
    };

    expect(dbMocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        adminUserId: "admin_1",
        action: "admin_customer_data_viewed",
        entity: "Customer",
        metadata: {
          page: 2,
          pageSize: 25,
          queryLength: "dana@example.com".length,
          queryPresent: true,
          resultCount: 3,
          totalItems: 80,
        },
      },
    });
    expect(JSON.stringify(payload.data.metadata)).not.toContain(
      "dana@example.com",
    );
  });
});
