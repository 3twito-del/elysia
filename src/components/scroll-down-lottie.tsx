"use client";

import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";

import scrollDownAnimation from "~/assets/scroll-down.json";
import { cn } from "~/lib/utils";

type ScrollDownLottieProps = {
  className?: string;
};

export function ScrollDownLottie({ className }: ScrollDownLottieProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let animation: AnimationItem | null = null;

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.accessibilityMotion === "reduce";

    animation = lottie.loadAnimation({
      animationData: scrollDownAnimation,
      autoplay: !prefersReducedMotion,
      container: containerRef.current,
      loop: !prefersReducedMotion,
      renderer: "svg",
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });

    if (prefersReducedMotion) {
      animation.goToAndStop(30, true);
    }

    return () => {
      animation?.destroy();
    };
  }, []);

  return (
    <span
      aria-hidden="true"
      className={cn("home-quick-search-lottie", className)}
      ref={containerRef}
    />
  );
}
