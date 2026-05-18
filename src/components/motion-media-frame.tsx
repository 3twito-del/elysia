"use client";

import { motion, useMotionValue } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { cn } from "~/lib/utils";

type MotionMediaFrameProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  hover?: boolean;
  intensity?: "cinematic" | "hero" | "feature" | "subtle";
  motionScope?: "home-hero" | "public";
  parallax?: boolean;
};

const parallaxDistanceByIntensity = {
  cinematic: 38,
  feature: 10,
  hero: 16,
  subtle: 5,
} satisfies Record<NonNullable<MotionMediaFrameProps["intensity"]>, number>;

const parallaxScaleByIntensity = {
  cinematic: 1.1,
  feature: 1.012,
  hero: 1.018,
  subtle: 1.006,
} satisfies Record<NonNullable<MotionMediaFrameProps["intensity"]>, number>;

export function MotionMediaFrame({
  children,
  className,
  contentClassName,
  hover = false,
  intensity = "feature",
  motionScope = "public",
  parallax = false,
}: MotionMediaFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useResolvedReducedMotion();
  const allowsEnhancedMotion = motionScope === "home-hero";
  const effectiveParallax = parallax && allowsEnhancedMotion;
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const hasPositioningClass = /\b(?:absolute|fixed|relative|sticky)\b/.test(
    className ?? "",
  );

  useEffect(() => {
    if (!effectiveParallax || shouldReduceMotion) {
      y.set(0);
      scale.set(1);
      return;
    }

    const node = frameRef.current;
    if (!node) return;

    let frame = 0;
    let isListening = false;
    const distance = parallaxDistanceByIntensity[intensity];
    const initialScale = parallaxScaleByIntensity[intensity];

    const syncParallax = () => {
      frame = 0;

      const rect = node.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const progress = clamp(
        (viewportHeight - rect.top) / (viewportHeight + rect.height),
        0,
        1,
      );

      y.set((progress - 0.5) * distance);
      scale.set(initialScale - progress * (initialScale - 1));
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncParallax);
    };

    const startTracking = () => {
      if (isListening) return;

      isListening = true;
      requestSync();
      window.addEventListener("scroll", requestSync, { passive: true });
      window.addEventListener("resize", requestSync);
    };

    const stopTracking = () => {
      if (!isListening) return;

      isListening = false;
      window.cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };

    if (!("IntersectionObserver" in window)) {
      startTracking();

      return stopTracking;
    }

    const initialFrame = window.requestAnimationFrame(() => {
      if (isElementNearViewport(node, 320)) {
        startTracking();
      }
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          startTracking();
        } else {
          stopTracking();
        }
      },
      { rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      observer.disconnect();
      stopTracking();
    };
  }, [effectiveParallax, intensity, scale, shouldReduceMotion, y]);

  return (
    <motion.div
      className={cn(
        "motion-media-frame",
        !hasPositioningClass && "relative",
        className,
      )}
      data-motion-intensity={intensity}
      data-motion-media="true"
      data-motion-parallax={effectiveParallax}
      data-motion-reduced={shouldReduceMotion}
      data-motion-scope={motionScope}
      ref={frameRef}
      whileHover={
        hover && allowsEnhancedMotion && !shouldReduceMotion
          ? {
              scale:
                intensity === "cinematic"
                  ? 1.01
                  : intensity === "subtle"
                    ? 1.003
                    : 1.006,
            }
          : undefined
      }
      transition={{ duration: 0.72, ease: [0.2, 0, 0, 1] }}
    >
      <motion.div
        className={cn("motion-media-content", contentClassName)}
        style={
          effectiveParallax && !shouldReduceMotion
            ? {
                scale,
                y,
              }
            : undefined
        }
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isElementNearViewport(node: HTMLElement, margin: number) {
  const rect = node.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.bottom >= -margin &&
    rect.right >= -margin &&
    rect.top <= viewportHeight + margin &&
    rect.left <= viewportWidth + margin
  );
}
