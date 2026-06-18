"use client";

import { useEffect } from "react";

const explicitAccordionGroupSelector = "[data-exclusive-details-group]";
const disabledAccordionSelector = "[data-exclusive-details-disabled]";
const footerNavDisclosureSelector = "[data-footer-nav-disclosure]";

type DetailsAccordionScope = {
  explicit: boolean;
  root: HTMLElement;
};

export function ExclusiveDetailsProvider() {
  useEffect(() => {
    const closePeerDetails = (event: Event) => {
      const activeDetails = event.target;

      if (
        !(activeDetails instanceof HTMLDetailsElement) ||
        !activeDetails.open ||
        !isManagedDetails(activeDetails)
      ) {
        return;
      }

      const scope = getDetailsAccordionScope(activeDetails);

      if (!scope) return;

      scope.root
        .querySelectorAll<HTMLDetailsElement>("details")
        .forEach((details) => {
          if (
            details === activeDetails ||
            !details.open ||
            !isManagedDetails(details) ||
            !isInSameAccordionScope(details, activeDetails, scope)
          ) {
            return;
          }

          details.open = false;
        });
    };

    document.addEventListener("toggle", closePeerDetails, true);
    document.documentElement.dataset.exclusiveDetailsReady = "true";

    return () => {
      document.removeEventListener("toggle", closePeerDetails, true);
      delete document.documentElement.dataset.exclusiveDetailsReady;
    };
  }, []);

  return null;
}

function getDetailsAccordionScope(
  details: HTMLDetailsElement,
): DetailsAccordionScope | null {
  const explicitRoot = details.closest<HTMLElement>(
    explicitAccordionGroupSelector,
  );

  if (explicitRoot) {
    return { explicit: true, root: explicitRoot };
  }

  if (!details.parentElement) return null;

  return { explicit: false, root: details.parentElement };
}

function isInSameAccordionScope(
  details: HTMLDetailsElement,
  activeDetails: HTMLDetailsElement,
  scope: DetailsAccordionScope,
) {
  if (scope.explicit) {
    return details.closest(explicitAccordionGroupSelector) === scope.root;
  }

  return details.parentElement === activeDetails.parentElement;
}

function isManagedDetails(details: HTMLDetailsElement) {
  return (
    !details.matches(footerNavDisclosureSelector) &&
    !details.closest(disabledAccordionSelector)
  );
}
