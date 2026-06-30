import { createHmac } from "node:crypto";

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
