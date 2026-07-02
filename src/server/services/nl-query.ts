import { generateText, Output } from "ai";
import { z } from "zod";

import { getErrorMessage } from "~/server/ai/audit";
import {
  getAiIntentMaxOutputTokens,
  getResolvedAiModelReadinessError,
  isAiProviderQuotaError,
  recordAiProviderUsage,
  resolveAiChatModel,
} from "~/server/ai/model";
import {
  getDataset,
  listDatasets,
  type Dataset,
} from "~/server/services/report-datasets";
import {
  aggregateRows,
  type Dimension,
  type Measure,
  type ReportResult,
} from "~/server/services/report-engine";

/**
 * Natural-language query (AI-002): maps a Hebrew/English question to one of the
 * pre-defined report datasets + its dimensions/measures via a constrained LLM
 * structured output, then runs the pure report engine. The model never emits
 * SQL — it only selects from the known semantic layer, so results stay safe and
 * grounded. Degrades gracefully when no AI model is configured.
 */

const NL_QUERY_TIMEOUT_MS = 4_000;

const nlQuerySchema = z.object({
  datasetKey: z.string().trim().max(40),
  dimensionKeys: z.array(z.string().trim().max(40)).max(4).default([]),
  measureKeys: z.array(z.string().trim().max(40)).max(4).default([]),
});

export type NlQuerySelection = z.infer<typeof nlQuerySchema>;

/** Describes the available datasets + columns for the model prompt. Pure. */
export function buildNlQuerySchemaContext(
  datasets: Array<Pick<Dataset, "key" | "label" | "dimensions" | "measures">>,
): string {
  return datasets
    .map((dataset) => {
      const dims = dataset.dimensions
        .map((dimension) => `${dimension.key} (${dimension.label})`)
        .join(", ");
      const measures = dataset.measures
        .map((measure) => `${measure.key} (${measure.label})`)
        .join(", ");
      return `dataset "${dataset.key}" — ${dataset.label}\n  ממדים: ${dims}\n  מדדים: ${measures}`;
    })
    .join("\n");
}

/**
 * Resolves requested dimension/measure keys against a dataset, dropping unknown
 * keys. Falls back to the first measure when none resolve. Pure.
 */
export function resolveNlQuerySelection(
  dataset: Dataset,
  selection: { dimensionKeys: string[]; measureKeys: string[] },
): { dimensions: Dimension[]; measures: Measure[] } {
  const dimensions = dataset.dimensions.filter((dimension) =>
    selection.dimensionKeys.includes(dimension.key),
  );
  let measures = dataset.measures.filter((measure) =>
    selection.measureKeys.includes(measure.key),
  );
  if (measures.length === 0 && dataset.measures[0]) {
    measures = [dataset.measures[0]];
  }
  return { dimensions, measures };
}

export type NlQueryResult = {
  source: "ai" | "fallback";
  datasetLabel: string | null;
  result: ReportResult | null;
  message?: string;
};

/** Answers a natural-language data question over the report datasets. */
export async function answerNlQuery(input: {
  question: string;
}): Promise<NlQueryResult> {
  const question = input.question.trim().slice(0, 300);
  if (!question) {
    return { source: "fallback", datasetLabel: null, result: null };
  }

  const datasets = listDatasets();
  const resolved = resolveAiChatModel();
  if (getResolvedAiModelReadinessError(resolved)) {
    return {
      source: "fallback",
      datasetLabel: null,
      result: null,
      message: "שאילתת שפה טבעית דורשת מפתח AI מוגדר.",
    };
  }

  let selection: NlQuerySelection;
  try {
    const generated = await generateText({
      abortSignal: AbortSignal.timeout(NL_QUERY_TIMEOUT_MS),
      maxOutputTokens: getAiIntentMaxOutputTokens(),
      maxRetries: 0,
      model: resolved.model,
      system:
        "אתה ממפה שאלת נתונים לשכבה סמנטית מוגדרת מראש. בחר datasetKey אחד מהרשימה, ועד 3 ממדים ומדדים לפי המפתחות המדויקים בלבד. אל תמציא מפתחות.",
      prompt: `מאגרים זמינים:\n${buildNlQuerySchemaContext(datasets)}\n\nשאלה: ${question}`,
      output: Output.object({ schema: nlQuerySchema }),
      temperature: 0,
    });
    selection = generated.output;
    await recordAiProviderUsage({
      provider: resolved.provider,
      model: resolved.modelId,
      purpose: "chat",
      status: "succeeded",
      usage: generated.usage,
    });
  } catch (error) {
    await recordAiProviderUsage({
      provider: resolved.provider,
      model: resolved.modelId,
      purpose: "chat",
      status: isAiProviderQuotaError(error) ? "quota_exhausted" : "failed",
      metadata: { error: getErrorMessage(error) },
    });
    return {
      source: "fallback",
      datasetLabel: null,
      result: null,
      message: "לא ניתן היה לפרש את השאלה כרגע.",
    };
  }

  const dataset = getDataset(selection.datasetKey);
  if (!dataset) {
    return {
      source: "fallback",
      datasetLabel: null,
      result: null,
      message: `לא זוהה מאגר נתונים מתאים (${selection.datasetKey}).`,
    };
  }

  const { dimensions, measures } = resolveNlQuerySelection(dataset, selection);
  const rows = await dataset.load();
  const result = aggregateRows({ rows, dimensions, measures });

  return { source: "ai", datasetLabel: dataset.label, result };
}
