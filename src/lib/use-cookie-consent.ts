"use client";

import { useSyncExternalStore } from "react";

import {
  COOKIE_CONSENT_EVENT,
  type CookieConsentValue,
  readCookieConsent,
} from "~/lib/cookie-consent";

export function useCookieConsentValue() {
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

function getCookieConsentSnapshot(): CookieConsentValue | null {
  return readCookieConsent()?.value ?? null;
}

function getServerCookieConsentSnapshot(): CookieConsentValue | null {
  return null;
}
