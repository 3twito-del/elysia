import { describe, expect, it } from "vitest";

import {
  ALERT_ESCALATION_COOLDOWNS_MS,
  buildSearchProviderViolations,
  buildShopifyDriftViolations,
  evaluateOutboxInvariants,
  nextNotificationDelayMs,
  shouldNotifyAlert,
} from "./operational-alerts";

const now = new Date("2026-07-08T12:00:00Z");

function minutesAgo(minutes: number) {
  return new Date(now.getTime() - minutes * 60_000);
}

describe("nextNotificationDelayMs", () => {
  it("escalates through the cooldown ladder and then repeats the last step", () => {
    expect(nextNotificationDelayMs(0)).toBe(ALERT_ESCALATION_COOLDOWNS_MS[0]);
    expect(nextNotificationDelayMs(1)).toBe(ALERT_ESCALATION_COOLDOWNS_MS[1]);
    expect(nextNotificationDelayMs(2)).toBe(ALERT_ESCALATION_COOLDOWNS_MS[2]);
    expect(nextNotificationDelayMs(3)).toBe(ALERT_ESCALATION_COOLDOWNS_MS[3]);
    expect(nextNotificationDelayMs(9)).toBe(ALERT_ESCALATION_COOLDOWNS_MS[3]);
  });
});

describe("shouldNotifyAlert", () => {
  it("notifies a fresh open P0 immediately", () => {
    expect(
      shouldNotifyAlert({
        lastNotifiedAt: null,
        notifyCount: 0,
        now,
        severity: "P0",
        status: "OPEN",
      }),
    ).toBe(true);
  });

  it("repeats P0 notifications only after the escalating cooldown", () => {
    expect(
      shouldNotifyAlert({
        lastNotifiedAt: minutesAgo(10),
        notifyCount: 1,
        now,
        severity: "P0",
        status: "OPEN",
      }),
    ).toBe(false);
    expect(
      shouldNotifyAlert({
        lastNotifiedAt: minutesAgo(16),
        notifyCount: 1,
        now,
        severity: "P0",
        status: "OPEN",
      }),
    ).toBe(true);
  });

  it("notifies P1 once and never repeats", () => {
    expect(
      shouldNotifyAlert({
        lastNotifiedAt: null,
        notifyCount: 0,
        now,
        severity: "P1",
        status: "OPEN",
      }),
    ).toBe(true);
    expect(
      shouldNotifyAlert({
        lastNotifiedAt: minutesAgo(600),
        notifyCount: 1,
        now,
        severity: "P1",
        status: "OPEN",
      }),
    ).toBe(false);
  });

  it("keeps P2 dashboard-only and silences acknowledged alerts", () => {
    expect(
      shouldNotifyAlert({
        lastNotifiedAt: null,
        notifyCount: 0,
        now,
        severity: "P2",
        status: "OPEN",
      }),
    ).toBe(false);
    expect(
      shouldNotifyAlert({
        lastNotifiedAt: minutesAgo(600),
        notifyCount: 2,
        now,
        severity: "P0",
        status: "ACKNOWLEDGED",
      }),
    ).toBe(false);
  });
});

describe("evaluateOutboxInvariants", () => {
  it("stays quiet while events are within their class SLO", () => {
    expect(
      evaluateOutboxInvariants({
        events: [
          {
            createdAt: minutesAgo(3),
            status: "PENDING",
            type: "payment.captured",
          },
          {
            createdAt: minutesAgo(20),
            status: "PENDING",
            type: "email.requested",
          },
        ],
        now,
      }),
    ).toEqual([]);
  });

  it("raises a loud P0 MONEY alert for an overdue captured payment", () => {
    const violations = evaluateOutboxInvariants({
      events: [
        {
          createdAt: minutesAgo(30),
          status: "FAILED",
          type: "payment.captured",
        },
      ],
      now,
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      alertKey: "outbox-overdue:MONEY",
      class: "MONEY",
      severity: "P0",
    });
  });

  it("aggregates overdue events per class with occurrence counts in the message", () => {
    const violations = evaluateOutboxInvariants({
      events: [
        {
          createdAt: minutesAgo(90),
          status: "PENDING",
          type: "email.requested",
        },
        {
          createdAt: minutesAgo(200),
          status: "PENDING",
          type: "email.requested",
        },
      ],
      now,
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      alertKey: "outbox-overdue:CUSTOMER_COMMUNICATION",
      class: "CUSTOMER_COMMUNICATION",
      severity: "P1",
    });
    expect(violations[0]?.message).toContain("2 ");
  });

  it("treats a stuck analytics rollup as low severity", () => {
    const violations = evaluateOutboxInvariants({
      events: [
        {
          createdAt: minutesAgo(3 * 24 * 60),
          status: "PENDING",
          type: "analytics.rollup_requested",
        },
      ],
      now,
    });

    expect(violations[0]).toMatchObject({
      class: "ANALYTICS",
      severity: "P2",
    });
  });

  it("raises a P0 for dead-lettered money events regardless of age", () => {
    const violations = evaluateOutboxInvariants({
      events: [
        {
          createdAt: minutesAgo(1),
          status: "DEAD_LETTER",
          type: "payment.captured",
        },
      ],
      now,
    });

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      alertKey: "outbox-dead-letter:payment.captured",
      class: "MONEY",
      severity: "P0",
    });
  });
});

describe("buildShopifyDriftViolations (K-06)", () => {
  it("stays quiet when Shopify dropshipping isn't configured", () => {
    expect(buildShopifyDriftViolations(null)).toEqual([]);
  });

  it("stays quiet when the drift report is clean", () => {
    expect(
      buildShopifyDriftViolations({
        checkedAt: now.toISOString(),
        grantedScopeCount: 2,
        missingScopes: [],
        ok: true,
        webhooks: [
          { status: "ok", topic: "orders/create" },
          { status: "ok", topic: "orders/updated" },
          { status: "ok", topic: "orders/cancelled" },
        ],
      }),
    ).toEqual([]);
  });

  it("raises one violation per missing or mismatched webhook, plus a scope violation", () => {
    const violations = buildShopifyDriftViolations({
      checkedAt: now.toISOString(),
      grantedScopeCount: 1,
      missingScopes: ["read_orders"],
      ok: false,
      webhooks: [
        { status: "missing", topic: "orders/create" },
        {
          registeredAddress: "https://stale.vercel.app/api/webhooks/shopify/orders",
          status: "address-mismatch",
          topic: "orders/updated",
        },
        { status: "ok", topic: "orders/cancelled" },
      ],
    });

    expect(violations).toHaveLength(3);
    expect(violations[0]).toMatchObject({
      alertKey: "shopify-webhook-drift:orders/create",
      class: "SYSTEM",
      severity: "P1",
    });
    expect(violations[1]).toMatchObject({
      alertKey: "shopify-webhook-drift:orders/updated",
      class: "SYSTEM",
      severity: "P1",
    });
    expect(violations[1]?.message).toContain("stale.vercel.app");
    expect(violations[2]).toMatchObject({
      alertKey: "shopify-scope-drift",
      class: "SYSTEM",
      severity: "P1",
      measuredValue: "1",
    });
    expect(violations[2]?.message).toContain("read_orders");
  });
});

describe("buildSearchProviderViolations (K-06)", () => {
  it("stays quiet when Typesense isn't configured (local fallback by design)", () => {
    expect(buildSearchProviderViolations("not-configured")).toEqual([]);
  });

  it("stays quiet when Typesense is reachable", () => {
    expect(buildSearchProviderViolations("reachable")).toEqual([]);
  });

  it("raises a P1 SYSTEM violation when configured but unreachable", () => {
    const violations = buildSearchProviderViolations("unreachable");

    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({
      alertKey: "search-provider-unreachable",
      class: "SYSTEM",
      severity: "P1",
      invariant: "search-provider-reachable-when-configured",
    });
  });
});
