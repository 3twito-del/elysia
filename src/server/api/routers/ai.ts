import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { tryOnProvider } from "~/server/adapters/try-on";
import { db } from "~/server/db";
import { searchCatalogProducts } from "~/server/services/catalog";

export const aiRouter = createTRPCRouter({
  recommendGift: publicProcedure
    .input(
      z.object({
        relation: z.string(),
        occasion: z.string(),
        budget: z.number().positive(),
        style: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hits = (
        await searchCatalogProducts({
          query: input.style.join(" "),
          maxPrice: input.budget,
          availableOnly: true,
        })
      ).slice(0, 3);
      const response = {
        summary: `ל-${input.occasion} עבור ${input.relation}, הייתי מתחיל מתכשיטים נקיים עם שימוש יומיומי.`,
        products: hits,
      };
      const customer = ctx.session?.user.id
        ? await db.customer.findUnique({
            where: { userId: ctx.session.user.id },
            select: { id: true },
          })
        : null;

      await db.recommendationSession.create({
        data: {
          customerId: customer?.id,
          input,
          output: {
            summary: response.summary,
            productSlugs: hits.map((product) => product.slug),
          },
          model: "catalog-rules-v1",
        },
      });

      return response;
    }),

  createTryOnSession: publicProcedure
    .input(
      z.object({
        productSlug: z.string(),
        variantId: z.string().optional(),
        sourceImageUrl: z.string().url().optional(),
      }),
    )
    .mutation(({ input }) => tryOnProvider.createSession(input)),

  orderSupport: publicProcedure
    .input(
      z.object({
        orderNumber: z.string().trim().min(3),
        email: z.string().trim().email().toLowerCase(),
      }),
    )
    .query(async ({ input }) => {
      const order = await db.order.findFirst({
        where: {
          orderNumber: input.orderNumber,
          email: input.email,
        },
        include: { branch: true, payments: true },
      });

      if (!order) {
        return {
          found: false,
          summary: "לא נמצאה הזמנה שתואמת לפרטים שנמסרו.",
          nextStep: "בדקו את מספר ההזמנה והאימייל.",
        };
      }

      return {
        found: true,
        summary: `הזמנה ${order.orderNumber} נמצאת בסטטוס ${order.status}.`,
        nextStep:
          order.status === "PENDING_PAYMENT"
            ? "ההזמנה ממתינה לתשלום או אישור נציג."
            : order.status === "READY_FOR_PICKUP"
              ? `ניתן לאסוף מהסניף ${order.branch?.name ?? ""}.`
              : "נעדכן בכל שינוי סטטוס.",
        paymentStatus: order.payments[0]?.status ?? "PENDING",
      };
    }),

  buildStyleProfile: publicProcedure
    .input(
      z.object({
        metalColors: z.array(z.string()).default([]),
        styles: z.array(z.string()).default([]),
        ringSize: z.string().optional(),
        necklaceFit: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user.id || ctx.session.user.adminUserId) {
        return {
          saved: false,
          summary: "נדרש חיבור לאזור הלקוח לשמירת פרופיל סגנון.",
        };
      }

      const customer = await db.customer.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!customer) {
        return { saved: false, summary: "לא נמצא פרופיל לקוח פעיל." };
      }

      await db.styleProfile.upsert({
        where: { customerId: customer.id },
        update: input,
        create: { customerId: customer.id, ...input },
      });

      return {
        saved: true,
        summary: "פרופיל הסגנון נשמר וישמש להמלצות עתידיות.",
      };
    }),

  adminProductCopy: adminProcedure("CATALOG_WRITE")
    .input(
      z.object({
        name: z.string().trim().min(2),
        category: z.string().trim().min(2),
        material: z.string().trim().min(2),
        stone: z.string().trim().optional(),
      }),
    )
    .query(({ input }) => ({
      shortDescription: `${input.name} ב${input.material}${input.stone ? ` עם ${input.stone}` : ""}, בעיצוב נקי לשימוש יומיומי ומתנה מדויקת.`,
      description: [
        `${input.name} נבנה כפריט ${input.category} מודרני עם נוכחות עדינה.`,
        `החומר המרכזי הוא ${input.material}${input.stone ? ` בשילוב ${input.stone}` : ""}.`,
        "הטון מתאים לקטלוג Aphrodite: פרקטי, יוקרתי ונגיש, בלי להמציא מלאי או מחיר.",
      ].join("\n\n"),
    })),
});
