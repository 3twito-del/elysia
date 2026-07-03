import { readFileSync } from "node:fs";
import path from "node:path";

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
      "יש לבחור לפחות תכשיט אחד.",
      "יש להזין שם מלא.",
      "יש להזין טלפון תקין.",
      "יש להזין אימייל תקין.",
    ]);
  });

  it("wires checkout validation summaries to first invalid field focus", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain("checkoutFieldFocusOrder");
    expect(checkoutForm).toContain("function focusFirstCheckoutError()");
    expect(checkoutForm).toContain(
      "checkoutFormRef.current?.elements.namedItem",
    );
    expect(checkoutForm).toContain("field.focus()");
    expect(checkoutForm).toContain(
      "window.requestAnimationFrame(focusFirstCheckoutError)",
    );
    expect(checkoutForm).toContain('id="checkout-issue-list"');
    expect(checkoutForm).toContain('data-testid="checkout-validation-summary"');
    expect(checkoutForm).toContain(
      'aria-invalid={Boolean(getVisibleFieldError("name"))}',
    );
    expect(checkoutForm).toContain('aria-describedby="name-error"');
    expect(checkoutForm).toContain('role="status"');
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
