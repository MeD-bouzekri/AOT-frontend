"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Reveal from "./Reveal";
import { Check, ArrowRight, Server, Building2, ShieldCheck, Cpu, HardDrive, Headset } from "lucide-react";

interface Tier {
  name: string;
  price: string;
  periodText: string;
  description: string;
  features: { icon: React.ElementType; text: string }[];
  highlighted: boolean;
  ctaText: string;
  ctaHref: string;
  gradientClass: string;
  glowColor: string;
  borderColor: string;
  isCustom: boolean;
}

const pricingTiers: Tier[] = [
  {
    name: "Platform License",
    price: "$12,000",
    periodText: "/ year",
    description: "Orchestra runs on the company's own servers, using their own local LLM. Data never leaves the building. Includes the full platform, updates, and support.",
    ctaText: "Request Access",
    ctaHref: "#cta",
    gradientClass: "bg-gradient-to-br from-brand-card/70 via-brand-card/50 to-brand-card-light/30",
    glowColor: "rgba(140, 82, 255, 0.07)",
    borderColor: "rgba(140, 82, 255, 0.15)",
    highlighted: false,
    isCustom: false,
    features: [
      { icon: Server, text: "Self-hosted on your own infrastructure" },
      { icon: Cpu, text: "Runs on your local LLM — no cloud dependency" },
      { icon: ShieldCheck, text: "Data never leaves your building" },
      { icon: HardDrive, text: "Full platform access with all agents" },
      { icon: Headset, text: "Updates & support included" },
      { icon: Building2, text: "Scales per department & company size" },
    ],
  },
  {
    name: "Full Ownership",
    price: "Custom",
    periodText: "per deal",
    description: "The company buys Orchestra outright and installs it permanently on their infrastructure. Priced per deal — contact us.",
    ctaText: "Contact Us",
    ctaHref: "#cta",
    gradientClass: "bg-gradient-to-br from-brand-card/85 via-brand-card/60 to-brand-teal/10",
    glowColor: "rgba(140, 82, 255, 0.14)",
    borderColor: "rgba(140, 82, 255, 0.35)",
    highlighted: true,
    isCustom: true,
    features: [
      { icon: Building2, text: "Permanent ownership of the platform" },
      { icon: HardDrive, text: "Installed on your infrastructure indefinitely" },
      { icon: Cpu, text: "Full LLM & agent stack isolation" },
      { icon: ShieldCheck, text: "Air-gapped deployment support" },
      { icon: Headset, text: "Dedicated onboarding & integration team" },
      { icon: Server, text: "Negotiated enterprise SLA & maintenance" },
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 relative border-t border-brand-border overflow-hidden">
      {/* Background ambient decorative light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full glow-spot-primary opacity-15 pointer-events-none blur-[140px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <Reveal className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-primary font-display">
            Simple, Transparent Pricing
          </h2>
          <p className="text-text-secondary mt-4 text-base md:text-lg">
            Two clean options — license the platform or own it outright. Both run entirely on your infrastructure.
          </p>
        </Reveal>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch mb-14">
          {pricingTiers.map((tier, idx) => (
            <PricingCard key={tier.name} tier={tier} index={idx} />
          ))}
        </div>

        {/* Value Anchor Line */}
        <Reveal direction="up" className="max-w-2xl mx-auto text-center">
          <p className="text-text-muted text-sm md:text-base leading-relaxed">
            <span className="text-text-secondary font-medium">Runs on your servers, on your own AI — your data stays yours.</span>
            {" "}And one prevented fraud costs more than a year of Orchestra.
          </p>
        </Reveal>

      </div>
    </section>
  );
}

function PricingCard({ tier, index }: { tier: Tier; index: number }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.21, 0.47, 0.32, 0.98] }}
      onMouseMove={handleMouseMove}
      className={`group relative rounded-2xl border p-6 md:p-8 flex flex-col overflow-hidden transition-all duration-500 ${tier.gradientClass} ${
        tier.highlighted
          ? "border-brand-teal/30 shadow-2xl shadow-brand-teal/5"
          : "border-brand-border shadow-lg"
      } hover:-translate-y-2 hover:scale-[1.01]`}
    >
      {/* Dynamic mouse-follow glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${tier.glowColor}, transparent 80%)`,
        }}
      />
      {/* Border edge glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120px circle at ${coords.x}px ${coords.y}px, ${tier.borderColor}, transparent 80%)`,
          padding: "1px",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* Card content */}
      <div className="relative z-10 flex flex-col flex-1">

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <h3 className="text-xl md:text-2xl font-extrabold text-text-primary font-display group-hover:text-brand-cyan transition-colors duration-300">
            {tier.name}
          </h3>
          <div className="text-right">
            <span className={`font-black text-text-primary font-mono group-hover:scale-105 transition-transform duration-300 inline-block ${
              tier.isCustom ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
            }`}>
              {tier.price}
            </span>
            <span className="text-[10px] text-text-muted block mt-0.5 font-mono uppercase tracking-wider">
              {tier.periodText}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-text-secondary text-xs md:text-sm mb-6 leading-relaxed">
          {tier.description}
        </p>

        {/* Features */}
        <div className="border-t border-brand-border/60 pt-5 mb-6 flex-1">
          <ul className="space-y-3">
            {tier.features.map((feature, fIdx) => {
              const Icon = feature.icon;
              return (
                <li
                  key={fIdx}
                  className="flex items-center text-xs text-text-secondary group-hover:translate-x-0.5 transition-transform duration-300"
                  style={{ transitionDelay: `${fIdx * 25}ms` }}
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-teal/10 flex items-center justify-center mr-3 shrink-0 group-hover:bg-brand-teal/20 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-brand-cyan" />
                  </div>
                  <span>{feature.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* CTA */}
        <a
          href={tier.ctaHref}
          className={`w-full justify-center group/btn transition-all duration-300 ${
            tier.highlighted ? "btn-brutal" : "btn-brutal-ghost"
          }`}
        >
          <span>{tier.ctaText}</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1.5 transition-transform" />
        </a>

      </div>
    </motion.div>
  );
}
