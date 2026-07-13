import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { computeNextBilling, isSubscriptionDue } from "./subscriptions";

describe("computeNextBilling", () => {
  it("advances by one month", () => {
    expect(
      computeNextBilling(new Date("2026-01-15T00:00:00Z"), "MONTHLY").toISOString(),
    ).toBe("2026-02-15T00:00:00.000Z");
  });

  it("advances by one year", () => {
    expect(
      computeNextBilling(new Date("2026-03-01T00:00:00Z"), "YEARLY").toISOString(),
    ).toBe("2027-03-01T00:00:00.000Z");
  });
});

describe("isSubscriptionDue", () => {
  const now = new Date("2026-06-25T12:00:00Z");

  it("is due when the next billing date has passed", () => {
    expect(isSubscriptionDue(new Date("2026-06-25T00:00:00Z"), now)).toBe(true);
  });

  it("is not due when the next billing date is in the future", () => {
    expect(isSubscriptionDue(new Date("2026-07-01T00:00:00Z"), now)).toBe(false);
  });
});

describe("K-14 audit coverage", () => {
  it("subscription mutations write an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/subscriptions.ts"),
      "utf8",
    );

    for (const operation of [
      "createPlan",
      "subscribeCustomer",
      "cancelSubscription",
      "runSubscriptionBilling",
    ]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("writeAdminAudit");
    }
  });
});
