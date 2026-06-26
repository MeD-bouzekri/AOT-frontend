"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** entrance offset direction */
  direction?: Direction;
  /** seconds before this element starts */
  delay?: number;
  /** stagger children that are themselves <Reveal> or motion items */
  stagger?: boolean;
  /** how much must be in view before firing (0-1) */
  amount?: number;
}

const offset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 40 },
  down: { x: 0, y: -40 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * Scroll-reveal wrapper. Fades + slides children in once when they enter
 * the viewport. Respects prefers-reduced-motion via framer's reducedMotion.
 */
export default function Reveal({
  children,
  className,
  direction = "up",
  delay = 0,
  stagger = false,
  amount = 0.25,
}: RevealProps) {
  const o = offset[direction];

  const variants: Variants = {
    hidden: { opacity: 0, x: o.x, y: o.y },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1],
        delay,
        ...(stagger ? { staggerChildren: 0.12, delayChildren: delay } : {}),
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
}

/** Child item for use inside a stagger <Reveal stagger>. */
export const RevealItem = motion.div;
export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};
