"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Reveal from "./Reveal";
import {
  ArrowRight,
  Network,
  Database,
  ShieldAlert,
  FileCode,
  UserCheck,
  Activity,
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: any;
  colorClass: string;
  pillText: string;
}

const features: Feature[] = [
  {
    id: "agent-assembly",
    title: "Dynamic Agent Assembly",
    description: "OrchestrAI analyzes each request and assembles a bespoke team of specialized agents — Validator, Approver, Executor, Reporter — on the fly, sized exactly to the task.",
    icon: Network,
    colorClass: "icon-grad-teal",
    pillText: "Orchestration"
  },
  {
    id: "institutional-memory",
    title: "Institutional Memory",
    description: "A vector store of every past workflow. The orchestrator recalls how similar requests were handled, reusing proven decisions instead of starting from zero.",
    icon: Database,
    colorClass: "icon-grad-teal",
    pillText: "Vector Store"
  },
  {
    id: "proactive-sentinel",
    title: "Proactive Sentinel",
    description: "An always-on anomaly detector that flags risk before it propagates — unusual amounts, policy drift, or suspicious patterns surface as glowing alerts, not after-the-fact reports.",
    icon: ShieldAlert,
    colorClass: "icon-grad-mix",
    pillText: "Risk Detection"
  },
  {
    id: "policy-as-code",
    title: "Policy-as-Code + Versioning",
    description: "Compliance rules live as versioned code. Every workflow is validated against the current policy set, with a full history of what changed, when, and why.",
    icon: FileCode,
    colorClass: "icon-grad-blue",
    pillText: "Governance"
  },
  {
    id: "human-in-loop",
    title: "Configurable Human-in-the-Loop",
    description: "Insert approval checkpoints anywhere in a flow. Humans review, approve, or reject at the exact points you define — the orchestrator pauses and resumes around them.",
    icon: UserCheck,
    colorClass: "icon-grad-blue",
    pillText: "Control"
  },
  {
    id: "live-visualization",
    title: "Live Visualization & Audit Trail",
    description: "Watch workflows execute in real time as a living graph, with a complete, immutable audit trail of every agent decision, approval, and policy check.",
    icon: Activity,
    colorClass: "icon-grad-teal",
    pillText: "Traceability"
  }
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 relative">
      {/* Background visual details */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section header */}
        <Reveal className="max-w-3xl mx-auto text-center mb-20">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-cyan font-mono px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
            Core Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4 font-display">
            One orchestrator. Every safeguard.
          </h2>
          <p className="text-gray-400 mt-4 text-base md:text-lg">
            From dynamic agent assembly to full audit traceability — the intelligence and the guardrails enterprises need to trust autonomous workflows.
          </p>
        </Reveal>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <FeatureCard key={feature.id} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-white/5 bg-slate-900/40 p-6 md:p-8 overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-2xl"
    >
      {/* Dynamic Glow Radial Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(140, 82, 255, 0.06), transparent 80%)`
        }}
      />

      {/* Card Border Glow Highlight */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120px circle at ${coords.x}px ${coords.y}px, rgba(140, 82, 255, 0.15), transparent 80%)`,
          padding: "1px",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude"
        }}
      />

      {/* Pill header */}
      <div className="flex items-center justify-between mb-6">
        <div className={`w-11 h-11 rounded-xl ${feature.colorClass} flex items-center justify-center text-white shadow-md shadow-black/30`}>
          <Icon className="w-5.5 h-5.5" />
        </div>
        <span className="text-[10px] font-mono font-bold tracking-widest text-brand-cyan uppercase bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-full">
          {feature.pillText}
        </span>
      </div>

      {/* Typography */}
      <h3 className="text-lg font-bold text-white group-hover:text-brand-cyan transition-colors duration-200">
        {feature.title}
      </h3>
      <p className="text-gray-400 text-xs md:text-sm mt-3 leading-relaxed">
        {feature.description}
      </p>

      {/* Learn more visual anchor */}
      <div className="mt-6 flex items-center text-xs font-semibold text-brand-cyan group-hover:text-white transition-colors duration-200 cursor-pointer">
        <span>Learn more</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
}
