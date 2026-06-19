"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

import { cn } from "~/lib/utils";
import { useResolvedReducedMotion } from "~/components/motion-preference";

type AboutRevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Delay step applied to staggered children via the --rv-i custom prop. */
  delay?: number;
} & Record<string, unknown>;

/**
 * Scroll-reveal wrapper scoped to the About page. Sets `data-inview` once the
 * element enters the viewport; all motion lives in CSS (`.about-rv*`) so it can
 * be neutralised for reduced-motion users. Unlike the global `motion-reveal`
 * system, these classes are not suppressed on `.about-cinematic-page`.
 */
export function AboutReveal({
  as,
  children,
  className,
  delay = 0,
  ...rest
}: AboutRevealProps) {
  const Tag = as ?? "div";
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useResolvedReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const inView = revealed || reduceMotion;

  useEffect(() => {
    if (reduceMotion || revealed) return;

    const node = ref.current;

    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setRevealed(true));

      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        setRevealed(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [reduceMotion, revealed]);

  return (
    <Tag
      className={cn("about-rv", className)}
      data-inview={inView ? "true" : "false"}
      ref={ref}
      style={{ "--rv-delay": `${delay}s` } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Subtle “scroll” affordance pinned to the bottom of the hero. */
export function AboutScrollCue() {
  return (
    <a
      aria-label="גללי למטה כדי להמשיך"
      className="about-scroll-cue"
      data-testid="about-scroll-cue"
      href="#about-manifesto"
    >
      <span className="about-scroll-cue-label">גללי</span>
      <span aria-hidden="true" className="about-scroll-cue-track">
        <span className="about-scroll-cue-dot" />
      </span>
    </a>
  );
}
