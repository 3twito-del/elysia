import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const ordersRouter = createTRPCRouter({
  demoTimeline: publicProcedure.query(() => [
    { status: "PAID", label: "התשלום התקבל", at: "עכשיו" },
    {
      status: "PREPARING",
      label: "ההזמנה עוברת הכנה ואריזה",
      at: "עד 24 שעות",
    },
    {
      status: "READY_FOR_PICKUP",
      label: "עדכון מסירה נשלח ללקוח",
      at: "לאחר הכנה",
    },
  ]),
});
