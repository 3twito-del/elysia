import { db } from "~/server/db";

/**
 * Document management + lightweight e-signature (DMS, Phase 7).
 *
 * Documents store a reference (URL) optionally linked to an entity, and carry a
 * signature lifecycle NONE → PENDING → SIGNED. summarizeDocuments is pure and
 * exported for unit testing.
 */

export type DocumentSummaryInput = { status: string; signatureStatus: string };

/** Counts active/archived documents and pending signatures. Pure. */
export function summarizeDocuments(documents: DocumentSummaryInput[]) {
  let active = 0;
  let archived = 0;
  let pendingSignatures = 0;

  for (const document of documents) {
    if (document.status === "ACTIVE") active += 1;
    else if (document.status === "ARCHIVED") archived += 1;
    if (document.signatureStatus === "PENDING") pendingSignatures += 1;
  }

  return { active, archived, pendingSignatures };
}

async function nextDocumentNumber() {
  const today = new Date();
  const prefix = `DOC-${today.getUTCFullYear()}`;
  const count = await db.document.count({
    where: { documentNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

/** Registers a document reference. */
export async function createDocument(input: {
  name: string;
  url: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  uploadedById?: string;
}) {
  if (!input.url.trim()) throw new Error("חסר קישור למסמך.");

  return db.document.create({
    data: {
      documentNumber: await nextDocumentNumber(),
      name: input.name,
      url: input.url.trim(),
      category: input.category,
      entityType: input.entityType,
      entityId: input.entityId,
      uploadedById: input.uploadedById,
    },
  });
}

/** Marks a document as awaiting signature. */
export async function requestSignature(input: { documentId: string }) {
  const document = await db.document.findUnique({
    where: { id: input.documentId },
    select: { signatureStatus: true },
  });
  if (!document) throw new Error("מסמך לא נמצא.");
  if (document.signatureStatus === "SIGNED") {
    throw new Error("המסמך כבר נחתם.");
  }

  return db.document.update({
    where: { id: input.documentId },
    data: { signatureStatus: "PENDING" },
  });
}

/** Records a signature on a document. */
export async function signDocument(input: { documentId: string; signedBy?: string }) {
  const document = await db.document.findUnique({
    where: { id: input.documentId },
    select: { signatureStatus: true },
  });
  if (!document) throw new Error("מסמך לא נמצא.");
  if (document.signatureStatus === "SIGNED") {
    throw new Error("המסמך כבר נחתם.");
  }

  return db.document.update({
    where: { id: input.documentId },
    data: {
      signatureStatus: "SIGNED",
      signedBy: input.signedBy,
      signedAt: new Date(),
    },
  });
}

/** Archives a document. */
export async function archiveDocument(input: { documentId: string }) {
  return db.document.update({
    where: { id: input.documentId },
    data: { status: "ARCHIVED" },
  });
}

/** Recent documents for the DMS workbench. */
export async function listDocuments(limit = 20) {
  return db.document.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      documentNumber: true,
      name: true,
      category: true,
      url: true,
      status: true,
      signatureStatus: true,
    },
  });
}

/** Status roll-up for the DMS card. */
export async function getDocumentSummary() {
  const documents = await db.document.findMany({
    select: { status: true, signatureStatus: true },
  });
  return summarizeDocuments(documents);
}
