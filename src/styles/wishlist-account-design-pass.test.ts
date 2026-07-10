import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const accountPage = read("src/app/account/page.tsx");
const wishlistPage = read("src/app/wishlist/page.tsx");
const guestWishlistProducts = read(
  "src/app/wishlist/_components/guest-wishlist-products.tsx",
);
const wishlistShortlist = read("src/app/account/_lib/wishlist-shortlist.ts");
const wishlistProductsLib = read("src/app/wishlist/_lib/wishlist-products.ts");
const customerWishlistQuery = read(
  "src/app/account/_lib/customer-wishlist-query.ts",
);
const orderPage = read("src/app/account/orders/[id]/page.tsx");
const invoicesPage = read("src/app/account/invoices/page.tsx");
const addressForm = read("src/app/account/_components/customer-address-form.tsx");
const savedSizesForm = read(
  "src/app/account/_components/customer-saved-sizes-form.tsx",
);
const css = read("src/styles/globals.css");

describe("wishlist + account design pass (owner-selected DP 51-58)", () => {
  it("hides the wishlist remove control until hover/focus on desktop, keeping it always visible on mobile", () => {
    expect(css).toContain(".wishlist-item-remove {");
    expect(css).toContain("opacity: 1;");
    expect(css).toContain(
      "@media (hover: hover) and (pointer: fine) and (min-width: 768px) {",
    );
    expect(wishlistPage).toContain('className="wishlist-item-remove"');
    expect(guestWishlistProducts).toContain(
      'className="wishlist-item-remove justify-self-start"',
    );
  });

  it("shows a live availability note on saved items instead of a badge (no save-time snapshot exists, so it reflects current status)", () => {
    expect(wishlistShortlist).toContain(
      "export function getWishlistItemAvailabilityNote(",
    );
    expect(wishlistShortlist).toContain("status.canAddToCart ? null : status.label");
    expect(customerWishlistQuery).toContain("inventoryItems: {");
    expect(wishlistPage).toContain("getWishlistItemAvailabilityNote({");
    expect(wishlistPage).toContain(
      'data-testid="wishlist-item-availability-note"',
    );
    expect(wishlistProductsLib).toContain("availabilityLabel?:");
    expect(guestWishlistProducts).toContain("product.availabilityLabel");
  });

  it("aligns the dashboard shortcut grid's JSX breakpoint with its CSS divider breakpoint (both switch at 1024px)", () => {
    expect(accountPage).toContain(
      'className="account-support-grid grid gap-0 sm:grid-cols-2 lg:grid-cols-4"',
    );
    expect(css).toContain("@media (min-width: 1024px) {");
  });

  it("gives the order timeline a token-colored status dot per step", () => {
    expect(orderPage).toContain('className="order-timeline-dot');
    expect(orderPage).toContain('data-state={event.state}');
    expect(css).toContain(".order-timeline-dot {");
    expect(css).toContain('.order-timeline-dot[data-state="current"]');
    expect(css).toContain('.order-timeline-dot[data-state="done"]');
    expect(css).toContain('.dark .order-timeline-dot[data-state="done"]');
  });

  it("keeps the saved-sizes empty state to a single action", () => {
    expect(accountPage).toContain("בינתיים אפשר להיעזר במדריך המידות.");
    expect(accountPage).not.toContain("/service?topic=sizing");
  });

  it("keeps profile-adjacent save forms on the silent StatusMessage pattern (audit: already the established convention, no page jump)", () => {
    expect(addressForm).toContain("<StatusMessage");
    expect(addressForm).toContain('variant="plain"');
    expect(addressForm).not.toContain("router.push");
    expect(savedSizesForm).toContain("<StatusMessage");
    expect(savedSizesForm).toContain('variant="plain"');
  });

  it("uses tabular-nums for every price and count in the invoices table", () => {
    expect(invoicesPage).toContain('className="text-2xl font-semibold tabular-nums"');
    expect(invoicesPage).toContain(
      'className="font-semibold tabular-nums"',
    );
  });

  it("shows saved sizes as compact chips instead of full-width bordered rows", () => {
    expect(accountPage).toContain('data-testid="account-saved-size-chips"');
    expect(accountPage).toContain(
      'className="border-border inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"',
    );
    expect(accountPage).not.toContain(
      'className="account-record-row flex items-center justify-between rounded-md border p-3"',
    );
  });
});
