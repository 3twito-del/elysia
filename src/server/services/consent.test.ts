import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isConsentGranted, resolveConsent } from "./consent";

describe("resolveConsent", () => {
  it("takes the latest record per channel and defaults missing channels to false", () => {
    const resolved = resolveConsent([
      { channel: "EMAIL", status: "GRANTED", createdAt: new Date("2026-01-01") },
      { channel: "EMAIL", status: "REVOKED", createdAt: new Date("2026-03-01") },
      { channel: "SMS", status: "GRANTED", createdAt: new Date("2026-02-01") },
    ]);

    const byChannel = Object.fromEntries(
      resolved.map((entry) => [entry.channel, entry.granted]),
    );

    expect(byChannel.EMAIL).toBe(false); // latest is REVOKED
    expect(byChannel.SMS).toBe(true);
    expect(byChannel.PUSH).toBe(false); // never recorded
    expect(byChannel.WHATSAPP).toBe(false);
  });
});

describe("isConsentGranted", () => {
  const records = [
    { channel: "EMAIL", status: "GRANTED", createdAt: new Date("2026-01-01") },
    { channel: "EMAIL", status: "GRANTED", createdAt: new Date("2026-04-01") },
  ];

  it("is true when the latest record grants the channel", () => {
    expect(isConsentGranted(records, "EMAIL")).toBe(true);
  });

  it("is false for a channel with no records", () => {
    expect(isConsentGranted(records, "SMS")).toBe(false);
  });
});

describe("K-14 audit coverage", () => {
  it("recordConsent writes an AuditLog row inside a transaction", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/server/services/consent.ts"),
      "utf8",
    );
    const start = source.indexOf("export async function recordConsent(");
    const next = source.indexOf("\nexport async function ", start + 1);

    expect(start).toBeGreaterThanOrEqual(0);

    const body = source.slice(start, next === -1 ? source.length : next);

    expect(body).toContain("db.$transaction");
    expect(body).toContain("writeAdminAudit");
  });
});
