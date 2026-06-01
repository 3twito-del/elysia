import { createAppointmentInputSchema } from "~/lib/appointment-validation";
import { assertTRPCRateLimit, getTRPCRequestIp } from "~/server/api/rate-limit";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createAppointmentRequest } from "~/server/services/appointments";
import { createRateLimitKey } from "~/server/services/rate-limit";

export const appointmentsRouter = createTRPCRouter({
  create: publicProcedure
    .input(createAppointmentInputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertTRPCRateLimit({
        key: createRateLimitKey("appointment", input.phone),
        limit: 4,
        windowMs: 60 * 60_000,
        message: "יותר מדי בקשות לפגישה. נסו שוב מאוחר יותר.",
      });
      await assertTRPCRateLimit({
        key: `appointment-ip:${getTRPCRequestIp(ctx.headers)}`,
        limit: 20,
        windowMs: 60 * 60_000,
        message: "יותר מדי בקשות לפגישה. נסו שוב מאוחר יותר.",
      });

      return createAppointmentRequest({
        appointment: input,
        customerUserId: ctx.session?.user.id,
      });
    }),
});
