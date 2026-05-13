import { describe, expect, it } from "vitest";

import {
  DELETE_CONFIRMATION_VALUE,
  customerAddressInputSchema,
  deleteCustomerDataInputSchema,
  getZodFieldErrors,
  returnRequestInputSchema,
} from "./account-validation";

describe("account validation", () => {
  it("normalizes optional address fields and accepts a valid address", () => {
    const parsed = customerAddressInputSchema.parse({
      city: " תל אביב ",
      label: " ",
      phone: "050-1234567",
      postalCode: "",
      recipient: "דנה כהן",
      street: "דיזנגוף 10",
    });

    expect(parsed).toMatchObject({
      city: "תל אביב",
      label: undefined,
      phone: "050-1234567",
      postalCode: undefined,
      recipient: "דנה כהן",
      street: "דיזנגוף 10",
    });
  });

  it("returns field-level address errors", () => {
    const parsed = customerAddressInputSchema.safeParse({
      city: "",
      phone: "abc",
      recipient: "",
      street: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(getZodFieldErrors(parsed.error)).toMatchObject({
        city: "יש להזין עיר.",
        phone: "יש להזין טלפון תקין.",
        recipient: "יש להזין שם מקבל.",
        street: "יש להזין רחוב ומספר.",
      });
    }
  });

  it("validates return request details", () => {
    expect(
      returnRequestInputSchema.safeParse({
        notes: "",
        orderId: "order_1",
        reason: "מידה לא מתאימה",
      }).success,
    ).toBe(true);

    expect(
      returnRequestInputSchema.safeParse({
        notes: "",
        orderId: "",
        reason: "",
      }).success,
    ).toBe(false);
  });

  it("requires the exact privacy deletion confirmation", () => {
    expect(
      deleteCustomerDataInputSchema.safeParse({
        confirmation: DELETE_CONFIRMATION_VALUE,
      }).success,
    ).toBe(true);
    expect(
      deleteCustomerDataInputSchema.safeParse({ confirmation: "delete" })
        .success,
    ).toBe(false);
  });
});
