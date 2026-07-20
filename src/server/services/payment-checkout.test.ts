import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  orderFindUnique: vi.fn(),
}));

const paymentMocks = vi.hoisted(() => ({
  createCheckout: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    order: {
      findUnique: dbMocks.orderFindUnique,
    },
  },
}));

vi.mock("~/server/adapters/payment", () => ({
  paymentProvider: {
    createCheckout: paymentMocks.createCheckout,
  },
}));

const ownCommerceMocks = vi.hoisted(() => ({
  isOwnCommerceEnabled: vi.fn(() => true),
}));

vi.mock("~/server/services/own-commerce", () => ({
  isOwnCommerceEnabled: ownCommerceMocks.isOwnCommerceEnabled,
}));

import {
  createPaymentCheckoutSession,
  getExistingPaymentCheckoutSessionFromPayments,
  getPaymentCheckoutFailureMessage,
  type PaymentCheckoutFailureKind,
} from "./payment-checkout";

describe("payment checkout failure copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps local payment failures customer-safe and provider-redacted", () => {
    const kinds: PaymentCheckoutFailureKind[] = [
      "provider_unavailable",
      "payment_rejected",
      "callback_mismatch",
      "webhook_delay",
      "payment_already_recorded",
      "own_commerce_disabled",
    ];
    const messages = kinds.map((kind) =>
      getPaymentCheckoutFailureMessage(kind),
    );

    expect(new Set(messages).size).toBe(messages.length);

    for (const message of messages) {
      expect(message.length).toBeGreaterThan(30);
      expect(message).not.toMatch(/CARD_COM|CardCom|terminal|webhook secret/i);
      expect(message).not.toMatch(/success/i);
    }
  });

  it("separates unavailable provider, rejected payment, callback mismatch, and webhook delay cases", () => {
    // Hebrew now (UX22) -- this used to be the one hardcoded-English surface
    // in an otherwise Hebrew-only checkout flow.
    expect(getPaymentCheckoutFailureMessage("provider_unavailable")).toContain(
      "לא ניתן לפתוח את התשלום",
    );
    expect(getPaymentCheckoutFailureMessage("payment_rejected")).toContain(
      "לא אושר",
    );
    expect(getPaymentCheckoutFailureMessage("callback_mismatch")).toContain(
      "לא ניתן היה לאמת",
    );
    expect(getPaymentCheckoutFailureMessage("webhook_delay")).toContain(
      "ממתינה לאישור תשלום",
    );
  });

  it("restores a pending provider checkout session for repeated submissions", () => {
    expect(
      getExistingPaymentCheckoutSessionFromPayments([
        {
          idempotencyKey: "checkout_order_1_provider_payment_1",
          provider: "cardcom",
          providerPaymentId: "provider_payment_1",
          providerStatus: "checkout_created",
          rawPayload: {
            redirectUrl: "https://secure.example/pay/provider_payment_1",
          },
          status: "PENDING",
        },
      ]),
    ).toEqual({
      idempotencyKey: "checkout_order_1_provider_payment_1",
      provider: "cardcom",
      providerPaymentId: "provider_payment_1",
      redirectUrl: "https://secure.example/pay/provider_payment_1",
    });

    expect(
      getExistingPaymentCheckoutSessionFromPayments([
        {
          idempotencyKey: "checkout_order_1_provider_payment_1",
          provider: "cardcom",
          providerPaymentId: "provider_payment_1",
          providerStatus: "checkout_created",
          rawPayload: {},
          status: "PENDING",
        },
      ]),
    ).toBeNull();
  });

  it("returns an existing pending checkout without creating another provider session", async () => {
    dbMocks.orderFindUnique.mockResolvedValueOnce({
      email: "customer@example.com",
      orderNumber: "ELY-1001",
      payments: [
        {
          idempotencyKey: "checkout_order_1_provider_payment_1",
          provider: "cardcom",
          providerPaymentId: "provider_payment_1",
          providerStatus: "checkout_created",
          rawPayload: {
            redirectUrl: "https://secure.example/pay/provider_payment_1",
          },
          status: "PENDING",
        },
      ],
      status: "PENDING_PAYMENT",
      total: 1290,
    });

    await expect(
      createPaymentCheckoutSession({
        checkout: {
          amount: 1290,
          customerEmail: "customer@example.com",
          orderId: "order_1",
          orderNumber: "ELY-1001",
          returnUrl: "https://elysia.local/checkout/return",
        },
        headers: new Headers({ origin: "https://elysia.local" }),
      }),
    ).resolves.toMatchObject({
      providerPaymentId: "provider_payment_1",
      redirectUrl: "https://secure.example/pay/provider_payment_1",
    });
    expect(paymentMocks.createCheckout).not.toHaveBeenCalled();
  });

  // ADR 0013 Gate L2 — while own commerce is disabled, the merchant-of-record
  // payment path must refuse before touching the order or the provider.
  it("refuses to open a payment session while own commerce is disabled", async () => {
    ownCommerceMocks.isOwnCommerceEnabled.mockReturnValueOnce(false);

    await expect(
      createPaymentCheckoutSession({
        checkout: {
          amount: 1290,
          customerEmail: "customer@example.com",
          orderId: "order_1",
          orderNumber: "ELY-1001",
          returnUrl: "https://elysia.local/checkout/return",
        },
        headers: new Headers({ origin: "https://elysia.local" }),
      }),
    ).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: getPaymentCheckoutFailureMessage("own_commerce_disabled"),
    });
    expect(dbMocks.orderFindUnique).not.toHaveBeenCalled();
    expect(paymentMocks.createCheckout).not.toHaveBeenCalled();
  });
});
