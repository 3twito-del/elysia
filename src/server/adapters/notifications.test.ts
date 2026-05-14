import { beforeEach, describe, expect, it, vi } from "vitest";

const resendSendMock = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function ResendMock() {
    return {
      emails: {
        send: resendSendMock,
      },
    };
  }),
}));

vi.mock("~/env", () => ({
  env: {
    BREVO_API_KEY: undefined,
    RESEND_API_KEY: "re_test",
    STORE_FROM_EMAIL: "orders@example.com",
    STORE_FROM_NAME: "Aphrodite",
    NODE_ENV: "test",
  },
}));

import {
  createNotificationProvider,
  notificationProvider,
  PRODUCTION_EMAIL_PROVIDER_ERROR,
} from "./notifications";

describe("notification adapter", () => {
  beforeEach(() => {
    resendSendMock.mockReset();
  });

  it("passes Resend idempotency keys for retry-safe emails", async () => {
    resendSendMock.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    });

    const result = await notificationProvider.sendEmail({
      to: "dana@example.com",
      subject: "Order update",
      body: "Your order was updated.",
      idempotencyKey: "email.requested:order_123",
    });

    expect(result).toEqual({ id: "email_123", provider: "resend" });
    expect(resendSendMock).toHaveBeenCalledWith(
      {
        from: "Aphrodite <orders@example.com>",
        to: "dana@example.com",
        subject: "Order update",
        text: "Your order was updated.",
        html: undefined,
      },
      { idempotencyKey: "email.requested:order_123" },
    );
  });

  it("fails when Resend returns a provider error", async () => {
    resendSendMock.mockResolvedValue({
      data: null,
      error: {
        name: "daily_quota_exceeded",
        statusCode: 429,
        message: "Daily email quota exceeded.",
      },
    });

    await expect(
      notificationProvider.sendEmail({
        to: "dana@example.com",
        subject: "Order update",
        body: "Your order was updated.",
      }),
    ).rejects.toThrow("daily_quota_exceeded: 429: Daily email quota exceeded.");
  });

  it("uses the mock provider only outside production when email keys are absent", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {
      return undefined;
    });
    const provider = createNotificationProvider({
      NODE_ENV: "development",
      BREVO_API_KEY: undefined,
      RESEND_API_KEY: undefined,
    });

    await expect(
      provider.sendEmail({
        to: "dana@example.com",
        subject: "Order update",
        body: "Your order was updated.",
      }),
    ).resolves.toMatchObject({ provider: "mock" });
    expect(provider.isOperational()).toBe(false);
    expect(provider.providerName()).toBe("mock");

    infoSpy.mockRestore();
  });

  it("fails clearly in production when transactional email keys are absent", async () => {
    const provider = createNotificationProvider({
      NODE_ENV: "production",
      BREVO_API_KEY: undefined,
      RESEND_API_KEY: undefined,
    });

    expect(provider.isOperational()).toBe(false);
    expect(provider.providerName()).toBe("missing");
    await expect(
      provider.sendEmail({
        to: "dana@example.com",
        subject: "Order update",
        body: "Your order was updated.",
      }),
    ).rejects.toThrow(PRODUCTION_EMAIL_PROVIDER_ERROR);
    await expect(
      provider.sendOtp("dana@example.com", "123456"),
    ).rejects.toThrow(PRODUCTION_EMAIL_PROVIDER_ERROR);
  });
});
