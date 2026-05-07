import { z } from "zod";

import {
  createAiMatchReason,
  createCatalogSearchPlan,
  resolveAiCatalogSearchIntent,
} from "~/lib/ai-catalog-intent";
import { tryOnProvider } from "~/server/adapters/try-on";
import { db } from "~/server/db";
import {
  formatPrice,
  getCatalogBranches,
  searchCatalogProducts,
} from "~/server/services/catalog";
import {
  failAiRun,
  finishAiRun,
  startAiRun,
  traceAiToolCall,
} from "~/server/ai/audit";
import {
  AI_PROMPT_VERSION,
  AI_RUN_KIND,
  AI_TOOL_WORKFLOW_MODEL,
} from "~/server/ai/constants";
import { createStructuredRecommendationContract } from "~/server/ai/recommendation-contract";

export const searchCatalogToolInputSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  branch: z.string().optional(),
  material: z.string().optional(),
  stone: z.string().optional(),
  maxPrice: z.number().optional(),
});

export const saveStyleProfileInputSchema = z.object({
  metalColors: z.array(z.string()).default([]),
  styles: z.array(z.string()).default([]),
  ringSize: z.string().optional(),
  necklaceFit: z.string().optional(),
});

export const createTryOnSessionInputSchema = z.object({
  productSlug: z.string(),
  variantId: z.string().optional(),
  sourceImageUrl: z.string().url().optional(),
});

export const orderSupportInputSchema = z.object({
  orderNumber: z.string().trim().min(3),
  email: z.string().trim().email().toLowerCase(),
});

export const recommendGiftInputSchema = z.object({
  relation: z.string(),
  occasion: z.string(),
  budget: z.number().positive(),
  style: z.array(z.string()).default([]),
});

export const searchCatalogToolOutputSchema = z.array(
  z.object({
    slug: z.string(),
    url: z.string(),
    name: z.string(),
    price: z.number(),
    formattedPrice: z.string(),
    image: z.string(),
    matchReason: z.string(),
    category: z.string(),
    material: z.string(),
    stone: z.string().optional(),
    description: z.string(),
    availableBranchCount: z.number(),
    availableBranches: z.array(
      z.object({
        name: z.string(),
        city: z.string(),
        quantity: z.number(),
      }),
    ),
  }),
);

export const saveStyleProfileOutputSchema = z.object({
  saved: z.boolean(),
  summary: z.string(),
});

export const createTryOnSessionOutputSchema = z.object({
  id: z.string(),
  status: z.enum(["queued", "ready"]),
  provider: z.literal("internal-webar"),
  message: z.string(),
});

export const orderSupportOutputSchema = z.object({
  found: z.boolean(),
  summary: z.string(),
  nextStep: z.string(),
  paymentStatus: z.string().optional(),
});

export type SearchCatalogToolInput = z.infer<
  typeof searchCatalogToolInputSchema
>;
export type SaveStyleProfileInput = z.infer<typeof saveStyleProfileInputSchema>;
export type CreateTryOnSessionInput = z.infer<
  typeof createTryOnSessionInputSchema
>;
export type OrderSupportInput = z.infer<typeof orderSupportInputSchema>;
export type RecommendGiftInput = z.infer<typeof recommendGiftInputSchema>;

export type AiActionContext = {
  customerId?: string;
  sessionUserId?: string;
  isAdmin?: boolean;
};

export async function getCustomerIdForAiSession(input: {
  sessionUserId?: string;
  isAdmin?: boolean | null;
}) {
  if (!input.sessionUserId || input.isAdmin) return undefined;

  const customer = await db.customer.findUnique({
    where: { userId: input.sessionUserId },
    select: { id: true },
  });

  return customer?.id;
}

export async function executeSearchCatalog(input: SearchCatalogToolInput) {
  const intent = resolveAiCatalogSearchIntent(input);
  const searchPlan = createCatalogSearchPlan(intent);
  const resultSets = [];

  for (const searchInput of searchPlan) {
    resultSets.push(
      await searchCatalogProducts({
        ...searchInput,
        availableOnly: true,
      }),
    );
  }

  const branches = await getCatalogBranches();
  const results = Array.from(
    new Map(
      resultSets.flat().map((product) => [product.slug, product] as const),
    ).values(),
  ).slice(0, 4);

  return results.map((product) => ({
    slug: product.slug,
    url: `/product/${product.slug}`,
    name: product.name,
    price: product.price,
    formattedPrice: formatPrice(product.price),
    image: product.image,
    matchReason: createAiMatchReason(product, intent),
    category: product.categoryName,
    material: product.material,
    stone: product.stone,
    description: product.shortDescription,
    availableBranchCount: Object.values(product.inventory).filter(
      (quantity) => quantity > 0,
    ).length,
    availableBranches: branches
      .map((branch) => ({
        name: branch.name,
        city: branch.city,
        quantity: product.inventory[branch.slug] ?? 0,
      }))
      .filter((branch) => branch.quantity > 0),
  }));
}

export async function executeSaveStyleProfile(
  input: SaveStyleProfileInput,
  context: AiActionContext,
) {
  if (!context.customerId || context.isAdmin) {
    return {
      saved: false,
      summary: "נדרש חיבור לאזור הלקוח כדי לשמור פרופיל סגנון.",
    };
  }

  await db.styleProfile.upsert({
    where: { customerId: context.customerId },
    update: input,
    create: { customerId: context.customerId, ...input },
  });

  return {
    saved: true,
    summary: "פרופיל הסגנון נשמר וישמש להמלצות עתידיות.",
  };
}

export async function executeCreateTryOnSession(
  input: CreateTryOnSessionInput,
) {
  return tryOnProvider.createSession(input);
}

export async function executeOrderSupport(input: OrderSupportInput) {
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
}

export async function recommendGiftWithAiAudit(
  input: RecommendGiftInput,
  context: AiActionContext,
) {
  const run = await startAiRun({
    kind: AI_RUN_KIND.giftRecommendation,
    model: AI_TOOL_WORKFLOW_MODEL,
    promptVersion: AI_PROMPT_VERSION,
    input,
    customerId: context.customerId,
  });

  try {
    const products = (
      await traceAiToolCall(
        {
          aiRunId: run.id,
          name: "searchCatalog",
          input: {
            query: input.style.join(" "),
            maxPrice: input.budget,
          },
        },
        () =>
          executeSearchCatalog({
            query: input.style.join(" "),
            maxPrice: input.budget,
          }),
      )
    ).slice(0, 3);

    const summary = createGiftSummary(input);
    const recommendation = createStructuredRecommendationContract({
      summary,
      products,
      requestedSignals: {
        budget: input.budget,
        style: input.style,
        relation: input.relation,
        occasion: input.occasion,
      },
      maxProducts: 3,
    });

    const output = {
      runId: run.id,
      summary,
      products,
      recommendation,
    };

    await db.recommendationSession.create({
      data: {
        customerId: context.customerId,
        input,
        output: {
          summary: output.summary,
          productSlugs: recommendation.productSlugs,
          recommendation,
          aiRunId: run.id,
        },
        model: AI_TOOL_WORKFLOW_MODEL,
      },
    });

    await finishAiRun(run.id, { recommendation });

    return output;
  } catch (error) {
    await failAiRun(run.id, error);
    throw error;
  }
}

export async function saveStyleProfileWithAiAudit(
  input: SaveStyleProfileInput,
  context: AiActionContext,
) {
  const run = await startAiRun({
    kind: AI_RUN_KIND.styleProfile,
    model: AI_TOOL_WORKFLOW_MODEL,
    promptVersion: AI_PROMPT_VERSION,
    input,
    customerId: context.customerId,
  });

  try {
    const output = await traceAiToolCall(
      { aiRunId: run.id, name: "saveStyleProfile", input },
      () => executeSaveStyleProfile(input, context),
    );

    await finishAiRun(run.id, output);

    return { ...output, runId: run.id };
  } catch (error) {
    await failAiRun(run.id, error);
    throw error;
  }
}

export async function createTryOnSessionWithAiAudit(
  input: CreateTryOnSessionInput,
  context: AiActionContext,
) {
  const run = await startAiRun({
    kind: AI_RUN_KIND.tryOn,
    model: AI_TOOL_WORKFLOW_MODEL,
    promptVersion: AI_PROMPT_VERSION,
    input,
    customerId: context.customerId,
  });

  try {
    const output = await traceAiToolCall(
      { aiRunId: run.id, name: "createTryOnSession", input },
      () => executeCreateTryOnSession(input),
    );

    await finishAiRun(run.id, output);

    return { ...output, runId: run.id };
  } catch (error) {
    await failAiRun(run.id, error);
    throw error;
  }
}

export async function orderSupportWithAiAudit(
  input: OrderSupportInput,
  context: AiActionContext,
) {
  const run = await startAiRun({
    kind: AI_RUN_KIND.orderSupport,
    model: AI_TOOL_WORKFLOW_MODEL,
    promptVersion: AI_PROMPT_VERSION,
    input: { orderNumber: input.orderNumber, email: input.email },
    customerId: context.customerId,
  });

  try {
    const output = await traceAiToolCall(
      { aiRunId: run.id, name: "orderSupport", input },
      () => executeOrderSupport(input),
    );

    await finishAiRun(run.id, output);

    return { ...output, runId: run.id };
  } catch (error) {
    await failAiRun(run.id, error);
    throw error;
  }
}

function createGiftSummary(input: RecommendGiftInput) {
  return `ל-${input.occasion} עבור ${input.relation}, הייתי מתחיל מתכשיטים זמינים מהקטלוג שמתאימים לתקציב ולסגנון שנבחרו.`;
}
