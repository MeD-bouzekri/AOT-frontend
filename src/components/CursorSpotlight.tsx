"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Soft radial light that trails the cursor across the whole viewport,
 * blended over the aurora for a reactive, "alive" background.
 * Fixed + pointer-events-none so it never blocks UI. Hidden on touch
 * (no real cursor) and on reduced-motion.
 */
export default function CursorSpotlight() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const sx = useSpring(x, { stiffness: 120, damping: 25, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 120, damping: 25, mass: 0.6 });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduced || !fine) return;
    setEnabled(true);

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[1] mix-blend-screen"
      style={{
        x: sx,
        y: sy,
        // center the gradient on the motion values
        translateX: "-50%",
        translateY: "-50%",
        width: 700,
        height: 700,
        left: 0,
        top: 0,
        background:
          "radial-gradient(circle, rgba(58,157,143,0.16) 0%, rgba(201,122,78,0.07) 35%, transparent 65%)",
        filter: "blur(10px)",
      }}
    />
  );
}
