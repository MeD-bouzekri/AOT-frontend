"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import HeroVisual from "./HeroVisual";

/**
 * Persistent site-wide 3D layer.
 *
 * Fixed to the right edge, behind content. FULLY VISIBLE while the user is in
 * the platform (hero) section, then fades down into a dim "shadow" as they
 * scroll past it — but never disappears.
 *
 * Blend is set in JS (not Tailwind dark: variant) to avoid the dark-mode
 * "black box" bug: `multiply` against the near-black dark bg crushes the
 * sphere to black, so dark mode uses NORMAL blend (solid sphere), and only
 * light mode uses `multiply` (soft shadow on white).
 */
export default function PersistentVisual() {
  const { scrollY } = useScroll();
  const [vh, setVh] = useState(0);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const set = () => setVh(window.innerHeight);
    set();
    window.addEventListener("resize", set);

    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.classList.contains("dark"));
    syncTheme();
    const obs = new MutationObserver(syncTheme);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      window.removeEventListener("resize", set);
      obs.disconnect();
    };
  }, []);

  // 1 (full) while in the hero, easing to a dim shadow ~1 viewport down.
  const range = vh || 800;
  const opacity = useTransform(
    scrollY,
    [0, range * 0.85],
    [1, isDark ? 0.35 : 0.3]
  );

  return (
    <motion.div
      style={{
        opacity,
        mixBlendMode: isDark ? "normal" : "multiply",
      }}
      className="fixed inset-y-0 right-0 z-[1] hidden w-1/2 items-center justify-center pointer-events-none lg:flex"
      aria-hidden="true"
    >
      <div className="w-full max-w-xl px-8">
        <HeroVisual />
      </div>
    </motion.div>
  );
}
