"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "~/lib/utils";
import { useResolvedReducedMotion } from "~/components/motion-preference";
import { usePublicMotion } from "~/components/public-motion-provider";

type RevealSectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  floatingAvoid?: boolean;
  initialVisible?: boolean;
  variant?: "standard" | "hero" | "feature" | "subtle" | "none";
} & Omit<ComponentProps<"section">, "children" | "className" | "ref">;

type RevealGridProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  variant?: "cards" | "media" | "compact";
} & Omit<ComponentProps<"div">, "children" | "className" | "ref">;

const gridStaggerByVariant = {
  cards: 0.045,
  compact: 0.03,
  media: 0.055,
} satisfies Record<NonNullable<RevealGridProps["variant"]>, number>;

function useRevealInView<T extends HTMLElement>(initialVisible = true) {
  const ref = useRef<T>(null);
  const shouldReduceMotion = useResolvedReducedMotion();
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    if (!initialVisible && !shouldReduceMotion) return;

    const visibleFrame = window.requestAnimationFrame(() => setIsVisible(true));

    return () => window.cancelAnimationFrame(visibleFrame);
  }, [initialVisible, shouldReduceMotion]);

  useEffect(() => {
    const node = ref.current;

    if (!node || isVisible || shouldReduceMotion) return;

    if (!("IntersectionObserver" in window)) {
      const timeout = setTimeout(() => setIsVisible(true), 0);

      return () => clearTimeout(timeout);
    }

    const visibleFrame = window.requestAnimationFrame(() => {
      if (isElementNearViewport(node, 48)) {
        setIsVisible(true);
      }
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(visibleFrame);
      observer.disconnect();
    };
  }, [isVisible, shouldReduceMotion]);

  return [ref, isVisible || shouldReduceMotion] as const;
}

function isElementNearViewport(node: HTMLElement, margin = 0) {
  const rect = node.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.bottom >= -margin &&
    rect.right >= -margin &&
    rect.top <= viewportHeight - margin &&
    rect.left <= viewportWidth + margin
  );
}

export function RevealSection({
  children,
  className,
  delay = 0,
  floatingAvoid = true,
  initialVisible = true,
  style,
  variant = "standard",
  ...props
}: RevealSectionProps) {
  const { suppressInitialReveal } = usePublicMotion();
  const [ref, isVisible] = useRevealInView<HTMLElement>(
    initialVisible || suppressInitialReveal || variant === "none",
  );
  const revealStyle = {
    ...style,
    "--reveal-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <section
      className={cn("elysia-section motion-reveal", className)}
      data-public-floating-avoid={floatingAvoid ? "true" : undefined}
      data-reveal-variant={variant}
      data-reveal-visible={isVisible}
      {...props}
      ref={ref}
      style={revealStyle}
    >
      {children}
    </section>
  );
}

export function RevealGrid({
  children,
  className,
  stagger,
  variant = "cards",
  ...props
}: RevealGridProps) {
  const [ref, isVisible] = useRevealInView<HTMLDivElement>(true);
  const items = Children.toArray(children);
  const resolvedStagger = stagger ?? gridStaggerByVariant[variant];

  return (
    <div
      className={cn("motion-reveal-grid", className)}
      data-reveal-variant={variant}
      data-reveal-visible={isVisible}
      {...props}
      ref={ref}
    >
      {items.map((child, index) => {
        const style = {
          "--reveal-delay": `${0.02 + index * resolvedStagger}s`,
        } as CSSProperties;

        return (
          <div
            className="motion-reveal-item h-full [&>*]:h-full"
            data-reveal-variant={variant}
            data-reveal-visible={isVisible}
            key={isValidElement(child) && child.key != null ? child.key : index}
            style={style}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
