"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type PublicMotionProviderProps = {
  children: ReactNode;
};

type MotionState = "visible" | "enter" | "exit";

const pageTransitionMs = 440;

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    const syncFrame = window.requestAnimationFrame(updatePreference);

    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      window.cancelAnimationFrame(syncFrame);
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

export function PublicMotionProvider({ children }: PublicMotionProviderProps) {
  const pathname = usePathname();
  const shouldReduceMotion = usePrefersReducedMotion();
  const isAdminRoute = pathname.startsWith("/admin");
  const pendingChildren = useRef(children);
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  const [renderedChildren, setRenderedChildren] = useState(children);
  const [motionState, setMotionState] = useState<MotionState>("visible");

  useEffect(() => {
    pendingChildren.current = children;
  }, [children]);

  useEffect(() => {
    if (pathname === renderedPathname) {
      const updateFrame = window.requestAnimationFrame(() =>
        setRenderedChildren(children),
      );

      return () => window.cancelAnimationFrame(updateFrame);
    }

    if (shouldReduceMotion) {
      const updateFrame = window.requestAnimationFrame(() => {
        setRenderedPathname(pathname);
        setRenderedChildren(children);
        setMotionState("visible");
      });

      return () => window.cancelAnimationFrame(updateFrame);
    }

    const exitFrame = window.requestAnimationFrame(() =>
      setMotionState("exit"),
    );

    const swapTimer = window.setTimeout(() => {
      setRenderedPathname(pathname);
      setRenderedChildren(pendingChildren.current);
      setMotionState("enter");

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setMotionState("visible"));
      });
    }, pageTransitionMs);

    return () => {
      window.cancelAnimationFrame(exitFrame);
      window.clearTimeout(swapTimer);
    };
  }, [children, pathname, renderedPathname, shouldReduceMotion]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <div className="public-motion-shell" data-motion-state={motionState}>
      <div aria-hidden="true" className="public-motion-ambient" />
      <div className="public-motion-content">{renderedChildren}</div>
    </div>
  );
}
