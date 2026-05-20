import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import { verifyCloudinarySignature } from "./route";

describe("Cloudinary webhook verification", () => {
  it("verifies signed webhook bodies within the timestamp window", () => {
    const rawBody = JSON.stringify({ public_id: "products/elysia-ring" });
    const timestamp = "1760000000";
    const secret = "cloudinary-secret";
    const signature = createHash("sha256")
      .update(`${rawBody}${timestamp}${secret}`)
      .digest("hex");
    const signedAtMs = Number(timestamp) * 1000;

    expect(
      verifyCloudinarySignature({
        rawBody,
        secret,
        signature,
        timestamp,
        nowMs: signedAtMs + 60_000,
      }),
    ).toBe(true);
  });

  it("rejects stale signed callbacks and production fallback verification", () => {
    const rawBody = JSON.stringify({ public_id: "products/elysia-ring" });
    const timestamp = "1760000000";
    const secret = "cloudinary-secret";
    const signature = createHash("sha256")
      .update(`${rawBody}${timestamp}${secret}`)
      .digest("hex");
    const signedAtMs = Number(timestamp) * 1000;

    expect(
      verifyCloudinarySignature({
        rawBody,
        secret,
        signature,
        timestamp,
        nowMs: signedAtMs + 3 * 60 * 60_000,
      }),
    ).toBe(false);
    expect(
      verifyCloudinarySignature({
        rawBody,
        secret: "",
        signature: null,
        timestamp: null,
        nodeEnv: "production",
      }),
    ).toBe(false);
    expect(
      verifyCloudinarySignature({
        rawBody,
        secret: "",
        signature: null,
        timestamp: null,
        nodeEnv: "development",
      }),
    ).toBe(true);
  });
});
