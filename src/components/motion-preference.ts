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
    const observer = new MutationObserver(updatePreference);

    observer.observe(document.documentElement, {
      attributeFilter: ["data-accessibility-motion"],
      attributes: true,
    });
    window.addEventListener("elysia:accessibility-settings", updatePreference);

    return () => {
      observer.disconnect();
      window.removeEventListener(
        "elysia:accessibility-settings",
        updatePreference,
      );
    };
  }, []);

  return (prefersReducedMotion ?? false) || siteReducedMotion;
}
