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
import { branches, formatPrice, searchProducts } from "~/lib/catalog";

export const maxDuration = 30;

const chatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
});

export async function POST(req: Request) {
  const { messages } = chatRequestSchema.parse(await req.json());

  if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      {
        error:
          "Missing GOOGLE_GENERATIVE_AI_API_KEY. Create a Gemini API key in Google AI Studio and add it to your environment variables.",
      },
      { status: 503 },
    );
  }

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: [
      "את סטייליסטית התכשיטים של Aphrodite.",
      "עני בעברית בלבד, בטון יוקרתי, רגוע ותמציתי.",
      "בכל בקשה שכוללת המלצה, חיפוש, מתנה, תקציב, חומר, סגנון, קטגוריה או אירוע, חובה לקרוא קודם לכלי searchCatalog.",
      "המליצי רק על מוצרים שהוחזרו מהכלי searchCatalog. אין להמציא מוצרים, מחירים, מלאי, סניפים או קישורים.",
      "כאשר יש המלצות, הציגי 2-4 אפשרויות קצרות עם סיבת התאמה, מחיר, זמינות וקישור מוצר.",
      "אם הכלי מחזיר חלופות קרובות שאינן התאמה מושלמת, הציגי אותן כחלופות קרובות במקום לומר שלא נמצאו מוצרים.",
      "אל תשאלי שאלת הבהרה אם אפשר להריץ חיפוש רחב על בסיס הבקשה הקיימת.",
      "שאלי שאלת הבהרה אחת בלבד אם אין בבקשה שום רמז לסוג תכשיט, תקציב, אירוע, חומר או סגנון.",
      "אם אין מוצר מתאים בתקציב או בקטגוריה, אמרי זאת והציעי לשנות תקציב, חומר או סגנון.",
      "Do not add constraints that the user did not state. If the user did not specify category, material, stone, or metal color, do not narrow the answer to one.",
      "When searchCatalog returns two or more products, show at least two returned products unless the user explicitly asked for only one.",
      "Never say that no products were found if searchCatalog returned products. If the match is not exact, present them as close alternatives.",
      "Copy product URLs exactly from the `url` field.",
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
          maxPrice: z.number().optional(),
        }),
        execute: (input) => {
          const resultSets = [
            searchProducts(input),
            input.query ? searchProducts({ ...input, query: undefined }) : [],
            input.category
              ? searchProducts({ ...input, category: undefined })
              : [],
            input.query || input.category
              ? searchProducts({
                  branch: input.branch,
                  maxPrice: input.maxPrice,
                })
              : [],
            input.maxPrice ? searchProducts({ maxPrice: input.maxPrice }) : [],
            searchProducts({}),
          ];
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
            recommendationLine: `${product.name} - ${formatPrice(product.price)} - /product/${product.slug}`,
            name: product.name,
            price: product.price,
            formattedPrice: formatPrice(product.price),
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
