import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";
import type * as CartModule from "~/server/services/cart";
import type * as CartFixturesModule from "~/server/services/cart-fixtures";
import type * as PushModule from "~/server/services/push";

const cartMocks = vi.hoisted(() => ({
  addCartItem: vi.fn<typeof CartModule.addCartItem>(),
  scheduleCartReminder: vi.fn<typeof PushModule.scheduleCartReminder>(),
  shouldUseFixtureCart: vi.fn<typeof CartFixturesModule.shouldUseFixtureCart>(),
}));

vi.mock("~/server/services/cart", async (importOriginal) => {
  const actual = await importOriginal<typeof CartModule>();

  return {
    ...actual,
    addCartItem: cartMocks.addCartItem,
  };
});

vi.mock("~/server/services/cart-fixtures", async (importOriginal) => {
  const actual = await importOriginal<typeof CartFixturesModule>();

  return {
    ...actual,
    shouldUseFixtureCart: cartMocks.shouldUseFixtureCart,
  };
});

vi.mock("~/server/services/push", async (importOriginal) => {
  const actual = await importOriginal<typeof PushModule>();

  return {
    ...actual,
    scheduleCartReminder: cartMocks.scheduleCartReminder,
  };
});

import { POST } from "./route";

describe("cart item route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
    cartMocks.shouldUseFixtureCart.mockReturnValue(false);
    cartMocks.scheduleCartReminder.mockResolvedValue(
      {} as Awaited<ReturnType<typeof PushModule.scheduleCartReminder>>,
    );
  });

  it("adds a valid cart item and schedules a cart reminder", async () => {
    cartMocks.addCartItem.mockResolvedValueOnce({ itemCount: 2 } as Awaited<
      ReturnType<typeof CartModule.addCartItem>
    >);

    const response = await POST(
      createCartItemRequest({
        quantity: 1,
        sessionKey: "cart_session_1234567890",
        variantSku: "sku-1",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      itemCount: 2,
      ok: true,
    });
    expect(cartMocks.addCartItem).toHaveBeenCalledWith({
      quantity: 1,
      sessionKey: "cart_session_1234567890",
      variantSku: "sku-1",
    });
    expect(cartMocks.scheduleCartReminder).toHaveBeenCalledWith({
      sessionKey: "cart_session_1234567890",
    });
  });

  it("does not schedule reminder jobs for fixture carts", async () => {
    cartMocks.shouldUseFixtureCart.mockReturnValue(true);
    cartMocks.addCartItem.mockResolvedValueOnce({ itemCount: 1 } as Awaited<
      ReturnType<typeof CartModule.addCartItem>
    >);

    const response = await POST(
      createCartItemRequest({
        sessionKey: "cart_session_fixture_1234567890",
        variantSku: "sku-1",
      }),
    );

    expect(response.status).toBe(200);
    expect(cartMocks.scheduleCartReminder).not.toHaveBeenCalled();
  });

  it("rejects malformed payloads before touching the cart service", async () => {
    const response = await POST(
      createCartItemRequest({
        sessionKey: "short",
        variantSku: "",
      }),
    );

    expect(response.status).toBe(400);
    expect(cartMocks.addCartItem).not.toHaveBeenCalled();
  });

  it("returns customer-safe bad-request JSON for cart validation failures", async () => {
    cartMocks.addCartItem.mockRejectedValueOnce(
      new TRPCError({
        code: "BAD_REQUEST",
        message: "Product is unavailable.",
      }),
    );

    const response = await POST(
      createCartItemRequest({
        sessionKey: "cart_session_unavailable_1234567890",
        variantSku: "sku-unavailable",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Product is unavailable.",
      ok: false,
    });
  });

  it("rate limits repeated cart item requests", async () => {
    cartMocks.addCartItem.mockResolvedValue({ itemCount: 1 } as Awaited<
      ReturnType<typeof CartModule.addCartItem>
    >);

    let response = await POST(
      createCartItemRequest({
        sessionKey: "cart_session_rate_limit_1234567890",
        variantSku: "sku-1",
      }),
    );

    for (let attempt = 0; attempt < 40; attempt += 1) {
      response = await POST(
        createCartItemRequest({
          sessionKey: "cart_session_rate_limit_1234567890",
          variantSku: "sku-1",
        }),
      );
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      error: "Too many cart item requests.",
      ok: false,
    });
  });

  it("returns standardized service-unavailable JSON for unexpected failures", async () => {
    cartMocks.addCartItem.mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    const response = await POST(
      createCartItemRequest({
        sessionKey: "cart_session_failure_1234567890",
        variantSku: "sku-1",
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Cart item updates are temporarily unavailable.",
      ok: false,
    });
  });
});

function createCartItemRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/cart/items", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.20",
    },
    method: "POST",
  });
}
