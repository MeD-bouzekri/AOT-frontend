"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormPanel from "./FormPanel";
import VisualPanel from "./VisualPanel";
import ThemeToggle from "../ThemeToggle";

type Mode = "signin" | "signup";

/**
 * Split-screen auth.
 *  - signin: form LEFT, visual RIGHT
 *  - signup: sides SWAP (form RIGHT, visual LEFT)
 * The swap is animated via framer-motion `layout`: each panel keeps its
 * identity and slides to its new slot. The global landing aurora shows
 * through the page, so this screen shares the same animated background.
 */
export default function AuthShell() {
  const [mode, setMode] = useState<Mode>("signin");
  const toggle = () => setMode((m) => (m === "signin" ? "signup" : "signin"));

  // order controls which slot each panel occupies; framer `layout` tweens it
  const formOrder = mode === "signin" ? 0 : 1;
  const visualOrder = mode === "signin" ? 1 : 0;

  const spring = { type: "spring" as const, stiffness: 120, damping: 20 };

  return (
    <main className="relative min-h-screen w-full px-4 py-6 sm:px-6 lg:px-10 flex items-center justify-center">
      {/* floating top bar: back to site + theme toggle */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-brand-teal transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to site</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative z-10 grid h-[88vh] max-h-[760px] w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-2">
        {/* FORM panel */}
        <motion.div
          layout
          transition={spring}
          style={{ order: formOrder }}
          className="min-h-0 rounded-3xl border border-brand-border bg-brand-card/55 backdrop-blur-xl"
        >
          <FormPanel mode={mode} onToggle={toggle} />
        </motion.div>

        {/* VISUAL panel — hidden on small screens */}
        <motion.div
          layout
          transition={spring}
          style={{ order: visualOrder }}
          className="hidden min-h-0 lg:block"
        >
          <VisualPanel mode={mode} />
        </motion.div>
      </div>
    </main>
  );
}
