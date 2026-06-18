"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accessibility,
  CaseSensitive,
  CirclePause,
  Contrast,
  EyeOff,
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
import {
  getElementInert,
  getFocusableDialogElements,
  inertOutsideDialogSelector,
  setElementInert,
} from "~/components/accessibility-dialog";
import {
  applyAccessibilitySettings,
  areSettingsEqual,
  defaultAccessibilitySettings,
  getClientSettingsSnapshot,
  getServerSettingsSnapshot,
  parseStoredSettings,
  subscribeToAccessibilitySettings,
  type AccessibilitySettings,
  type TextScale,
  writeStoredSettings,
} from "~/components/accessibility-settings";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

const textScaleOptions: Array<{ value: TextScale; label: string }> = [
  { value: "normal", label: "רגיל" },
  { value: "large", label: "גדול" },
  { value: "xlarge", label: "גדול מאוד" },
];

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
  const dialogId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const initialFocusRef = useRef<HTMLHeadingElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreTriggerFocusRef = useRef(false);
  const statusFrameRef = useRef<number | null>(null);
  const statusTimeoutRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hiddenTriggerPathname, setHiddenTriggerPathname] = useState<
    string | null
  >(null);
  const [statusMessage, setStatusMessage] = useState("");
  const settingsSnapshot = useSyncExternalStore(
    subscribeToAccessibilitySettings,
    getClientSettingsSnapshot,
    getServerSettingsSnapshot,
  );
  const settings = useMemo(
    () => parseStoredSettings(settingsSnapshot),
    [settingsSnapshot],
  );
  const announceSettingsChange = useCallback((message: string) => {
    if (statusFrameRef.current !== null) {
      window.cancelAnimationFrame(statusFrameRef.current);
    }

    if (statusTimeoutRef.current !== null) {
      window.clearTimeout(statusTimeoutRef.current);
    }

    setStatusMessage("");

    statusFrameRef.current = window.requestAnimationFrame(() => {
      setStatusMessage(message);
      statusTimeoutRef.current = window.setTimeout(
        () => setStatusMessage(""),
        2400,
      );
    });
  }, []);
  const updateSettings = useCallback(
    (
      updater:
        | AccessibilitySettings
        | ((current: AccessibilitySettings) => AccessibilitySettings),
      announcement = "העדפות הנגישות עודכנו",
    ) => {
      const current = parseStoredSettings(getClientSettingsSnapshot());
      const next = typeof updater === "function" ? updater(current) : updater;

      if (areSettingsEqual(current, next)) return;

      writeStoredSettings(next);
      announceSettingsChange(announcement);
    },
    [announceSettingsChange],
  );

  useEffect(() => {
    applyAccessibilitySettings(settings);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (statusFrameRef.current !== null) {
        window.cancelAnimationFrame(statusFrameRef.current);
      }

      if (statusTimeoutRef.current !== null) {
        window.clearTimeout(statusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    shouldRestoreTriggerFocusRef.current = false;
    const closeFrame = window.requestAnimationFrame(() => {
      setIsOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(closeFrame);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>(inertOutsideDialogSelector),
    ).filter((element) => !dialogRef.current?.contains(element));
    const previousInertStates = inertTargets.map((element) => ({
      ariaHidden: element.getAttribute("aria-hidden"),
      element,
      inert: getElementInert(element),
    }));
    const focusFrame = window.requestAnimationFrame(() => {
      initialFocusRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        shouldRestoreTriggerFocusRef.current = true;
        setIsOpen(false);
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = getFocusableDialogElements(dialogRef.current);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) return;

        const activeElement = document.activeElement;
        const isDialogFocusable = focusableElements.some(
          (element) => element === activeElement,
        );

        if (!isDialogFocusable) {
          event.preventDefault();
          (event.shiftKey ? lastElement : firstElement).focus();
        } else if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    inertTargets.forEach((element) => {
      setElementInert(element, true);
      element.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      previousInertStates.forEach(({ ariaHidden, element, inert }) => {
        setElementInert(element, inert);

        if (ariaHidden === null) {
          element.removeAttribute("aria-hidden");
        } else {
          element.setAttribute("aria-hidden", ariaHidden);
        }
      });
      document.body.style.overflow = previousOverflow;
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      shouldRestoreTriggerFocusRef.current = true;
      return;
    }

    if (!shouldRestoreTriggerFocusRef.current) return;

    const restoreTriggerFocus = () => {
      const trigger =
        triggerButtonRef.current ??
        document.querySelector<HTMLButtonElement>(
          '[data-accessibility-widget-trigger="true"]',
        );

      trigger?.focus({ preventScroll: true });
      shouldRestoreTriggerFocusRef.current = false;
    };
    const restoreFrame = window.requestAnimationFrame(restoreTriggerFocus);
    const restoreTimeout = window.setTimeout(restoreTriggerFocus, 0);
    const restoreSettledTimeout = window.setTimeout(restoreTriggerFocus, 50);

    return () => {
      window.cancelAnimationFrame(restoreFrame);
      window.clearTimeout(restoreTimeout);
      window.clearTimeout(restoreSettledTimeout);
    };
  }, [isOpen]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const currentScaleIndex = getScaleIndex(settings.textScale);
  const isTriggerHidden = hiddenTriggerPathname === pathname;
  const usesCheckoutTopPlacement = pathname === "/checkout";
  const closeMenu = () => {
    shouldRestoreTriggerFocusRef.current = true;
    setIsOpen(false);
  };
  const hideFloatingTriggerForPage = () => {
    shouldRestoreTriggerFocusRef.current = false;
    setIsOpen(false);
    setHiddenTriggerPathname(pathname);
  };

  return (
    <>
      {!isTriggerHidden && (
        <Button
          aria-controls={dialogId}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label="פתיחת תפריט נגישות"
          className={cn(
            "public-floating-control public-floating-trigger bg-background text-foreground focus-visible:outline-foreground/50 fixed right-3 bottom-[calc(max(var(--floating-stack-bottom,0.75rem),var(--public-floating-bar-offset,0.75rem))+env(safe-area-inset-bottom))] left-auto z-50 size-10 rounded-full shadow-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid sm:right-5 sm:size-11",
            usesCheckoutTopPlacement &&
              "top-[calc(var(--site-header-height)+var(--floating-stack-top,0px)+0.75rem+env(safe-area-inset-top))] bottom-auto sm:bottom-auto",
          )}
          data-accessibility-widget-trigger="true"
          data-icon-tooltip="תפריט נגישות"
          data-icon-tooltip-placement="top"
          onClick={() => setIsOpen(true)}
          ref={triggerButtonRef}
          size="icon-lg"
          tabIndex={isOpen ? -1 : undefined}
          type="button"
          variant="outline"
        >
          <Accessibility className="size-6" aria-hidden="true" />
        </Button>
      )}

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
            className="popup-surface minimal-scroll fixed top-1/2 left-1/2 z-[100] grid max-h-[min(42rem,calc(100vh-2rem))] w-[min(calc(100vw-2rem),27rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border p-4 text-sm shadow-[0_24px_80px_oklch(0.1_0_0_/_24%)] outline-none"
            id={dialogId}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4 pe-1">
              <div>
                <h2
                  className="rounded-sm text-xl font-medium outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]"
                  id={titleId}
                  ref={initialFocusRef}
                  tabIndex={-1}
                >
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
                data-icon-tooltip="סגירה"
                data-icon-tooltip-placement="top"
                onClick={closeMenu}
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
                  data-icon-tooltip="הקטנת טקסט"
                  data-icon-tooltip-placement="top"
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
                  data-icon-tooltip="הגדלת טקסט"
                  data-icon-tooltip-placement="top"
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
                description="מעביר את הממשק לצבעים חדים ומובחנים יותר."
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

            <div className="glass-inset -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-lg border-t p-4 sm:flex-row sm:flex-wrap sm:justify-end">
              <Button
                className="justify-between"
                onClick={hideFloatingTriggerForPage}
                type="button"
                variant="ghost"
              >
                הסתרת הכפתור בדף זה
                <EyeOff className="size-4" aria-hidden="true" />
              </Button>
              <Button
                className="justify-between"
                onClick={() =>
                  updateSettings(
                    defaultAccessibilitySettings,
                    "התאמות הנגישות אופסו",
                  )
                }
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

            <div
              aria-atomic="true"
              aria-live="polite"
              className="sr-only"
              role="status"
            >
              {statusMessage}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
