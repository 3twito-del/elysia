"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { Moon, Sun } from "lucide-react";

import {
  getClientThemeSnapshot,
  getServerThemeSnapshot,
  parseStoredThemePreference,
  subscribeToThemePreference,
  writeStoredThemePreference,
} from "~/components/theme-preference";
import { cn } from "~/lib/utils";

type ThemeToggleProps = {
  className?: string;
  style?: CSSProperties;
};

export function ThemeToggle({ className, style }: ThemeToggleProps) {
  const stored = useSyncExternalStore(
    subscribeToThemePreference,
    getClientThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isDark = parseStoredThemePreference(stored || null) === "dark";

  return (
    <button
      aria-pressed={isDark}
      className={cn(
        "mobile-nav-quick-action mobile-nav-animated-item text-muted-foreground hover:text-foreground grid min-h-[3.25rem] grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[var(--glass-border)] px-2 text-sm transition-colors outline-none last:border-b-0 focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
        className,
      )}
      data-testid="mobile-nav-theme-toggle"
      onClick={() => writeStoredThemePreference(isDark ? "light" : "dark")}
      style={style}
      type="button"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
      <span>מצב לילה</span>
      <span
        aria-hidden="true"
        className="border-[var(--glass-border)] text-muted-foreground rounded-full border px-2 py-0.5 text-[0.68rem]"
      >
        {isDark ? "כהה" : "בהיר"}
      </span>
    </button>
  );
}
