import { branches } from "~/lib/catalog";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const branchesRouter = createTRPCRouter({
  list: publicProcedure.query(() => branches),
});
