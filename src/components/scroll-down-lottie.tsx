"use client";

import { useEffect, useRef } from "react";

import scrollDownAnimation from "~/assets/scroll-down.json";
import { cn } from "~/lib/utils";

type ScrollDownLottieProps = {
  className?: string;
};

export function ScrollDownLottie({ className }: ScrollDownLottieProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    let animation: LottieAnimationHandle | null = null;
    let isCancelled = false;

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.accessibilityMotion === "reduce";

    void import("lottie-web").then(({ default: lottie }) => {
      if (isCancelled || !container.isConnected) return;

      animation = lottie.loadAnimation({
        animationData: scrollDownAnimation,
        autoplay: !prefersReducedMotion,
        container,
        loop: !prefersReducedMotion,
        renderer: "svg",
        rendererSettings: {
          preserveAspectRatio: "xMidYMid meet",
        },
      });

      if (prefersReducedMotion) {
        animation.goToAndStop(30, true);
      }
    });

    return () => {
      isCancelled = true;
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

type LottieAnimationHandle = {
  destroy: () => void;
  goToAndStop: (value: number, isFrame?: boolean) => void;
};
