"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

import { useResolvedReducedMotion } from "~/components/motion-preference";

const SPARKLE_COUNT = 24;

/** Small, deterministic PRNG so the light dust is stable across renders/SSR. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Sparkle = {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
};

/**
 * Drives the cinematic "living prism" light on the about hero. A rAF loop
 * tracks the pointer (or device tilt) and eases a warm light source across the
 * hero, splitting into faint spectral dispersion — as if light were catching a
 * faceted gem. When the pointer is idle it falls back to a slow Lissajous
 * drift so the hero never sits still. All visuals are CSS, fed by a handful of
 * custom properties set on the hero element. Honors reduced-motion.
 */
export function AboutHeroAurora() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useResolvedReducedMotion();

  const sparkles = useMemo<Sparkle[]>(() => {
    const random = mulberry32(0x9e3779b9);

    return Array.from({ length: SPARKLE_COUNT }, () => ({
      left: random() * 100,
      top: random() * 100,
      size: 1.5 + random() * 3.5,
      delay: random() * 6,
      duration: 4.5 + random() * 5,
      drift: -16 - random() * 28,
    }));
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    const hero = node?.closest<HTMLElement>(".about-cinematic-hero");

    if (!node || !hero) return;

    if (reduceMotion) {
      hero.style.setProperty("--aurora-x", "62");
      hero.style.setProperty("--aurora-y", "40");
      hero.style.setProperty("--aurora-energy", "0");
      hero.style.setProperty("--aurora-shift-x", "0");
      hero.style.setProperty("--aurora-shift-y", "0");

      return;
    }

    let frame = 0;
    let running = false;
    let visible = true;

    let currentX = 62;
    let currentY = 40;
    let targetX = 62;
    let targetY = 40;
    let energy = 0;
    let targetEnergy = 0;
    let lastPointerAt = 0;
    let driftStart = performance.now();

    const applyVars = () => {
      hero.style.setProperty("--aurora-x", currentX.toFixed(2));
      hero.style.setProperty("--aurora-y", currentY.toFixed(2));
      hero.style.setProperty("--aurora-energy", energy.toFixed(3));
      hero.style.setProperty(
        "--aurora-shift-x",
        ((currentX - 50) / 50).toFixed(3),
      );
      hero.style.setProperty(
        "--aurora-shift-y",
        ((currentY - 50) / 50).toFixed(3),
      );
    };

    const tick = (now: number) => {
      const isIdle = now - lastPointerAt > 1400;

      if (isIdle) {
        const t = (now - driftStart) / 1000;
        targetX = 50 + Math.sin(t * 0.31) * 30 + Math.sin(t * 0.12) * 8;
        targetY = 42 + Math.cos(t * 0.25) * 17 + Math.sin(t * 0.18) * 6;
        targetEnergy = 0.34;
      }

      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      energy += (targetEnergy - energy) * 0.05;

      applyVars();
      frame = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (running || !visible) return;

      running = true;
      driftStart = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) return;

      targetX = Math.max(
        0,
        Math.min(100, ((event.clientX - rect.left) / rect.width) * 100),
      );
      targetY = Math.max(
        0,
        Math.min(100, ((event.clientY - rect.top) / rect.height) * 100),
      );
      targetEnergy = 1;
      lastPointerAt = performance.now();
    };

    const onPointerLeave = () => {
      targetEnergy = 0.34;
      lastPointerAt = 0;
    };

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma == null || event.beta == null) return;

      targetX = Math.max(0, Math.min(100, 50 + event.gamma * 1.6));
      targetY = Math.max(0, Math.min(100, 40 + (event.beta - 45) * 1.1));
      targetEnergy = 0.85;
      lastPointerAt = performance.now();
    };

    hero.addEventListener("pointermove", onPointerMove, { passive: true });
    hero.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("deviceorientation", onDeviceOrientation, {
      passive: true,
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;

        if (visible) startLoop();
        else stopLoop();
      },
      { threshold: 0 },
    );

    observer.observe(hero);

    const onVisibilityChange = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    startLoop();

    return () => {
      stopLoop();
      observer.disconnect();
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("deviceorientation", onDeviceOrientation);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reduceMotion]);

  return (
    <div aria-hidden="true" className="about-aurora" ref={rootRef}>
      <div className="about-aurora-spotlight" />
      <div className="about-aurora-prism" />
      <div className="about-aurora-sheen" />
      <div className="about-aurora-bloom" />
      <div className="about-aurora-sparkles">
        {sparkles.map((sparkle, index) => (
          <span
            className="about-aurora-spark"
            key={index}
            style={
              {
                left: `${sparkle.left}%`,
                top: `${sparkle.top}%`,
                "--spark-size": `${sparkle.size}px`,
                "--spark-delay": `${sparkle.delay}s`,
                "--spark-duration": `${sparkle.duration}s`,
                "--spark-drift": `${sparkle.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
