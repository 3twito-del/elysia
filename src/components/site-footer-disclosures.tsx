"use client";

import { useEffect } from "react";

const footerNavDisclosureSelector = "[data-footer-nav-disclosure]";
const desktopMediaQuery = "(min-width: 640px)";

export function SiteFooterDisclosures() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(desktopMediaQuery);
    const syncDisclosureState = () => {
      document
        .querySelectorAll<HTMLDetailsElement>(footerNavDisclosureSelector)
        .forEach((details) => {
          details.open = mediaQuery.matches;
        });
    };

    syncDisclosureState();
    mediaQuery.addEventListener("change", syncDisclosureState);

    return () => {
      mediaQuery.removeEventListener("change", syncDisclosureState);
    };
  }, []);

  return null;
}
