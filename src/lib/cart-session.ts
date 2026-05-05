const CART_SESSION_STORAGE_KEY = "aphrodite_cart_session";
const CART_SESSION_COOKIE = "aphrodite_cart_session";
const CART_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const CART_UPDATED_EVENT = "aphrodite:cart-updated";

export function getOrCreateCartSessionKey() {
  const existing = readStoredSessionKey();

  if (existing) {
    writeCartSessionCookie(existing);
    return existing;
  }

  const sessionKey = createCartSessionKey();

  writeStoredSessionKey(sessionKey);
  writeCartSessionCookie(sessionKey);

  return sessionKey;
}

export function getStoredCartSessionKey() {
  return readStoredSessionKey();
}

export function dispatchCartUpdated() {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

function readStoredSessionKey() {
  const cookieSession = readCartSessionCookie();

  if (cookieSession) return cookieSession;

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

function readCartSessionCookie() {
  const value = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${CART_SESSION_COOKIE}=`))
    ?.split("=")[1];

  if (typeof value !== "string" || !isValidSessionKey(value)) return null;

  return decodeURIComponent(value);
}

function writeCartSessionCookie(sessionKey: string) {
  document.cookie = [
    `${CART_SESSION_COOKIE}=${encodeURIComponent(sessionKey)}`,
    "Path=/",
    `Max-Age=${CART_SESSION_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ].join("; ");
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
