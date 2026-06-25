import { db } from "~/server/db";

/**
 * Marketing consent / preference center (CRM-MKT-003, Phase 2).
 *
 * Consent is an append-only log per customer and channel; current consent is the
 * latest record for that channel (default: not granted — opt-in). Outbound
 * marketing (e.g. journey send_email steps) must check isChannelAllowed before
 * dispatching. The resolver is pure and exported for unit testing.
 */

export const CONSENT_CHANNELS = ["EMAIL", "SMS", "PUSH", "WHATSAPP"] as const;
export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

export type ConsentRecordLite = {
  channel: string;
  status: string;
  createdAt: Date;
};

/** Resolves the current granted state per channel from the consent log. Pure. */
export function resolveConsent(records: ConsentRecordLite[]) {
  const latest = new Map<string, ConsentRecordLite>();
  for (const record of records) {
    const current = latest.get(record.channel);
    if (!current || record.createdAt.getTime() > current.createdAt.getTime()) {
      latest.set(record.channel, record);
    }
  }

  return CONSENT_CHANNELS.map((channel) => {
    const record = latest.get(channel);
    return {
      channel,
      granted: record?.status === "GRANTED",
      at: record?.createdAt ?? null,
    };
  });
}

/** Whether the given channel is currently granted in the records. Pure. */
export function isConsentGranted(
  records: ConsentRecordLite[],
  channel: ConsentChannel,
): boolean {
  return resolveConsent(records).some(
    (entry) => entry.channel === channel && entry.granted,
  );
}

/** Appends a consent record for a customer. */
export async function recordConsent(input: {
  customerId: string;
  channel: ConsentChannel;
  status: "GRANTED" | "REVOKED";
  source?: string;
  note?: string;
}) {
  return db.consentRecord.create({
    data: {
      customerId: input.customerId,
      channel: input.channel,
      status: input.status,
      source: input.source,
      note: input.note,
    },
  });
}

/** Records consent for the customer matching an email. Throws if unknown. */
export async function recordConsentByEmail(input: {
  email: string;
  channel: ConsentChannel;
  status: "GRANTED" | "REVOKED";
  source?: string;
  note?: string;
}) {
  const customer = await db.customer.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (!customer) {
    throw new Error(`לא נמצא לקוח עם הדוא"ל ${input.email}.`);
  }

  return recordConsent({ ...input, customerId: customer.id });
}

/** Current resolved consent + recent history for a customer. */
export async function getCustomerConsent(customerId: string) {
  const records = await db.consentRecord.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { resolved: resolveConsent(records), history: records };
}

/** Whether a channel is currently allowed for a customer (DB-backed). */
export async function isChannelAllowed(
  customerId: string,
  channel: ConsentChannel,
): Promise<boolean> {
  const latest = await db.consentRecord.findFirst({
    where: { customerId, channel },
    orderBy: { createdAt: "desc" },
    select: { status: true },
  });

  return latest?.status === "GRANTED";
}

/** Recent consent changes across customers for the consent workbench. */
export async function listRecentConsentRecords(limit = 20) {
  const records = await db.consentRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      channel: true,
      status: true,
      source: true,
      createdAt: true,
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return records.map((record) => {
    const name = [record.customer?.firstName, record.customer?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      id: record.id,
      channel: record.channel,
      status: record.status,
      source: record.source,
      createdAt: record.createdAt,
      customerName:
        name.length > 0 ? name : (record.customer?.email ?? "לקוח ללא שם"),
    };
  });
}
