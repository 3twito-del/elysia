import { z } from "zod";

import { products } from "~/lib/catalog";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { tryOnProvider } from "~/server/adapters/try-on";

export const aiRouter = createTRPCRouter({
  recommendGift: publicProcedure
    .input(
      z.object({
        relation: z.string(),
        occasion: z.string(),
        budget: z.number().positive(),
        style: z.array(z.string()).default([]),
      }),
    )
    .query(({ input }) => {
      const hits = products
        .filter((product) => product.price <= input.budget)
        .slice(0, 3);

      return {
        summary: `ל-${input.occasion} עבור ${input.relation}, הייתי מתחיל מתכשיטים נקיים עם שימוש יומיומי.`,
        products: hits,
      };
    }),

  createTryOnSession: publicProcedure
    .input(
      z.object({
        productSlug: z.string(),
        variantId: z.string().optional(),
        sourceImageUrl: z.string().url().optional(),
      }),
    )
    .mutation(({ input }) => tryOnProvider.createSession(input)),
});
