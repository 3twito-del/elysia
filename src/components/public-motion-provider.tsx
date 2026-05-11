"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type PublicMotionProviderProps = {
  children: ReactNode;
};

type MotionState = "visible" | "enter" | "exit";

type PublicMotionContextValue = {
  suppressInitialReveal: boolean;
};

const pageTransitionMs = 180;
const anchorScrollEventName = "aphrodite:anchor-scroll";
const PublicMotionContext = createContext<PublicMotionContextValue>({
  suppressInitialReveal: false,
});

function getRouteMotionScope(pathname: string) {
  if (pathname.startsWith("/category/")) return "/category";

  return pathname;
}

function shouldPreserveRouteShell(fromPathname: string, toPathname: string) {
  return (
    fromPathname !== toPathname &&
    getRouteMotionScope(fromPathname) === getRouteMotionScope(toPathname)
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () =>
      setPrefersReducedMotion(
        mediaQuery.matches ||
          document.documentElement.dataset.accessibilityMotion === "reduce",
      );
    const syncFrame = window.requestAnimationFrame(updatePreference);

    mediaQuery.addEventListener("change", updatePreference);
    window.addEventListener(
      "aphrodite:accessibility-settings",
      updatePreference,
    );

    return () => {
      window.cancelAnimationFrame(syncFrame);
      mediaQuery.removeEventListener("change", updatePreference);
      window.removeEventListener(
        "aphrodite:accessibility-settings",
        updatePreference,
      );
    };
  }, []);

  return prefersReducedMotion;
}

export function usePublicMotion() {
  return useContext(PublicMotionContext);
}

export function PublicMotionProvider({ children }: PublicMotionProviderProps) {
  const pathname = usePathname();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isAdminRoute = pathname.startsWith("/admin");
  const pendingChildren = useRef(children);
  const hasSyncedInitialChildren = useRef(false);
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  const [renderedChildren, setRenderedChildren] = useState(children);
  const [motionState, setMotionState] = useState<MotionState>("visible");
  const [suppressInitialReveal, setSuppressInitialReveal] = useState(false);
  const motionContextValue = useMemo(
    () => ({ suppressInitialReveal }),
    [suppressInitialReveal],
  );

  useEffect(() => {
    pendingChildren.current = children;
  }, [children]);

  useEffect(() => {
    if (motionState !== "enter" || pathname !== renderedPathname) return;

    let revealResetFrame = 0;
    const visibleFrame = window.requestAnimationFrame(() => {
      setMotionState("visible");
      revealResetFrame = window.requestAnimationFrame(() =>
        setSuppressInitialReveal(false),
      );
    });

    return () => {
      window.cancelAnimationFrame(visibleFrame);
      window.cancelAnimationFrame(revealResetFrame);
    };
  }, [motionState, pathname, renderedPathname]);

  useEffect(() => {
    if (pathname === renderedPathname) {
      const shouldSuppressReveal = hasSyncedInitialChildren.current;
      let revealResetFrame = 0;
      const updateFrame = window.requestAnimationFrame(() => {
        if (shouldSuppressReveal) {
          setSuppressInitialReveal(true);
        }

        setRenderedChildren(children);
        hasSyncedInitialChildren.current = true;
      });

      if (shouldSuppressReveal) {
        revealResetFrame = window.requestAnimationFrame(() => {
          revealResetFrame = window.requestAnimationFrame(() =>
            setSuppressInitialReveal(false),
          );
        });
      }

      return () => {
        window.cancelAnimationFrame(updateFrame);
        window.cancelAnimationFrame(revealResetFrame);
      };
    }

    if (
      shouldReduceMotion ||
      shouldPreserveRouteShell(renderedPathname, pathname)
    ) {
      let revealResetFrame = 0;
      const updateFrame = window.requestAnimationFrame(() => {
        setSuppressInitialReveal(true);
        setRenderedPathname(pathname);
        setRenderedChildren(children);
        setMotionState("visible");
      });
      revealResetFrame = window.requestAnimationFrame(() => {
        revealResetFrame = window.requestAnimationFrame(() =>
          setSuppressInitialReveal(false),
        );
      });

      return () => {
        window.cancelAnimationFrame(updateFrame);
        window.cancelAnimationFrame(revealResetFrame);
      };
    }

    const exitFrame = window.requestAnimationFrame(() =>
      setMotionState("exit"),
    );

    const swapTimer = window.setTimeout(() => {
      setSuppressInitialReveal(true);
      setRenderedPathname(pathname);
      setRenderedChildren(pendingChildren.current);
      setMotionState("enter");
    }, pageTransitionMs);

    return () => {
      window.cancelAnimationFrame(exitFrame);
      window.clearTimeout(swapTimer);
    };
  }, [children, pathname, renderedPathname, shouldReduceMotion]);

  useEffect(() => {
    if (isAdminRoute) return;

    const root = document.documentElement;
    const anchorScrollTimers = new Set<number>();

    const queueAnchorTimer = (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        anchorScrollTimers.delete(timer);
        callback();
      }, delay);

      anchorScrollTimers.add(timer);
    };

    const beginAnchorScrollSession = (target: HTMLElement) => {
      root.dataset.anchorScrollActive = "true";
      dispatchAnchorScrollEvent("start", target);

      queueAnchorTimer(() => dispatchAnchorScrollEvent("settle", target), 1080);
      queueAnchorTimer(() => {
        delete root.dataset.anchorScrollActive;
        dispatchAnchorScrollEvent("end", target);
      }, 1380);
    };

    const onAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.altKey ||
        event.ctrlKey ||
        event.shiftKey
      ) {
        return;
      }

      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) return;

      const anchor = eventTarget.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const hash = normalizeHash(anchor.getAttribute("href"));
      const target = getElementByHash(hash);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();
      beginAnchorScrollSession(target);

      if (!shouldReduceMotion) {
        anchor.dataset.anchorActivating = "true";
        target.dataset.anchorTargetActive = "true";
      }

      scrollTargetToViewportTop(target, {
        behavior: shouldReduceMotion ? "auto" : "smooth",
      });

      const nextUrl = new URL(window.location.href);
      nextUrl.hash = hash;
      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

      if (window.location.hash === hash) {
        window.history.replaceState(null, "", nextPath);
      } else {
        window.history.pushState(null, "", nextPath);
      }

      if (shouldReduceMotion) return;

      window.setTimeout(() => {
        delete anchor.dataset.anchorActivating;
      }, 720);
      window.setTimeout(() => {
        delete target.dataset.anchorTargetActive;
      }, 1180);
    };

    document.addEventListener("click", onAnchorClick, true);

    return () => {
      document.removeEventListener("click", onAnchorClick, true);
      anchorScrollTimers.forEach((timer) => window.clearTimeout(timer));
      delete root.dataset.anchorScrollActive;
    };
  }, [isAdminRoute, shouldReduceMotion]);

  useEffect(() => {
    if (isAdminRoute) return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    if (window.location.hash) {
      return () => {
        window.history.scrollRestoration = previousScrollRestoration;
      };
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const frame = window.requestAnimationFrame(scrollToTop);
    const timer = window.setTimeout(scrollToTop, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) return;

    let canClearHashAtTop = false;
    let frame = 0;

    const clearHashWhenBackAtTop = () => {
      frame = 0;

      if (
        !canClearHashAtTop ||
        !window.location.hash ||
        window.scrollY > 24 ||
        document.documentElement.dataset.anchorScrollActive === "true"
      ) {
        return;
      }

      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    const requestHashCleanup = () => {
      if (frame) return;

      frame = window.requestAnimationFrame(clearHashWhenBackAtTop);
    };

    const allowHashCleanupTimer = window.setTimeout(() => {
      canClearHashAtTop = true;
      requestHashCleanup();
    }, 1200);

    window.addEventListener("scroll", requestHashCleanup, { passive: true });
    window.addEventListener("hashchange", requestHashCleanup);
    window.addEventListener(anchorScrollEventName, requestHashCleanup);

    return () => {
      window.clearTimeout(allowHashCleanupTimer);
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestHashCleanup);
      window.removeEventListener("hashchange", requestHashCleanup);
      window.removeEventListener(anchorScrollEventName, requestHashCleanup);
    };
  }, [isAdminRoute, pathname]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <PublicMotionContext.Provider value={motionContextValue}>
      <div className="public-motion-shell" data-motion-state={motionState}>
        <div aria-hidden="true" className="public-motion-ambient" />
        <div className="public-motion-content">{renderedChildren}</div>
      </div>
    </PublicMotionContext.Provider>
  );
}

function normalizeHash(href: string | null) {
  if (!href || href === "#") return "";

  return href.startsWith("#") ? href : "";
}

function getElementByHash(hash: string) {
  if (!hash || hash === "#") return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
}

function dispatchAnchorScrollEvent(
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

function scrollTargetToViewportTop(
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

    const offset = target.getBoundingClientRect().top;
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
  return Math.max(0, target.getBoundingClientRect().top + window.scrollY);
}
