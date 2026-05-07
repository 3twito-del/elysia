import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
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
    .mutation(async ({ ctx, input }) =>
      recommendGiftWithAiAudit(input, await createAiActionContext(ctx)),
    ),

  createTryOnSession: publicProcedure
    .input(createTryOnSessionInputSchema)
    .mutation(async ({ ctx, input }) =>
      createTryOnSessionWithAiAudit(input, await createAiActionContext(ctx)),
    ),

  orderSupport: publicProcedure
    .input(orderSupportInputSchema)
    .query(async ({ ctx, input }) =>
      orderSupportWithAiAudit(input, await createAiActionContext(ctx)),
    ),

  buildStyleProfile: publicProcedure
    .input(saveStyleProfileInputSchema)
    .mutation(async ({ ctx, input }) =>
      saveStyleProfileWithAiAudit(input, await createAiActionContext(ctx)),
    ),

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
