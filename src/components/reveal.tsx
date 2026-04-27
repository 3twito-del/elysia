"use client";

import { Children, isValidElement, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react";

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

const revealTransition: Transition = {
  duration: 0.62,
  ease: [0.22, 1, 0.36, 1],
};

function getRevealVariants(shouldReduceMotion: boolean): Variants {
  return {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 18, filter: "blur(8px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  };
}

export function RevealSection({
  children,
  className,
  delay = 0,
}: RevealSectionProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.section
      className={cn("motion-reveal", className)}
      initial="hidden"
      transition={{ ...revealTransition, delay }}
      variants={getRevealVariants(shouldReduceMotion)}
      viewport={{ once: true, margin: "-80px" }}
      whileInView="visible"
    >
      {children}
    </motion.section>
  );
}

export function RevealGrid({
  children,
  className,
  stagger = 0.07,
}: RevealGridProps) {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const items = Children.toArray(children);

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: shouldReduceMotion ? 0 : 0.04,
        staggerChildren: shouldReduceMotion ? 0 : stagger,
      },
    },
  };

  return (
    <motion.div
      className={cn("motion-reveal-grid", className)}
      initial="hidden"
      variants={containerVariants}
      viewport={{ once: true, margin: "-80px" }}
      whileInView="visible"
    >
      {items.map((child, index) => (
        <motion.div
          className="motion-reveal-item h-full [&>*]:h-full"
          key={isValidElement(child) && child.key != null ? child.key : index}
          transition={revealTransition}
          variants={getRevealVariants(shouldReduceMotion)}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
