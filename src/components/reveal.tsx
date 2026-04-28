"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "~/lib/utils";

type RevealSectionProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

type RevealGridProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

function useInViewOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      const timeout = setTimeout(() => setIsVisible(true), 0);

      return () => clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin: "-80px", threshold: 0 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible] as const;
}

export function RevealSection({
  children,
  className,
  delay = 0,
}: RevealSectionProps) {
  const [ref, isVisible] = useInViewOnce<HTMLElement>();
  const style = { "--reveal-delay": `${delay}s` } as CSSProperties;

  return (
    <section
      className={cn("motion-reveal", className)}
      data-reveal-visible={isVisible}
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
}: RevealGridProps) {
  const [ref, isVisible] = useInViewOnce<HTMLDivElement>();
  const items = Children.toArray(children);

  return (
    <div
      className={cn("motion-reveal-grid", className)}
      data-reveal-visible={isVisible}
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
