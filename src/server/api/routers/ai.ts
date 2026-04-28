import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { tryOnProvider } from "~/server/adapters/try-on";
import { db } from "~/server/db";
import { searchCatalogProducts } from "~/server/services/catalog";

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
    .query(async ({ ctx, input }) => {
      const hits = (
        await searchCatalogProducts({
          query: input.style.join(" "),
          maxPrice: input.budget,
          availableOnly: true,
        })
      ).slice(0, 3);
      const response = {
        summary: `ל-${input.occasion} עבור ${input.relation}, הייתי מתחיל מתכשיטים נקיים עם שימוש יומיומי.`,
        products: hits,
      };
      const customer = ctx.session?.user.id
        ? await db.customer.findUnique({
            where: { userId: ctx.session.user.id },
            select: { id: true },
          })
        : null;

      await db.recommendationSession.create({
        data: {
          customerId: customer?.id,
          input,
          output: {
            summary: response.summary,
            productSlugs: hits.map((product) => product.slug),
          },
          model: "catalog-rules-v1",
        },
      });

      return response;
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
