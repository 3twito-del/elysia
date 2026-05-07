import { tool } from "ai";

import {
  createTryOnSessionInputSchema,
  createTryOnSessionOutputSchema,
  executeCreateTryOnSession,
  executeOrderSupport,
  executeSaveStyleProfile,
  executeSearchCatalog,
  orderSupportInputSchema,
  orderSupportOutputSchema,
  saveStyleProfileInputSchema,
  saveStyleProfileOutputSchema,
  searchCatalogToolInputSchema,
  searchCatalogToolOutputSchema,
  type AiActionContext,
  type SearchCatalogToolInput,
} from "~/server/ai/commerce-actions";
import { traceAiToolCall } from "~/server/ai/audit";
import {
  assertAiToolPolicy,
  type AiToolPolicyContext,
} from "~/server/ai/policy";

export type AiCommerceToolContext = AiActionContext &
  AiToolPolicyContext & {
    aiRunId?: string;
  };

export function createAiCommerceTools(context: AiCommerceToolContext) {
  return {
    searchCatalog: tool({
      description:
        "Search the real Aphrodite jewelry catalog by need, style, category, branch, material, stone, or budget. Use before every product recommendation.",
      inputSchema: searchCatalogToolInputSchema,
      outputSchema: searchCatalogToolOutputSchema,
      strict: true,
      execute: (input, options) => {
        const resolvedInput = applyCatalogPlanningHints(
          input,
          context.planning?.catalogHints,
        );

        return traceAiToolCall(
          {
            aiRunId: context.aiRunId,
            toolCallId: options.toolCallId,
            name: "searchCatalog",
            input: resolvedInput,
          },
          () => {
            assertAiToolPolicy({
              toolName: "searchCatalog",
              toolInput: resolvedInput,
              context,
            });

            return executeSearchCatalog(resolvedInput);
          },
        );
      },
    }),

    saveStyleProfile: tool({
      description:
        "Save the signed-in customer's style profile after the customer has provided style preferences.",
      inputSchema: saveStyleProfileInputSchema,
      outputSchema: saveStyleProfileOutputSchema,
      needsApproval: true,
      strict: true,
      execute: (input, options) =>
        traceAiToolCall(
          {
            aiRunId: context.aiRunId,
            toolCallId: options.toolCallId,
            name: "saveStyleProfile",
            input,
          },
          () => {
            assertAiToolPolicy({
              toolName: "saveStyleProfile",
              toolInput: input,
              context,
            });

            return executeSaveStyleProfile(input, context);
          },
        ),
    }),

    createTryOnSession: tool({
      description:
        "Create a virtual try-on session for a catalog product after the customer asks for try-on.",
      inputSchema: createTryOnSessionInputSchema,
      outputSchema: createTryOnSessionOutputSchema,
      needsApproval: true,
      strict: true,
      execute: (input, options) =>
        traceAiToolCall(
          {
            aiRunId: context.aiRunId,
            toolCallId: options.toolCallId,
            name: "createTryOnSession",
            input,
          },
          () => {
            assertAiToolPolicy({
              toolName: "createTryOnSession",
              toolInput: input,
              context,
            });

            return executeCreateTryOnSession(input);
          },
        ),
    }),

    orderSupport: tool({
      description:
        "Look up an order by order number and email address provided by the customer.",
      inputSchema: orderSupportInputSchema,
      outputSchema: orderSupportOutputSchema,
      strict: true,
      execute: (input, options) =>
        traceAiToolCall(
          {
            aiRunId: context.aiRunId,
            toolCallId: options.toolCallId,
            name: "orderSupport",
            input: { orderNumber: input.orderNumber, email: input.email },
          },
          () => {
            assertAiToolPolicy({
              toolName: "orderSupport",
              toolInput: input,
              context,
            });

            return executeOrderSupport(input);
          },
        ),
    }),
  };
}

export function applyCatalogPlanningHints(
  input: SearchCatalogToolInput,
  hints: SearchCatalogToolInput | undefined,
) {
  if (!hints) return input;

  return {
    ...input,
    query: mergeSearchQueries(hints.query, input.query),
    category: hints.category ?? input.category,
    branch: hints.branch ?? input.branch,
    material: hints.material ?? input.material,
    stone: hints.stone ?? input.stone,
    maxPrice: hints.maxPrice ?? input.maxPrice,
  } satisfies SearchCatalogToolInput;
}

function mergeSearchQueries(
  hintedQuery: string | undefined,
  modelQuery: string | undefined,
) {
  const parts = [hintedQuery, modelQuery]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) return undefined;

  return Array.from(new Set(parts)).join(" ");
}
