import { TRPCError } from "@trpc/server";

import { createAppointmentInputSchema } from "~/lib/appointment-validation";
import { assertTRPCRateLimit, getTRPCRequestIp } from "~/server/api/rate-limit";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
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

      const branch = await db.branch.findUnique({
        where: { slug: input.branchSlug },
      });

      if (!branch) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "אפשרות השירות שנבחרה לא נמצאה.",
        });
      }

      const customer = ctx.session?.user.id
        ? await db.customer.findUnique({
            where: { userId: ctx.session.user.id },
            select: { id: true },
          })
        : input.email
          ? await db.customer.findUnique({
              where: { email: input.email },
              select: { id: true },
            })
          : null;

      const appointment = await db.appointment.create({
        data: {
          branchId: branch.id,
          customerId: customer?.id,
          topic: input.topic,
          name: input.name,
          email: input.email,
          phone: input.phone,
          startsAt: new Date(input.startsAt),
          notes: input.notes,
        },
      });

      if (input.email) {
        await notificationProvider
          .sendEmail({
            to: input.email,
            subject: "בקשת הפגישה שלך התקבלה",
            body: `קיבלנו את בקשתך לפגישה בנושא ${input.topic}. צוות Elysia יחזור אליך לאישור.`,
            idempotencyKey: `appointment_confirmation:${appointment.id}`,
          })
          .catch(async (error: unknown) => {
            await db.integrationJob.create({
              data: {
                provider: notificationProvider.providerName(),
                jobType: "appointment_confirmation",
                status: "FAILED",
                attempts: 1,
                lastError:
                  error instanceof Error ? error.message : "Unknown error",
                finishedAt: new Date(),
                payload: {
                  appointmentId: appointment.id,
                  recipient: input.email,
                },
              },
            });
          });
      }

      return {
        id: appointment.id,
        status: appointment.status,
        branch,
        ...input,
      };
    }),
});
