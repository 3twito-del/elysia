import type { FulfillmentMethod } from "@prisma/client";

import { env } from "~/env";
import { formatHebrewDateTime, formatPrice } from "~/lib/format";
import { notificationProvider } from "~/server/adapters/notifications";
import { db } from "~/server/db";

export type ManualOrderNotificationContext = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branchName: string;
  branchPhone: string;
  productName: string;
  sku: string;
  quantity: number;
  total: number;
  fulfillmentMethod: FulfillmentMethod;
  reservationExpiresAt: Date;
};

export function formatManualOrderAmount(amount: number) {
  return formatPrice(amount);
}

export function createManualOrderCustomerMessage(
  input: ManualOrderNotificationContext,
) {
  const fulfillmentText =
    input.fulfillmentMethod === "PICKUP"
      ? `תיאום שירות דרך ${input.branchName}`
      : "משלוח לכתובת שנמסרה";

  return {
    to: input.customerEmail,
    toName: input.customerName,
    subject: `בקשת ההזמנה ${input.orderNumber} התקבלה`,
    body: [
      `${input.customerName} שלום,`,
      `בקשת ההזמנה שלך ב-Elysia התקבלה ונשמרה לטיפול נציג.`,
      `מספר הזמנה: ${input.orderNumber}`,
      `פריט: ${input.productName}`,
      `כמות: ${input.quantity}`,
      `סכום לתשלום באישור ידני: ${formatManualOrderAmount(input.total)}`,
      `אופן קבלה: ${fulfillmentText}`,
      `המלאי נשמר עד ${formatHebrewDateTime(input.reservationExpiresAt)}.`,
      `צוות Elysia יחזור אליך לאישור סופי והמשך טיפול.`,
    ].join("\n\n"),
  };
}

export function createManualOrderOperationsMessage(
  input: ManualOrderNotificationContext,
) {
  return {
    to: env.OPERATIONS_EMAIL ?? "",
    subject: `בקשת הזמנה חדשה ${input.orderNumber}`,
    body: [
      `נוצרה בקשת הזמנה חדשה לטיפול ידני.`,
      `מספר הזמנה: ${input.orderNumber}`,
      `לקוח: ${input.customerName}`,
      `אימייל: ${input.customerEmail}`,
      `טלפון: ${input.customerPhone}`,
      `פריט: ${input.productName}`,
      `SKU: ${input.sku}`,
      `כמות: ${input.quantity}`,
      `סכום: ${formatManualOrderAmount(input.total)}`,
      `ערוץ שירות: ${input.branchName}`,
      `טלפון שירות: ${input.branchPhone}`,
      `Fulfillment: ${input.fulfillmentMethod}`,
      `שמירת מלאי עד: ${input.reservationExpiresAt.toISOString()}`,
    ].join("\n"),
  };
}

export function redactManualOrderNotificationRecipient(
  recipient: string | null,
) {
  const normalized = recipient?.trim();

  if (!normalized) return null;

  if (normalized.includes("@")) {
    const [localPart, domain] = normalized.split("@");
    const safeLocal = localPart ? `${localPart.slice(0, 1)}***` : "[redacted]";

    return domain ? `${safeLocal}@${domain}` : safeLocal;
  }

  const digits = normalized.replace(/\D/g, "");

  return digits.length >= 4 ? `***${digits.slice(-4)}` : "[redacted]";
}

export async function sendManualOrderNotifications(
  input: ManualOrderNotificationContext,
) {
  if (!notificationProvider.isOperational()) {
    await recordManualOrderNotificationJob({
      input,
      jobType: "manual_order_notification",
      recipient: input.customerEmail,
      status: "FAILED",
      lastError: "No transactional email provider is configured.",
    });
    return;
  }

  await sendManualOrderNotificationMessage({
    input,
    jobType: "manual_order_customer_confirmation",
    recipient: input.customerEmail,
    message: createManualOrderCustomerMessage(input),
  });

  if (!env.OPERATIONS_EMAIL) {
    await recordManualOrderNotificationJob({
      input,
      jobType: "manual_order_operations_notification",
      recipient: null,
      status: "FAILED",
      lastError: "OPERATIONS_EMAIL is not configured.",
    });
    return;
  }

  await sendManualOrderNotificationMessage({
    input,
    jobType: "manual_order_operations_notification",
    recipient: env.OPERATIONS_EMAIL,
    message: createManualOrderOperationsMessage(input),
  });
}

async function sendManualOrderNotificationMessage(input: {
  input: ManualOrderNotificationContext;
  jobType: string;
  recipient: string;
  message: Parameters<typeof notificationProvider.sendEmail>[0];
}) {
  try {
    const result = await notificationProvider.sendEmail({
      ...input.message,
      idempotencyKey: `${input.jobType}:${input.input.orderId}`,
    });
    await recordManualOrderNotificationJob({
      input: input.input,
      jobType: input.jobType,
      recipient: input.recipient,
      status: "COMPLETED",
      providerMessageId: result.id,
    });
  } catch (error) {
    await recordManualOrderNotificationJob({
      input: input.input,
      jobType: input.jobType,
      recipient: input.recipient,
      status: "FAILED",
      lastError: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

async function recordManualOrderNotificationJob(input: {
  input: ManualOrderNotificationContext;
  jobType: string;
  recipient: string | null;
  status: "COMPLETED" | "FAILED";
  providerMessageId?: string;
  lastError?: string;
}) {
  try {
    await db.integrationJob.create({
      data: {
        provider: notificationProvider.providerName(),
        jobType: input.jobType,
        status: input.status,
        attempts: input.status === "COMPLETED" ? 1 : 0,
        lastError: input.lastError,
        finishedAt: new Date(),
        payload: {
          orderId: input.input.orderId,
          orderNumber: input.input.orderNumber,
          recipient: redactManualOrderNotificationRecipient(input.recipient),
          providerMessageId: input.providerMessageId,
        },
      },
    });
  } catch (error) {
    console.error("[manual-order:notification-job]", error);
  }
}
