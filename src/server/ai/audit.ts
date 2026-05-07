import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";
import { AI_RUN_STATUS } from "~/server/ai/constants";
import type { AiRunKind } from "~/server/ai/planner";

type StartAiRunInput = {
  kind: AiRunKind;
  model: string;
  promptVersion: string;
  input: unknown;
  customerId?: string;
  metadata?: unknown;
};

type TraceAiToolCallInput = {
  aiRunId?: string;
  toolCallId?: string;
  name: string;
  input?: unknown;
};

export async function startAiRun(input: StartAiRunInput) {
  try {
    return await db.aiRun.create({
      data: {
        kind: input.kind,
        model: input.model,
        promptVersion: input.promptVersion,
        input: toPrismaJson(input.input),
        ...(input.customerId ? { customerId: input.customerId } : {}),
        ...(input.metadata !== undefined
          ? { metadata: toPrismaJson(input.metadata) }
          : {}),
      },
      select: {
        id: true,
        startedAt: true,
      },
    });
  } catch (error) {
    if (isAiAuditUnavailableError(error)) {
      console.warn("[ai-audit:unavailable]", getErrorMessage(error));

      return { id: undefined, startedAt: new Date() };
    }

    throw error;
  }
}

export async function finishAiRun(id: string | undefined, output: unknown) {
  if (!id) return;

  const completedAt = new Date();
  try {
    const run = await db.aiRun.findUnique({
      where: { id },
      select: { startedAt: true },
    });

    await db.aiRun.update({
      where: { id },
      data: {
        status: AI_RUN_STATUS.succeeded,
        output: toPrismaJson(output),
        completedAt,
        durationMs: run
          ? Math.max(0, completedAt.getTime() - run.startedAt.getTime())
          : undefined,
      },
    });
  } catch (error) {
    logAiAuditWriteFailure(error);
  }
}

export async function failAiRun(
  id: string | undefined,
  error: unknown,
  output?: unknown,
) {
  if (!id) return;

  const completedAt = new Date();
  try {
    const run = await db.aiRun.findUnique({
      where: { id },
      select: { startedAt: true },
    });

    await db.aiRun.update({
      where: { id },
      data: {
        status: AI_RUN_STATUS.failed,
        error: redactAiAuditText(getErrorMessage(error)),
        ...(output !== undefined ? { output: toPrismaJson(output) } : {}),
        completedAt,
        durationMs: run
          ? Math.max(0, completedAt.getTime() - run.startedAt.getTime())
          : undefined,
      },
    });
  } catch (auditError) {
    logAiAuditWriteFailure(auditError);
  }
}

export async function traceAiToolCall<T>(
  input: TraceAiToolCallInput,
  execute: () => Promise<T> | T,
) {
  if (!input.aiRunId) {
    return execute();
  }

  const aiRunId = input.aiRunId;
  const startedAt = new Date();
  const toolCall = await createAiToolCallTrace({ ...input, aiRunId });

  try {
    const output = await execute();
    const completedAt = new Date();

    if (toolCall?.id) {
      try {
        await db.aiToolCall.update({
          where: { id: toolCall.id },
          data: {
            status: AI_RUN_STATUS.succeeded,
            output: toPrismaJson(output),
            completedAt,
            durationMs: Math.max(
              0,
              completedAt.getTime() - startedAt.getTime(),
            ),
          },
        });
      } catch (auditError) {
        logAiAuditWriteFailure(auditError);
      }
    }

    return output;
  } catch (error) {
    const completedAt = new Date();

    if (toolCall?.id) {
      try {
        await db.aiToolCall.update({
          where: { id: toolCall.id },
          data: {
            status: AI_RUN_STATUS.failed,
            error: redactAiAuditText(getErrorMessage(error)),
            completedAt,
            durationMs: Math.max(
              0,
              completedAt.getTime() - startedAt.getTime(),
            ),
          },
        });
      } catch (auditError) {
        logAiAuditWriteFailure(auditError);
      }
    }

    throw error;
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Unknown AI execution error.";
}

export function toPrismaJson(value: unknown) {
  try {
    return JSON.parse(
      JSON.stringify(redactAiAuditValue(value ?? null)),
    ) as Prisma.InputJsonValue;
  } catch {
    return {
      unserializable: true,
      type: typeof value,
    } satisfies Prisma.InputJsonObject;
  }
}

export function redactAiAuditValue(value: unknown): unknown {
  if (typeof value === "string") return redactAiAuditText(value);
  if (Array.isArray(value))
    return value.map((item) => redactAiAuditValue(item));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      isSensitiveAuditKey(key) ? "[redacted]" : redactAiAuditValue(entryValue),
    ]),
  );
}

export function redactAiAuditText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[redacted-email]")
    .replace(
      /(?:\+?972[-\s]?)?(?:0?5\d|0[2-9])[-\s]?\d{3}[-\s]?\d{4}\b/g,
      "[redacted-phone]",
    );
}

async function createAiToolCallTrace(
  input: TraceAiToolCallInput & { aiRunId: string },
) {
  try {
    return await db.aiToolCall.create({
      data: {
        aiRunId: input.aiRunId,
        name: input.name,
        ...(input.toolCallId ? { toolCallId: input.toolCallId } : {}),
        ...(input.input !== undefined
          ? { input: toPrismaJson(input.input) }
          : {}),
      },
      select: { id: true },
    });
  } catch (error) {
    logAiAuditWriteFailure(error);

    return null;
  }
}

function isSensitiveAuditKey(key: string) {
  return /email|phone|identifier|token|secret|password|apikey|apiKey|address|recipient|firstName|lastName|sourceImageUrl|inputMediaUrl|outputMediaUrl/i.test(
    key,
  );
}

function isAiAuditUnavailableError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message : "";

  return (
    code === "P2021" ||
    code === "P2022" ||
    /AiRun|AiToolCall|does not exist|table.*not.*exist/i.test(message)
  );
}

function logAiAuditWriteFailure(error: unknown) {
  const message = getErrorMessage(error);

  if (isAiAuditUnavailableError(error)) {
    console.warn("[ai-audit:unavailable]", message);
    return;
  }

  console.error("[ai-audit:write-failed]", message);
}
