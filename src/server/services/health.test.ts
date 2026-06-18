import { describe, expect, it } from "vitest";

import { getHealthOk, getHealthReadinessReport } from "./health";

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

  it("separates required app readiness from optional provider readiness", () => {
    const report = getHealthReadinessReport({
      database: "up",
      email: "brevo",
      jobs: "secured",
      payment: "manual-checkout",
      search: "local-fallback",
      shopifyDropship: "optional-disabled",
    });

    expect(report).toEqual({
      app: {
        checks: {
          database: "up",
          email: "brevo",
          jobs: "secured",
        },
        ok: true,
        status: "ready",
      },
      optionalProviders: {
        checks: {
          payment: "manual-checkout",
          search: "local-fallback",
          shopifyDropship: "optional-disabled",
        },
        ok: true,
        status: "ready-or-disabled",
      },
      overall: {
        ok: true,
      },
    });
  });

  it("keeps unsafe readiness details out of the health report", () => {
    const report = getHealthReadinessReport({
      database: "up",
      email: "missing",
      jobs: "missing-secret",
      payment: "manual-checkout",
      search: "configured",
      shopifyDropship: "configured",
    });
    const serialized = JSON.stringify(report);

    expect(report.app.ok).toBe(false);
    expect(report.overall.ok).toBe(false);
    expect(serialized).not.toMatch(
      /(?:token|password|api[_-]?key|CARD_COM_API_PASSWORD|SHOPIFY_WEBHOOK_SECRET)=/iu,
    );
  });
});
