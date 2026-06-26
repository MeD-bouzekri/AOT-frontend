"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Disable scrolling while loading
    document.body.style.overflow = "hidden";

    // Simulate progress load ticks
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = Math.floor(Math.random() * 15) + 8;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        document.body.style.overflow = "unset";
        onComplete();
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  const done = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 1, scale: 1 }}
      // zoom-OUT reveal: overlay scales up + fades, exposing the landing
      // beneath while the navbar logo flies to the top-left corner.
      exit={{ opacity: 0, scale: 1.15 }}
      transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
      style={{ transformOrigin: "center" }}
      className="fixed inset-0 z-40 bg-slate-950 flex flex-col items-center justify-center select-none"
    >
      {/* Decorative background glow */}
      <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-teal/10 blur-[100px] pointer-events-none" />

      {/* progress UI fades + slides away once load completes, so the
          handoff to the landing feels like a camera pull-back */}
      <motion.div
        animate={{
          opacity: done ? 0 : 1,
          y: done ? 16 : 0,
          scale: done ? 0.96 : 1,
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="flex flex-col items-center max-w-xs w-full px-6 relative z-10 mt-40"
      >
        {/* Progress Bar */}
        <div className="w-full space-y-3">
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-teal to-brand-copper rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut", duration: 0.1 }}
            />
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-gray-500 uppercase tracking-widest">
              Initializing Engine
            </span>
            <span className="text-brand-teal font-bold">{progress}%</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
