import { generateText, Output } from "ai";
import { z } from "zod";

import { getErrorMessage } from "~/server/ai/audit";
import {
  getAiMaxOutputTokens,
  getResolvedAiModelReadinessError,
  isAiProviderQuotaError,
  recordAiProviderUsage,
  resolveAiChatModel,
} from "~/server/ai/model";
import { db } from "~/server/db";

/**
 * Document-AI for vendor invoices (AI-004): extracts structured fields from a
 * pasted invoice document via a constrained LLM structured output, and stores a
 * draft for human review before AP is created. Extraction-only — it never posts
 * to the books. Degrades with a clear message when no AI model is configured.
 */

const DOC_AI_TIMEOUT_MS = 12_000;

const extractionSchema = z.object({
  vendorName: z.string().trim().max(160).optional(),
  invoiceNumber: z.string().trim().max(80).optional(),
  invoiceDate: z.string().trim().max(40).optional(),
  currency: z.string().trim().max(8).optional(),
  total: z.number().nonnegative().max(1e9).optional(),
  lines: z
    .array(
      z.object({
        description: z.string().trim().max(200),
        quantity: z.number().positive().max(1e6).default(1),
        unitCost: z.number().nonnegative().max(1e9).default(0),
      }),
    )
    .max(50)
    .default([]),
});

export type InvoiceExtraction = z.infer<typeof extractionSchema>;

/** Formats extracted lines into the "description | quantity | unitCost" grid the
 * vendor-invoice form accepts. Pure. */
export function extractionToLinesText(
  lines: Array<{ description: string; quantity: number; unitCost: number }>,
): string {
  return lines
    .map((line) => `${line.description} | ${line.quantity} | ${line.unitCost}`)
    .join("\n");
}

/** Extracts a vendor-invoice draft from pasted text and stores it for review. */
export async function extractInvoiceDocument(input: { text: string }) {
  const text = input.text.trim().slice(0, 8000);
  if (!text) throw new Error("יש להדביק טקסט חשבונית.");

  const resolved = resolveAiChatModel();
  if (getResolvedAiModelReadinessError(resolved)) {
    throw new Error("חילוץ מסמכים דורש מפתח AI מוגדר.");
  }

  let extraction: InvoiceExtraction;
  try {
    const generated = await generateText({
      abortSignal: AbortSignal.timeout(DOC_AI_TIMEOUT_MS),
      maxOutputTokens: getAiMaxOutputTokens(),
      maxRetries: 0,
      model: resolved.model,
      system:
        "אתה מחלץ שדות מחשבונית ספק. החזר שם ספק, מספר חשבונית, תאריך, מטבע, סכום כולל ושורות (תיאור, כמות, מחיר יחידה). חלץ רק מה שמופיע במסמך — אל תמציא.",
      prompt: `טקסט החשבונית:\n${text}`,
      output: Output.object({ schema: extractionSchema }),
      temperature: 0,
    });
    extraction = generated.output;
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
    throw new Error("לא ניתן היה לחלץ נתונים מהמסמך כרגע.");
  }

  return persistExtraction(extraction, "ai");
}

const EXTRACTION_SYSTEM =
  "אתה מחלץ שדות מחשבונית ספק. החזר שם ספק, מספר חשבונית, תאריך, מטבע, סכום כולל ושורות (תיאור, כמות, מחיר יחידה). חלץ רק מה שמופיע במסמך — אל תמציא.";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Extracts a vendor-invoice draft from an uploaded image/PDF via vision. */
export async function extractInvoiceFromImage(input: {
  data: Uint8Array;
  mediaType: string;
}) {
  if (!SUPPORTED_IMAGE_TYPES.has(input.mediaType)) {
    throw new Error("סוג קובץ לא נתמך (PNG/JPEG/WEBP/PDF).");
  }
  if (input.data.byteLength === 0) throw new Error("קובץ ריק.");
  if (input.data.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("הקובץ גדול מדי (עד 8MB).");
  }

  const resolved = resolveAiChatModel();
  if (getResolvedAiModelReadinessError(resolved)) {
    throw new Error("חילוץ מסמכים דורש מפתח AI מוגדר.");
  }

  let extraction: InvoiceExtraction;
  try {
    const generated = await generateText({
      abortSignal: AbortSignal.timeout(DOC_AI_TIMEOUT_MS),
      maxOutputTokens: getAiMaxOutputTokens(),
      maxRetries: 0,
      model: resolved.model,
      system: EXTRACTION_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "חלץ את פרטי החשבונית מהמסמך המצורף." },
            { type: "image", image: input.data, mediaType: input.mediaType },
          ],
        },
      ],
      output: Output.object({ schema: extractionSchema }),
      temperature: 0,
    });
    extraction = generated.output;
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
    throw new Error("לא ניתן היה לחלץ נתונים מהתמונה כרגע.");
  }

  return persistExtraction(extraction, "ai-image");
}

function persistExtraction(extraction: InvoiceExtraction, source: string) {
  return db.documentExtraction.create({
    data: {
      vendorName: extraction.vendorName ?? null,
      invoiceNumber: extraction.invoiceNumber ?? null,
      invoiceDate: extraction.invoiceDate ?? null,
      currency: extraction.currency ?? null,
      total: extraction.total ?? null,
      linesText: extractionToLinesText(extraction.lines),
      source,
    },
  });
}

export async function getDocumentExtraction(id: string) {
  return db.documentExtraction.findUnique({
    where: { id },
    select: {
      id: true,
      invoiceNumber: true,
      invoiceDate: true,
      linesText: true,
    },
  });
}

export async function listDocumentExtractions(limit = 15) {
  const rows = await db.documentExtraction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      vendorName: true,
      invoiceNumber: true,
      invoiceDate: true,
      currency: true,
      total: true,
      linesText: true,
      createdAt: true,
    },
  });
  return rows.map((row) => ({
    id: row.id,
    vendorName: row.vendorName,
    invoiceNumber: row.invoiceNumber,
    invoiceDate: row.invoiceDate,
    currency: row.currency,
    total: row.total == null ? null : Number(row.total),
    linesText: row.linesText,
    createdAt: row.createdAt,
  }));
}
