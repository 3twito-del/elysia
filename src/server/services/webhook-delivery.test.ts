import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertPublicWebhookUrl,
  isBlockedAddress,
  isBlockedIpv4Address,
  isBlockedIpv6Address,
  matchesSubscription,
  maskSecret,
  nextBackoffSeconds,
  signPayload,
  WebhookUrlBlockedError,
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

describe("isBlockedIpv4Address (K-13)", () => {
  it("blocks RFC1918 private ranges", () => {
    expect(isBlockedIpv4Address("10.0.0.1")).toBe(true);
    expect(isBlockedIpv4Address("172.16.0.1")).toBe(true);
    expect(isBlockedIpv4Address("172.31.255.255")).toBe(true);
    expect(isBlockedIpv4Address("192.168.1.1")).toBe(true);
  });

  it("blocks loopback and link-local (incl. the cloud metadata IP)", () => {
    expect(isBlockedIpv4Address("127.0.0.1")).toBe(true);
    expect(isBlockedIpv4Address("169.254.169.254")).toBe(true);
  });

  it("blocks carrier-grade NAT, documentation, and reserved/multicast ranges", () => {
    expect(isBlockedIpv4Address("100.64.0.1")).toBe(true);
    expect(isBlockedIpv4Address("192.0.2.1")).toBe(true);
    expect(isBlockedIpv4Address("198.51.100.1")).toBe(true);
    expect(isBlockedIpv4Address("203.0.113.1")).toBe(true);
    expect(isBlockedIpv4Address("224.0.0.1")).toBe(true);
    expect(isBlockedIpv4Address("255.255.255.255")).toBe(true);
  });

  it("allows real public addresses", () => {
    expect(isBlockedIpv4Address("8.8.8.8")).toBe(false);
    expect(isBlockedIpv4Address("1.1.1.1")).toBe(false);
    expect(isBlockedIpv4Address("172.15.255.255")).toBe(false);
    expect(isBlockedIpv4Address("172.32.0.0")).toBe(false);
  });
});

describe("isBlockedIpv6Address (K-13)", () => {
  it("blocks loopback, unspecified, link-local, and unique-local addresses", () => {
    expect(isBlockedIpv6Address("::1")).toBe(true);
    expect(isBlockedIpv6Address("::")).toBe(true);
    expect(isBlockedIpv6Address("fe80::1")).toBe(true);
    expect(isBlockedIpv6Address("fc00::1")).toBe(true);
    expect(isBlockedIpv6Address("fdff::1")).toBe(true);
  });

  it("blocks IPv4-mapped addresses whose embedded IPv4 is blocked", () => {
    expect(isBlockedIpv6Address("::ffff:169.254.169.254")).toBe(true);
    expect(isBlockedIpv6Address("::ffff:8.8.8.8")).toBe(false);
  });

  it("allows real public IPv6 addresses", () => {
    expect(isBlockedIpv6Address("2001:4860:4860::8888")).toBe(false);
  });
});

describe("isBlockedAddress (K-13)", () => {
  it("dispatches to the v4 or v6 checker by format", () => {
    expect(isBlockedAddress("127.0.0.1")).toBe(true);
    expect(isBlockedAddress("8.8.8.8")).toBe(false);
    expect(isBlockedAddress("::1")).toBe(true);
    expect(isBlockedAddress("2001:4860:4860::8888")).toBe(false);
  });
});

describe("assertPublicWebhookUrl (K-13)", () => {
  // Literal IP hostnames resolve without any real DNS/network I/O (Node's
  // resolver special-cases already-valid IP literals), so these are
  // deterministic without mocking `node:dns/promises`.
  it("throws WebhookUrlBlockedError for a literal private/metadata IP", async () => {
    await expect(
      assertPublicWebhookUrl("http://169.254.169.254/latest"),
    ).rejects.toBeInstanceOf(WebhookUrlBlockedError);
    await expect(
      assertPublicWebhookUrl("http://127.0.0.1/hook"),
    ).rejects.toBeInstanceOf(WebhookUrlBlockedError);
  });

  it("resolves for a literal public IP", async () => {
    await expect(
      assertPublicWebhookUrl("http://8.8.8.8/hook"),
    ).resolves.toBeUndefined();
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
