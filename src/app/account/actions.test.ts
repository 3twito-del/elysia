import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStateForTests } from "~/server/services/rate-limit";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  customerFindUnique: vi.fn(),
  productFindMany: vi.fn(),
  revalidatePath: vi.fn(),
  savedSizeUpsert: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  transaction: vi.fn(async (operations: unknown[]) => Promise.all(operations)),
  wishlistItemUpsert: vi.fn(),
  wishlistUpsert: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {},
}));

vi.mock("~/server/auth", () => ({
  auth: mocks.auth,
  signIn: mocks.signIn,
  signOut: mocks.signOut,
}));

vi.mock("~/server/db", () => ({
  db: {
    $transaction: mocks.transaction,
    customer: {
      findUnique: mocks.customerFindUnique,
    },
    product: {
      findMany: mocks.productFindMany,
    },
    savedSize: {
      upsert: mocks.savedSizeUpsert,
    },
    wishlist: {
      upsert: mocks.wishlistUpsert,
    },
    wishlistItem: {
      upsert: mocks.wishlistItemUpsert,
    },
  },
}));

import {
  mergeGuestWishlistAction,
  saveCustomerSizeAction,
  syncCustomerSavedSizesAction,
} from "./actions";

describe("saveCustomerSizeAction", () => {
  beforeEach(() => {
    resetRateLimitStateForTests();
    vi.clearAllMocks();
  });

  it("lets guests keep local size flow without writing to the database", async () => {
    mocks.auth.mockResolvedValueOnce(null);

    const result = await saveCustomerSizeAction(
      {},
      createSizeFormData("ring", "54"),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("נשמרה במכשיר");
    expect(mocks.savedSizeUpsert).not.toHaveBeenCalled();
  });

  it("rejects admin sessions from customer size saving", async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { adminUserId: "admin_1", id: "user_admin" },
    });

    const result = await saveCustomerSizeAction(
      {},
      createSizeFormData("ring", "54"),
    );

    expect(result.ok).toBe(false);
    expect(mocks.savedSizeUpsert).not.toHaveBeenCalled();
  });

  it("upserts a saved size for a signed-in customer", async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { adminUserId: null, id: "user_1" },
    });
    mocks.customerFindUnique.mockResolvedValueOnce({ id: "customer_1" });
    mocks.savedSizeUpsert.mockResolvedValueOnce({});

    const result = await saveCustomerSizeAction(
      {},
      createSizeFormData("bracelet", "m"),
    );

    expect(result.ok).toBe(true);
    expect(mocks.savedSizeUpsert).toHaveBeenCalledWith({
      where: {
        customerId_kind: {
          customerId: "customer_1",
          kind: "bracelet",
        },
      },
      update: { value: "M" },
      create: {
        customerId: "customer_1",
        kind: "bracelet",
        value: "M",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("syncs local saved sizes that are missing from the customer profile", async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { adminUserId: null, id: "user_1" },
    });
    mocks.customerFindUnique.mockResolvedValueOnce({
      id: "customer_1",
      savedSizes: [{ kind: "ring", value: "54" }],
    });
    mocks.savedSizeUpsert.mockResolvedValue({});

    const result = await syncCustomerSavedSizesAction([
      { kind: "ring", value: "56" },
      { kind: "bracelet", value: "m" },
    ]);

    expect(result.ok).toBe(true);
    expect(mocks.savedSizeUpsert).toHaveBeenCalledTimes(1);
    expect(mocks.savedSizeUpsert).toHaveBeenCalledWith({
      where: {
        customerId_kind: {
          customerId: "customer_1",
          kind: "bracelet",
        },
      },
      update: { value: "M" },
      create: {
        customerId: "customer_1",
        kind: "bracelet",
        value: "M",
      },
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/account");
  });

  it("merges guest wishlist slugs into new account wishlist items without duplicates", async () => {
    mocks.auth.mockResolvedValueOnce({
      user: { adminUserId: null, id: "user_1" },
    });
    mocks.customerFindUnique.mockResolvedValueOnce({
      id: "customer_1",
      wishlist: {
        id: "wishlist_1",
        items: [{ variantId: "variant_existing" }],
      },
    });
    mocks.wishlistUpsert.mockResolvedValueOnce({ id: "wishlist_1" });
    mocks.productFindMany.mockResolvedValueOnce([
      {
        slug: "venus-line-ring",
        variants: [{ id: "variant_existing" }],
      },
      {
        slug: "noor-earrings",
        variants: [{ id: "variant_new" }],
      },
    ]);
    mocks.wishlistItemUpsert.mockResolvedValueOnce({});

    const result = await mergeGuestWishlistAction([
      "venus-line-ring",
      "noor-earrings",
      "venus-line-ring",
    ]);

    expect(result).toMatchObject({
      duplicateCount: 1,
      mergedCount: 1,
      ok: true,
      requestedCount: 2,
    });
    expect(mocks.wishlistItemUpsert).toHaveBeenCalledTimes(1);
    expect(mocks.wishlistItemUpsert).toHaveBeenCalledWith({
      where: {
        wishlistId_variantId: {
          variantId: "variant_new",
          wishlistId: "wishlist_1",
        },
      },
      update: {},
      create: {
        variantId: "variant_new",
        wishlistId: "wishlist_1",
      },
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/account");
  });
});

function createSizeFormData(kind: string, value: string) {
  const formData = new FormData();

  formData.set("kind", kind);
  formData.set("value", value);

  return formData;
}
