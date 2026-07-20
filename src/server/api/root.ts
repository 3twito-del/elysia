import { adminRouter } from "~/server/api/routers/admin";
import { aiRouter } from "~/server/api/routers/ai";
import { appointmentsRouter } from "~/server/api/routers/appointments";
import { branchesRouter } from "~/server/api/routers/branches";
import { cartRouter } from "~/server/api/routers/cart";
import { catalogRouter } from "~/server/api/routers/catalog";
import { checkoutRouter } from "~/server/api/routers/checkout";
import { customersRouter } from "~/server/api/routers/customers";
import { ordersRouter } from "~/server/api/routers/orders";
import { searchRouter } from "~/server/api/routers/search";
import { wishlistRouter } from "~/server/api/routers/wishlist";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  ai: aiRouter,
  appointments: appointmentsRouter,
  branches: branchesRouter,
  cart: cartRouter,
  catalog: catalogRouter,
  checkout: checkoutRouter,
  customers: customersRouter,
  orders: ordersRouter,
  search: searchRouter,
  wishlist: wishlistRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.catalog.featured();
 *       ^? Product[]
 */
export const createCaller = createCallerFactory(appRouter);
