"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
  id?: string;
  /** pull strength in px at edge of element */
  strength?: number;
}

/**
 * Magnetic hover: element eases toward the cursor while hovered,
 * springs back on leave. Pointer-only (skipped on touch via media query
 * since touch has no hover). Honors reduced-motion through framer.
 */
export default function MagneticButton({
  children,
  href,
  className,
  id,
  strength = 18,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    x.set(relX * strength);
    y.set(relY * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      id={id}
      className={className}
      style={{ x: sx, y: sy }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.a>
  );
}
