import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  matchesSubscription,
  maskSecret,
  nextBackoffSeconds,
  signPayload,
} from "./webhook-delivery";

describe("signPayload", () => {
  it("produces a verifiable HMAC-SHA256 signature", () => {
    const body = '{"a":1}';
    const expected = createHmac("sha256", "whsec_x").update(body).digest("hex");
    expect(signPayload("whsec_x", body)).toBe(expected);
  });
});

describe("matchesSubscription", () => {
  it("matches exact events and the wildcard", () => {
    expect(matchesSubscription(["order.paid"], "order.paid")).toBe(true);
    expect(matchesSubscription(["order.paid"], "order.shipped")).toBe(false);
    expect(matchesSubscription(["*"], "anything")).toBe(true);
  });
});

describe("nextBackoffSeconds", () => {
  it("grows exponentially and caps at an hour", () => {
    expect(nextBackoffSeconds(0)).toBe(30);
    expect(nextBackoffSeconds(1)).toBe(60);
    expect(nextBackoffSeconds(2)).toBe(120);
    expect(nextBackoffSeconds(20)).toBe(3600);
  });
});

describe("maskSecret", () => {
  it("reveals only the prefix", () => {
    expect(maskSecret("whsec_abcdef123456")).toBe("whsec_••••••");
  });
});

describe("K-14 audit coverage", () => {
  it("every admin-initiated endpoint/delivery mutation writes an AuditLog row", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/webhook-delivery.ts"),
      "utf8",
    );

    for (const operation of [
      "createEndpoint",
      "setEndpointActive",
      "deleteEndpoint",
      "deliverWebhook",
    ]) {
      const start = source.indexOf(`export async function ${operation}`);
      const next = source.indexOf("\nexport async function ", start + 1);

      expect(start).toBeGreaterThanOrEqual(0);

      const body = source.slice(start, next === -1 ? source.length : next);

      expect(body).toContain("writeAdminAudit");
    }
  });
});
