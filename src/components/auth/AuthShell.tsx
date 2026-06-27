"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FormPanel from "./FormPanel";
import VisualPanel from "./VisualPanel";
import ThemeToggle from "../ThemeToggle";

/**
 * Split-screen sign-in. Form on the left, brand panel on the right.
 */
export default function AuthShell() {
  return (
    <main className="relative min-h-screen w-full px-4 py-6 sm:px-6 lg:px-10 flex items-center justify-center">
      {/* floating top bar: back to site + theme toggle */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to site</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative z-10 grid h-[88vh] max-h-[760px] w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-2">
        {/* FORM panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
        >
          <FormPanel />
        </motion.div>

        {/* VISUAL panel — hidden on small screens */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="hidden min-h-0 lg:block"
        >
          <VisualPanel />
        </motion.div>
      </div>
    </main>
  );
}
