"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import {
  getClientThemeSnapshot,
  getServerThemeSnapshot,
  parseStoredThemePreference,
  subscribeToThemePreference,
  writeStoredThemePreference,
} from "~/components/theme-preference";
import { Button } from "~/components/ui/button";

export function ThemeToggle() {
  const stored = useSyncExternalStore(
    subscribeToThemePreference,
    getClientThemeSnapshot,
    getServerThemeSnapshot,
  );
  const isDark = parseStoredThemePreference(stored || null) === "dark";

  return (
    <Button
      aria-pressed={isDark}
      className="site-header-action size-10 sm:size-11"
      data-icon-tooltip="מצב לילה"
      data-icon-tooltip-placement="bottom"
      onClick={() => writeStoredThemePreference(isDark ? "light" : "dark")}
      size="icon"
      type="button"
      variant="ghost"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-5" />
      ) : (
        <Moon aria-hidden="true" className="size-5" />
      )}
      <span className="sr-only">מצב לילה</span>
    </Button>
  );
}
