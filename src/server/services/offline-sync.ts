import { Prisma } from "@prisma/client";
import { z } from "zod";

import { newsletterInputSchema } from "~/lib/public-action-validation";
import { newsletterConsentText } from "~/lib/legal-content";
import { publicServiceRequestInputSchema } from "~/lib/service-validation";
import { db } from "~/server/db";
import {
  addCartItem,
  addCartItemInputSchema,
  removeCartItem,
  removeCartItemInputSchema,
  updateCartItemInputSchema,
  updateCartItemQuantity,
  updateCartOptions,
  updateCartOptionsInputSchema,
} from "~/server/services/cart";
import { createPublicServiceRequest } from "~/server/services/service";
import { scheduleCartReminder } from "~/server/services/push";

export const offlineJsonActionSchema = z.object({
  actionId: z.string().trim().min(8).max(128),
  createdAt: z.string().trim().max(64).optional(),
  deviceId: z.string().trim().min(8).max(128),
  kind: z.enum([
    "cart.addItem",
    "cart.updateItem",
    "cart.removeItem",
    "cart.updateOptions",
    "newsletter.join",
    "push.preferences",
  ]),
  payload: z.record(z.unknown()),
});

export const offlineJsonSyncSchema = z.object({
  actions: z.array(offlineJsonActionSchema).min(1).max(25),
});

export const offlineServiceRequestMetadataSchema = z.object({
  actionId: z.string().trim().min(8).max(128),
  createdAt: z.string().trim().max(64).optional(),
  deviceId: z.string().trim().min(8).max(128),
  kind: z.literal("service.request"),
  payload: z.record(z.unknown()),
});

export type OfflineSyncResult = {
  actionId: string;
  error?: string;
  ok: boolean;
};

export type OfflineSyncSummary = {
  failed: number;
  synced: number;
  total: number;
};

export type OfflineSyncResponse = {
  ok: boolean;
  results: OfflineSyncResult[];
  summary: OfflineSyncSummary;
};

export function createOfflineSyncResponse(
  results: OfflineSyncResult[],
): OfflineSyncResponse {
  const failed = results.filter((result) => !result.ok).length;

  return {
    ok: failed === 0,
    results,
    summary: {
      failed,
      synced: results.length - failed,
      total: results.length,
    },
  };
}

export function getPublicOfflineSyncError(kind: string) {
  if (kind.startsWith("cart.")) {
    return "Some offline cart changes could not be synced. Review your cart, then retry when the connection is stable.";
  }

  if (kind === "service.request") {
    return "Queued service request or attachments could not be synced. Please retry or submit the request again from the service page.";
  }

  return "Queued action could not be synced. Please retry when the connection is stable.";
}

export async function processOfflineJsonActions(
  actions: z.infer<typeof offlineJsonActionSchema>[],
) {
  const results: OfflineSyncResult[] = [];

  for (const action of actions) {
    results.push(await processOfflineAction(action, executeJsonAction));
  }

  return results;
}

export async function processOfflineServiceRequest(input: {
  files: File[];
  metadata: z.infer<typeof offlineServiceRequestMetadataSchema>;
}) {
  return processOfflineAction(input.metadata, async (metadata) => {
    const parsed = publicServiceRequestInputSchema.parse(metadata.payload);

    await createPublicServiceRequest({
      data: parsed,
      files: input.files,
    });

    return { type: "service.request" };
  });
}

async function processOfflineAction<
  TAction extends {
    actionId: string;
    deviceId: string;
    kind: string;
  },
>(
  action: TAction,
  execute: (action: TAction) => Promise<Prisma.InputJsonValue | void>,
) {
  const existing = await db.offlineActionReceipt.findUnique({
    where: {
      deviceId_actionId: {
        actionId: action.actionId,
        deviceId: action.deviceId,
      },
    },
  });

  if (existing?.status === "PROCESSED") {
    return { actionId: action.actionId, ok: true };
  }

  if (!existing) {
    try {
      await db.offlineActionReceipt.create({
        data: {
          actionId: action.actionId,
          deviceId: action.deviceId,
          kind: action.kind,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      return { actionId: action.actionId, ok: true };
    }
  }

  try {
    const result = (await execute(action)) ?? { ok: true };

    await db.offlineActionReceipt.update({
      where: {
        deviceId_actionId: {
          actionId: action.actionId,
          deviceId: action.deviceId,
        },
      },
      data: {
        lastError: null,
        processedAt: new Date(),
        result,
        status: "PROCESSED",
      },
    });

    return { actionId: action.actionId, ok: true };
  } catch {
    const publicMessage = getPublicOfflineSyncError(action.kind);

    await db.offlineActionReceipt.update({
      where: {
        deviceId_actionId: {
          actionId: action.actionId,
          deviceId: action.deviceId,
        },
      },
      data: {
        lastError: publicMessage,
        status: "FAILED",
      },
    });

    return { actionId: action.actionId, error: publicMessage, ok: false };
  }
}

async function executeJsonAction(
  action: z.infer<typeof offlineJsonActionSchema>,
) {
  if (action.kind === "cart.addItem") {
    const parsed = addCartItemInputSchema.parse(action.payload);
    const cart = await addCartItem(parsed);

    await scheduleCartReminder({ sessionKey: parsed.sessionKey }).catch(
      () => undefined,
    );

    return { itemCount: cart?.itemCount ?? 0 };
  }

  if (action.kind === "cart.updateItem") {
    const parsed = updateCartItemInputSchema.parse(action.payload);
    const cart = await updateCartItemQuantity(parsed);

    return { itemCount: cart?.itemCount ?? 0 };
  }

  if (action.kind === "cart.removeItem") {
    const parsed = removeCartItemInputSchema.parse(action.payload);
    const cart = await removeCartItem(parsed);

    return { itemCount: cart?.itemCount ?? 0 };
  }

  if (action.kind === "cart.updateOptions") {
    const parsed = updateCartOptionsInputSchema.parse(action.payload);
    const cart = await updateCartOptions(parsed);

    return { itemCount: cart.itemCount };
  }

  if (action.kind === "newsletter.join") {
    const parsed = newsletterInputSchema.parse(action.payload);

    await db.newsletterSubscription.upsert({
      where: { email: parsed.email },
      update: {
        consentedAt: new Date(),
        consentText: newsletterConsentText,
        status: "SUBSCRIBED",
        source: "pwa-offline",
      },
      create: {
        consentedAt: new Date(),
        consentText: newsletterConsentText,
        email: parsed.email,
        source: "pwa-offline",
      },
    });

    return { type: "newsletter.join" };
  }

  if (action.kind === "push.preferences") {
    const { updatePushPreferencesFromOffline } =
      await import("~/server/services/push");

    await updatePushPreferencesFromOffline(action.payload);
    return { type: "push.preferences" };
  }
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
