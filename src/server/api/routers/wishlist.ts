import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

/**
 * Guests and admins both get an empty list rather than an error — the
 * client-side wishlist buttons treat "not saved" as the safe default and
 * fall back to localStorage for guests.
 */
export const wishlistRouter = createTRPCRouter({
  getSavedSlugs: publicProcedure.query(async ({ ctx }) => {
    const customerId = ctx.session?.user?.id;
    const isCustomerSession = Boolean(
      customerId && !ctx.session?.user?.adminUserId,
    );

    if (!isCustomerSession || !customerId) return [];

    const wishlist = await db.wishlist.findUnique({
      where: { customerId },
      select: {
        items: { select: { variant: { select: { product: { select: { slug: true } } } } } },
      },
    });

    return wishlist?.items.map((item) => item.variant.product.slug) ?? [];
  }),
});
