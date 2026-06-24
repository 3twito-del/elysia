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
    expect(actions).toContain("saved?: boolean");
    expect(actions).toContain("db.wishlistItem.findUnique");
    expect(actions).toContain("saved: false");
    expect(actions).toContain("saved: true");
    expect(actions).toContain("ניתן לשמור גם בלי התחברות.");
    expect(guestWishlist).toContain(
      'GUEST_WISHLIST_STORAGE_KEY = "elysia_guest_wishlist"',
    );
    expect(guestWishlist).toContain("subscribeToGuestWishlist");
    expect(guestWishlist).toContain("removeGuestWishlistItem");
    expect(guestWishlist).toContain("clearGuestWishlistItems");
    expect(productCardFavorite).toContain('nextState.code === "AUTH_REQUIRED"');
    expect(productCardFavorite).toContain("saveGuestWishlistItem(productSlug)");
    expect(productCardFavorite).toContain(
      "removeGuestWishlistItem(productSlug)",
    );
    expect(productCardFavorite).toContain("setServerSavedState");
    expect(productCardFavorite).toContain("saved: false");
    expect(productCardFavorite).toContain("data-favorite-saved=");
    expect(productCardFavorite).not.toContain("text-red");
    expect(productCardFavorite).toContain("הוסר מהמועדפים בדפדפן זה");
    expect(productCardFavorite).toContain("נשמר במועדפים בדפדפן זה");
    expect(productWishlist).toContain('nextState.code === "AUTH_REQUIRED"');
    expect(productWishlist).toContain("removeGuestWishlistItem(productSlug)");
    expect(productWishlist).toContain("setServerSavedState");
    expect(productWishlist).toContain("saved: false");
    expect(productWishlist).toContain("data-favorite-saved=");
    expect(productWishlist).toContain("saveGuestWishlistItem(productSlug)");
    expect(productWishlist).toContain("aria-pressed={isSaved}");
  });

  it("keeps guest wishlist state recoverable across reloads and navigation", () => {
    const guestWishlist = read("src/lib/guest-wishlist.ts");
    const productCardFavorite = read(
      "src/components/product-card-favorite-button.tsx",
    );
    const productWishlist = read(
      "src/app/product/[slug]/_components/wishlist-button.tsx",
    );

    expect(guestWishlist).toContain("readGuestWishlistSlugs");
    expect(guestWishlist).toContain("window.localStorage.getItem");
    expect(guestWishlist).toContain("window.localStorage.setItem");
    expect(guestWishlist).toContain("GUEST_WISHLIST_UPDATED_EVENT");
    expect(guestWishlist).toContain("window.dispatchEvent");
    expect(guestWishlist).toContain("window.localStorage.removeItem");
    expect(guestWishlist).toContain('window.addEventListener("storage"');
    expect(guestWishlist).toContain("event.key === GUEST_WISHLIST_STORAGE_KEY");
    expect(guestWishlist).toContain("MAX_GUEST_WISHLIST_ITEMS");
    expect(guestWishlist).toContain(
      "readGuestWishlistSlugs().filter((savedSlug) => savedSlug !== slug)",
    );

    for (const source of [productCardFavorite, productWishlist]) {
      expect(source).toContain("useEffect");
      expect(source).toContain("isGuestWishlistSaved(productSlug)");
      expect(source).toContain("subscribeToGuestWishlist(syncGuestSavedState)");
      expect(source).toContain("[productSlug]");
      expect(source).toContain('nextState.code === "AUTH_REQUIRED"');
      expect(source).toContain("setGuestSaved(true)");
      expect(source).toContain('typeof nextState.saved === "boolean"');
      expect(source).toContain("window.setTimeout");
      expect(source).toContain("window.clearTimeout");
      expect(source).toContain("message: undefined");
    }
  });

  it("keeps product-card favorite feedback complete for hover, touch, and keyboard", () => {
    const productCardFavorite = read(
      "src/components/product-card-favorite-button.tsx",
    );

    expect(productCardFavorite).toContain("aria-pressed={isSaved}");
    expect(productCardFavorite).toContain("aria-describedby={statusId}");
    expect(productCardFavorite).toContain("canRemove");
    expect(productCardFavorite).toContain("הסרה מהמועדפים");
    expect(productCardFavorite).toContain("data-icon-tooltip=");
    expect(productCardFavorite).toContain(
      "FAVORITE_REMOVAL_VISUAL_DELAY_MS = 3_000",
    );
    expect(productCardFavorite).toContain("pointerInsideCardRef");
    expect(productCardFavorite).toContain("maybeHideRemovedFavorite");
    expect(productCardFavorite).toContain(
      "hasMessage || visuallySaved ? undefined",
    );
    expect(productCardFavorite).toContain("product-card-favorite-status");
    expect(productCardFavorite).toContain(
      'data-testid="product-card-favorite-feedback"',
    );
    expect(productCardFavorite).toContain(
      'role={state.ok === false ? "alert" : "status"}',
    );
    expect(productCardFavorite).toContain(
      "max-w-[min(16rem,calc(100vw-2rem))]",
    );
    expect(productCardFavorite).toContain("disabled={pending}");
    expect(productCardFavorite).toContain('type="submit"');
  });

  it("merges guest wishlist items after customer sign-in without duplicate cards", () => {
    const accountPage = read("src/app/account/page.tsx");
    const accountActions = read("src/app/account/actions.ts");
    const mergeNotice = read(
      "src/app/account/_components/guest-wishlist-merge-notice.tsx",
    );

    expect(accountPage).toContain("<GuestWishlistMergeNotice />");
    expect(accountActions).toContain("mergeGuestWishlistAction");
    expect(accountActions).toContain("guestWishlistMergeInputSchema");
    expect(accountActions).toContain("new Set(parsed.data)");
    expect(accountActions).toContain("db.wishlistItem.upsert");
    expect(accountActions).toContain("wishlistId_variantId");
    expect(accountActions).toContain("mergedCount");
    expect(mergeNotice).toContain('"use client"');
    expect(mergeNotice).toContain("readGuestWishlistSlugs()");
    expect(mergeNotice).toContain("mergeGuestWishlistAction(slugs)");
    expect(mergeNotice).toContain("clearGuestWishlistItems()");
    expect(mergeNotice).toContain("router.refresh()");
    expect(mergeNotice).toContain(
      'testId="account-guest-wishlist-merge-notice"',
    );
  });
});

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}
