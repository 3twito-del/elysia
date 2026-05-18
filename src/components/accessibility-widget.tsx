"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accessibility,
  CaseSensitive,
  CirclePause,
  Contrast,
  Minus,
  Plus,
  RotateCcw,
  Underline,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

type TextScale = "normal" | "large" | "xlarge";

type AccessibilitySettings = {
  textScale: TextScale;
  highContrast: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
};

const storageKey = "aphrodite.accessibility-settings";
const settingsChangeEvent = "aphrodite:accessibility-settings";

const defaultSettings: AccessibilitySettings = {
  textScale: "normal",
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false,
};

const textScaleOptions: Array<{ value: TextScale; label: string }> = [
  { value: "normal", label: "רגיל" },
  { value: "large", label: "גדול" },
  { value: "xlarge", label: "גדול מאוד" },
];

function isTextScale(value: unknown): value is TextScale {
  return value === "normal" || value === "large" || value === "xlarge";
}

function parseStoredSettings(stored: string | null) {
  if (!stored) return defaultSettings;

  try {
    const parsed = JSON.parse(stored) as Partial<AccessibilitySettings>;

    return {
      textScale: isTextScale(parsed.textScale)
        ? parsed.textScale
        : defaultSettings.textScale,
      highContrast:
        typeof parsed.highContrast === "boolean"
          ? parsed.highContrast
          : defaultSettings.highContrast,
      underlineLinks:
        typeof parsed.underlineLinks === "boolean"
          ? parsed.underlineLinks
          : defaultSettings.underlineLinks,
      reduceMotion:
        typeof parsed.reduceMotion === "boolean"
          ? parsed.reduceMotion
          : defaultSettings.reduceMotion,
    };
  } catch {
    return defaultSettings;
  }
}

function subscribeToAccessibilitySettings(onStoreChange: () => void) {
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

function getClientSettingsSnapshot() {
  try {
    return window.localStorage.getItem(storageKey) ?? "";
  } catch {
    return "";
  }
}

function getServerSettingsSnapshot() {
  return "";
}

function writeStoredSettings(settings: AccessibilitySettings) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  } catch {
    // Browsers can block storage in strict privacy modes; the live setting still applies.
  }

  applyAccessibilitySettings(settings);
}

function applyAccessibilitySettings(settings: AccessibilitySettings) {
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

function getScaleIndex(value: TextScale) {
  return textScaleOptions.findIndex((option) => option.value === value);
}

function ToggleRow({
  checked,
  description,
  label,
  onChange,
  icon: Icon,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
  icon: typeof Contrast;
}) {
  return (
    <label className="glass-inset flex cursor-pointer items-center justify-between gap-4 rounded-md border p-3">
      <span className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          <span className="text-muted-foreground mt-1 block text-xs leading-5">
            {description}
          </span>
        </span>
      </span>
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className={cn(
          "border-input relative h-6 w-11 shrink-0 rounded-full border transition peer-focus-visible:ring-3 peer-focus-visible:ring-[var(--glass-focus)]",
          checked ? "bg-foreground" : "bg-background",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition",
            checked ? "bg-background right-6" : "bg-muted-foreground right-1",
          )}
        />
      </span>
    </label>
  );
}

export function AccessibilityWidget() {
  const pathname = usePathname();
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const settingsSnapshot = useSyncExternalStore(
    subscribeToAccessibilitySettings,
    getClientSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const settings = useMemo(
    () => parseStoredSettings(settingsSnapshot),
    [settingsSnapshot],
  );
  const updateSettings = useCallback(
    (
      updater:
        | AccessibilitySettings
        | ((current: AccessibilitySettings) => AccessibilitySettings),
    ) => {
      const current = parseStoredSettings(getClientSettingsSnapshot());
      const next = typeof updater === "function" ? updater(current) : updater;

      writeStoredSettings(next);
    },
    [],
  );

  useEffect(() => {
    applyAccessibilitySettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() =>
      closeButtonRef.current?.focus(),
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        window.requestAnimationFrame(() => triggerButtonRef.current?.focus());
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        ).filter((element) => !element.hasAttribute("disabled"));

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) return;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const currentScaleIndex = getScaleIndex(settings.textScale);
  const closeMenu = () => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerButtonRef.current?.focus());
  };

  return (
    <>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="פתיחת תפריט נגישות"
        className="public-floating-control public-floating-trigger fixed top-[max(calc(var(--site-header-height)+11.75rem+env(safe-area-inset-top)),32svh)] left-4 z-50 size-11 rounded-full shadow-[0_16px_36px_oklch(0.12_0_0_/_20%)] sm:top-auto sm:right-6 sm:bottom-[calc(max(var(--floating-stack-bottom,1rem),var(--public-floating-bar-offset,1rem))+env(safe-area-inset-bottom))] sm:left-auto sm:size-12"
        data-accessibility-widget-trigger="true"
        onClick={() => setIsOpen(true)}
        ref={triggerButtonRef}
        size="icon-lg"
        type="button"
      >
        <Accessibility className="size-6" aria-hidden="true" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[90]" dir="rtl">
          <button
            aria-label="סגירת תפריט נגישות"
            className="popup-overlay fixed inset-0 cursor-default"
            onClick={closeMenu}
            tabIndex={-1}
            type="button"
          />

          <section
            aria-describedby={descriptionId}
            aria-labelledby={titleId}
            aria-modal="true"
            className="popup-surface fixed top-1/2 left-1/2 z-[100] grid max-h-[min(42rem,calc(100vh-2rem))] w-[min(calc(100vw-2rem),27rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-4 text-sm shadow-[0_24px_80px_oklch(0.1_0_0_/_24%)] outline-none"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4 pe-1">
              <div>
                <h2 className="text-xl font-medium" id={titleId}>
                  תפריט נגישות
                </h2>
                <p
                  className="text-muted-foreground mt-2 leading-6"
                  id={descriptionId}
                >
                  התאמות תצוגה לשיפור הקריאות והשימוש באתר.
                </p>
              </div>
              <Button
                aria-label="סגירת תפריט נגישות"
                onClick={closeMenu}
                ref={closeButtonRef}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <section aria-labelledby="accessibility-text-size">
              <div className="mb-3 flex items-center gap-2">
                <CaseSensitive className="size-4" aria-hidden="true" />
                <h3
                  className="text-sm font-semibold"
                  id="accessibility-text-size"
                >
                  גודל טקסט
                </h3>
              </div>

              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <Button
                  aria-label="הקטנת טקסט"
                  disabled={currentScaleIndex <= 0}
                  onClick={() =>
                    updateSettings((current) => ({
                      ...current,
                      textScale:
                        textScaleOptions[
                          Math.max(0, getScaleIndex(current.textScale) - 1)
                        ]?.value ?? "normal",
                    }))
                  }
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Minus className="size-4" aria-hidden="true" />
                </Button>

                <div
                  className="glass-inset grid grid-cols-3 rounded-md border p-1"
                  role="group"
                  aria-label="בחירת גודל טקסט"
                >
                  {textScaleOptions.map((option) => (
                    <button
                      aria-pressed={settings.textScale === option.value}
                      className={cn(
                        "rounded-sm px-2 py-2 text-xs font-medium transition",
                        settings.textScale === option.value
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      key={option.value}
                      onClick={() =>
                        updateSettings((current) => ({
                          ...current,
                          textScale: option.value,
                        }))
                      }
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <Button
                  aria-label="הגדלת טקסט"
                  disabled={currentScaleIndex >= textScaleOptions.length - 1}
                  onClick={() =>
                    updateSettings((current) => ({
                      ...current,
                      textScale:
                        textScaleOptions[
                          Math.min(
                            textScaleOptions.length - 1,
                            getScaleIndex(current.textScale) + 1,
                          )
                        ]?.value ?? "xlarge",
                    }))
                  }
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </section>

            <Separator />

            <div className="grid gap-3">
              <ToggleRow
                checked={settings.highContrast}
                description="מעביר את הממשק לצבעים חדים וברורים יותר."
                icon={Contrast}
                label="ניגודיות גבוהה"
                onChange={(checked) =>
                  updateSettings((current) => ({
                    ...current,
                    highContrast: checked,
                  }))
                }
              />
              <ToggleRow
                checked={settings.underlineLinks}
                description="מסמן קישורים בקו תחתון כדי להבדיל אותם מטקסט רגיל."
                icon={Underline}
                label="הדגשת קישורים"
                onChange={(checked) =>
                  updateSettings((current) => ({
                    ...current,
                    underlineLinks: checked,
                  }))
                }
              />
              <ToggleRow
                checked={settings.reduceMotion}
                description="מבטל אנימציות ומעברים שאינם חיוניים."
                icon={CirclePause}
                label="הפחתת תנועה"
                onChange={(checked) =>
                  updateSettings((current) => ({
                    ...current,
                    reduceMotion: checked,
                  }))
                }
              />
            </div>

            <div className="glass-inset -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-lg border-t p-4 sm:flex-row sm:justify-end">
              <Button
                className="justify-between"
                onClick={() => updateSettings(defaultSettings)}
                type="button"
                variant="outline"
              >
                איפוס התאמות
                <RotateCcw className="size-4" aria-hidden="true" />
              </Button>
              <Button asChild className="justify-between" variant="secondary">
                <Link href="/accessibility" onClick={closeMenu}>
                  הצהרת נגישות
                </Link>
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
