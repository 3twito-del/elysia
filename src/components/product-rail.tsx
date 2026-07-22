"use client";

import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "~/lib/utils";

export function ProductRail({
  ariaLabel,
  children,
  className,
  equalGroup,
}: {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  equalGroup?: string;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    event.currentTarget.scrollBy({
      behavior: "smooth",
      left:
        event.key === "ArrowLeft"
          ? -event.currentTarget.clientWidth * 0.8
          : event.currentTarget.clientWidth * 0.8,
    });
  };

  return (
    <div
      aria-label={ariaLabel}
      className={cn("product-horizontal-rail minimal-scroll", className)}
      data-layout-equal-group={equalGroup}
      onKeyDown={handleKeyDown}
      role="region"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
