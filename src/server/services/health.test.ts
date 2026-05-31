import { describe, expect, it } from "vitest";

import { getHealthOk } from "./health";

describe("health readiness", () => {
  it("treats manual checkout as healthy while keeping hard failures unhealthy", () => {
    expect(
      getHealthOk({
        database: "degraded-fallback",
        email: "brevo",
        jobs: "preview-disabled",
        payment: "manual-checkout",
        search: "configured",
        shopifyDropship: "optional-disabled",
      }),
    ).toBe(true);

    expect(
      getHealthOk({
        database: "down",
        email: "brevo",
        jobs: "secured",
        payment: "manual-checkout",
        search: "configured",
        shopifyDropship: "optional-disabled",
      }),
    ).toBe(false);
  });
});
