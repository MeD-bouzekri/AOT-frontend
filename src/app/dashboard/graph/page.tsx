"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, X, Cpu, Terminal, FileText, ShieldCheck, User, Flag,
  ChevronDown,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface GraphNode {
  id: string;
  label: string;
  level: "planner" | "manager" | "worker" | "governance" | string;
  department: string;
  status: string;
}
interface GraphEdge { from: string; to: string; }
interface RunRow {
  run_id: string;
  status: string;
  plan: { domain?: string; summary?: string } | null;
  started_at: string;
}
type Positioned = GraphNode & { x: number; y: number };

const STATUS_COLOR: Record<string, string> = {
  done:           "#10b981",
  blocked:        "#ef4444",
  frozen:         "#ef4444",
  denied:         "#ef4444",
  awaiting_human: "#f59e0b",
  pending:        "#f59e0b",
  running:        "#8C52FF",
};

const LEVEL_COLOR: Record<string, string> = {
  planner:    "#8C52FF",
  manager:    "#a78bfa",
  worker:     "#c084fc",
  governance: "#ef4444",
};

function nodeColor(node: GraphNode) {
  return STATUS_COLOR[node.status] ?? LEVEL_COLOR[node.level] ?? "#5e5e68";
}

export default function WorkflowGraphPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8C52FF]/20 border-t-[#8C52FF]" />
        </div>
      }
    >
      <GraphContent />
    </Suspense>
  );
}

function GraphContent() {
  const router    = useRouter();
  const params    = useSearchParams();
  const urlRun    = params.get("run") ?? "";

  const [runs,      setRuns]      = useState<RunRow[]>([]);
  const [activeRun, setActiveRun] = useState(urlRun);
  const [graph,     setGraph]     = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [selected,  setSelected]  = useState<GraphNode | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const fetchRuns = useCallback(async () => {
    try {
      const list = await api<RunRow[]>("/api/runs");
      setRuns(list);
      setActiveRun((cur) => cur || list[0]?.run_id || "");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load runs.");
    }
  }, []);

  const fetchGraph = useCallback(async (runId: string) => {
    if (!runId) return;
    setLoading(true);
    setError("");
    try {
      const data = await api<{ nodes: GraphNode[]; edges: GraphEdge[] }>(
        `/api/runs/${runId}/graph`,
      );
      setGraph(data);
      setSelected((prev) => prev && data.nodes.find((n) => n.id === prev.id) || null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load graph.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRuns(); }, [fetchRuns]);
  useEffect(() => { if (urlRun) setActiveRun(urlRun); }, [urlRun]);
  useEffect(() => {
    if (!activeRun) return;
    void fetchGraph(activeRun);
    const run = runs.find((r) => r.run_id === activeRun);
    if (run?.status === "running") {
      const id = setInterval(() => void fetchGraph(activeRun), 2000);
      return () => clearInterval(id);
    }
  }, [activeRun, runs, fetchGraph]);

  const selectRun = (runId: string) => {
    setActiveRun(runId);
    setSelected(null);
    router.push(`/dashboard/graph?run=${runId}`);
  };

  const positioned = layout(graph?.nodes ?? []);
  const run        = runs.find((r) => r.run_id === activeRun);

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      {/* ── Header ── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-1)]">
            Workflow Graph
          </h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            Agent dependency graph reconstructed from the audit log.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Run selector */}
          <div className="relative">
            <select
              value={activeRun}
              onChange={(e) => selectRun(e.target.value)}
          className="rounded-xl py-2.5 pl-4 pr-10 text-[12px] font-mono text-[var(--text-2)] outline-none focus:ring-0 cursor-pointer bg-[var(--surface)]"
            style={{
              border: "1px solid var(--border-vis)",
              minWidth: 260,
            }}
            >
              {runs.length === 0 && <option value="">No runs yet</option>}
              {runs.map((r) => (
                <option key={r.run_id} value={r.run_id}>
                  {r.run_id.slice(0, 8)} · {(r.plan?.summary ?? r.plan?.domain ?? "").slice(0, 32)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-4)]" />
          </div>
          <button
            onClick={() => void fetchGraph(activeRun)}
            aria-label="Refresh"
            className="grid h-10 w-10 place-items-center rounded-xl transition-colors bg-[var(--surface)] hover:bg-[var(--surface-2)]"
            style={{ border: "1px solid var(--border-vis)" }}
          >
            <RefreshCw className={`h-4 w-4 text-[var(--text-2)] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* ── Canvas + Inspector ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

        {/* Graph canvas */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden bg-[var(--surface)]"
          style={{ border: "1px solid var(--border-vis)" }}
        >
          {/* Canvas header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <span className="text-[13px] font-semibold text-[var(--text-1)]">Execution Graph</span>
              {run?.plan?.summary && (
                <p className="text-[11px] text-[var(--text-4)] mt-0.5 max-w-[360px] truncate">{run.plan.summary}</p>
              )}
            </div>
            {run && <StatusChip status={run.status} />}
          </div>

          {/* SVG */}
          <div className="p-4 relative">
            {!graph || graph.nodes.length === 0 ? (
              <div className="grid min-h-[380px] place-items-center">
                <div className="text-center">
                  <div className="h-12 w-12 rounded-2xl mx-auto mb-4 grid place-items-center" style={{ background: "var(--accent-quiet)", border: "1px solid var(--accent-line)" }}>
                    <Cpu className="h-5 w-5 text-[#a78bfa]" />
                  </div>
                  <p className="text-sm text-[var(--text-3)]">
                    {activeRun ? "No graph data for this run yet." : "Submit a request to generate a graph."}
                  </p>
                </div>
              </div>
            ) : (
              <svg viewBox="0 0 860 480" className="h-auto w-full" role="img" aria-label="Workflow graph">
                <defs>
                  {/* gradient for edges */}
                  <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8C52FF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
                  </linearGradient>
                  {/* glow filter */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  <marker id="arrow" viewBox="0 0 10 10" refX="12" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M0 1 L10 5 L0 9 z" fill="#8C52FF" opacity="0.5" />
                  </marker>
                </defs>

                {/* background grid dots */}
                <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="var(--surface-3)" />
                </pattern>
                <rect width="860" height="480" fill="url(#dots)" />

                {/* edges */}
                {graph.edges.map((edge, i) => {
                  const a = positioned.find((n) => n.id === edge.from);
                  const b = positioned.find((n) => n.id === edge.to);
                  if (!a || !b) return null;
                  const dx = b.x - a.x;
                  const d  = `M ${a.x} ${a.y} C ${a.x + dx * 0.5} ${a.y}, ${a.x + dx * 0.5} ${b.y}, ${b.x} ${b.y}`;
                  return (
                    <path
                      key={i}
                      d={d}
                      fill="none"
                      stroke="url(#edge-grad)"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      markerEnd="url(#arrow)"
                      opacity="0.8"
                    />
                  );
                })}

                {/* nodes */}
                {positioned.map((node) => {
                  const isSel  = selected?.id === node.id;
                  const color  = nodeColor(node);
                  const W = 118, H = 44, rx = 12;
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x - W / 2}, ${node.y - H / 2})`}
                      onClick={() => setSelected(isSel ? null : node)}
                      className="cursor-pointer"
                    >
                      {/* glow behind selected */}
                      {isSel && (
                        <rect x="-4" y="-4" width={W + 8} height={H + 8} rx={rx + 4}
                          fill={color} opacity="0.12" filter="url(#glow)" />
                      )}
                      {/* card bg */}
                      <rect width={W} height={H} rx={rx}
                        fill={isSel ? `${color}18` : "var(--surface-2)"}
                        stroke={isSel ? color : "var(--border-strong)"}
                        strokeWidth={isSel ? 1.5 : 1}
                      />
                      {/* left accent stripe */}
                      <rect x="0" y={rx / 2} width="3" height={H - rx} rx="1.5" fill={color} opacity="0.8" />
                      {/* icon */}
                      <foreignObject x="10" y="13" width="18" height="18">
                        <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18 }}>
                          {levelIcon(node.level, 14)}
                        </div>
                      </foreignObject>
                      {/* label */}
                      <foreignObject x="30" y="8" width={W - 36} height={H - 16}>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1 }}>
                            {node.level}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {node.label.replace(/_/g, " ")}
                          </div>
                        </div>
                      </foreignObject>
                      {/* status dot */}
                      <circle cx={W - 8} cy="8" r="4" fill={color} />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          {/* Legend */}
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3"
            style={{ borderTop: "1px solid var(--border-vis)" }}
          >
            {[
              { color: "#8C52FF", label: "Planner" },
              { color: "#a78bfa", label: "Manager" },
              { color: "#c084fc", label: "Worker" },
              { color: "#ef4444", label: "Governance" },
              { color: "#10b981", label: "Done" },
              { color: "#f59e0b", label: "Waiting" },
            ].map(({ color, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-4)]">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Inspector panel */}
        <div
          className="rounded-2xl bg-[var(--surface)]"
          style={{ border: "1px solid var(--border-vis)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-vis)" }}
          >
            <span className="text-[13px] font-semibold text-[var(--text-1)]">Node Inspector</span>
            {selected && (
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-lg transition-colors hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4 text-[var(--text-4)]" />
              </button>
            )}
          </div>
          <div className="p-5">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-14 text-center"
                >
                  <div
                    className="h-10 w-10 rounded-xl mb-3 grid place-items-center"
                    style={{ background: "var(--accent-quiet)", border: "1px solid var(--accent-line)" }}
                  >
                    <Cpu className="h-4 w-4 text-[#a78bfa]" />
                  </div>
                  <p className="text-sm text-[var(--text-3)]">Select a node to inspect</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  {/* Node title */}
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: `${nodeColor(selected)}10`,
                      border: `1px solid ${nodeColor(selected)}25`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: nodeColor(selected) }}>{levelIcon(selected.level, 16)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: nodeColor(selected) }}>
                        {selected.level}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-[var(--text-1)] capitalize">
                      {selected.label.replace(/_/g, " ")}
                    </h3>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <InspectorRow label="Department" value={selected.department || "—"} />
                    <InspectorRow label="Level" value={selected.level} />
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[var(--text-4)]">Status</span>
                      <StatusChip status={selected.status} />
                    </div>
                    <InspectorRow label="Node ID" value={selected.id} mono />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Runs list */}
          {runs.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border-vis)" }}>
              <p className="px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-4)]">Recent Runs</p>
              <div className="flex flex-col gap-0.5 px-2 pb-3 max-h-52 overflow-y-auto">
                {runs.slice(0, 8).map((r) => {
                  const isActive = r.run_id === activeRun;
                  const sColor   = STATUS_COLOR[r.status] ?? "#5e5e68";
                  return (
                    <button
                      key={r.run_id}
                      onClick={() => selectRun(r.run_id)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors"
                      style={{
                        background: isActive ? "var(--accent-quiet)" : "transparent",
                        border: isActive ? "1px solid var(--accent-line)" : "1px solid transparent",
                      }}
                    >
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: sColor }} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-mono text-[var(--text-2)] truncate">{r.run_id.slice(0, 12)}…</p>
                        <p className="text-[10px] text-[var(--text-4)] truncate">{r.plan?.summary?.slice(0, 32) ?? r.plan?.domain ?? ""}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Layout algorithm ── */
const CANVAS_H = 480;

function layout(nodes: GraphNode[]): Positioned[] {
  const bucket = (n: GraphNode): "pre" | "plan" | "mid" | "gov" | "report" => {
    if (n.level === "planner") return n.id === "planner" ? "plan" : "pre";
    if (n.level === "manager" || n.level === "worker") return "mid";
    if (n.level === "governance") return n.id === "reporter" ? "report" : "gov";
    return "mid";
  };
  const COLS = { pre: 90, plan: 240, mid: 450, gov: 660, report: 790 } as const;
  const groups: Record<string, GraphNode[]> = {};
  for (const n of nodes) (groups[bucket(n)] ??= []).push(n);

  return nodes.map((n) => {
    const b     = bucket(n);
    const peers = groups[b];
    const idx   = peers.findIndex((p) => p.id === n.id);
    const step  = CANVAS_H / (peers.length + 1);
    return { ...n, x: COLS[b], y: step * (idx + 1) };
  });
}

/* ── Helpers ── */
function levelIcon(level: string, size = 14) {
  const style = { width: size, height: size };
  if (level === "planner")    return <Terminal style={style} />;
  if (level === "manager")    return <Cpu style={style} />;
  if (level === "worker")     return <FileText style={style} />;
  if (level === "governance") return <ShieldCheck style={style} />;
  if (level === "user")       return <User style={style} />;
  return <Flag style={style} />;
}

function StatusChip({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#8e8e98";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
      style={{ color, background: `${color}15` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function InspectorRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-[var(--text-4)]">{label}</span>
      <span className={`text-[12px] text-[var(--text-2)] capitalize ${mono ? "font-mono text-[10px]" : ""}`}>{value}</span>
    </div>
  );
}
