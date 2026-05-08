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
  intensity?: "hero" | "feature" | "subtle";
  parallax?: boolean;
};

const parallaxDistanceByIntensity = {
  feature: 20,
  hero: 36,
  subtle: 10,
} satisfies Record<NonNullable<MotionMediaFrameProps["intensity"]>, number>;

const parallaxScaleByIntensity = {
  feature: 1.025,
  hero: 1.045,
  subtle: 1.012,
} satisfies Record<NonNullable<MotionMediaFrameProps["intensity"]>, number>;

export function MotionMediaFrame({
  children,
  className,
  contentClassName,
  hover = false,
  intensity = "feature",
  parallax = false,
}: MotionMediaFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useResolvedReducedMotion();
  const y = useMotionValue(0);
  const scale = useMotionValue(1);

  useEffect(() => {
    if (!parallax || shouldReduceMotion) {
      y.set(0);
      scale.set(1);
      return;
    }

    const node = frameRef.current;
    if (!node) return;

    let frame = 0;
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

    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", requestSync);
    };
  }, [intensity, parallax, scale, shouldReduceMotion, y]);

  return (
    <motion.div
      className={cn("motion-media-frame", className)}
      data-motion-intensity={intensity}
      data-motion-media="true"
      data-motion-reduced={shouldReduceMotion}
      ref={frameRef}
      whileHover={
        hover && !shouldReduceMotion
          ? { scale: intensity === "subtle" ? 1.006 : 1.01 }
          : undefined
      }
    >
      <motion.div
        className={cn("motion-media-content", contentClassName)}
        style={
          parallax && !shouldReduceMotion
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
