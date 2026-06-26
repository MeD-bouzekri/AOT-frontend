"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldAlert, Cpu, Banknote, HelpCircle, Activity } from "lucide-react";

type RailType = "legacy" | "aeroroute";

export default function RoutingVisualizer() {
  const [activeRail, setActiveRail] = useState<RailType>("aeroroute");

  return (
    <div className="glass-card w-full rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-300">
      {/* Header Bar */}
      <div className="bg-slate-900/60 border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono">
            AeroRoute Live Engine Simulator
          </span>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex bg-slate-950 p-1 rounded-full border border-white/5">
          <button
            onClick={() => setActiveRail("legacy")}
            id="btn-rail-legacy"
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
              activeRail === "legacy"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Legacy SWIFT
          </button>
          <button
            onClick={() => setActiveRail("aeroroute")}
            id="btn-rail-aeroroute"
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
              activeRail === "aeroroute"
                ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            AeroRoute
          </button>
        </div>
      </div>

      {/* Transaction Details */}
      <div className="p-6 bg-slate-950/40 border-b border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Transfer Amount</span>
          <span className="text-sm font-bold text-white">$45,000.00 USD</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Destination</span>
          <span className="text-sm font-bold text-white">Munich, Germany (EUR)</span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Estimated Fee</span>
          <span className={`text-sm font-bold transition-colors ${activeRail === "aeroroute" ? "text-brand-cyan" : "text-red-400"}`}>
            {activeRail === "aeroroute" ? "$4.50 USD" : "$165.00 USD"}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Settlement Time</span>
          <span className={`text-sm font-bold transition-colors ${activeRail === "aeroroute" ? "text-green-400" : "text-amber-400"}`}>
            {activeRail === "aeroroute" ? "1.4 Seconds (Instant)" : "3 - 5 Business Days"}
          </span>
        </div>
      </div>

      {/* Visual Workspace */}
      <div className="relative h-[240px] md:h-[280px] bg-slate-950/80 flex items-center justify-center p-4">
        
        {/* Ambient Grid overlay */}
        <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

        {/* Nodes and SVG connections */}
        <div className="w-full max-w-lg relative flex items-center justify-between z-10">
          
          {/* Sender Node */}
          <div className="flex flex-col items-center space-y-2 relative">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold">🇺🇸</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">US Entity</span>
          </div>

          {/* SVG Routing Lines */}
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-5">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="cyan-purple-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3a9d8f" />
                  <stop offset="100%" stopColor="#c97a4e" />
                </linearGradient>
              </defs>

              {activeRail === "legacy" ? (
                // Legacy path with multiple hoops
                <>
                  <path
                    d="M 25 110 Q 90 40 180 60"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="opacity-40"
                  />
                  <path
                    d="M 180 60 Q 230 40 280 80"
                    fill="transparent"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="opacity-40"
                  />
                  <path
                    d="M 280 80 Q 330 140 435 110"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="opacity-40"
                  />

                  {/* Slow moving pulse */}
                  <motion.path
                    d="M 25 110 Q 90 40 180 60 Q 230 40 280 80 Q 330 140 435 110"
                    fill="transparent"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="8 20"
                    animate={{ strokeDashoffset: [-60, 0] }}
                    transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  />
                </>
              ) : (
                // AeroRoute direct rail path
                <>
                  <path
                    d="M 25 110 Q 230 110 435 110"
                    fill="transparent"
                    stroke="url(#cyan-purple-grad)"
                    strokeWidth="3"
                    className="opacity-30"
                  />
                  <motion.path
                    d="M 25 110 Q 230 110 435 110"
                    fill="transparent"
                    stroke="url(#cyan-purple-grad)"
                    strokeWidth="3"
                    strokeDasharray="20 120"
                    animate={{ strokeDashoffset: [-280, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Dynamic Interactive Middle Nodes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeRail === "legacy" ? (
                <motion.div
                  key="legacy-middle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex space-x-6 md:space-x-12 relative"
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
                      <Banknote className="w-4 h-4 animate-pulse" />
                    </div>
                    <span className="text-[9px] text-amber-500 font-mono">Local Bank</span>
                  </div>

                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-red-500/30 flex items-center justify-center text-red-500 shadow-md">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-red-500 font-mono">SWIFT Hop</span>
                  </div>

                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] text-amber-500 font-mono">Corr Bank</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="aero-middle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center space-y-1.5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-cyan/20 to-brand-violet/20 border border-brand-cyan/50 flex items-center justify-center shadow-xl glow-shadow-cyan relative group">
                    <div className="absolute inset-0.5 rounded-2xl bg-slate-950/80 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-brand-cyan animate-spin-slow" />
                    </div>
                  </div>
                  <span className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider font-mono">
                    AeroRoute Smart Hub
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Receiver Node */}
          <div className="flex flex-col items-center space-y-2 relative">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold">🇩🇪</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">EU Receiver</span>
          </div>

        </div>
      </div>

      {/* Statistics & Success Box */}
      <div className="p-6 bg-slate-900/40 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {activeRail === "aeroroute" ? (
            <>
              <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-mono block">Current Status</span>
                <span className="text-xs font-bold text-white">Settled. Funds deposited in Germany local rail.</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-mono block">Current Status</span>
                <span className="text-xs font-bold text-white">Awaiting clearance at intermediate European hub.</span>
              </div>
            </>
          )}
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-400 font-mono block">Liquidity Optimization</span>
          <span className={`text-xs font-bold ${activeRail === "aeroroute" ? "text-brand-cyan" : "text-gray-500"}`}>
            {activeRail === "aeroroute" ? "98.2% Efficiency" : "Not Optimized"}
          </span>
        </div>
      </div>
    </div>
  );
}
