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
