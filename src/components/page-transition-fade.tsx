"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Gives the main content area a brief entrance fade on route change. Keyed on
 * pathname so React remounts the wrapper (replaying the CSS animation)
 * instead of running an exit/enter transition system — no dependency on App
 * Router navigation-pending timing.
 */
export function PageTransitionFade({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page-transition-fade" key={pathname}>
      {children}
    </div>
  );
}
