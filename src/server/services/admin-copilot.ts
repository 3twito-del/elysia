import { generateText } from "ai";

import { getErrorMessage } from "~/server/ai/audit";
import {
  getAiMaxOutputTokens,
  getResolvedAiModelReadinessError,
  isAiProviderQuotaError,
  recordAiProviderUsage,
  resolveAiChatModel,
} from "~/server/ai/model";
import { getCostAccountingSummary } from "~/server/services/cost-accounting";
import { getDunningSummary } from "~/server/services/dunning";
import { getFxSummary } from "~/server/services/currency-fx";

/**
 * Admin AI copilot (AI-001): answers management questions grounded in a small,
 * read-only live-metrics snapshot. Recommendation-only — never performs actions
 * (aligns with the AI governance guardrails). Degrades to a deterministic
 * summary when no AI model is configured.
 */

const COPILOT_TIMEOUT_MS = 15_000;

export type CopilotSnapshot = {
  overdueCount: number;
  overdueTotal: number;
  dunningEscalations: number;
  fxUnrealized: number;
  costMargin: number;
};

/** Formats the snapshot into a compact grounding context. Pure. */
export function buildCopilotContext(snapshot: CopilotSnapshot): string {
  return [
    `חשבוניות באיחור (AR): ${snapshot.overdueCount} · יתרה ₪${snapshot.overdueTotal}`,
    `הסלמות גבייה (רמה 3+): ${snapshot.dunningEscalations}`,
    `הפרשי-שער לא-ממומשים (FX): ₪${snapshot.fxUnrealized}`,
    `רווחיות מרכזי עלות/רווח: ₪${snapshot.costMargin}`,
  ].join("\n");
}

/** Deterministic fallback answer from the raw metrics. Pure. */
export function fallbackAnswer(snapshot: CopilotSnapshot): string {
  return [
    "סיכום מדדים (ללא AI):",
    buildCopilotContext(snapshot),
  ].join("\n");
}

async function gatherSnapshot(): Promise<CopilotSnapshot> {
  const [dunning, fx, cost] = await Promise.all([
    getDunningSummary().catch(() => ({
      overdueCount: 0,
      overdueTotal: 0,
      escalations: 0,
    })),
    getFxSummary().catch(() => ({ totalUnrealized: 0 })),
    getCostAccountingSummary().catch(() => ({ margin: 0 })),
  ]);
  return {
    overdueCount: dunning.overdueCount,
    overdueTotal: dunning.overdueTotal,
    dunningEscalations: dunning.escalations,
    fxUnrealized: fx.totalUnrealized,
    costMargin: cost.margin,
  };
}

const SYSTEM_PROMPT = [
  "אתה עוזר ניהולי ל-ERP/CRM בעברית. ענה קצר, ענייני ומדויק.",
  "השתמש אך ורק בנתונים שסופקו ב'הקשר' — אל תמציא מספרים או עובדות.",
  "אם המידע חסר לשאלה, אמור זאת במפורש.",
  "אתה ממליץ בלבד ואינך מבצע פעולות (ללא כתיבה לספרים).",
].join(" ");

/** Answers an admin question grounded in the live snapshot. */
export async function answerAdminQuestion(input: {
  question: string;
}): Promise<{ answer: string; source: "ai" | "fallback"; context: string }> {
  const question = input.question.trim().slice(0, 500);
  const snapshot = await gatherSnapshot();
  const context = buildCopilotContext(snapshot);

  if (!question) {
    return { answer: fallbackAnswer(snapshot), source: "fallback", context };
  }

  const resolved = resolveAiChatModel();
  if (getResolvedAiModelReadinessError(resolved)) {
    return { answer: fallbackAnswer(snapshot), source: "fallback", context };
  }

  try {
    const result = await generateText({
      abortSignal: AbortSignal.timeout(COPILOT_TIMEOUT_MS),
      maxOutputTokens: getAiMaxOutputTokens(),
      maxRetries: 0,
      model: resolved.model,
      system: SYSTEM_PROMPT,
      prompt: `הקשר (נתונים חיים):\n${context}\n\nשאלת המנהל: ${question}`,
      temperature: 0.2,
    });

    await recordAiProviderUsage({
      provider: resolved.provider,
      model: resolved.modelId,
      purpose: "chat",
      status: "succeeded",
      usage: result.usage,
    });

    const answer = result.text.trim();
    return {
      answer: answer.length > 0 ? answer : fallbackAnswer(snapshot),
      source: answer.length > 0 ? "ai" : "fallback",
      context,
    };
  } catch (error) {
    await recordAiProviderUsage({
      provider: resolved.provider,
      model: resolved.modelId,
      purpose: "chat",
      status: isAiProviderQuotaError(error) ? "quota_exhausted" : "failed",
      metadata: { error: getErrorMessage(error) },
    });
    return { answer: fallbackAnswer(snapshot), source: "fallback", context };
  }
}
