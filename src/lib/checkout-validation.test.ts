import { describe, expect, it } from "vitest";

import {
  getCheckoutIssueList,
  hasCheckoutErrors,
  validateCheckoutFields,
} from "./checkout-validation";

describe("checkout validation", () => {
  it("requires delivery address fields for delivery", () => {
    const errors = validateCheckoutFields({
      branchSlug: "tel-aviv",
      email: "dana@example.com",
      fulfillmentMethod: "DELIVERY",
      name: "Dana Levi",
      phone: "0501234567",
    });

    expect(errors.city).toBe("יש להזין עיר למשלוח.");
    expect(errors.street).toBe("יש להזין רחוב ומספר.");
    expect(hasCheckoutErrors(errors)).toBe(true);
  });

  it("does not require delivery address fields for pickup", () => {
    const errors = validateCheckoutFields({
      branchSlug: "tel-aviv",
      email: "dana@example.com",
      fulfillmentMethod: "PICKUP",
      name: "Dana Levi",
      phone: "0501234567",
    });

    expect(errors.city).toBeUndefined();
    expect(errors.street).toBeUndefined();
    expect(hasCheckoutErrors(errors)).toBe(false);
  });

  it("reports cart and session blockers as issue list items", () => {
    const errors = validateCheckoutFields({
      branchSlug: "",
      cartItemCount: 0,
      email: "invalid",
      fulfillmentMethod: "PICKUP",
      name: "",
      phone: "",
      requireCart: true,
      sessionReady: false,
    });

    expect(getCheckoutIssueList(errors)).toEqual([
      "יצירת סל מקומי עדיין בטעינה.",
      "יש להוסיף לפחות פריט אחד לסל.",
      "יש להזין שם מלא.",
      "יש להזין טלפון תקין.",
      "יש להזין אימייל תקין.",
      "יש לבחור סניף מלאי.",
    ]);
  });
});
