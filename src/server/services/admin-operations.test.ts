import { describe, expect, it } from "vitest";

import {
  createAdminPageInfo,
  createIntegrationSummary,
} from "./admin-operations";

describe("admin operations helpers", () => {
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
});
