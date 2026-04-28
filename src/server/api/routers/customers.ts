import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  requestCustomerOtp,
  requestCustomerOtpInputSchema,
  verifyCustomerOtp,
  verifyCustomerOtpInputSchema,
} from "~/server/services/customer-otp";

export const customersRouter = createTRPCRouter({
  requestOtp: publicProcedure
    .input(requestCustomerOtpInputSchema)
    .mutation(({ input }) => requestCustomerOtp(input)),

  verifyOtp: publicProcedure
    .input(verifyCustomerOtpInputSchema)
    .mutation(({ input }) => verifyCustomerOtp(input)),
});
