import { z } from "zod";

import { assertTRPCRateLimit, getTRPCRequestIp } from "~/server/api/rate-limit";
import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { createRateLimitKey } from "~/server/services/rate-limit";
import {
  createTryOnSessionInputSchema,
  createTryOnSessionWithAiAudit,
  getCustomerIdForAiSession,
  orderSupportInputSchema,
  orderSupportWithAiAudit,
  recommendGiftInputSchema,
  recommendGiftWithAiAudit,
  saveStyleProfileInputSchema,
  saveStyleProfileWithAiAudit,
  type AiActionContext,
} from "~/server/ai/commerce-actions";

export const aiRouter = createTRPCRouter({
  recommendGift: publicProcedure
    .input(recommendGiftInputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertAiPublicRateLimit(ctx.headers, "gift");

      return recommendGiftWithAiAudit(input, await createAiActionContext(ctx));
    }),

  createTryOnSession: publicProcedure
    .input(createTryOnSessionInputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertAiPublicRateLimit(ctx.headers, "try-on");

      return createTryOnSessionWithAiAudit(
        input,
        await createAiActionContext(ctx),
      );
    }),

  orderSupport: publicProcedure
    .input(orderSupportInputSchema)
    .query(async ({ ctx, input }) => {
      await assertAiPublicRateLimit(ctx.headers, "order-support");
      await assertTRPCRateLimit({
        key: createRateLimitKey("ai:order-support-email", input.email),
        limit: 10,
        windowMs: 15 * 60_000,
        message: "יותר מדי בדיקות הזמנה. נסו שוב מאוחר יותר.",
      });

      return orderSupportWithAiAudit(input, await createAiActionContext(ctx));
    }),

  buildStyleProfile: publicProcedure
    .input(saveStyleProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      await assertAiPublicRateLimit(ctx.headers, "style-profile");

      return saveStyleProfileWithAiAudit(
        input,
        await createAiActionContext(ctx),
      );
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

async function assertAiPublicRateLimit(headers: Headers, action: string) {
  await assertTRPCRateLimit({
    key: `ai:${action}:${getTRPCRequestIp(headers)}`,
    limit: 30,
    windowMs: 15 * 60_000,
    message: "יותר מדי בקשות AI. נסו שוב מאוחר יותר.",
  });
}

async function createAiActionContext(ctx: {
  session: {
    user?: {
      id?: string;
      adminUserId?: string | null;
    };
  } | null;
}): Promise<AiActionContext> {
  const sessionUserId = ctx.session?.user?.id;
  const isAdmin = Boolean(ctx.session?.user?.adminUserId);

  return {
    sessionUserId,
    isAdmin,
    customerId: await getCustomerIdForAiSession({
      sessionUserId,
      isAdmin,
    }),
  };
}
