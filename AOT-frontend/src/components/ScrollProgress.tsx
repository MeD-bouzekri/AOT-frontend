"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gradient bar pinned to the top, tracks full-page scroll progress. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className="scroll-progress fixed top-0 left-0 right-0 h-[2px] origin-left z-[60] pointer-events-none"
      aria-hidden="true"
    />
  );
}
