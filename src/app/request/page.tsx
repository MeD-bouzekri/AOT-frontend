"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Cpu, FileText, Terminal, ShieldCheck, CheckCircle2,
  AlertTriangle, Copy, Download, Check, Clock, XCircle,
  ChevronDown, ChevronUp, Layers,
} from "lucide-react";
import ConsoleShell from "@/components/console/ConsoleShell";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, gatewayWs } from "@/lib/api";

interface StepEvent {
  run_id: string;
  department: string;
  level: "planner" | "manager" | "worker" | "governance";
  agent: string;
  phase: string;
  status: string;
  output?: string | null;
  reasoning?: string | null;
  policy_citation?: string | null;
  type?: string;
  veto?: unknown;
  ts?: string;
}

type RunStatus = "running" | "done" | "frozen" | "awaiting_human" | "denied";

interface ActiveRun {
  id: string;
  request: string;
  status: RunStatus;
  steps: StepEvent[];
}

const SCENARIOS: {
  title: string;
  tag: string;
  prompt: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    title: "Clean Approval",
    tag: "Passes",
    prompt: "Approve a $9,000 annual Notion license for the design team.",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: "#10b981",
  },
  {
    title: "Contractor Access",
    tag: "SEC-04 · CISO",
    prompt: "Onboard Priya Sharma, a mid-level software engineer contractor, remote, who needs production access.",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    color: "#8C52FF",
  },
  {
    title: "Vendor Without DPA",
    tag: "PROC-07 · DPO",
    prompt: "Approve a $95,000 annual Slack subscription for our customer data platform (vendor processes personal data, no DPA on file).",
    icon: <FileText className="h-3.5 w-3.5" />,
    color: "#8C52FF",
  },
  {
    title: "Spend Over Ceiling",
    tag: "FIN-12 · CFO",
    prompt: "Approve a $2,000,000 enterprise data-center hardware purchase from Dell for the new Oran facility.",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: "#f59e0b",
  },
];

const isReportStep = (s: StepEvent) =>
  s.phase === "Final report" || s.phase === "Report (frozen)";

const STATUS_CONFIG: Record<RunStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  running:        { label: "Orchestrating", color: "#8C52FF", bg: "rgba(140,82,255,0.08)", border: "rgba(140,82,255,0.25)", icon: <Cpu className="h-4 w-4 animate-spin" /> },
  done:           { label: "Completed",     color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  icon: <CheckCircle2 className="h-4 w-4" /> },
  frozen:         { label: "Frozen — Governance Veto", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: <XCircle className="h-4 w-4" /> },
  denied:         { label: "Denied",        color: "#ef4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.25)",   icon: <XCircle className="h-4 w-4" /> },
  awaiting_human: { label: "Awaiting Review", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: <Clock className="h-4 w-4" /> },
};

function ReportBlock({ runId, text }: { runId: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `orchestra-report-${runId.slice(0, 8)}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-1)]">
          <FileText className="h-3.5 w-3.5" style={{ color: "#8C52FF" }} />
          Execution Report
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={copy} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]">
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={download} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]">
            <Download className="h-3 w-3" />
            Download
          </button>
        </div>
      </div>
      <pre className="max-h-[380px] overflow-auto px-4 py-3.5 font-mono text-[11px] leading-relaxed text-[var(--text-2)] whitespace-pre">
        {text}
      </pre>
    </motion.div>
  );
}

function StepCard({ step, idx, total }: { step: StepEvent; idx: number; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const isBlocked = step.status === "blocked";
  const hasExtra  = !!(step.reasoning || step.output);

  const levelMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    planner:    { label: "Planner",    color: "#8C52FF", icon: <Terminal className="h-2.5 w-2.5" /> },
    manager:    { label: "Manager",    color: "#a78bfa", icon: <Cpu className="h-2.5 w-2.5" /> },
    worker:     { label: "Worker",     color: "#60a5fa", icon: <Layers className="h-2.5 w-2.5" /> },
    governance: { label: "Governance", color: isBlocked ? "#ef4444" : "#f59e0b", icon: <ShieldCheck className="h-2.5 w-2.5" /> },
  };
  const meta = levelMeta[step.level] ?? { label: step.level, color: "#8C52FF", icon: <Cpu className="h-2.5 w-2.5" /> };

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="relative flex gap-3"
    >
      {/* Timeline connector */}
      {idx < total - 1 && (
        <div className="absolute left-[9px] top-5 bottom-[-12px] w-px bg-[var(--border)]" />
      )}

      {/* Icon node */}
      <div
        className="relative z-10 mt-0.5 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: isBlocked ? "rgba(239,68,68,0.5)" : `${meta.color}40`,
          background:   isBlocked ? "rgba(239,68,68,0.1)" : `${meta.color}14`,
          color:        isBlocked ? "#ef4444" : meta.color,
        }}
      >
        {meta.icon}
      </div>

      {/* Card */}
      <div
        className="flex-1 rounded-lg border mb-3 overflow-hidden"
        style={{
          borderColor: isBlocked ? "rgba(239,68,68,0.25)" : "var(--border)",
          background:   isBlocked ? "rgba(239,68,68,0.04)" : "var(--surface-2)",
        }}
      >
        {/* Card header */}
        <div
          className={`flex items-center justify-between px-3 py-2.5 ${hasExtra ? "cursor-pointer hover:bg-[var(--surface-3)] transition-colors" : ""}`}
          onClick={() => hasExtra && setExpanded((e) => !e)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: `${meta.color}18`, color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-[12px] font-semibold text-[var(--text-1)] truncate">
              {step.agent.replace(/_/g, " ")}
            </span>
            {step.phase && (
              <span className="hidden sm:block text-[10px] font-mono text-[var(--text-4)] truncate">
                · {step.phase}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {step.policy_citation && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-red-500 border border-red-500/20">
                {step.policy_citation}
              </span>
            )}
            {step.ts && (
              <span className="font-mono text-[10px] text-[var(--text-4)]">
                {new Date(step.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            {hasExtra && (
              expanded
                ? <ChevronUp className="h-3.5 w-3.5 text-[var(--text-4)]" />
                : <ChevronDown className="h-3.5 w-3.5 text-[var(--text-4)]" />
            )}
          </div>
        </div>

        {/* Expandable body */}
        <AnimatePresence initial={false}>
          {expanded && hasExtra && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[var(--border)]"
            >
              <div className="px-3 py-2.5 space-y-2">
                {step.output && (
                  <p className="text-[12px] leading-relaxed text-[var(--text-2)]">{step.output}</p>
                )}
                {step.reasoning && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <p className="text-[10px] font-semibold text-[var(--text-4)] uppercase tracking-widest mb-1">Reasoning</p>
                    <p className="text-[11px] leading-relaxed text-[var(--text-3)]">{step.reasoning}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function RequestPortal() {
  const { token } = useAuth();
  const [promptText, setPromptText]   = useState("");
  const [activeRun, setActiveRun]     = useState<ActiveRun | null>(null);
  const [loading, setLoading]         = useState(false);
  const [submitError, setSubmitError] = useState("");
  const wsRef    = useRef<WebSocket | null>(null);
  const streamEl = useRef<HTMLDivElement>(null);

  useEffect(() => () => wsRef.current?.close(), []);

  // Auto-scroll the execution panel as steps arrive
  useEffect(() => {
    if (streamEl.current) {
      streamEl.current.scrollTop = streamEl.current.scrollHeight;
    }
  }, [activeRun?.steps.length]);

  const statusFromEvent = (ev: StepEvent): RunStatus | null => {
    if (ev.status === "blocked" || ev.type === "hitl") return "frozen";
    if (ev.status === "denied") return "denied";
    if (ev.status === "awaiting_human") return "awaiting_human";
    if (ev.phase === "complete" || ev.status === "done") {
      if (ev.type === "hitl" || ev.veto) return "frozen";
    }
    return null;
  };

  const submitRequest = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setSubmitError("");
    wsRef.current?.close();

    try {
      const { run_id } = await api<{ run_id: string; status: string }>(
        "/api/request",
        { method: "POST", body: { text } },
      );

      setActiveRun({ id: run_id, request: text, status: "running", steps: [] });
      setPromptText("");

      const ws = new WebSocket(gatewayWs(`/api/runs/${run_id}/stream`, token));
      wsRef.current = ws;

      ws.onmessage = (msg) => {
        try {
          const ev: StepEvent = JSON.parse(msg.data);
          setActiveRun((prev) => {
            if (!prev || prev.id !== ev.run_id) return prev;
            const terminal = statusFromEvent(ev);
            const isStep = ev.phase !== "complete";
            return {
              ...prev,
              status: terminal ?? (ev.status === "done" && ev.phase === "Final report" ? "done" : prev.status),
              steps: isStep ? [...prev.steps, ev] : prev.steps,
            };
          });
          if (ev.phase === "complete") ws.close();
        } catch { /* non-JSON */ }
      };
      ws.onerror = () => setSubmitError("Live stream interrupted. The run may still be processing.");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Failed to submit the request.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const visibleSteps = activeRun?.steps.filter((s) => !isReportStep(s)) ?? [];
  const reportStep   = activeRun?.steps.find((s) => isReportStep(s) && s.output);
  const statusCfg    = activeRun ? STATUS_CONFIG[activeRun.status] : null;

  return (
    <ConsoleShell>
      <div className="mx-auto max-w-6xl space-y-6">

        {/* ── Page header ── */}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-1)]">
            New Request
          </h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            Describe a task and Orchestra will route it through the right agents and compliance gates.
          </p>
        </div>

        {/* ── Main layout: left (input) + right (scenarios) ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">

          {/* Input panel */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <label htmlFor="task-input" className="text-[13px] font-semibold text-[var(--text-1)]">
                Task description
              </label>
              <p className="mt-0.5 text-[11px] text-[var(--text-4)]">
                Be specific — include names, amounts, systems, or policy context where relevant.
              </p>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); submitRequest(promptText); }}
            >
              <textarea
                id="task-input"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitRequest(promptText);
                  }
                }}
                placeholder="e.g. Onboard a senior data engineer (full-time, remote) who needs production database access…"
                className="min-h-[160px] max-h-[280px] w-full resize-y bg-transparent px-5 py-4 text-sm leading-relaxed text-[var(--text-1)] outline-none placeholder:text-[var(--text-4)]"
              />
              <div
                className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-2)]"
              >
                <span className="text-[11px] text-[var(--text-4)]">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
                  {" "}to submit ·{" "}
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 font-mono text-[10px]">⇧ Enter</kbd>
                  {" "}for newline
                </span>
                <button
                  type="submit"
                  disabled={loading || !promptText.trim()}
                  className="btn-brutal !py-2 !px-4 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {loading ? "Routing…" : "Submit"}
                </button>
              </div>
            </form>

            {submitError && (
              <div className="flex items-center gap-2 px-5 py-3 text-sm text-red-500 border-t border-red-500/20 bg-red-500/5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {submitError}
              </div>
            )}
          </div>

          {/* Scenario selector */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-4)]">
              Example scenarios
            </p>
            {SCENARIOS.map((sc, i) => (
              <button
                key={i}
                onClick={() => setPromptText(sc.prompt)}
                className="group w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all duration-200 hover:border-[#8C52FF]/35 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md"
                    style={{ background: `${sc.color}18`, color: sc.color }}
                  >
                    {sc.icon}
                  </span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide"
                    style={{ background: `${sc.color}12`, color: sc.color }}
                  >
                    {sc.tag}
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-[var(--text-1)] group-hover:text-[#8C52FF] transition-colors">
                  {sc.title}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-3)]">
                  {sc.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Execution panel ── */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">

          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2 w-2 rounded-full ${activeRun?.status === "running" ? "animate-pulse" : ""}`}
                style={{ background: statusCfg?.color ?? "var(--text-4)" }}
              />
              <span className="text-[13px] font-semibold text-[var(--text-1)]">
                {statusCfg ? statusCfg.label : "Execution Log"}
              </span>
            </div>
            {activeRun && (
              <span className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-3)]">
                Run {activeRun.id.slice(0, 8)}…
              </span>
            )}
          </div>

          {/* Panel body */}
          <div className="min-h-[360px] flex flex-col">
            <AnimatePresence mode="wait">
              {!activeRun ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-[var(--border-strong)] text-[var(--text-4)]">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-2)]">No active run</p>
                    <p className="mt-0.5 text-xs text-[var(--text-4)]">Submit a request to begin.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col p-5 gap-4"
                >
                  {/* Status banner */}
                  {statusCfg && (
                    <div
                      className="flex items-center gap-3 rounded-lg px-4 py-3 border"
                      style={{ background: statusCfg.bg, borderColor: statusCfg.border, color: statusCfg.color }}
                    >
                      {statusCfg.icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold">{statusCfg.label}</p>
                        <p className="text-[11px] opacity-70 truncate mt-0.5">{activeRun.request}</p>
                      </div>
                    </div>
                  )}

                  {/* Steps timeline */}
                  <div ref={streamEl} className="max-h-[420px] overflow-y-auto pr-1">
                    {visibleSteps.length === 0 && activeRun.status === "running" && (
                      <div className="flex items-center gap-2.5 py-2 text-xs text-[var(--text-3)]">
                        <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#8C52FF]" />
                        Planner assembling the workflow…
                      </div>
                    )}

                    {visibleSteps.map((step, idx) => (
                      <StepCard
                        key={`${step.agent}-${idx}`}
                        step={step}
                        idx={idx}
                        total={visibleSteps.length}
                      />
                    ))}
                  </div>

                  {/* Execution report */}
                  {reportStep?.output && (
                    <ReportBlock runId={activeRun.id} text={reportStep.output} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </ConsoleShell>
  );
}
