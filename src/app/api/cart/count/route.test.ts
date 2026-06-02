import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const cartMocks = vi.hoisted(() => ({
  getCartBySession: vi.fn(),
}));

vi.mock("~/server/services/cart", () => ({
  getCartBySession: cartMocks.getCartBySession,
}));

import { GET } from "./route";

describe("cart count route", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
  });

  it("returns an empty count without touching the cart service for invalid sessions", async () => {
    const response = await GET(
      new Request("http://localhost/api/cart/count?sessionKey=short"),
    );

    await expect(response.json()).resolves.toEqual({ itemCount: 0 });
    expect(response.status).toBe(200);
    expect(cartMocks.getCartBySession).not.toHaveBeenCalled();
  });

  it("returns the active cart count for a valid session key", async () => {
    cartMocks.getCartBySession.mockResolvedValueOnce({ itemCount: 4 });

    const response = await GET(
      new Request(
        "http://localhost/api/cart/count?sessionKey=cart_session_1234567890",
      ),
    );

    await expect(response.json()).resolves.toEqual({ itemCount: 4 });
    expect(response.status).toBe(200);
    expect(cartMocks.getCartBySession).toHaveBeenCalledWith(
      "cart_session_1234567890",
    );
  });

  it("returns standardized rate-limit JSON with retry headers", async () => {
    cartMocks.getCartBySession.mockResolvedValue({ itemCount: 1 });

    let response = await GET(
      createCartCountRequest("cart_session_rate_limit_1234567890"),
    );

    for (let attempt = 0; attempt < 120; attempt += 1) {
      response = await GET(
        createCartCountRequest("cart_session_rate_limit_1234567890"),
      );
    }

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Too many cart count requests.",
    });
  });

  it("returns standardized error JSON when the cart service is unavailable", async () => {
    cartMocks.getCartBySession.mockRejectedValueOnce(
      new Error("database unavailable"),
    );

    const response = await GET(
      createCartCountRequest("cart_session_unavailable_1234567890"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Cart count is temporarily unavailable.",
    });
  });

  it("keeps the header cart badge fresh without exaggerated badge styling", () => {
    const cartCountLink = read("src/components/cart-count-link.tsx");
    const cartSession = read("src/lib/cart-session.ts");
    const offlineSync = read("src/lib/pwa-offline.ts");

    expect(cartCountLink).toContain("CART_UPDATED_EVENT");
    expect(cartCountLink).toContain("getStoredCartSessionKey()");
    expect(cartCountLink).toContain("getOfflineCartDelta(sessionKey)");
    expect(cartCountLink).toContain("/api/cart/count?sessionKey=");
    expect(cartCountLink).toContain('cache: "no-store"');
    expect(cartCountLink).toContain('window.addEventListener("focus"');
    expect(cartCountLink).toContain(
      'document.addEventListener("visibilitychange"',
    );
    expect(cartCountLink).toContain('aria-live="polite"');
    expect(cartCountLink).toContain(
      'data-cart-state={itemCount > 0 ? "filled" : "empty"}',
    );
    expect(cartCountLink).toContain('data-testid="cart-count-empty-state"');
    expect(cartCountLink).toContain('itemCount > 99 ? "99+" : itemCount');
    expect(cartCountLink).not.toContain("shadow-");

    expect(cartSession).toContain("window.dispatchEvent");
    expect(cartSession).toContain("CART_UPDATED_EVENT");
    expect(offlineSync).toContain(
      "window.dispatchEvent(new Event(CART_UPDATED_EVENT))",
    );
  });
});

function createCartCountRequest(sessionKey: string) {
  return new Request(
    `http://localhost/api/cart/count?sessionKey=${encodeURIComponent(
      sessionKey,
    )}`,
    {
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    },
  );
}

function read(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}
