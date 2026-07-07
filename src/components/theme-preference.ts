export type ThemePreference = "light" | "dark";

const storageKey = "elysia.theme-preference";
export const themePreferenceChangeEvent = "elysia:theme-preference";

export const defaultThemePreference: ThemePreference = "light";

export const darkThemeColor = "#161210";
export const lightThemeColor = "#fbf8f4";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}

export function parseStoredThemePreference(
  stored: string | null,
): ThemePreference {
  return isThemePreference(stored) ? stored : defaultThemePreference;
}

export function subscribeToThemePreference(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(themePreferenceChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(themePreferenceChangeEvent, onStoreChange);
  };
}

export function getClientThemeSnapshot() {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

export function getServerThemeSnapshot() {
  return "";
}

export function writeStoredThemePreference(preference: ThemePreference) {
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // Browsers can block storage in strict privacy modes; the live theme still applies.
  }

  applyThemePreference(preference);
}

export function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  // The admin surface is light-only until it gets its own dark audit.
  const isDark =
    preference === "dark" && !window.location.pathname.startsWith("/admin");

  root.classList.toggle("dark", isDark);
  syncThemeColorMeta(isDark);
  window.dispatchEvent(new CustomEvent(themePreferenceChangeEvent));
}

function syncThemeColorMeta(isDark: boolean) {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDark ? darkThemeColor : lightThemeColor);
}
