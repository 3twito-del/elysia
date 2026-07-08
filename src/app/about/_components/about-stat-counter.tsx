"use client";

import { useEffect, useRef, useState } from "react";

type AboutStatCounterProps = {
  /** Final displayed value, e.g. "925". Its leading integer is counted up. */
  value: string;
  /** Count-up duration in milliseconds. */
  durationMs?: number;
};

/** ease-out cubic — fast start, gentle settle. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function motionIsReduced() {
  // Only ever called from inside an effect (client), so window/document always
  // exist — no SSR guard needed, keeping this hydration-safe.
  return (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.dataset.accessibilityMotion === "reduce"
  );
}

/**
 * Counts a stat value up from zero the first time it scrolls into view. Renders
 * the final value on the server and when motion is reduced, so no-JS and
 * reduced-motion visitors always see the real number with no layout shift.
 */
export function AboutStatCounter({
  value,
  durationMs = 1400,
}: AboutStatCounterProps) {
  const parsed = /^(\D*)(\d[\d,]*)(.*)$/.exec(value);
  const prefix = parsed?.[1] ?? "";
  const suffix = parsed?.[3] ?? "";
  const target = Number((parsed?.[2] ?? "").replace(/,/g, ""));

  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!Number.isFinite(target) || target <= 0 || motionIsReduced()) return;

    const node = ref.current;
    if (!node) return;

    // Prime to zero before the band is reached (it sits below the fold), so the
    // first thing the visitor sees when scrolling to it is the count-up.
    setDisplay(`${prefix}0${suffix}`);

    const run = () => {
      if (started.current) return;
      started.current = true;
      const startedAt = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startedAt) / durationMs);
        const current = Math.round(easeOut(t) * target);
        setDisplay(`${prefix}${current.toLocaleString("en-US")}${suffix}`);
        if (t < 1) requestAnimationFrame(tick);
        else setDisplay(value); // exact final value, original formatting
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target, prefix, suffix, value, durationMs]);

  return (
    <span data-testid="about-stat-counter" ref={ref}>
      {display}
    </span>
  );
}
