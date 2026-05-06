import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { env } from "~/env";
import {
  createAiMatchReason,
  createCatalogSearchPlan,
  resolveAiCatalogSearchIntent,
} from "~/lib/ai-catalog-intent";
import {
  formatPrice,
  getCatalogBranches,
  searchCatalogProducts,
} from "~/server/services/catalog";
import {
  badRequestJson,
  rateLimitedJson,
  serviceUnavailableJson,
} from "~/server/http/api-response";
import { readSafeJson } from "~/server/http/safe-json";
import {
  assertRateLimit,
  getRequestIp,
  RateLimitExceededError,
} from "~/server/services/rate-limit";

export const maxDuration = 30;

const DEFAULT_GOOGLE_CHAT_MODEL = "gemini-2.5-flash-lite";
const DEFAULT_GATEWAY_CHAT_MODEL = "openai/gpt-5.4";

const chatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
});

function resolveChatModel() {
  const configuredModel = env.AI_CHAT_MODEL?.trim();

  if (configuredModel?.startsWith("google:")) {
    return {
      model: google(configuredModel.slice("google:".length)),
      requiresGoogleKey: true,
    };
  }

  if (configuredModel && !configuredModel.includes("/")) {
    return {
      model: google(configuredModel),
      requiresGoogleKey: true,
    };
  }

  if (configuredModel) {
    return {
      model: configuredModel,
      requiresGoogleKey: false,
    };
  }

  if (env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      model: google(DEFAULT_GOOGLE_CHAT_MODEL),
      requiresGoogleKey: true,
    };
  }

  return {
    model: DEFAULT_GATEWAY_CHAT_MODEL,
    requiresGoogleKey: false,
  };
}

export async function POST(req: Request) {
  try {
    await assertRateLimit({
      key: `chat:${getRequestIp(req)}`,
      limit: 30,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return rateLimitedJson(error, "Too many chat requests.");
    }

    throw error;
  }

  const json = await readSafeJson(req);

  if (!json.ok) {
    return badRequestJson("Invalid request body.");
  }

  const parsedRequest = chatRequestSchema.safeParse(json.data);

  if (!parsedRequest.success) {
    return badRequestJson("Invalid request body.");
  }

  const { messages } = parsedRequest.data;
  const { model: chatModel, requiresGoogleKey } = resolveChatModel();

  if (requiresGoogleKey && !env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return serviceUnavailableJson(
      "Missing GOOGLE_GENERATIVE_AI_API_KEY for the configured Google chat model.",
    );
  }

  const result = streamText({
    model: chatModel,
    maxRetries: 1,
    system: [
      "את סטייליסטית התכשיטים של Aphrodite.",
      "עני בעברית בלבד, בטון יוקרתי, רגוע ותמציתי.",
      "בכל בקשה שכוללת המלצה, חיפוש, מתנה, תקציב, חומר, סגנון, קטגוריה או אירוע, חובה לקרוא קודם לכלי searchCatalog.",
      "המליצי רק על מוצרים שהוחזרו מהכלי searchCatalog. אין להמציא מוצרים, מחירים, מלאי או סניפים.",
      "אל תכתבי קישורי מוצר, URL או את הביטוי 'קישור למוצר' בתוך הטקסט. כרטיסי המוצר יוצגו אוטומטית אחרי התשובה.",
      "כאשר יש המלצות, כתבי פסקה קצרה וטבעית שמסבירה את הכיוון, ואז רשימת שמות פריטים עם סיבת התאמה קצרה בלבד.",
      "אם הכלי מחזיר חלופות קרובות שאינן התאמה מושלמת, הציגי אותן כחלופות קרובות במקום לומר שלא נמצאו מוצרים.",
      "אל תשאלי שאלת הבהרה אם אפשר להריץ חיפוש רחב על בסיס הבקשה הקיימת.",
      "שאלי שאלת הבהרה אחת בלבד אם אין בבקשה שום רמז לסוג תכשיט, תקציב, אירוע, חומר או סגנון.",
      "אם אין מוצר מתאים בתקציב או בקטגוריה, אמרי זאת והציעי לשנות תקציב, חומר או סגנון.",
      "Do not add constraints that the user did not state. If the user did not specify category, material, stone, or metal color, do not narrow the answer to one.",
      "When searchCatalog returns two or more products, show at least two returned products unless the user explicitly asked for only one.",
      "Never say that no products were found if searchCatalog returned products. If the match is not exact, present them as close alternatives.",
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(4),
    tools: {
      searchCatalog: tool({
        description:
          "Search Aphrodite jewelry catalog by need, style, category, branch, or budget.",
        inputSchema: z.object({
          query: z.string().optional(),
          category: z.string().optional(),
          branch: z.string().optional(),
          material: z.string().optional(),
          stone: z.string().optional(),
          maxPrice: z.number().optional(),
        }),
        execute: async (input) => {
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
              resultSets
                .flat()
                .map((product) => [product.slug, product] as const),
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
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
