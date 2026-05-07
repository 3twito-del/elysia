import { createAgentUIStreamResponse, type UIMessage } from "ai";
import { z } from "zod";

import { failAiRun, startAiRun } from "~/server/ai/audit";
import { createAiCommerceAgent } from "~/server/ai/agent";
import { getCustomerIdForAiSession } from "~/server/ai/commerce-actions";
import { AI_PROMPT_VERSION } from "~/server/ai/constants";
import {
  getResolvedAiModelReadinessError,
  resolveAiChatModel,
} from "~/server/ai/model";
import {
  createAiPlanningContext,
  extractLatestUserText,
  extractRecentUserTexts,
} from "~/server/ai/planner";
import { auth } from "~/server/auth";
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

const CHAT_MAX_MESSAGES = 24;
const CHAT_MAX_LATEST_USER_TEXT_LENGTH = 2_000;
const CHAT_MAX_TOTAL_TEXT_LENGTH = 8_000;

const chatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()).min(1).max(CHAT_MAX_MESSAGES),
});

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
  const latestUserText = extractLatestUserText(messages);
  const recentUserTexts = extractRecentUserTexts(messages);
  const messageValidation = validateChatMessages({
    latestUserText,
    recentUserTexts,
  });

  if (!messageValidation.ok) {
    return badRequestJson(messageValidation.error);
  }

  const resolvedModel = resolveAiChatModel();
  const modelReadinessError = getResolvedAiModelReadinessError(resolvedModel);

  if (modelReadinessError) {
    return serviceUnavailableJson(modelReadinessError);
  }

  const session = await auth();
  const isAdmin = Boolean(session?.user.adminUserId);
  const customerId = await getCustomerIdForAiSession({
    sessionUserId: session?.user.id,
    isAdmin,
  });
  const planning = createAiPlanningContext({
    latestUserText,
    recentUserTexts,
  });
  const run = await startAiRun({
    kind: planning.kind,
    model: resolvedModel.modelId,
    promptVersion: AI_PROMPT_VERSION,
    input: {
      latestUserText,
      recentUserTexts,
      messages,
      planning,
    },
    customerId,
    metadata: {
      ip: getRequestIp(req),
      provider: resolvedModel.provider,
    },
  });

  try {
    const agent = createAiCommerceAgent({
      model: resolvedModel.model,
      aiRunId: run.id,
      customerId,
      sessionUserId: session?.user.id,
      isAdmin,
      planning,
    });

    return await createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      abortSignal: req.signal,
    });
  } catch (error) {
    await failAiRun(run.id, error);
    throw error;
  }
}

function validateChatMessages(input: {
  latestUserText: string;
  recentUserTexts: string[];
}) {
  if (!input.latestUserText) {
    return {
      ok: false,
      error: "A text message from the user is required.",
    } as const;
  }

  if (input.latestUserText.length > CHAT_MAX_LATEST_USER_TEXT_LENGTH) {
    return {
      ok: false,
      error: "The latest user message is too long.",
    } as const;
  }

  const totalTextLength = input.recentUserTexts.reduce(
    (total, text) => total + text.length,
    0,
  );

  if (totalTextLength > CHAT_MAX_TOTAL_TEXT_LENGTH) {
    return {
      ok: false,
      error: "The chat context is too long.",
    } as const;
  }

  return { ok: true } as const;
}
