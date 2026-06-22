"use client";

import { useEffect, useRef, useState } from "react";

import { useResolvedReducedMotion } from "~/components/motion-preference";
import { cn } from "~/lib/utils";

const finePointerQuery = "(hover: hover) and (pointer: fine)";

type HomeHeroAuraProps = {
  className?: string;
};

// Deterministic placement so the floating motes render identically on the
// server and the client (no Math.random hydration mismatch).
const heroAuraMotes = [
  { delay: 0, drift: -18, duration: 13, left: 12, size: 5, top: 68 },
  { delay: 2.4, drift: 14, duration: 16, left: 26, size: 3, top: 38 },
  { delay: 1.1, drift: -10, duration: 14, left: 41, size: 6, top: 78 },
  { delay: 3.6, drift: 22, duration: 18, left: 58, size: 4, top: 30 },
  { delay: 0.7, drift: -16, duration: 15, left: 71, size: 5, top: 60 },
  { delay: 2.9, drift: 12, duration: 19, left: 84, size: 3, top: 44 },
  { delay: 1.8, drift: -22, duration: 12, left: 92, size: 4, top: 72 },
  { delay: 4.2, drift: 18, duration: 17, left: 49, size: 3, top: 52 },
] as const;

const heroAuraIdleOrigin = { x: 68, y: 38 } as const;
const heroAuraCssProperties = {
  x: { value: "--hero-aura-x" },
  y: { value: "--hero-aura-y" },
} as const;
const heroAuraPercentUnit = { value: "%" } as const;
const heroAuraEvents = {
  pointerleave: { value: "pointerleave" },
  pointermove: { value: "pointermove" },
} as const;

export function HomeHeroAura({ className }: HomeHeroAuraProps) {
  const auraRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const shouldReduceMotion = useResolvedReducedMotion();
  const [isFinePointer, setIsFinePointer] = useState(false);

  // The aura is a pointer-driven flourish; on touch / coarse-pointer devices it
  // only adds GPU load, so we disable its motion entirely there.
  useEffect(() => {
    const mediaQuery = window.matchMedia(finePointerQuery);
    const updatePointer = () => setIsFinePointer(mediaQuery.matches);

    updatePointer();
    mediaQuery.addEventListener("change", updatePointer);

    return () => mediaQuery.removeEventListener("change", updatePointer);
  }, []);

  const enableMotion = isFinePointer && !shouldReduceMotion;

  useEffect(() => {
    const aura = auraRef.current;
    if (!aura || !enableMotion) return;
    if (typeof Element.prototype.animate !== "function") return;

    const animations: Animation[] = [];

    for (const mote of aura.querySelectorAll<HTMLElement>(
      ".home-hero-aura-mote",
    )) {
      const drift = mote.style.getPropertyValue("--mote-drift") || "16px";
      const duration =
        Number.parseFloat(mote.style.getPropertyValue("--mote-duration")) ||
        14;
      const delay =
        Number.parseFloat(mote.style.getPropertyValue("--mote-delay")) || 0;

      animations.push(
        mote.animate(
          [
            { opacity: 0, transform: "translate3d(0, 12px, 0)" },
            { opacity: 0.85, offset: 0.2 },
            { opacity: 0.7, offset: 0.8 },
            { opacity: 0, transform: `translate3d(${drift}, -56px, 0)` },
          ],
          {
            delay: delay * 1000,
            duration: duration * 1000,
            easing: "ease-in-out",
            iterations: Number.POSITIVE_INFINITY,
          },
        ),
      );
    }

    return () => {
      for (const animation of animations) animation.cancel();
    };
  }, [enableMotion]);

  useEffect(() => {
    const aura = auraRef.current;
    if (!aura || !enableMotion) return;

    const hero = aura.parentElement;
    if (!hero) return;

    const setOrigin = (xPercent: number, yPercent: number) => {
      aura.style.setProperty(
        heroAuraCssProperties.x.value,
        String(xPercent).concat(heroAuraPercentUnit.value),
      );
      aura.style.setProperty(
        heroAuraCssProperties.y.value,
        String(yPercent).concat(heroAuraPercentUnit.value),
      );
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;

        const rect = hero.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((event.clientY - rect.top) / rect.height) * 100;

        if (
          xPercent < -10 ||
          xPercent > 110 ||
          yPercent < -10 ||
          yPercent > 110
        ) {
          aura.dataset.heroAuraActive = String(false);
          setOrigin(heroAuraIdleOrigin.x, heroAuraIdleOrigin.y);
          return;
        }

        aura.dataset.heroAuraActive = String(true);
        setOrigin(
          Math.min(Math.max(xPercent, 0), 100),
          Math.min(Math.max(yPercent, 0), 100),
        );
      });
    };

    const handlePointerLeave = () => {
      aura.dataset.heroAuraActive = String(false);
      setOrigin(heroAuraIdleOrigin.x, heroAuraIdleOrigin.y);
    };

    hero.addEventListener(heroAuraEvents.pointermove.value, handlePointerMove, {
      passive: true,
    });
    hero.addEventListener(heroAuraEvents.pointerleave.value, handlePointerLeave);

    return () => {
      hero.removeEventListener(
        heroAuraEvents.pointermove.value,
        handlePointerMove,
      );
      hero.removeEventListener(
        heroAuraEvents.pointerleave.value,
        handlePointerLeave,
      );
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enableMotion]);

  return (
    <div
      aria-hidden="true"
      className={cn("home-hero-aura absolute inset-0", className)}
      data-hero-aura-active="false"
      data-hero-aura-reduced={enableMotion ? "false" : "true"}
      data-testid="home-hero-aura"
      ref={auraRef}
    >
      <span className="home-hero-aura-glow" />
      <span className="home-hero-aura-motes">
        {heroAuraMotes.map((mote, index) => (
          <span
            className="home-hero-aura-mote"
            key={index}
            style={
              {
                "--mote-delay": `${mote.delay}s`,
                "--mote-drift": `${mote.drift}px`,
                "--mote-duration": `${mote.duration}s`,
                "--mote-size": `${mote.size}px`,
                left: `${mote.left}%`,
                top: `${mote.top}%`,
              } as React.CSSProperties
            }
          />
        ))}
      </span>
    </div>
  );
}
