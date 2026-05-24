export type TextScale = "normal" | "large" | "xlarge";

export type AccessibilitySettings = {
  textScale: TextScale;
  highContrast: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
};

const storageKey = "elysia.accessibility-settings";
export const settingsChangeEvent = "elysia:accessibility-settings";

export const defaultAccessibilitySettings: AccessibilitySettings = {
  textScale: "normal",
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false,
};

export function isTextScale(value: unknown): value is TextScale {
  return value === "normal" || value === "large" || value === "xlarge";
}

export function parseStoredSettings(stored: string | null) {
  if (!stored) return defaultAccessibilitySettings;

  try {
    const parsed = JSON.parse(stored) as Partial<AccessibilitySettings>;

    return {
      textScale: isTextScale(parsed.textScale)
        ? parsed.textScale
        : defaultAccessibilitySettings.textScale,
      highContrast:
        typeof parsed.highContrast === "boolean"
          ? parsed.highContrast
          : defaultAccessibilitySettings.highContrast,
      underlineLinks:
        typeof parsed.underlineLinks === "boolean"
          ? parsed.underlineLinks
          : defaultAccessibilitySettings.underlineLinks,
      reduceMotion:
        typeof parsed.reduceMotion === "boolean"
          ? parsed.reduceMotion
          : defaultAccessibilitySettings.reduceMotion,
    };
  } catch {
    return defaultAccessibilitySettings;
  }
}

export function subscribeToAccessibilitySettings(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(settingsChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(settingsChangeEvent, onStoreChange);
  };
}

export function getClientSettingsSnapshot() {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

export function getServerSettingsSnapshot() {
  return "";
}

export function writeStoredSettings(settings: AccessibilitySettings) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // Browsers can block storage in strict privacy modes; the live setting still applies.
  }

  applyAccessibilitySettings(settings);
}

export function applyAccessibilitySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  if (settings.textScale === "normal") {
    delete root.dataset.accessibilityText;
  } else {
    root.dataset.accessibilityText = settings.textScale;
  }

  if (settings.highContrast) {
    root.dataset.accessibilityContrast = "true";
  } else {
    delete root.dataset.accessibilityContrast;
  }

  if (settings.underlineLinks) {
    root.dataset.accessibilityLinks = "true";
  } else {
    delete root.dataset.accessibilityLinks;
  }

  if (settings.reduceMotion) {
    root.dataset.accessibilityMotion = "reduce";
  } else {
    delete root.dataset.accessibilityMotion;
  }

  window.dispatchEvent(new CustomEvent(settingsChangeEvent));
}

export function areSettingsEqual(
  first: AccessibilitySettings,
  second: AccessibilitySettings,
) {
  return (
    first.textScale === second.textScale &&
    first.highContrast === second.highContrast &&
    first.underlineLinks === second.underlineLinks &&
    first.reduceMotion === second.reduceMotion
  );
}
