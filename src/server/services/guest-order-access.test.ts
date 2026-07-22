import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  createGuestOrderAccessToken,
  guestOrderIdentifierMatches,
  verifyGuestOrderAccessToken,
} from "~/server/services/guest-order-access";

describe("guest order access token", () => {
  it("matches stored email and phone values after canonical normalization", () => {
    expect(
      guestOrderIdentifierMatches(" DANA@EXAMPLE.COM ", {
        email: "dana@example.com",
        phone: null,
      }),
    ).toBe(true);
    expect(
      guestOrderIdentifierMatches("0501234567", {
        email: null,
        phone: "050-123-4567",
      }),
    ).toBe(true);
    expect(
      guestOrderIdentifierMatches("0509999999", {
        email: "dana@example.com",
        phone: "050-123-4567",
      }),
    ).toBe(false);
  });

  it("grants access only to the order encoded in an unexpired signed token", () => {
    const token = createGuestOrderAccessToken({
      orderId: "order_123",
      secret: "test-secret-with-enough-entropy",
      now: new Date("2026-07-22T12:00:00.000Z"),
      ttlSeconds: 600,
    });

    expect(
      verifyGuestOrderAccessToken(token, {
        secret: "test-secret-with-enough-entropy",
        now: new Date("2026-07-22T12:09:59.000Z"),
      }),
    ).toMatchObject({ orderId: "order_123" });
    expect(
      verifyGuestOrderAccessToken(token, {
        secret: "different-secret",
        now: new Date("2026-07-22T12:01:00.000Z"),
      }),
    ).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = createGuestOrderAccessToken({
      orderId: "order_123",
      secret: "test-secret-with-enough-entropy",
      now: new Date("2026-07-22T12:00:00.000Z"),
      ttlSeconds: 60,
    });

    expect(
      verifyGuestOrderAccessToken(token, {
        secret: "test-secret-with-enough-entropy",
        now: new Date("2026-07-22T12:01:01.000Z"),
      }),
    ).toBeNull();
  });

  it("keeps guest verification order-scoped and separate from customer sign-in", () => {
    const guestSource = readFileSync(
      path.join(process.cwd(), "src/server/services/guest-order-access.ts"),
      "utf8",
    );
    const customerSource = readFileSync(
      path.join(process.cwd(), "src/server/services/customer-otp.ts"),
      "utf8",
    );

    expect(guestSource).toContain(
      'GUEST_ORDER_OTP_PURPOSE = "GUEST_ORDER_ACCESS"',
    );
    expect(guestSource).toContain("purpose: GUEST_ORDER_OTP_PURPOSE");
    expect(guestSource).toContain("contextKey: order.id");
    expect(guestSource).not.toMatch(/tx\.customer\.(?:create|upsert)/u);
    expect(
      customerSource.match(/purpose: CUSTOMER_SIGN_IN_OTP_PURPOSE/gu),
    ).toHaveLength(3);
  });

  it("sets an HttpOnly short-lived cookie only after guest verification", () => {
    const actionSource = readFileSync(
      path.join(process.cwd(), "src/app/account/actions.ts"),
      "utf8",
    );

    expect(actionSource).toContain("httpOnly: true");
    expect(actionSource).toContain(
      "maxAge: GUEST_ORDER_ACCESS_MAX_AGE_SECONDS",
    );
    expect(actionSource).toContain('path: "/account"');
    expect(actionSource).toContain('sameSite: "lax"');
  });
});
