import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const paymentMocks = vi.hoisted(() => ({
  verifyWebhook: vi.fn(),
}));
const paymentWebhookMocks = vi.hoisted(() => ({
  applyCardComWebhook: vi.fn(),
}));
const webhookMocks = vi.hoisted(() => ({
  createWebhookErrorSummary: vi.fn((error: unknown) => ({
    name: error instanceof Error ? error.name : typeof error,
  })),
  createWebhookSafeLogContext: vi.fn(
    (input: { provider: string; stage: string; status?: string }) => ({
      provider: input.provider,
      rawBodyHash: "safe-body-hash",
      stage: input.stage,
      status: input.status ?? "RECEIVED",
    }),
  ),
  parseWebhookJson: vi.fn((rawBody: string) =>
    rawBody.trim() ? (JSON.parse(rawBody) as unknown) : {},
  ),
  recordWebhookEvent: vi.fn(),
}));

vi.mock("~/server/adapters/payment", () => ({
  paymentProvider: {
    verifyWebhook: paymentMocks.verifyWebhook,
  },
}));

vi.mock("~/server/services/payment-webhooks", () => ({
  applyCardComWebhook: paymentWebhookMocks.applyCardComWebhook,
}));

vi.mock("~/server/services/webhook-events", () => ({
  createWebhookErrorSummary: webhookMocks.createWebhookErrorSummary,
  createWebhookSafeLogContext: webhookMocks.createWebhookSafeLogContext,
  parseWebhookJson: webhookMocks.parseWebhookJson,
  recordWebhookEvent: webhookMocks.recordWebhookEvent,
}));

import { POST } from "./route";

describe("CardCom webhook route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();

    paymentMocks.verifyWebhook.mockResolvedValue(true);
    webhookMocks.recordWebhookEvent.mockResolvedValue({ id: "webhook_evt_1" });
    paymentWebhookMocks.applyCardComWebhook.mockResolvedValue({
      matched: true,
      updated: true,
    });
  });

  it("returns a stable unauthorized response for invalid signatures", async () => {
    paymentMocks.verifyWebhook.mockResolvedValue(false);

    const response = await POST(createCardComWebhookRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Invalid signature.",
    });
    expect(webhookMocks.recordWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "cardcom",
        status: "FAILED",
        fallbackEventType: "cardcom.unverified",
      }),
    );
    expect(paymentWebhookMocks.applyCardComWebhook).not.toHaveBeenCalled();
  });

  it("returns a redacted 503 when payment processing fails", async () => {
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    paymentWebhookMocks.applyCardComWebhook.mockRejectedValueOnce(
      new Error("provider secret leaked"),
    );

    try {
      const response = await POST(createCardComWebhookRequest());

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        ok: false,
        error: "CardCom webhook processing is unavailable.",
      });
      expect(errorSpy).toHaveBeenCalledWith(
        "[webhook:cardcom:process-failed]",
        expect.objectContaining({
          provider: "cardcom",
          rawBodyHash: "safe-body-hash",
          stage: "processing",
        }),
        { name: "Error" },
      );
      const loggedOutput = JSON.stringify(errorSpy.mock.calls);

      expect(loggedOutput).not.toContain("provider secret leaked");
      expect(loggedOutput).not.toContain('"message"');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("rate-limits before webhook verification work", async () => {
    let response = await POST(createCardComWebhookRequest());

    for (let attempt = 0; attempt < 120; attempt += 1) {
      response = await POST(createCardComWebhookRequest());
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Too many webhook requests.",
    });
    expect(paymentMocks.verifyWebhook).toHaveBeenCalledTimes(120);
  });
});

function createCardComWebhookRequest() {
  return new Request("http://localhost/api/webhooks/cardcom", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-cardcom-signature": "test-signature",
      "x-cardcom-timestamp": "1760000000",
      "x-forwarded-for": "203.0.113.71",
    },
    body: JSON.stringify({
      provider: "cardcom",
      providerPaymentId: "cardcom_payment_1",
      status: "captured",
    }),
  });
}
