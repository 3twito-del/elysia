import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("form error and recovery contract", () => {
  it("lets status messages be referenced by form controls", () => {
    const statusMessage = read("src/components/ui/status-message.tsx");

    expect(statusMessage).toContain("id?: string");
    expect(statusMessage).toContain("id={id}");
  });

  it("keeps service request field errors focusable and described", () => {
    const serviceForm = read(
      "src/app/service/_components/service-request-form.tsx",
    );

    expect(serviceForm).toContain("serviceFieldFocusOrder");
    expect(serviceForm).toContain("getFieldErrorId");
    expect(serviceForm).toContain("window.requestAnimationFrame");
    expect(serviceForm).toContain(
      'aria-describedby={getFieldErrorId("topicSlug")}',
    );
    expect(serviceForm).toContain(
      'aria-describedby={getFieldErrorId("message")}',
    );
    expect(serviceForm).toContain(
      "aria-invalid={Boolean(state.fieldErrors?.topicSlug)}",
    );
    expect(serviceForm).toContain(
      "aria-invalid={Boolean(state.fieldErrors?.message)}",
    );
    expect(serviceForm).toContain("aria-describedby={describedBy}");
    expect(serviceForm).toContain("field.focus()");
  });

  it("keeps checkout validation recovery focused on the first invalid field", () => {
    const checkoutForm = read(
      "src/app/checkout/_components/cart-checkout-form.tsx",
    );

    expect(checkoutForm).toContain("checkoutFieldFocusOrder");
    expect(checkoutForm).toContain("checkoutFormRef");
    expect(checkoutForm).toContain("focusFirstCheckoutError");
    expect(checkoutForm).toContain(
      "window.requestAnimationFrame(focusFirstCheckoutError)",
    );
    expect(checkoutForm).toContain('id="checkout-issue-list"');
    expect(checkoutForm).toContain('aria-describedby="name-error"');
    expect(checkoutForm).toContain('aria-describedby="phone-error"');
    expect(checkoutForm).toContain('aria-describedby="email-error"');
  });

  it("keeps newsletter and admin login errors recoverable", () => {
    const newsletter = read("src/components/newsletter-form.tsx");
    const adminLogin = read(
      "src/app/admin/login/_components/admin-login-form.tsx",
    );

    expect(newsletter).toContain("newsletterEmailHintId");
    expect(newsletter).toContain("newsletterStatusId");
    expect(newsletter).toContain("newsletterOfflineStatusId");
    expect(newsletter).toContain("emailInputRef");
    expect(newsletter).toContain("aria-invalid={hasNewsletterError}");
    expect(newsletter).toContain("id={newsletterStatusId}");

    expect(adminLogin).toContain("adminLoginStatusId");
    expect(adminLogin).toContain("formRef");
    expect(adminLogin).toContain("aria-invalid={hasLoginError}");
    expect(adminLogin).toContain("id={adminLoginStatusId}");
  });

  it("keeps account OTP errors field-linked without provider detail leakage", () => {
    const otpForm = read("src/app/account/_components/customer-otp-form.tsx");
    const accountActions = read("src/app/account/actions.ts");

    expect(otpForm).toContain("otpRequestStatusId");
    expect(otpForm).toContain("otpVerifyStatusId");
    expect(otpForm).toContain("identifierInputRef");
    expect(otpForm).toContain("codeInputRef");
    expect(otpForm).toContain("aria-invalid={hasRequestError}");
    expect(otpForm).toContain("aria-invalid={hasVerifyError}");

    expect(accountActions).not.toContain("const fallbackMessage");
    expect(accountActions).toContain("בדקו את הפרטים");
  });
});

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
