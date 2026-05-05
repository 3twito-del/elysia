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
import { usePublicMotion } from "~/components/public-motion-provider";

type RevealSectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
} & Omit<ComponentProps<"section">, "children" | "className" | "ref" | "style">;

type RevealGridProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
} & Omit<ComponentProps<"div">, "children" | "className" | "ref">;

function useInViewOnce<T extends HTMLElement>(initialVisible = false) {
  const ref = useRef<T>(null);
  const [hasForcedVisible, setHasForcedVisible] = useState(initialVisible);
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    if (!initialVisible || hasForcedVisible) return;

    const visibleFrame = window.requestAnimationFrame(() =>
      setHasForcedVisible(true),
    );

    return () => window.cancelAnimationFrame(visibleFrame);
  }, [hasForcedVisible, initialVisible]);

  useEffect(() => {
    const node = ref.current;

    if (!node || hasForcedVisible) return;

    if (!("IntersectionObserver" in window)) {
      const timeout = setTimeout(() => setIsVisible(true), 0);

      return () => clearTimeout(timeout);
    }

    const visibleFrame = window.requestAnimationFrame(() => {
      if (isElementNearViewport(node)) {
        setIsVisible(true);
      }
    });
    const fallbackTimeout = window.setTimeout(() => setIsVisible(true), 360);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "-80px", threshold: 0 },
    );

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(visibleFrame);
      window.clearTimeout(fallbackTimeout);
      observer.disconnect();
    };
  }, [hasForcedVisible]);

  return [ref, hasForcedVisible || isVisible] as const;
}

function isElementNearViewport(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.bottom >= -80 &&
    rect.right >= -80 &&
    rect.top <= viewportHeight + 80 &&
    rect.left <= viewportWidth + 80
  );
}

export function RevealSection({
  children,
  className,
  delay = 0,
  ...props
}: RevealSectionProps) {
  const { suppressInitialReveal } = usePublicMotion();
  const [ref, isVisible] = useInViewOnce<HTMLElement>(suppressInitialReveal);
  const style = { "--reveal-delay": `${delay}s` } as CSSProperties;

  return (
    <section
      className={cn("motion-reveal", className)}
      data-reveal-visible={isVisible}
      {...props}
      ref={ref}
      style={style}
    >
      {children}
    </section>
  );
}

export function RevealGrid({
  children,
  className,
  stagger = 0.07,
  ...props
}: RevealGridProps) {
  const { suppressInitialReveal } = usePublicMotion();
  const [ref, isVisible] = useInViewOnce<HTMLDivElement>(suppressInitialReveal);
  const items = Children.toArray(children);

  return (
    <div
      className={cn("motion-reveal-grid", className)}
      data-reveal-visible={isVisible}
      {...props}
      ref={ref}
    >
      {items.map((child, index) => {
        const style = {
          "--reveal-delay": `${0.04 + index * stagger}s`,
        } as CSSProperties;

        return (
          <div
            className="motion-reveal-item h-full [&>*]:h-full"
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
