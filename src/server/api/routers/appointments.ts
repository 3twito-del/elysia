import { z } from "zod";

import { branches } from "~/lib/catalog";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { notificationProvider } from "~/server/adapters/notifications";

export const appointmentsRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        branchSlug: z.string(),
        topic: z.string().min(2),
        name: z.string().min(2),
        email: z.string().email().optional(),
        phone: z.string().min(7),
        startsAt: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const branch =
        branches.find((item) => item.slug === input.branchSlug) ?? branches[0]!;

      if (input.email) {
        await notificationProvider.sendEmail({
          to: input.email,
          subject: "בקשת הפגישה שלך התקבלה",
          body: `קיבלנו את בקשתך לפגישה בנושא ${input.topic} בסניף ${branch.name}. צוות Aphrodite יחזור אליך לאישור.`,
        });
      }

      return {
        id: `apt_${Date.now()}`,
        status: "REQUESTED" as const,
        branch,
        ...input,
      };
    }),
});
