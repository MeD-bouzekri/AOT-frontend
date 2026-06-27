"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Cpu, FileText, Terminal, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles,
  Copy, Download, Check,
} from "lucide-react";
import ConsoleShell from "@/components/console/ConsoleShell";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, gatewayWs } from "@/lib/api";

// Live StepEvent shape — matches the gateway's StepEvent (schemas.py).
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

// Demo templates aligned to the REAL engine: clean pass + each freeze rule.
const templates: {
  title: string;
  tag: string;
  prompt: string;
  icon: React.ReactNode;
  tone: "ok" | "ciso" | "dpo" | "cfo";
}[] = [
  {
    title: "Clean approval",
    tag: "passes",
    prompt: "Approve a $9,000 annual Notion license for the design team.",
    icon: <CheckCircle2 className="h-4 w-4" />,
    tone: "ok",
  },
  {
    title: "Contractor → production",
    tag: "SEC-04 · CISO",
    prompt:
      "Onboard Priya Sharma, a mid-level software engineer contractor, remote, who needs production access.",
    icon: <ShieldCheck className="h-4 w-4" />,
    tone: "ciso",
  },
  {
    title: "Vendor without DPA",
    tag: "PROC-07 · DPO",
    prompt:
      "Approve a $95,000 annual Slack subscription for our customer data platform (vendor processes personal data, no DPA on file).",
    icon: <FileText className="h-4 w-4" />,
    tone: "dpo",
  },
  {
    title: "Spend over ceiling",
    tag: "FIN-12 · CFO",
    prompt:
      "Approve a $2,000,000 enterprise data-center hardware purchase from Dell for the new Oran facility.",
    icon: <AlertTriangle className="h-4 w-4" />,
    tone: "cfo",
  },
];

const TEMPLATE_TONE: Record<string, string> = {
  ok: "text-emerald-600 dark:text-emerald-400",
  ciso: "text-[#8C52FF]",
  dpo: "text-[#8C52FF]",
  cfo: "text-amber-600 dark:text-amber-400",
};

// The reporter/frozen node emits the full report text as this step's output.
const isReportStep = (s: StepEvent) =>
  s.phase === "Final report" || s.phase === "Report (frozen)";

/** Renders the engine's ASCII execution report in a styled monospace block,
 *  with copy + download. The report is fixed-width ASCII (not Markdown), so a
 *  <pre> preserves its intended layout. */
function ReportBlock({ runId, text }: { runId: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  const download = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orchestra-report-${runId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[var(--text-1)]">
          <FileText className="h-3.5 w-3.5 text-[#8C52FF]" />
          Execution Report
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={copy}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--text-3)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-1)]"
          >
            <Download className="h-3 w-3" /> Download
          </button>
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-[var(--text-2)] whitespace-pre">
        {text}
      </pre>
    </div>
  );
}

export default function RequestPortal() {
  // ConsoleShell handles the auth guard, identity, and sign-out.
  const { token } = useAuth();
  const [promptText, setPromptText] = useState("");
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  // tidy up any open socket on unmount
  useEffect(() => () => wsRef.current?.close(), []);

  // Map an incoming StepEvent to a terminal run status (or keep running).
  const statusFromEvent = (ev: StepEvent): RunStatus | null => {
    if (ev.status === "blocked" || ev.type === "hitl") return "frozen";
    if (ev.status === "denied") return "denied";
    if (ev.status === "awaiting_human") return "awaiting_human";
    if (ev.phase === "complete" || ev.status === "done") {
      // 'complete' terminal event carries the real outcome via type/veto
      if (ev.type === "hitl" || ev.veto) return "frozen";
    }
    return null;
  };

  // Submit → POST /api/request, then open the live WS stream for this run.
  const submitRequest = useCallback(
    async (text: string) => {
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

        // open the live stream: every StepEvent appends to the timeline
        const ws = new WebSocket(
          gatewayWs(`/api/runs/${run_id}/stream`, token),
        );
        wsRef.current = ws;

        ws.onmessage = (msg) => {
          try {
            const ev: StepEvent = JSON.parse(msg.data);
            setActiveRun((prev) => {
              if (!prev || prev.id !== ev.run_id) return prev;
              const terminal = statusFromEvent(ev);
              // the 'complete' bookkeeping event isn't a visible step
              const isStep = ev.phase !== "complete";
              return {
                ...prev,
                status:
                  terminal ??
                  (ev.status === "done" && ev.phase === "Final report"
                    ? "done"
                    : prev.status),
                steps: isStep ? [...prev.steps, ev] : prev.steps,
              };
            });
            if (ev.phase === "complete") ws.close();
          } catch {
            /* ignore non-JSON frames */
          }
        };
        ws.onerror = () =>
          setSubmitError("Live stream interrupted. The run may still be processing.");
      } catch (e) {
        setSubmitError(
          e instanceof ApiError ? e.message : "Failed to submit the request.",
        );
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  return (
    <ConsoleShell>
      {/* page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg accent-gradient text-white shadow-sm">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--text-1)]">
              New Request
            </h1>
            <p className="text-sm text-[var(--text-3)]">
              The Planner decomposes your task, runs department agents, and applies governance gates.
            </p>
          </div>
        </div>
      </div>

      {/* Main panel layout — input on top, live execution below */}
      <main className="flex w-full flex-col gap-6">

        {/* ── Top: input + templates ── */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <label htmlFor="task-input" className="mb-2 block text-[13px] font-medium text-[var(--text-2)]">
              Describe the task
            </label>

            <form
              onSubmit={(e) => { e.preventDefault(); submitRequest(promptText); }}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] transition-colors focus-within:border-[#8C52FF]"
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
                className="min-h-[160px] max-h-[340px] w-full resize-y bg-transparent p-3.5 text-sm leading-relaxed text-[var(--text-1)] outline-none placeholder:text-[var(--text-4)]"
              />
              <div className="flex items-center justify-between border-t border-[var(--border)] px-3.5 py-2.5">
                <span className="text-[11px] text-[var(--text-4)]">
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send ·{" "}
                  <kbd className="rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 font-mono text-[10px]">⇧ Enter</kbd> newline
                </span>
                <button
                  type="submit"
                  disabled={loading || !promptText.trim()}
                  className="btn-brutal !py-2 !px-3.5 text-[13px]"
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
              <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {submitError}
              </p>
            )}
          </div>

          {/* Templates */}
          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-4)]">
              Try a scenario
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => setPromptText(tpl.prompt)}
                  className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-all hover:border-[#8C52FF]/40 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={TEMPLATE_TONE[tpl.tone]}>
                      {tpl.icon}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-4)]">
                      {tpl.tag}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--text-1)] group-hover:text-[#8C52FF]">
                    {tpl.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-3)]">
                    {tpl.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Bottom: live execution (full width) ── */}
        <div className="flex min-w-0 flex-col">
          <div className="flex min-h-[440px] flex-1 flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-1)]">
                <span className={`h-1.5 w-1.5 rounded-full ${activeRun?.status === "running" ? "animate-pulse bg-[#8C52FF]" : "bg-[var(--text-4)]"}`} />
                Live Execution
              </span>
              {activeRun && (
                <span className="rounded bg-[var(--surface-3)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-3)]">
                  {activeRun.id}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <AnimatePresence mode="wait">
                {!activeRun ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-1 flex-col items-center justify-center text-center"
                  >
                    <div className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-dashed border-[var(--border-strong)] text-[var(--text-4)]">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-[var(--text-1)]">Awaiting request</h4>
                    <p className="mt-1 max-w-[220px] text-xs text-[var(--text-3)]">
                      Submit a task to watch the agent workflow compile in real time.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-full flex flex-col"
                  >
                    {/* Status header card */}
                    <div className={`p-4 rounded-xl border mb-5 flex items-center gap-3 ${
                      activeRun.status === "done"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : activeRun.status === "denied"
                        ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                        : activeRun.status === "frozen"
                        ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 font-semibold"
                        : activeRun.status === "awaiting_human"
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold"
                        : "bg-[var(--accent-quiet)] border-[#8C52FF]/30 text-[#8C52FF]"
                    }`}>
                      {activeRun.status === "done" && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                      {(activeRun.status === "frozen" || activeRun.status === "denied" || activeRun.status === "awaiting_human") && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                      {activeRun.status === "running" && <Cpu className="w-5 h-5 flex-shrink-0 animate-spin" />}

                      <div className="flex-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          {activeRun.status === "done" && "Workflow Completed"}
                          {activeRun.status === "frozen" && "Frozen — Governance Veto"}
                          {activeRun.status === "denied" && "Denied by Authority"}
                          {activeRun.status === "awaiting_human" && "Awaiting Human Approval"}
                          {activeRun.status === "running" && "Orchestrating…"}
                        </h4>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-[var(--text-3)]">
                          {activeRun.request}
                        </p>
                      </div>
                    </div>

                    {/* Timeline of steps */}
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {activeRun.steps.length === 0 && (
                        <div className="flex items-center gap-2.5 py-3 text-xs italic text-[var(--text-3)]">
                          <span className="h-2 w-2 animate-ping rounded-full bg-[#8C52FF]" />
                          <span>Planner assembling the team…</span>
                        </div>
                      )}

                      {activeRun.steps.filter((s) => !isReportStep(s)).map((step, idx) => {
                        const isPlanner = step.level === "planner";
                        const isManager = step.level === "manager";
                        const isWorker = step.level === "worker";
                        const isGov = step.level === "governance";
                        const isBlocked = step.status === "blocked";

                        return (
                          <motion.div
                            key={`${step.agent}-${idx}`}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 }}
                            className="group relative flex gap-3"
                          >
                            {/* vertical timeline connector line */}
                            {idx < activeRun.steps.length - 1 && (
                              <div className="absolute left-[10px] top-6 bottom-[-12px] w-px bg-[var(--border)]" />
                            )}

                            {/* Node icon */}
                            <div className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              isBlocked
                                ? "border-red-500/50 bg-red-500/15 text-red-500"
                                : "border-[#8C52FF]/40 bg-[var(--accent-quiet)] text-[#8C52FF]"
                            }`}>
                              {isPlanner && <Terminal className="h-2.5 w-2.5" />}
                              {isManager && <Cpu className="h-2.5 w-2.5" />}
                              {isWorker && <FileText className="h-2.5 w-2.5" />}
                              {isGov && <ShieldCheck className="h-2.5 w-2.5" />}
                            </div>

                            {/* Content card */}
                            <div className={`flex-1 rounded-lg border p-3 ${
                              isBlocked
                                ? "border-red-500/30 bg-red-500/5"
                                : "border-[var(--border)] bg-[var(--surface-2)]"
                            }`}>
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-1)]">
                                  {step.agent.replace(/_/g, " ")}
                                </span>
                                <div className="flex items-center gap-2">
                                  {step.policy_citation && (
                                    <span className="rounded bg-red-500/10 px-1 py-0.5 font-mono text-[9px] font-semibold text-red-500">
                                      {step.policy_citation}
                                    </span>
                                  )}
                                  <span className="font-mono text-[9px] text-[var(--text-4)]">
                                    {step.ts ? new Date(step.ts).toLocaleTimeString() : ""}
                                  </span>
                                </div>
                              </div>
                              {step.phase && (
                                <p className="mb-1 text-[10px] font-mono text-[#8C52FF]">{step.phase}</p>
                              )}
                              {step.output && (
                                <p className="text-[12px] leading-relaxed text-[var(--text-2)]">
                                  {step.output}
                                </p>
                              )}
                              {step.reasoning && (
                                <div className="mt-2 border-t border-[var(--border)] pt-1.5 text-[10px] text-[var(--text-3)]">
                                  <span className="font-semibold text-[#8C52FF]">Reasoning:</span> {step.reasoning}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Final execution report (ASCII, monospace) */}
                    {(() => {
                      const reportStep = activeRun.steps.find(
                        (s) => isReportStep(s) && s.output,
                      );
                      return reportStep?.output ? (
                        <ReportBlock runId={activeRun.id} text={reportStep.output} />
                      ) : null;
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </main>
    </ConsoleShell>
  );
}
