import type { Prisma } from "@prisma/client";

/**
 * Shared Prisma selection for a customer's wishlist items, including the full
 * product context (category, material, primary image, stone) needed to render
 * a wishlist card. Used by both the account page and the wishlist page so the
 * two stay in sync.
 */
export const customerWishlistItemsArgs = {
  orderBy: { createdAt: "desc" },
  include: {
    variant: {
      include: {
        inventoryItems: {
          select: { quantity: true, reserved: true, safetyStock: true },
        },
        product: {
          include: {
            category: true,
            material: true,
            media: {
              where: { kind: "IMAGE" },
              orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
              take: 1,
            },
            stone: true,
          },
        },
      },
    },
  },
} satisfies Prisma.Wishlist$itemsArgs;

export const customerWishlistInclude = {
  include: { items: customerWishlistItemsArgs },
} satisfies Prisma.Customer$wishlistArgs;
