export const anchorScrollEventName = "elysia:anchor-scroll";

export function normalizeSamePageHash(href: string | null) {
  if (!href || href === "#") return "";

  if (href.startsWith("#")) return href;

  try {
    const url = new URL(href, window.location.href);

    if (
      url.origin !== window.location.origin ||
      url.pathname !== window.location.pathname ||
      url.search !== window.location.search
    ) {
      return "";
    }

    return url.hash && url.hash !== "#" ? url.hash : "";
  } catch {
    return "";
  }
}

export function getElementByHash(hash: string) {
  if (!hash || hash === "#") return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
}

export function dispatchAnchorScrollEvent(
  phase: "start" | "settle" | "end",
  target: HTMLElement,
) {
  window.dispatchEvent(
    new CustomEvent(anchorScrollEventName, {
      detail: {
        phase,
        targetId: target.id,
        targetTop: getTargetDocumentTop(target),
      },
    }),
  );
}

export function scrollTargetToViewportTop(
  target: HTMLElement,
  options: Pick<ScrollToOptions, "behavior">,
) {
  window.scrollTo({
    top: getTargetDocumentTop(target),
    behavior: options.behavior,
  });

  if (options.behavior !== "smooth") return;

  const snapToExactTop = () => {
    if (!target.isConnected) return;

    const scrollMarginTop = getTargetScrollMarginTop(target);
    const offset = target.getBoundingClientRect().top - scrollMarginTop;

    if (Math.abs(offset) > 96) return;
    if (Math.abs(offset) <= 1) return;

    window.scrollTo({
      top: Math.max(0, window.scrollY + offset),
      behavior: "auto",
    });
  };

  window.setTimeout(snapToExactTop, 720);
  window.setTimeout(snapToExactTop, 1040);
}

function getTargetDocumentTop(target: HTMLElement) {
  return Math.max(
    0,
    target.getBoundingClientRect().top +
      window.scrollY -
      getTargetScrollMarginTop(target),
  );
}

function getTargetScrollMarginTop(target: HTMLElement) {
  const scrollMarginTop = Number.parseFloat(
    window.getComputedStyle(target).scrollMarginTop,
  );

  return Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0;
}
