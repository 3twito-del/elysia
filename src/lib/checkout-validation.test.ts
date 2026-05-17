import { describe, expect, it } from "vitest";

import {
  getCheckoutIssueList,
  hasCheckoutErrors,
  validateCheckoutFields,
} from "./checkout-validation";

describe("checkout validation", () => {
  it("requires delivery address fields for delivery", () => {
    const errors = validateCheckoutFields({
      email: "dana@example.com",
      fulfillmentMethod: "DELIVERY",
      name: "Dana Levi",
      phone: "0501234567",
    });

    expect(errors.city).toBe("יש להזין עיר למשלוח.");
    expect(errors.street).toBe("יש להזין רחוב ומספר.");
    expect(hasCheckoutErrors(errors)).toBe(true);
  });

  it("does not require an inventory source for online delivery", () => {
    const errors = validateCheckoutFields({
      city: "Tel Aviv",
      email: "dana@example.com",
      fulfillmentMethod: "DELIVERY",
      name: "Dana Levi",
      phone: "0501234567",
      street: "Herzl 1",
    });

    expect(errors.city).toBeUndefined();
    expect(errors.street).toBeUndefined();
    expect(hasCheckoutErrors(errors)).toBe(false);
  });

  it("reports cart and session blockers as issue list items", () => {
    const errors = validateCheckoutFields({
      cartItemCount: 0,
      city: "Tel Aviv",
      email: "invalid",
      fulfillmentMethod: "DELIVERY",
      name: "",
      phone: "",
      requireCart: true,
      sessionReady: false,
      street: "Herzl 1",
    });

    expect(getCheckoutIssueList(errors)).toEqual([
      "יצירת סל מקומי עדיין בטעינה.",
      "יש להוסיף לפחות פריט אחד לסל.",
      "יש להזין שם מלא.",
      "יש להזין טלפון תקין.",
      "יש להזין אימייל תקין.",
    ]);
  });
});
