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
      aria-checked={isDark}
      aria-label={`מצב לילה: ${isDark ? "פעיל" : "כבוי"}`}
      className={cn(
        "mobile-nav-theme-switch mobile-nav-animated-item text-foreground flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-right text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-[var(--glass-focus)]",
        className,
      )}
      data-testid="mobile-nav-theme-toggle"
      onClick={() => writeStoredThemePreference(isDark ? "light" : "dark")}
      role="switch"
      style={style}
      type="button"
    >
      <span
        aria-hidden="true"
        className="relative h-6 w-11 shrink-0 rounded-full border border-[var(--glass-border-strong)] bg-[var(--muted)] p-0.5 transition-colors"
      >
        <span
          className={cn(
            "bg-background block size-5 rounded-full border border-[var(--glass-border)] shadow-sm transition-transform duration-200 motion-reduce:transition-none",
            isDark && "-translate-x-5",
          )}
        />
      </span>
      <span className="grid flex-1 gap-0.5">
        <span className="inline-flex items-center gap-2 font-medium">
          {isDark ? (
            <Sun aria-hidden="true" className="size-4" />
          ) : (
            <Moon aria-hidden="true" className="size-4" />
          )}
          מצב לילה
        </span>
        <span className="text-muted-foreground text-xs">
          {isDark ? "פעיל" : "כבוי"}
        </span>
      </span>
    </button>
  );
}
