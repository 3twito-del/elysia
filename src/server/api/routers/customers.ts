import { createHash, randomInt } from "node:crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { notificationProvider } from "~/server/adapters/notifications";

function hashOtp(identifier: string, code: string) {
  return createHash("sha256").update(`${identifier}:${code}`).digest("hex");
}

export const customersRouter = createTRPCRouter({
  requestOtp: publicProcedure
    .input(
      z.object({
        identifier: z.string().min(5),
        channel: z.enum(["EMAIL", "SMS"]),
      }),
    )
    .mutation(async ({ input }) => {
      const code = String(randomInt(100000, 1000000));

      await notificationProvider.sendOtp(input.identifier, code);

      return {
        ok: true,
        channel: input.channel,
        codeHashPreview: hashOtp(input.identifier, code).slice(0, 8),
        expiresInMinutes: 10,
      };
    }),

  verifyOtp: publicProcedure
    .input(
      z.object({
        identifier: z.string().min(5),
        code: z.string().min(4).max(8),
      }),
    )
    .mutation(() => {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Customer OTP verification is not active yet.",
      });
    }),
});
