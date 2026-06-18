"use client";

import { useEffect } from "react";

const footerNavDisclosureSelector = "[data-footer-nav-disclosure]";
const footerNavRootSelector = "[data-footer-nav-root]";
const desktopMediaQuery = "(min-width: 768px)";

export function SiteFooterDisclosures() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(desktopMediaQuery);
    const footerNavRoot = document.querySelector(footerNavRootSelector);
    const syncDisclosureState = () => {
      document
        .querySelectorAll<HTMLDetailsElement>(footerNavDisclosureSelector)
        .forEach((details) => {
          details.open = mediaQuery.matches;
        });
    };
    const closeSiblingDisclosures = (event: Event) => {
      if (mediaQuery.matches) return;

      const activeDisclosure = event.currentTarget;

      if (
        !(activeDisclosure instanceof HTMLDetailsElement) ||
        !activeDisclosure.open
      ) {
        return;
      }

      footerNavRoot
        ?.querySelectorAll<HTMLDetailsElement>(footerNavDisclosureSelector)
        .forEach((details) => {
          if (details !== activeDisclosure) details.open = false;
        });
    };

    syncDisclosureState();
    mediaQuery.addEventListener("change", syncDisclosureState);
    footerNavRoot
      ?.querySelectorAll<HTMLDetailsElement>(footerNavDisclosureSelector)
      .forEach((details) => {
        details.addEventListener("toggle", closeSiblingDisclosures);
      });

    return () => {
      mediaQuery.removeEventListener("change", syncDisclosureState);
      footerNavRoot
        ?.querySelectorAll<HTMLDetailsElement>(footerNavDisclosureSelector)
        .forEach((details) => {
          details.removeEventListener("toggle", closeSiblingDisclosures);
        });
    };
  }, []);

  return null;
}
