"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Globe } from "lucide-react";

type Mode = "signin" | "signup";

const copy: Record<Mode, { title: string; sub: string }> = {
  signin: {
    title: "Welcome back, orchestrator.",
    sub: "Resume your workflows, agents, and audit trails — exactly where you left off.",
  },
  signup: {
    title: "Orchestrate your enterprise.",
    sub: "Spin up specialized agent teams and automate complex workflows in minutes.",
  },
};

/**
 * The "image" side of the auth split. The global landing aurora shows
 * through this translucent glass panel, so it carries the same animated
 * background. Content cross-fades with the auth mode.
 */
export default function VisualPanel({ mode }: { mode: Mode }) {
  const c = copy[mode];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-brand-border">
      {/* translucent glass so the page aurora glows through */}
      <div className="absolute inset-0 bg-brand-card/40 backdrop-blur-[2px]" />

      {/* layered teal/copper wash + grid for depth */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.06]" />
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-brand-teal/15 blur-[110px] animate-pulse-subtle pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 w-[380px] h-[380px] rounded-full bg-brand-copper/12 blur-[100px] animate-pulse-subtle pointer-events-none" />

      {/* content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-12">
        {/* brand mark */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-teal to-brand-blue text-brand-bg font-black">
            O
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Orchestr<span className="text-brand-teal">AI</span>
          </span>
        </div>

        {/* headline — cross-fades on mode change */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-sm"
        >
          <h2 className="font-display text-3xl lg:text-4xl font-black leading-tight text-white">
            {c.title}
          </h2>
          <p className="mt-4 text-sm lg:text-base leading-relaxed text-gray-300">
            {c.sub}
          </p>
        </motion.div>

        {/* trust strip */}
        <div className="flex flex-wrap items-center gap-5 text-[11px] font-mono text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-teal" /> Policy-as-code
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-brand-teal" /> Proactive sentinel
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-brand-teal" /> Full audit trail
          </span>
        </div>
      </div>
    </div>
  );
}
