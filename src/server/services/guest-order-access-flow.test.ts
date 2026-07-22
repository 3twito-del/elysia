import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const transactionClient = {
    otpChallenge: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    db: {
      $transaction: vi.fn(
        (callback: (tx: typeof transactionClient) => unknown) =>
          callback(transactionClient),
      ),
      order: { findFirst: vi.fn() },
      otpChallenge: { create: vi.fn(), findFirst: vi.fn() },
    },
    notificationProvider: {
      isOperational: vi.fn(() => false),
      sendOtp: vi.fn(() => Promise.resolve()),
    },
    transactionClient,
  };
});

vi.mock("~/env", () => ({
  env: {
    AUTH_SECRET: "test-secret-with-enough-entropy",
    NODE_ENV: "test",
  },
}));
vi.mock("~/server/db", () => ({ db: mocks.db }));
vi.mock("~/server/adapters/notifications", () => ({
  notificationProvider: mocks.notificationProvider,
}));

import { hashOtp } from "~/server/services/customer-otp";
import {
  requestGuestOrderAccess,
  verifyGuestOrderAccess,
  verifyGuestOrderAccessToken,
} from "~/server/services/guest-order-access";

describe("guest order OTP flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.notificationProvider.isOperational.mockReturnValue(false);
    mocks.notificationProvider.sendOtp.mockResolvedValue(undefined);
  });

  it("returns the same generic contract whether an order matches or not", async () => {
    mocks.db.order.findFirst.mockResolvedValueOnce(null);
    const missing = await requestGuestOrderAccess({
      identifier: "dana@example.com",
      orderNumber: "ELY-404",
    });

    mocks.db.order.findFirst.mockResolvedValueOnce({
      email: "Dana@Example.com",
      id: "order_123",
      phone: null,
    });
    mocks.db.otpChallenge.findFirst.mockResolvedValueOnce({
      createdAt: new Date(),
    });
    const coolingDown = await requestGuestOrderAccess({
      identifier: "dana@example.com",
      orderNumber: "ELY-123",
    });

    expect(Object.keys(missing).sort()).toEqual(
      Object.keys(coolingDown).sort(),
    );
    expect(missing.message).toBe(coolingDown.message);
    expect(mocks.notificationProvider.sendOtp).not.toHaveBeenCalled();
  });

  it.each([
    {
      attempts: 0,
      expiresAt: new Date(Date.now() - 1_000),
      label: "expired",
    },
    {
      attempts: 5,
      expiresAt: new Date(Date.now() + 60_000),
      label: "attempt-limited",
    },
  ])("rejects $label challenges without consuming them", async (state) => {
    mocks.transactionClient.otpChallenge.findFirst.mockResolvedValueOnce({
      ...state,
      codeHash: hashOtp("dana@example.com", "123456"),
      consumedAt: null,
      contextKey: "order_123",
      id: "challenge_123",
      identifier: "dana@example.com",
    });

    await expect(
      verifyGuestOrderAccess({
        challengeId: "challenge_123",
        code: "123456",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.transactionClient.otpChallenge.update).not.toHaveBeenCalled();
  });

  it("counts a wrong code and never creates a customer", async () => {
    mocks.transactionClient.otpChallenge.findFirst.mockResolvedValueOnce({
      attempts: 0,
      codeHash: hashOtp("dana@example.com", "123456"),
      consumedAt: null,
      contextKey: "order_123",
      expiresAt: new Date(Date.now() + 60_000),
      id: "challenge_123",
      identifier: "dana@example.com",
    });
    mocks.transactionClient.otpChallenge.update.mockResolvedValueOnce({});

    await expect(
      verifyGuestOrderAccess({
        challengeId: "challenge_123",
        code: "654321",
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.transactionClient.otpChallenge.update).toHaveBeenCalledWith({
      data: { attempts: { increment: 1 } },
      where: { id: "challenge_123" },
    });
    expect(mocks.transactionClient).not.toHaveProperty("customer");
  });

  it("consumes a valid challenge and grants access to one order only", async () => {
    mocks.transactionClient.otpChallenge.findFirst.mockResolvedValueOnce({
      attempts: 0,
      codeHash: hashOtp("0501234567", "123456"),
      consumedAt: null,
      contextKey: "order_123",
      expiresAt: new Date(Date.now() + 60_000),
      id: "challenge_123",
      identifier: "0501234567",
    });
    mocks.transactionClient.otpChallenge.update.mockResolvedValueOnce({});

    const result = await verifyGuestOrderAccess({
      challengeId: "challenge_123",
      code: "123456",
    });

    const updateInput = mocks.transactionClient.otpChallenge.update.mock
      .calls[0]?.[0] as
      | { data: { consumedAt: Date }; where: { id: string } }
      | undefined;
    expect(updateInput?.where).toEqual({ id: "challenge_123" });
    expect(updateInput?.data.consumedAt).toBeInstanceOf(Date);
    expect(
      verifyGuestOrderAccessToken(result.token, {
        secret: "test-secret-with-enough-entropy",
      }),
    ).toMatchObject({ orderId: "order_123" });
    expect(mocks.transactionClient).not.toHaveProperty("customer");
  });
});
