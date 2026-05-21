"use client";

import { useEffect, useState } from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

export function useResolvedReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [siteReducedMotion, setSiteReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(reducedMotionQuery);
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

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

  return prefersReducedMotion || siteReducedMotion;
}
