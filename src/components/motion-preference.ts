"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

export function useResolvedReducedMotion() {
  const prefersReducedMotion = useReducedMotion();
  const [siteReducedMotion, setSiteReducedMotion] = useState(false);

  useEffect(() => {
    const updatePreference = () =>
      setSiteReducedMotion(
        document.documentElement.dataset.accessibilityMotion === "reduce",
      );

    updatePreference();
    window.addEventListener(
      "aphrodite:accessibility-settings",
      updatePreference,
    );

    return () =>
      window.removeEventListener(
        "aphrodite:accessibility-settings",
        updatePreference,
      );
  }, []);

  return (prefersReducedMotion ?? false) || siteReducedMotion;
}
