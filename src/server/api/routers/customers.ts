import { assertTRPCRateLimit, getTRPCRequestIp } from "~/server/api/rate-limit";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createRateLimitKey } from "~/server/services/rate-limit";
import {
  normalizeOtpIdentifier,
  requestCustomerOtp,
  requestCustomerOtpInputSchema,
  verifyCustomerOtp,
  verifyCustomerOtpInputSchema,
} from "~/server/services/customer-otp";

export const customersRouter = createTRPCRouter({
  requestOtp: publicProcedure
    .input(requestCustomerOtpInputSchema)
    .mutation(async ({ ctx, input }) => {
      const identifier = normalizeOtpIdentifier(input.identifier);

      await assertTRPCRateLimit({
        key: createRateLimitKey("otp:request", identifier),
        limit: 3,
        windowMs: 10 * 60_000,
        message: "Too many OTP requests.",
      });
      await assertTRPCRateLimit({
        key: `otp:request-ip:${getTRPCRequestIp(ctx.headers)}`,
        limit: 20,
        windowMs: 10 * 60_000,
        message: "Too many OTP requests.",
      });

      return requestCustomerOtp(input);
    }),

  verifyOtp: publicProcedure
    .input(verifyCustomerOtpInputSchema)
    .mutation(async ({ ctx, input }) => {
      const identifier = normalizeOtpIdentifier(input.identifier);

      await assertTRPCRateLimit({
        key: createRateLimitKey("otp:verify", identifier),
        limit: 6,
        windowMs: 10 * 60_000,
        message: "Too many OTP verification attempts.",
      });
      await assertTRPCRateLimit({
        key: `otp:verify-ip:${getTRPCRequestIp(ctx.headers)}`,
        limit: 30,
        windowMs: 10 * 60_000,
        message: "Too many OTP verification attempts.",
      });

      return verifyCustomerOtp(input);
    }),
});
