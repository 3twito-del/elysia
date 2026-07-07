"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  applyThemePreference,
  getClientThemeSnapshot,
  parseStoredThemePreference,
} from "~/components/theme-preference";

/**
 * Re-applies the stored theme on every route change so client-side
 * navigation in and out of the light-only admin surface stays correct.
 */
export function ThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    applyThemePreference(
      parseStoredThemePreference(getClientThemeSnapshot() || null),
    );
  }, [pathname]);

  return null;
}
