"use client";

export const GUEST_WISHLIST_STORAGE_KEY = "elysia_guest_wishlist";
export const GUEST_WISHLIST_UPDATED_EVENT = "elysia:guest-wishlist-updated";

const MAX_GUEST_WISHLIST_ITEMS = 100;

export function readGuestWishlistSlugs() {
  if (typeof window === "undefined") return [];

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(GUEST_WISHLIST_STORAGE_KEY) ?? "[]",
    );

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, MAX_GUEST_WISHLIST_ITEMS);
  } catch {
    return [];
  }
}

export function isGuestWishlistSaved(productSlug: string) {
  return readGuestWishlistSlugs().includes(productSlug);
}

export function saveGuestWishlistItem(productSlug: string) {
  const slug = productSlug.trim();

  if (!slug || typeof window === "undefined") {
    return readGuestWishlistSlugs();
  }

  const slugs = [
    slug,
    ...readGuestWishlistSlugs().filter((savedSlug) => savedSlug !== slug),
  ].slice(0, MAX_GUEST_WISHLIST_ITEMS);

  try {
    window.localStorage.setItem(
      GUEST_WISHLIST_STORAGE_KEY,
      JSON.stringify(slugs),
    );
    window.dispatchEvent(
      new CustomEvent(GUEST_WISHLIST_UPDATED_EVENT, { detail: { slugs } }),
    );
  } catch {
    return readGuestWishlistSlugs();
  }

  return slugs;
}

export function removeGuestWishlistItem(productSlug: string) {
  const slug = productSlug.trim();

  if (!slug || typeof window === "undefined") {
    return readGuestWishlistSlugs();
  }

  const slugs = readGuestWishlistSlugs().filter(
    (savedSlug) => savedSlug !== slug,
  );

  try {
    window.localStorage.setItem(
      GUEST_WISHLIST_STORAGE_KEY,
      JSON.stringify(slugs),
    );
    window.dispatchEvent(
      new CustomEvent(GUEST_WISHLIST_UPDATED_EVENT, { detail: { slugs } }),
    );
  } catch {
    return readGuestWishlistSlugs();
  }

  return slugs;
}

export function clearGuestWishlistItems() {
  if (typeof window === "undefined") return [];

  try {
    window.localStorage.removeItem(GUEST_WISHLIST_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(GUEST_WISHLIST_UPDATED_EVENT, { detail: { slugs: [] } }),
    );
  } catch {
    return readGuestWishlistSlugs();
  }

  return [];
}

export function subscribeToGuestWishlist(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleUpdate = () => callback();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === GUEST_WISHLIST_STORAGE_KEY) callback();
  };

  window.addEventListener(GUEST_WISHLIST_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(GUEST_WISHLIST_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleStorage);
  };
}
