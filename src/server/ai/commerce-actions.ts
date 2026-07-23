import { z } from "zod";

import {
  createAiMatchReason,
  resolveAiCatalogSearchIntent,
} from "~/lib/ai-catalog-intent";
import type {
  createTryOnSessionInputSchema,
  orderSupportInputSchema,
  saveStyleProfileInputSchema,
  searchCatalogToolInputSchema,
} from "~/lib/ai-commerce-validation";
import { tryOnProvider } from "~/server/adapters/try-on";
import { searchProvider } from "~/server/adapters/search";
import { db } from "~/server/db";
import { formatPrice } from "~/server/services/catalog";
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
import {
  planCatalogSearches,
  selectCatalogCombination,
  selectDiverseCatalogProducts,
} from "~/server/ai/catalog-combination";

export {
  createTryOnSessionInputSchema,
  orderSupportInputSchema,
  saveStyleProfileInputSchema,
  searchCatalogToolInputSchema,
} from "~/lib/ai-commerce-validation";

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
    availableOnline: z.boolean(),
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
export type SearchCatalogToolOutput = z.infer<
  typeof searchCatalogToolOutputSchema
>;
export type SaveStyleProfileInput = z.infer<typeof saveStyleProfileInputSchema>;
export type CreateTryOnSessionInput = z.infer<
  typeof createTryOnSessionInputSchema
>;
export type OrderSupportInput = z.infer<typeof orderSupportInputSchema>;

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
  const plannedCategories = planCatalogSearches(input);
  const categoriesToSearch =
    plannedCategories.length > 0
      ? plannedCategories
      : [intent.category ?? input.category];
  const searchResults = await Promise.all(
    categoriesToSearch.map((category) =>
      searchProvider.searchProducts({
        availableOnly: true,
        category,
        material: intent.material ?? input.material,
        maxPrice: intent.maxPrice ?? input.maxPrice,
        mode: "semantic",
        perPage: 8,
        query: intent.originalQuery ?? intent.query ?? input.query,
        stone: intent.stone ?? input.stone,
      }),
    ),
  );
  const requestedCategories = input.categories?.length ?? 0;
  const results =
    input.mode === "combination"
      ? selectCatalogCombination(
          searchResults.map((result) => result.hits),
          {
            limit: requestedCategories > 0 ? 4 : 3,
            maxPrice: intent.maxPrice ?? input.maxPrice,
          },
        )
      : selectDiverseCatalogProducts(
          searchResults.map((result) => result.hits),
          4,
        );
  return results.map((product) => ({
    slug: product.slug,
    url: `/product/${product.slug}`,
    name: product.name,
    price: product.price,
    formattedPrice: formatPrice(product.price),
    image: product.image,
    matchReason:
      searchResults
        .map((result) => result.hitMetaBySlug[product.slug]?.matchReason)
        .find((value): value is string => typeof value === "string") ??
      createAiMatchReason(product, intent),
    category: product.categoryName,
    material: product.material,
    stone: product.stone,
    description: product.shortDescription,
    availableOnline: Object.values(product.inventory).some(
      (quantity) => quantity > 0,
    ),
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
    include: { payments: true },
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
        ? "ההזמנה ממתינה לאישור אישי."
        : "נעדכן בכל שינוי סטטוס.",
    paymentStatus: order.payments[0]?.status ?? "PENDING",
  };
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
