const CART_SESSION_STORAGE_KEY = "elysia_cart_session";
export const CART_UPDATED_EVENT = "elysia:cart-updated";

export function getOrCreateCartSessionKey() {
  const existing = readStoredSessionKey();

  if (existing) {
    return existing;
  }

  const sessionKey = createCartSessionKey();

  writeStoredSessionKey(sessionKey);

  return sessionKey;
}

export function getStoredCartSessionKey() {
  return readStoredSessionKey();
}

export function dispatchCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function readStoredSessionKey() {
  try {
    const stored = window.localStorage.getItem(CART_SESSION_STORAGE_KEY);

    return isValidSessionKey(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeStoredSessionKey(sessionKey: string) {
  try {
    window.localStorage.setItem(CART_SESSION_STORAGE_KEY, sessionKey);
  } catch {
    // Some privacy modes block localStorage writes. The cookie is enough for continuity.
  }
}

function createCartSessionKey() {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);

  return `cart_${Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")}`;
}

function isValidSessionKey(value: string | null | undefined) {
  return typeof value === "string" && value.length >= 16 && value.length <= 128;
}
