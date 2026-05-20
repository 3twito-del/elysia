"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { cn } from "~/lib/utils";

type KineticImageMotionProps = {
  children: ReactNode;
  className?: string;
  intensity?: "card" | "hero" | "panel";
  motionScope?: "home-hero" | "static";
  pointerMotion?: boolean;
  scrollMotion?: boolean;
};

const motionConfig = {
  card: {
    depth: 8,
    scale: 1.018,
    scrollDepth: 0,
  },
  hero: {
    depth: 18,
    scale: 1.026,
    scrollDepth: 0,
  },
  panel: {
    depth: 12,
    scale: 1.02,
    scrollDepth: 0,
  },
} satisfies Record<
  NonNullable<KineticImageMotionProps["intensity"]>,
  {
    depth: number;
    scale: number;
    scrollDepth: number;
  }
>;

export function KineticImageMotion({
  children,
  className,
  intensity = "panel",
  motionScope = "static",
  pointerMotion,
  scrollMotion = true,
}: KineticImageMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useResolvedReducedMotion();
  const allowsEnhancedMotion = motionScope === "home-hero";

  useEffect(() => {
    let disposeAnimation: (() => void) | null = null;
    let isCancelled = false;
    const root = rootRef.current;
    const layer = root?.querySelector<HTMLElement>(".kinetic-image-layer");

    if (!root || !layer || !allowsEnhancedMotion || shouldReduceMotion) return;

    void import("animejs").then(({ animate }) => {
      if (isCancelled || !root.isConnected) return;

      const config = motionConfig[intensity];
      const shouldUsePointerMotion = pointerMotion ?? intensity !== "hero";
      const scrollDepth = scrollMotion ? config.scrollDepth : 0;
      let pointerInside = false;
      let scrollFrame = 0;
      let layerAnimation: AnimationHandle | null = null;

      if (!shouldUsePointerMotion && !scrollDepth) return;

      const animateLayer = (
        x: number,
        y: number,
        scale: number,
        rotate: number,
        duration = 760,
      ) => {
        layerAnimation?.revert();
        layerAnimation = animate(layer, {
          translateX: x,
          translateY: y,
          scale,
          rotate,
          duration,
          ease: "out(3)",
        });
      };

      const onPointerMove = (event: PointerEvent) => {
        pointerInside = true;
        const rect = root.getBoundingClientRect();
        const xProgress = (event.clientX - rect.left) / rect.width - 0.5;
        const yProgress = (event.clientY - rect.top) / rect.height - 0.5;

        animateLayer(
          xProgress * config.depth,
          yProgress * config.depth,
          config.scale,
          xProgress * 0.42,
        );
      };

      const onPointerEnter = () => {
        pointerInside = true;
      };

      const onPointerLeave = () => {
        pointerInside = false;
        animateLayer(0, 0, 1, 0, 880);
      };

      const syncScroll = () => {
        scrollFrame = 0;

        if ((shouldUsePointerMotion && pointerInside) || !scrollDepth) return;

        const rect = root.getBoundingClientRect();
        const viewportHeight =
          window.innerHeight || document.documentElement.clientHeight;
        const progress = clamp(
          (viewportHeight - rect.top) / (viewportHeight + rect.height),
          0,
          1,
        );

        animateLayer(0, (progress - 0.5) * scrollDepth, 1.01, 0, 920);
      };

      const requestScrollSync = () => {
        if (!scrollDepth || scrollFrame) return;
        scrollFrame = window.requestAnimationFrame(syncScroll);
      };

      if (shouldUsePointerMotion) {
        root.addEventListener("pointerenter", onPointerEnter);
        root.addEventListener("pointermove", onPointerMove);
        root.addEventListener("pointerleave", onPointerLeave);
      }

      if (scrollDepth) {
        requestScrollSync();
        window.addEventListener("scroll", requestScrollSync, {
          passive: true,
        });
        window.addEventListener("resize", requestScrollSync);
      }

      disposeAnimation = () => {
        if (shouldUsePointerMotion) {
          root.removeEventListener("pointerenter", onPointerEnter);
          root.removeEventListener("pointermove", onPointerMove);
          root.removeEventListener("pointerleave", onPointerLeave);
        }
        window.removeEventListener("scroll", requestScrollSync);
        window.removeEventListener("resize", requestScrollSync);
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
        layerAnimation?.revert();
      };
    });

    return () => {
      isCancelled = true;
      disposeAnimation?.();
    };
  }, [
    allowsEnhancedMotion,
    intensity,
    pointerMotion,
    scrollMotion,
    shouldReduceMotion,
  ]);

  return (
    <div
      className={cn("kinetic-image-motion", className)}
      data-kinetic-image
      data-motion-enabled={allowsEnhancedMotion && !shouldReduceMotion}
      data-motion-reduced={shouldReduceMotion}
      data-motion-scope={motionScope}
      data-motion-source={allowsEnhancedMotion ? "animejs" : undefined}
      ref={rootRef}
    >
      <div className="kinetic-image-layer">{children}</div>
    </div>
  );
}

type AnimationHandle = {
  revert: () => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
