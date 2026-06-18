import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateTextMock = vi.hoisted(() => vi.fn());
const recordAiProviderUsageMock = vi.hoisted(() => vi.fn());

vi.mock("ai", () => ({
  generateText: generateTextMock,
  Output: {
    object: vi.fn((input: unknown): unknown => input),
  },
}));

vi.mock("~/server/ai/model", () => ({
  getAiIntentMaxOutputTokens: () => 256,
  getResolvedAiModelReadinessError: () => undefined,
  isAiProviderQuotaError: (error: unknown) =>
    error instanceof Error &&
    /quota|rate.?limit|exhausted/i.test(error.message),
  recordAiProviderUsage: recordAiProviderUsageMock,
  resolveAiChatModel: () => ({
    candidates: [],
    model: "mock-language-model",
    modelId: "mock-model",
    provider: "google",
    requiresGatewayAuth: false,
    requiresGoogleKey: false,
  }),
}));

describe("semantic search intent fallback", () => {
  beforeEach(() => {
    vi.stubEnv("AI_SEMANTIC_SEARCH_ENABLED", "true");
    generateTextMock.mockRejectedValue(
      new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      ),
    );
    recordAiProviderUsageMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to deterministic intent without logging provider failures", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const { resolveSemanticSearchIntent, resetSemanticIntentCacheForTests } =
      await import("./search-intent");

    resetSemanticIntentCacheForTests();

    const intent = await resolveSemanticSearchIntent(
      { query: "alpha beta" },
      {
        categories: [
          { slug: "rings", name: "Rings" },
          { slug: "necklaces", name: "Necklaces" },
        ],
        facets: {
          materials: ["sterling silver", "yellow gold"],
          stones: ["diamond", "pearl"],
        },
      },
    );

    expect(generateTextMock).toHaveBeenCalled();
    expect(recordAiProviderUsageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: "semantic_intent",
        status: "failed",
      }),
    );
    expect(intent.source).toBe("deterministic");
    expect(consoleError).not.toHaveBeenCalled();
  });
});
