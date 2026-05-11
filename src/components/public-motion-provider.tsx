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

      const hash = anchor.hash;
      const target = getElementByHash(hash);
      if (!target) return;

      if (shouldReduceMotion) return;

      event.preventDefault();

      anchor.dataset.anchorActivating = "true";
      target.dataset.anchorTargetActive = "true";

      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.pushState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${hash}`,
      );

      window.setTimeout(() => {
        delete anchor.dataset.anchorActivating;
      }, 720);
      window.setTimeout(() => {
        delete target.dataset.anchorTargetActive;
      }, 1180);
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
    };
  }, [isAdminRoute, shouldReduceMotion]);

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

function getElementByHash(hash: string) {
  if (!hash || hash === "#") return null;

  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return document.getElementById(hash.slice(1));
  }
}
