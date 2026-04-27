import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { searchProvider } from "~/server/adapters/search";

export const searchRouter = createTRPCRouter({
  products: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        branch: z.string().optional(),
        maxPrice: z.number().optional(),
      }),
    )
    .query(({ input }) => searchProvider.searchProducts(input)),

  reindex: publicProcedure.mutation(() => searchProvider.indexProducts()),
});
