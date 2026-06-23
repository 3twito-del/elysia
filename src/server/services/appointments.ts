import { TRPCError } from "@trpc/server";
import type { z } from "zod";

import type { createAppointmentInputSchema } from "~/lib/appointment-validation";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";
import { recordAnalyticsEvent } from "~/server/services/analytics";

export type CreateAppointmentInput = z.infer<
  typeof createAppointmentInputSchema
>;

export async function createAppointmentRequest(input: {
  customerUserId?: string;
  appointment: CreateAppointmentInput;
}) {
  const branch = await db.branch.findUnique({
    where: { slug: input.appointment.branchSlug },
  });

  if (!branch) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "אפשרות השירות שנבחרה לא נמצאה.",
    });
  }

  const customer = input.customerUserId
    ? await db.customer.findUnique({
        where: { userId: input.customerUserId },
        select: { id: true },
      })
    : input.appointment.email
      ? await db.customer.findUnique({
          where: { email: input.appointment.email },
          select: { id: true },
        })
      : null;

  const appointment = await db.appointment.create({
    data: {
      branchId: branch.id,
      customerId: customer?.id,
      topic: input.appointment.topic,
      name: input.appointment.name,
      email: input.appointment.email,
      phone: input.appointment.phone,
      startsAt: new Date(input.appointment.startsAt),
      notes: input.appointment.notes,
    },
  });

  if (input.appointment.email) {
    await sendAppointmentConfirmation({
      appointmentId: appointment.id,
      email: input.appointment.email,
      topic: input.appointment.topic,
    });
  }
  await recordAppointmentAnalyticsSafely({
    type: "appointment_requested",
    customerId: customer?.id,
    consentMode: "business",
    payload: {
      appointmentId: appointment.id,
      branchId: branch.id,
      branchSlug: branch.slug,
      topic: input.appointment.topic,
      startsAt: new Date(input.appointment.startsAt).toISOString(),
    },
    idempotencyKey: `appointment_requested:${appointment.id}`,
  });

  return {
    id: appointment.id,
    status: appointment.status,
    branch,
    ...input.appointment,
  };
}

async function recordAppointmentAnalyticsSafely(
  input: Parameters<typeof recordAnalyticsEvent>[0],
) {
  try {
    await recordAnalyticsEvent(input);
  } catch (error) {
    console.error("[appointments:analytics-failed]", error);
  }
}

async function sendAppointmentConfirmation(input: {
  appointmentId: string;
  email: string;
  topic: string;
}) {
  await notificationProvider
    .sendEmail({
      to: input.email,
      subject: "בקשת הפגישה שלך התקבלה",
      body: `קיבלנו את בקשתך לפגישה בנושא ${input.topic}. צוות Elysia יחזור אליך לאישור.`,
      idempotencyKey: `appointment_confirmation:${input.appointmentId}`,
    })
    .catch(async (error: unknown) => {
      await db.integrationJob.create({
        data: {
          provider: notificationProvider.providerName(),
          jobType: "appointment_confirmation",
          status: "FAILED",
          attempts: 1,
          lastError: error instanceof Error ? error.message : "Unknown error",
          finishedAt: new Date(),
          payload: {
            appointmentId: input.appointmentId,
            recipient: input.email,
          },
        },
      });
    });
}
