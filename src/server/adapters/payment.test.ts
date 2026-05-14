import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  assertCardComCheckoutConfigured,
  CARD_COM_PRODUCTION_CHECKOUT_ERROR,
  paymentProvider,
  verifyCardComWebhookSignature,
} from "./payment";

describe("payment adapter", () => {
  it("keeps CardCom mock checkout available outside production only", () => {
    expect(
      assertCardComCheckoutConfigured({
        NODE_ENV: "development",
        CARD_COM_API_NAME: undefined,
        CARD_COM_API_PASSWORD: undefined,
        CARD_COM_TERMINAL: undefined,
      }),
    ).toBe(false);

    expect(() =>
      assertCardComCheckoutConfigured({
        NODE_ENV: "production",
        CARD_COM_API_NAME: undefined,
        CARD_COM_API_PASSWORD: undefined,
        CARD_COM_TERMINAL: undefined,
      }),
    ).toThrow(CARD_COM_PRODUCTION_CHECKOUT_ERROR);

    expect(
      assertCardComCheckoutConfigured({
        NODE_ENV: "production",
        CARD_COM_API_NAME: "api-name",
        CARD_COM_API_PASSWORD: "api-password",
        CARD_COM_TERMINAL: "12345",
      }),
    ).toBe(true);
  });

  it("creates a mock CardCom checkout when credentials are absent", async () => {
    const session = await paymentProvider.createCheckout({
      orderId: "order_1",
      orderNumber: "APH-1001",
      amount: 1290,
      currency: "ILS",
      customerEmail: "customer@example.com",
      returnUrl: "https://aphrodite.local/checkout/return",
    });

    expect(session.provider).toBe("cardcom");
    expect(session.redirectUrl).toContain("/checkout/mock-payment");
    expect(session.idempotencyKey).toContain("order_1");
  });

  it("verifies HMAC signed CardCom webhook bodies", () => {
    const rawBody = JSON.stringify({ orderNumber: "APH-1001" });
    const signature = createHmac("sha256", "webhook-secret")
      .update(rawBody)
      .digest("hex");

    expect(
      verifyCardComWebhookSignature({
        rawBody,
        secret: "webhook-secret",
        signature,
      }),
    ).toBe(true);
  });

  it("rejects missing or mismatched CardCom webhook signatures", () => {
    expect(
      verifyCardComWebhookSignature({
        rawBody: "{}",
        secret: "webhook-secret",
        signature: "invalid",
      }),
    ).toBe(false);
    expect(
      verifyCardComWebhookSignature({
        rawBody: "{}",
        secret: undefined,
        signature: "invalid",
      }),
    ).toBe(false);
  });
});
