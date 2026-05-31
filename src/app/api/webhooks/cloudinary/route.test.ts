import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const envMock = vi.hoisted(() => ({
  CLOUDINARY_API_SECRET: "cloudinary-secret",
  NODE_ENV: "production",
}));
const webhookMocks = vi.hoisted(() => ({
  parseWebhookJson: vi.fn((rawBody: string) =>
    rawBody.trim() ? (JSON.parse(rawBody) as unknown) : {},
  ),
  recordWebhookEvent: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: envMock,
}));

vi.mock("~/server/services/webhook-events", () => ({
  parseWebhookJson: webhookMocks.parseWebhookJson,
  recordWebhookEvent: webhookMocks.recordWebhookEvent,
}));

import { POST, verifyCloudinarySignature } from "./route";

describe("Cloudinary webhook verification", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();

    envMock.CLOUDINARY_API_SECRET = "cloudinary-secret";
    envMock.NODE_ENV = "production";
    webhookMocks.recordWebhookEvent.mockResolvedValue({ id: "webhook_evt_1" });
  });

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

  it("records failed callbacks and returns a stable unauthorized response", async () => {
    const response = await POST(
      createCloudinaryWebhookRequest({
        signature: "invalid",
        timestamp: "1760000000",
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid Cloudinary signature.",
    });
    expect(webhookMocks.recordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "cloudinary",
        status: "FAILED",
        fallbackEventType: "cloudinary.unverified",
      }),
    );
  });
});

function createCloudinaryWebhookRequest(input: {
  signature: string;
  timestamp: string;
}) {
  const rawBody = JSON.stringify({
    public_id: "products/elysia-ring",
    signature: "payload-secret",
  });

  return new Request("http://localhost/api/webhooks/cloudinary", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cld-signature": input.signature,
      "x-cld-timestamp": input.timestamp,
      "x-forwarded-for": "203.0.113.73",
    },
    body: rawBody,
  });
}
