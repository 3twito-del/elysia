import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("guest wishlist saving", () => {
  it("keeps unauthenticated wishlist saves local instead of blocking the action", () => {
    const actions = read("src/app/actions.ts");
    const guestWishlist = read("src/lib/guest-wishlist.ts");
    const productCardFavorite = read(
      "src/components/product-card-favorite-button.tsx",
    );
    const productWishlist = read(
      "src/app/product/[slug]/_components/wishlist-button.tsx",
    );

    expect(actions).toContain('code: "AUTH_REQUIRED"');
    expect(actions).toContain("אפשר לשמור במועדפים גם בלי התחברות.");
    expect(guestWishlist).toContain(
      'GUEST_WISHLIST_STORAGE_KEY = "elysia_guest_wishlist"',
    );
    expect(guestWishlist).toContain("subscribeToGuestWishlist");
    expect(productCardFavorite).toContain(
      'nextState.code === "AUTH_REQUIRED"',
    );
    expect(productCardFavorite).toContain("saveGuestWishlistItem(productSlug)");
    expect(productCardFavorite).toContain(
      "נשמר במועדפים בדפדפן זה",
    );
    expect(productWishlist).toContain('nextState.code === "AUTH_REQUIRED"');
    expect(productWishlist).toContain("saveGuestWishlistItem(productSlug)");
    expect(productWishlist).toContain("aria-pressed={isSaved}");
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
