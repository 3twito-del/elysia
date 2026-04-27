import { describe, expect, it } from "vitest";

import { paymentProvider } from "./payment";

describe("payment adapter", () => {
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
});
