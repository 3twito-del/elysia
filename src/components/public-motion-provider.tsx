"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";

type PublicMotionProviderProps = {
  children: ReactNode;
};

const pageTransition: Transition = {
  duration: 0.44,
  ease: [0.22, 1, 0.36, 1],
};

export function PublicMotionProvider({ children }: PublicMotionProviderProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  const initial = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 10, filter: "blur(5px)" };
  const animate = { opacity: 1, y: 0, filter: "blur(0px)" };
  const exit = shouldReduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -6, filter: "blur(4px)" };

  return (
    <MotionConfig reducedMotion="user" transition={pageTransition}>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={animate}
          className="public-motion-shell"
          exit={exit}
          initial={initial}
          key={pathname}
          transition={pageTransition}
        >
          <div aria-hidden="true" className="public-motion-ambient" />
          <div className="public-motion-content">{children}</div>
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
