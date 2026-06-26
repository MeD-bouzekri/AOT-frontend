"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Send, Sparkles, LogOut, Cpu, Settings, FileText, 
  Terminal, ShieldCheck, CheckCircle2, AlertTriangle, PlayCircle 
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

interface Step {
  id: string;
  department: string;
  level: string;
  agent: string;
  action: string;
  phase: string;
  status: string;
  output: string;
  reasoning: string;
  ts: string;
}

interface Run {
  id: string;
  request: string;
  status: "completed" | "failed" | "running" | "pending_approval";
  requester: string;
  department: string;
  ts: string;
  steps: Step[];
}

const templates = [
  {
    title: "HR Onboarding contract",
    prompt: "Onboard new senior frontend developer Sarah Jenkins (HR contract draft + salary $120,000)",
    icon: "📄"
  },
  {
    title: "IT MacBook order",
    prompt: "IT: Deploy standard developer workstation (Order MacBook Pro M3, cost $2,499) for engineer David",
    icon: "💻"
  },
  {
    title: "Urgent renewal purchase",
    prompt: "Urgent license purchase: 15 WebStorm team seat licenses ($4,500 total, Procurement & Finance)",
    icon: "⚡"
  },
  {
    title: "Urgent server transfer",
    prompt: "Finance wire request: Urgent transfer of $25,000 for critical infrastructure cloud server licenses",
    icon: "💰"
  }
];

export default function RequestPortal() {
  const router = useRouter();
  const [userName, setUserName] = useState("Employee");
  const [userEmail, setUserEmail] = useState("employee@gmail.com");
  const [promptText, setPromptText] = useState("");
  const [activeRun, setActiveRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");
    if (name) setUserName(name);
    if (email) setUserEmail(email);
  }, []);

  // Poll active run if it's currently running
  useEffect(() => {
    if (!activeRun || (activeRun.status !== "running" && activeRun.steps.length === 0)) return;
    
    // Stop polling if run reached terminal state
    if (activeRun.status === "completed" || activeRun.status === "failed" || activeRun.status === "pending_approval") {
      // One final check to make sure all steps are retrieved
      const timeout = setTimeout(async () => {
        const res = await fetch(`/api/runs`);
        if (res.ok) {
          const list = await res.json();
          const fresh = list.find((r: any) => r.id === activeRun.id);
          if (fresh) setActiveRun(fresh);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(async () => {
      const res = await fetch(`/api/runs`);
      if (res.ok) {
        const list = await res.json();
        const fresh = list.find((r: any) => r.id === activeRun.id);
        if (fresh) {
          setActiveRun(fresh);
          if (fresh.status !== "running") {
            clearInterval(interval);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRun?.id, activeRun?.status, activeRun?.steps.length]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth");
  };

  const submitRequest = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: text,
          requester: userEmail
        })
      });
      if (res.ok) {
        const runData = await res.json();
        setActiveRun(runData);
        setPromptText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-brand-bg relative z-10 text-foreground">
      {/* Header bar */}
      <header className="border-b border-brand-border bg-brand-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg icon-grad-mix flex items-center justify-center font-black text-white text-sm">
              O
            </div>
            <span className="font-bold tracking-tight text-white font-display">
              Orchestr<span className="text-brand-cyan">AI</span> <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-brand-teal/20 text-brand-teal font-mono border border-brand-teal/30 ml-2">Portal</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white">{userName}</span>
              <span className="text-[10px] text-gray-400 font-mono">{userEmail}</span>
            </div>
            
            <ThemeToggle />
            
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-brand-border bg-[var(--surface-soft)] hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 text-gray-400 transition-all"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main panel layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left pane: Input console */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-brand-teal animate-pulse" />
              <span>Request Orchestrator</span>
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Enter any enterprise task. The central Planner agent will decompose the request, coordinate specialized department agents, compile results, and submit them through safety policy compliance gates.
            </p>

            {/* Input area */}
            <form 
              onSubmit={(e) => { e.preventDefault(); submitRequest(promptText); }}
              className="relative rounded-xl border border-brand-border focus-within:border-brand-teal/60 bg-[var(--surface-soft)] p-2 transition-all"
            >
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Ex: Onboard a new software engineer Sarah Jenkins, IT catalog MacBook Pro $2,500..."
                className="w-full bg-transparent min-h-[90px] text-sm text-white placeholder-gray-500 outline-none resize-none p-2 border-0 focus:ring-0"
              />
              <div className="flex items-center justify-between pt-2 border-t border-brand-border/40 px-2">
                <span className="text-[10px] text-gray-500 font-mono">
                  Press Enter to send, Shift+Enter for new line
                </span>
                
                <button
                  type="submit"
                  disabled={loading || !promptText.trim()}
                  className="btn-brutal !py-1.5 !px-3.5 !text-xs !bg-brand-teal text-white flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{loading ? "Routing..." : "Submit Task"}</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>

          {/* Templates list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => setPromptText(tpl.prompt)}
                className="text-left p-4 rounded-xl border border-brand-border bg-brand-card/25 hover:bg-brand-card/55 hover:border-brand-teal/30 hover:shadow-[0_4px_16px_rgba(58,157,143,0.06)] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{tpl.icon}</span>
                  <span className="text-xs font-semibold text-white group-hover:text-brand-teal transition-colors">
                    {tpl.title}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2 font-mono">
                  {tpl.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right pane: Real-time Orchestrator Execution Visualizer */}
        <div className="w-full lg:w-[420px] flex flex-col gap-6">
          <div className="flex-1 rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6 flex flex-col min-h-[400px]">
            <h3 className="font-display text-sm font-semibold text-white border-b border-brand-border pb-3 flex items-center justify-between">
              <span>Live Run Execution</span>
              {activeRun && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--surface-soft)] text-gray-400">
                  {activeRun.id}
                </span>
              )}
            </h3>

            <div className="flex-1 flex flex-col justify-center items-center py-6">
              <AnimatePresence mode="wait">
                {!activeRun ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-6"
                  >
                    <div className="w-12 h-12 rounded-full border border-dashed border-gray-600 flex items-center justify-center mx-auto mb-4 text-gray-500 animate-spin">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1">Awaiting Request</h4>
                    <p className="text-[10px] text-gray-400 max-w-[200px] mx-auto">
                      Submit a prompt on the left to see the agent workflow compile in real time.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-full flex flex-col"
                  >
                    {/* Status header card */}
                    <div className={`p-4 rounded-xl border mb-6 flex items-center gap-3 ${
                      activeRun.status === "completed" 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : activeRun.status === "failed"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : activeRun.status === "pending_approval"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold"
                        : "bg-brand-teal/10 border-brand-teal/30 text-brand-teal animate-pulse"
                    }`}>
                      {activeRun.status === "completed" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                      {activeRun.status === "failed" && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                      {activeRun.status === "pending_approval" && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                      {activeRun.status === "running" && <Cpu className="w-5 h-5 flex-shrink-0 animate-spin" />}
                      
                      <div className="flex-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          {activeRun.status === "completed" && "Workflow Completed"}
                          {activeRun.status === "failed" && "Workflow Blocked"}
                          {activeRun.status === "pending_approval" && "Veto Triggered - Pending Review"}
                          {activeRun.status === "running" && "Orchestrating Step Actions"}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 line-clamp-1">
                          {activeRun.request}
                        </p>
                      </div>
                    </div>

                    {/* Timeline of steps */}
                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[350px] pr-1">
                      {activeRun.steps.length === 0 && (
                        <div className="flex items-center gap-3 text-xs text-gray-400 py-3 italic">
                          <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
                          <span>Initial planner assembly starting...</span>
                        </div>
                      )}
                      
                      {activeRun.steps.map((step, idx) => {
                        const isPlanner = step.level === "planner";
                        const isManager = step.level === "manager";
                        const isWorker = step.level === "worker";
                        const isGov = step.level === "governance";

                        return (
                          <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative flex gap-3 group"
                          >
                            {/* vertical timeline connector line */}
                            {idx < activeRun.steps.length - 1 && (
                              <div className="absolute left-[9px] top-6 bottom-[-16px] w-[2px] bg-brand-border/40 group-hover:bg-brand-teal/20 transition-colors" />
                            )}

                            {/* Node icon */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 border ${
                              step.action === "BLOCK"
                                ? "bg-red-500/20 border-red-500/50 text-red-400"
                                : step.action === "veto cleared"
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "bg-[var(--surface-soft)] border-brand-border text-brand-teal"
                            }`}>
                              {isPlanner && <Terminal className="w-2.5 h-2.5" />}
                              {isManager && <Cpu className="w-2.5 h-2.5" />}
                              {isWorker && <FileText className="w-2.5 h-2.5" />}
                              {isGov && <ShieldCheck className="w-2.5 h-2.5" />}
                            </div>

                            {/* Content card */}
                            <div className="flex-1 bg-[var(--surface-soft)] border border-brand-border/50 rounded-xl p-3">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-white">
                                  {step.agent.replace("_", " ")}
                                </span>
                                <span className="text-[8px] text-gray-500 font-mono">
                                  {new Date(step.ts).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-300 leading-relaxed font-mono">
                                {step.output}
                              </p>
                              <div className="mt-2 pt-1.5 border-t border-brand-border/30 text-[9px] text-gray-400 font-mono">
                                <span className="font-semibold text-brand-teal/80">Reasoning:</span> {step.reasoning}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
