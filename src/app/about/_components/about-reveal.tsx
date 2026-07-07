import { type CSSProperties, type ElementType, type ReactNode } from "react";

import { cn } from "~/lib/utils";

type AboutRevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Delay step applied to staggered children via the --rv-i custom prop. */
  delay?: number;
} & Record<string, unknown>;

/**
 * About-page section wrapper. Content renders immediately (`data-inview="true"`).
 * The earlier scroll-reveal animation was removed in the design-restraint pass:
 * it read as an effect and could strand content invisible on fast scroll. The
 * `.about-rv*` CSS keys off `data-inview`, so a static "true" simply shows the
 * content with no motion.
 */
export function AboutReveal({
  as,
  children,
  className,
  delay = 0,
  ...rest
}: AboutRevealProps) {
  const Tag = as ?? "div";

  return (
    <Tag
      className={cn("about-rv", className)}
      data-inview="true"
      style={{ "--rv-delay": `${delay}s` } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
