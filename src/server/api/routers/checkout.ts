import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { paymentProvider } from "~/server/adapters/payment";
import {
  createManualOrder,
  createManualOrderInputSchema,
} from "~/server/services/manual-order";

export const checkoutRouter = createTRPCRouter({
  createManualOrder: publicProcedure
    .input(createManualOrderInputSchema)
    .mutation(({ input }) => createManualOrder(input)),

  createPayment: publicProcedure
    .input(
      z.object({
        orderId: z.string(),
        orderNumber: z.string(),
        amount: z.number().positive(),
        customerEmail: z.string().email(),
        returnUrl: z.string().url(),
      }),
    )
    .mutation(({ input }) =>
      paymentProvider.createCheckout({
        ...input,
        currency: "ILS",
      }),
    ),
});
