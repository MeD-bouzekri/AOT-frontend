"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, FileClock } from "lucide-react";
import { LogoMark } from "@/components/Logo";

type Mode = "signin" | "signup";

const copy: Record<Mode, { title: string; sub: string }> = {
  signin: {
    title: "Welcome back, orchestrator.",
    sub: "Resume your workflows, agents, and audit trails — exactly where you left off.",
  },
  signup: {
    title: "Orchestrate your enterprise.",
    sub: "Specialized agent teams, policy-as-code governance, and full traceability.",
  },
};

/**
 * The brand side of the auth split — a deep accent-gradient panel with a
 * subtle node motif. No blur orbs / aurora; just a clean gradient + grid.
 */
export default function VisualPanel({ mode }: { mode: Mode }) {
  const c = copy[mode];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      {/* accent gradient field */}
      <div className="absolute inset-0 accent-gradient" />
      {/* faint grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundSize: "44px 44px",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
        }}
      />
      {/* soft top-light */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-12 text-white">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <LogoMark size={26} variant="white" />
          <span className="font-display text-lg font-semibold tracking-tight">
            Orchestr<span className="text-white/80">AI</span>
          </span>
        </div>

        {/* headline */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-sm"
        >
          <h2 className="font-display text-3xl font-semibold leading-tight lg:text-4xl">
            {c.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/85 lg:text-base">
            {c.sub}
          </p>
        </motion.div>

        {/* trust strip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Policy-as-code
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> Proactive sentinel
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileClock className="h-4 w-4" /> Full audit trail
          </span>
        </div>
      </div>
    </div>
  );
}
