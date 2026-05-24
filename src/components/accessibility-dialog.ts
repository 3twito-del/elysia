const focusableDialogSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export const inertOutsideDialogSelector = [
  "#main-content",
  ".skip-link",
  '[data-cookie-consent-banner="true"]',
].join(",");

export function getElementInert(element: HTMLElement) {
  return element.inert;
}

export function setElementInert(element: HTMLElement, inert: boolean) {
  element.inert = inert;
}

export function getFocusableDialogElements(dialog: HTMLElement | null) {
  if (!dialog) return [];

  return Array.from(
    dialog.querySelectorAll<HTMLElement>(focusableDialogSelector),
  ).filter((element) => {
    if (element.hasAttribute("disabled")) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;

    const styles = window.getComputedStyle(element);

    return styles.display !== "none" && styles.visibility !== "hidden";
  });
}
