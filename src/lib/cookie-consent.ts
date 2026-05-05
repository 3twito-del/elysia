export const COOKIE_CONSENT_STORAGE_KEY = "aphrodite_cookie_consent";
export const COOKIE_CONSENT_EVENT = "aphrodite:cookie-consent";
export const RECENTLY_VIEWED_STORAGE_KEY = "aphrodite_recently_viewed";

export type CookieConsentValue = "essential" | "all";

export type CookieConsentRecord = {
  value: CookieConsentValue;
  updatedAt: string;
};

let inMemoryConsentRecord: CookieConsentRecord | null = null;

export function readCookieConsent() {
  if (typeof window === "undefined") return null;

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) ?? "null",
    );

    if (!isCookieConsentRecord(parsed)) return null;

    return parsed;
  } catch {
    return inMemoryConsentRecord;
  }
}

export function writeCookieConsent(value: CookieConsentValue) {
  const record: CookieConsentRecord = {
    value,
    updatedAt: new Date().toISOString(),
  };

  inMemoryConsentRecord = record;

  try {
    if (value === "essential") {
      window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    }

    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(record),
    );
  } catch {
    // Strict privacy modes can block localStorage. The in-memory event still lets
    // the current page respond to the user's choice.
  }

  window.dispatchEvent(
    new CustomEvent<CookieConsentRecord>(COOKIE_CONSENT_EVENT, {
      detail: record,
    }),
  );

  return record;
}

export function hasAnalyticsConsent() {
  return readCookieConsent()?.value === "all";
}

function isCookieConsentRecord(value: unknown): value is CookieConsentRecord {
  if (!value || typeof value !== "object") return false;

  const record = value as Partial<CookieConsentRecord>;

  return (
    (record.value === "essential" || record.value === "all") &&
    typeof record.updatedAt === "string"
  );
}
