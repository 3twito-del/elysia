import { describe, expect, it } from "vitest";

import {
  DEFAULT_PAYMENT_RUN_APPROVAL_THRESHOLD,
  requiresPaymentRunApproval,
} from "./payment-run";

describe("requiresPaymentRunApproval", () => {
  it("does not require approval below the threshold", () => {
    expect(requiresPaymentRunApproval(1000)).toBe(false);
  });

  it("requires approval at or above the threshold", () => {
    expect(
      requiresPaymentRunApproval(DEFAULT_PAYMENT_RUN_APPROVAL_THRESHOLD),
    ).toBe(true);
    expect(requiresPaymentRunApproval(500000)).toBe(true);
  });

  it("honours a custom threshold", () => {
    expect(requiresPaymentRunApproval(2000, 5000)).toBe(false);
    expect(requiresPaymentRunApproval(5000, 5000)).toBe(true);
  });
});
