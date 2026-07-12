import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  aiRunCreate: vi.fn(),
  aiRunFindUnique: vi.fn(),
  aiRunUpdate: vi.fn(),
  aiToolCallCreate: vi.fn(),
  aiToolCallUpdate: vi.fn(),
}));

vi.mock("~/server/db", () => ({
  db: {
    aiRun: {
      create: dbMocks.aiRunCreate,
      findUnique: dbMocks.aiRunFindUnique,
      update: dbMocks.aiRunUpdate,
    },
    aiToolCall: {
      create: dbMocks.aiToolCallCreate,
      update: dbMocks.aiToolCallUpdate,
    },
  },
}));

import {
  failAiRun,
  finishAiRun,
  redactAiAuditValue,
  startAiRun,
  traceAiToolCall,
} from "./audit";

describe("AI audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.aiRunCreate.mockResolvedValue({
      id: "run_1",
      startedAt: new Date("2026-05-06T10:00:00.000Z"),
    });
    dbMocks.aiRunFindUnique.mockResolvedValue({
      startedAt: new Date(Date.now() - 100),
    });
    dbMocks.aiToolCallCreate.mockResolvedValue({ id: "tool_1" });
  });

  it("starts an AI run with serialized input and metadata", async () => {
    await startAiRun({
      kind: "gift_recommendation",
      model: "model",
      promptVersion: "prompt-v1",
      input: { relation: "mom" },
      customerId: "customer_1",
      metadata: { source: "test" },
    });

    expect(getFirstMockArg(dbMocks.aiRunCreate)).toMatchObject({
      data: {
        kind: "gift_recommendation",
        model: "model",
        promptVersion: "prompt-v1",
        input: { relation: "mom" },
        customerId: "customer_1",
        metadata: { source: "test" },
      },
      select: { id: true, startedAt: true },
    });
  });

  it("redacts PII before audit persistence", () => {
    expect(
      redactAiAuditValue({
        email: "dana@example.com",
        text: "Call 050-123-4567 or dana@example.com",
        nested: {
          sourceImageUrl: "https://example.com/private.png",
        },
      }),
    ).toEqual({
      email: "[redacted]",
      text: "Call [redacted-phone] or [redacted-email]",
      nested: {
        sourceImageUrl: "[redacted]",
      },
    });
  });

  it("redacts card numbers and Israeli ID-shaped digit runs from free text", () => {
    expect(
      redactAiAuditValue({
        text: "כרטיס שלי הוא 4242 4242 4242 4242 ות\"ז 123456782",
      }),
    ).toEqual({
      text: "כרטיס שלי הוא [redacted-card] ות\"ז [redacted-id]",
    });
  });

  it("does not fail AI flows when audit tables are unavailable", async () => {
    dbMocks.aiRunCreate.mockRejectedValueOnce({
      code: "P2021",
      message: "The table `public.AiRun` does not exist.",
    });

    const result = await startAiRun({
      kind: "chat",
      model: "model",
      promptVersion: "prompt-v1",
      input: { text: "hello" },
    });

    expect(result.id).toBeUndefined();
    expect(result.startedAt).toBeInstanceOf(Date);
  });

  it("finishes an AI run with output and duration", async () => {
    await finishAiRun("run_1", { ok: true });

    expect(getFirstMockArg(dbMocks.aiRunUpdate)).toMatchObject({
      where: { id: "run_1" },
      data: {
        status: "SUCCEEDED",
        output: { ok: true },
      },
    });
    const update = getFirstMockArg(dbMocks.aiRunUpdate) as {
      data: { completedAt: unknown; durationMs: unknown };
    };

    expect(update.data.completedAt).toBeInstanceOf(Date);
    expect(typeof update.data.durationMs).toBe("number");
  });

  it("marks AI runs as failed with a readable error", async () => {
    await failAiRun("run_1", new Error("provider failed"));

    expect(getFirstMockArg(dbMocks.aiRunUpdate)).toMatchObject({
      where: { id: "run_1" },
      data: {
        status: "FAILED",
        error: "provider failed",
      },
    });
  });

  it("records successful tool calls", async () => {
    await expect(
      traceAiToolCall(
        {
          aiRunId: "run_1",
          toolCallId: "call_1",
          name: "searchCatalog",
          input: { query: "ring" },
        },
        async () => ({ products: 2 }),
      ),
    ).resolves.toEqual({ products: 2 });

    expect(getFirstMockArg(dbMocks.aiToolCallCreate)).toMatchObject({
      data: {
        aiRunId: "run_1",
        toolCallId: "call_1",
        name: "searchCatalog",
        input: { query: "ring" },
      },
      select: { id: true },
    });
    expect(getFirstMockArg(dbMocks.aiToolCallUpdate)).toMatchObject({
      where: { id: "tool_1" },
      data: {
        status: "SUCCEEDED",
        output: { products: 2 },
      },
    });
  });

  it("records failed tool calls and rethrows", async () => {
    await expect(
      traceAiToolCall(
        {
          aiRunId: "run_1",
          name: "orderSupport",
        },
        async () => {
          throw new Error("order lookup failed");
        },
      ),
    ).rejects.toThrow("order lookup failed");

    expect(getFirstMockArg(dbMocks.aiToolCallUpdate)).toMatchObject({
      where: { id: "tool_1" },
      data: {
        status: "FAILED",
        error: "order lookup failed",
      },
    });
  });
});

function getFirstMockArg(mock: ReturnType<typeof vi.fn>): unknown {
  return mock.mock.calls[0]?.[0];
}
