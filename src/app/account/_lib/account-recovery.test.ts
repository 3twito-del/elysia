import { describe, expect, it } from "vitest";

import { createAccountServiceHref } from "./account-recovery";

describe("account recovery links", () => {
  it("preselects service topic and order number for account recovery", () => {
    const href = createAccountServiceHref({
      message: "Need help with delivery.",
      orderNumber: "ORD-1001",
      topic: "order",
    });

    expect(href).toBe(
      "/service?topic=order&orderNumber=ORD-1001&message=Need+help+with+delivery.",
    );
  });

  it("omits blank optional params", () => {
    expect(
      createAccountServiceHref({
        message: " ",
        orderNumber: null,
        productReference: "",
        topic: "accessibility-privacy",
      }),
    ).toBe("/service?topic=accessibility-privacy");
  });
});
