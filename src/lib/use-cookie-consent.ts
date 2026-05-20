"use client";

import { useSyncExternalStore } from "react";

import {
  COOKIE_CONSENT_EVENT,
  type CookieConsentValue,
  readCookieConsent,
} from "~/lib/cookie-consent";

export type CookieConsentSnapshot = CookieConsentValue | null | undefined;

export function useCookieConsentValue(): CookieConsentSnapshot {
  return useSyncExternalStore(
    subscribeCookieConsent,
    getCookieConsentSnapshot,
    getServerCookieConsentSnapshot,
  );
}

function subscribeCookieConsent(onStoreChange: () => void) {
  window.addEventListener(COOKIE_CONSENT_EVENT, onStoreChange);

  return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onStoreChange);
}

function getCookieConsentSnapshot(): CookieConsentSnapshot {
  return readCookieConsent()?.value ?? null;
}

function getServerCookieConsentSnapshot(): CookieConsentSnapshot {
  return undefined;
}
