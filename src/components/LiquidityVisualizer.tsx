"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, RefreshCw, Layers, TrendingUp } from "lucide-react";
import Reveal from "./Reveal";

interface Node {
  id: string;
  city: string;      // agent name
  currency: string;  // agent role code
  flag: string;      // short label shown in the node chip
  balance: number;   // tasks handled (live counter)
  status: "Optimal" | "Rebalancing" | "Active";
  coords: { x: number; y: number };
}

// agents in the live orchestration graph (was currency hubs)
const initialNodes: Node[] = [
  { id: "ORCH", city: "Orchestrator", currency: "META", flag: "◆", balance: 1284, status: "Active", coords: { x: 50, y: 40 } },
  { id: "VAL", city: "Validator", currency: "VAL", flag: "✓", balance: 842, status: "Optimal", coords: { x: 20, y: 22 } },
  { id: "APP", city: "Approver", currency: "APR", flag: "⇄", balance: 511, status: "Active", coords: { x: 80, y: 22 } },
  { id: "EXE", city: "Executor", currency: "EXE", flag: "▶", balance: 967, status: "Optimal", coords: { x: 78, y: 68 } },
  { id: "SEN", city: "Sentinel", currency: "SEN", flag: "!", balance: 73, status: "Rebalancing", coords: { x: 22, y: 70 } }
];

interface LogEntry {
  id: string;
  timestamp: string;
  source: string;  // agent / stage
  dest: string;    // next agent / outcome
  amount: string;  // request label
  latency: string; // duration
}

export default function LiquidityVisualizer() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "1", timestamp: "09:24:12", source: "Validator", dest: "Approver", amount: "Vendor onboarding", latency: "0.4s" },
    { id: "2", timestamp: "09:23:45", source: "Approver", dest: "Executor", amount: "PO #4821 approved", latency: "0.9s" },
    { id: "3", timestamp: "09:22:08", source: "Sentinel", dest: "Flagged", amount: "Anomaly: amount spike", latency: "0.2s" }
  ]);

  // Simulate ticks: bump per-agent task counters + push new workflow events
  useEffect(() => {
    const requests = [
      "Vendor onboarding", "Expense reimbursement", "PO approval", "Access request",
      "Budget allocation", "Contract review", "Invoice match", "Policy exception",
    ];
    const stages = ["Validator", "Approver", "Executor", "Reporter", "Sentinel"];
    const outcomes = ["Executor", "Reporter", "Approved", "Human review", "Flagged", "Completed"];

    const interval = setInterval(() => {
      // 1. increment task counters + nudge status
      setNodes((prevNodes) =>
        prevNodes.map((node) => ({
          ...node,
          balance: node.balance + Math.floor(Math.random() * 4),
          status: Math.random() > 0.85 ? "Rebalancing" : Math.random() > 0.5 ? "Active" : "Optimal",
        }))
      );

      // 2. occasionally push a workflow event
      if (Math.random() > 0.55) {
        const source = stages[Math.floor(Math.random() * stages.length)];
        let dest = outcomes[Math.floor(Math.random() * outcomes.length)];
        if (dest === source) dest = "Completed";
        const req = requests[Math.floor(Math.random() * requests.length)];
        const now = new Date();

        const newLog: LogEntry = {
          id: Math.random().toString(),
          timestamp: now.toTimeString().split(" ")[0],
          source,
          dest,
          amount: req,
          latency: `${(Math.random() * 0.9 + 0.2).toFixed(1)}s`,
        };
        setLogs((prevLogs) => [newLog, ...prevLogs.slice(0, 4)]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // tasks-handled counter for each agent node
  const formatBalance = (bal: number) => `${bal.toLocaleString("en-US")} tasks`;

  return (
    <section id="liquidity" className="py-24 relative border-t border-white/5">
      {/* Background ambient lighting */}
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] rounded-full glow-spot-primary opacity-20 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] rounded-full glow-spot-secondary opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Block */}
        <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
          <div className="lg:col-span-8">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-cyan font-mono px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
              Live Orchestration
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-4 font-display">
              Watch the Agent Graph Think
            </h2>
            <p className="text-gray-400 mt-4 text-base md:text-lg max-w-2xl">
              A living view of the orchestrator coordinating its specialized agents — validating, approving, executing, and flagging anomalies in real time, with every event traced.
            </p>
          </div>
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <div className="glass-card px-4 py-2.5 rounded-full border border-white/10 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand-cyan animate-spin-slow" />
              <span className="text-xs font-mono font-bold text-gray-300">
                Orchestrator Status: All Agents Healthy
              </span>
            </div>
          </div>
        </Reveal>

        {/* Visual Showcase Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Map/Schematic Canvas (Left 8 columns) */}
          <div className="lg:col-span-8 glass-card rounded-3xl border border-white/5 bg-slate-900/20 p-6 md:p-8 flex flex-col justify-between min-h-[400px] relative overflow-hidden">
            
            {/* Dots overlay grid */}
            <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

            <div className="relative flex-1 w-full h-[320px] rounded-2xl bg-slate-950/60 border border-white/5 overflow-hidden flex items-center justify-center p-4">
              
              {/* Simulated Map Outline Nodes */}
              <div className="w-full h-full relative">
                        {/* SVG Connections */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  {/* Connect NY to UK */}
                  <path d="M 120 100 Q 230 60 300 70" fill="none" stroke="rgba(140, 82, 255, 0.15)" strokeWidth="2" />
                  <motion.path
                    d="M 120 100 Q 230 60 300 70"
                    fill="none"
                    stroke="#8C52FF"
                    strokeWidth="2"
                    strokeDasharray="10 40"
                    animate={{ strokeDashoffset: [-100, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  />

                  {/* Connect UK to Frankfurt */}
                  <path d="M 300 70 Q 320 75 340 100" fill="none" stroke="rgba(140, 82, 255, 0.15)" strokeWidth="1.5" />

                  {/* Connect Frankfurt to Tokyo */}
                  <path d="M 340 100 Q 480 80 580 120" fill="none" stroke="rgba(167, 139, 250, 0.15)" strokeWidth="2" />
                  <motion.path
                    d="M 340 100 Q 480 80 580 120"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2"
                    strokeDasharray="10 50"
                    animate={{ strokeDashoffset: [-120, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
                  />

                  {/* Connect Frankfurt to Singapore */}
                  <path d="M 340 100 Q 450 180 520 220" fill="none" stroke="rgba(140, 82, 255, 0.15)" strokeWidth="2" />
                  <motion.path
                    d="M 340 100 Q 450 180 520 220"
                    fill="none"
                    stroke="#8C52FF"
                    strokeWidth="2"
                    strokeDasharray="8 35"
                    animate={{ strokeDashoffset: [-80, 0] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                  />
                  {/* Connect Singapore to Tokyo */}
                  <path d="M 520 220 Q 560 180 580 120" fill="none" stroke="rgba(167, 139, 250, 0.15)" strokeWidth="2" />
                </svg>

                {/* Node Cards overlaying on relative coords */}
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute transition-all duration-700"
                    style={{
                      left: `${node.coords.x}%`,
                      top: `${node.coords.y}%`,
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    <div className="glass-card p-2 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg min-w-[130px] hover:border-brand-cyan/40 transition-all duration-300">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-cyan/15 text-brand-cyan text-xs font-bold font-mono">
                        {node.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold text-white uppercase truncate font-mono">
                            {node.city}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              node.status === "Optimal"
                                ? "bg-green-400"
                                : node.status === "Active"
                                ? "bg-brand-cyan animate-pulse"
                                : "bg-brand-copper animate-pulse"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 block font-bold mt-0.5">
                          {formatBalance(node.balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom info row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400 font-mono">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  <span>Idle / Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse" />
                  <span>Processing</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-copper animate-pulse" />
                  <span>Anomaly Flagged</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-gray-300">
                <Globe className="w-3.5 h-3.5" />
                <span>Agents Orchestrating Live</span>
              </div>
            </div>

          </div>

          {/* Activity Log (Right 4 columns) */}
          <div className="lg:col-span-4 glass-card rounded-3xl border border-white/5 bg-slate-900/20 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4.5 h-4.5 text-brand-cyan" />
                  <span className="text-sm font-bold text-white">Live Workflow Feed</span>
                </div>
                <TrendingUp className="w-4 h-4 text-brand-cyan" />
              </div>

              {/* Log List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-3 bg-slate-950/60 rounded-xl border border-white/5 font-mono text-[10px] space-y-1"
                    >
                      <div className="flex justify-between items-center text-gray-400">
                        <span>{log.timestamp}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            log.dest === "Flagged"
                              ? "text-amber-400 bg-amber-400/10"
                              : log.dest === "Human review"
                              ? "text-brand-blue bg-brand-blue/10"
                              : "text-brand-cyan bg-brand-cyan/10"
                          }`}
                        >
                          {log.dest === "Flagged"
                            ? "Flagged"
                            : log.dest === "Human review"
                            ? "Review"
                            : "Traced"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-white font-bold text-xs mt-1">
                        <span className="flex items-center gap-1">
                          {log.source} 
                          <span className="text-gray-500 font-normal">→</span> 
                          {log.dest}
                        </span>
                        <span>{log.amount}</span>
                      </div>
                      <div className="text-gray-500 text-[9px] flex justify-between">
                        <span>Traced · audit log written</span>
                        <span className="text-green-400">{log.latency}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Stats Summary Widget inside feed card */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/5 mt-6">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>WORKFLOWS ORCHESTRATED</span>
                <span className="text-brand-cyan">24H</span>
              </div>
              <div className="text-lg font-black text-white font-mono mt-1">
                12,480
              </div>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-400 font-mono font-bold">
                <span>100% traced · 0 untracked actions</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
