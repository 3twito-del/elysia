"use client";

import { getOrCreateCartSessionKey } from "~/lib/cart-session";
import { getPwaDeviceId } from "~/lib/pwa-offline";

export async function subscribeToElysiaPush(input: {
  marketingOptIn?: boolean;
  productSlug?: string;
  transactionalOptIn?: boolean;
}) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("Push notifications are not configured.");
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Push notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(publicKey),
      userVisibleOnly: true,
    }));
  const response = await fetch("/api/push/subscribe", {
    body: JSON.stringify({
      deviceId: await getPwaDeviceId(),
      marketingOptIn: input.marketingOptIn ?? false,
      productSlug: input.productSlug,
      sessionKey: getOrCreateCartSessionKey(),
      subscription: subscription.toJSON(),
      transactionalOptIn: input.transactionalOptIn ?? true,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Push subscription failed.");
  }

  return response.json() as Promise<{ ok: true; subscriptionId: string }>;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}
