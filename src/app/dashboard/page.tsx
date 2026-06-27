"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RefreshCw, ArrowUpRight, CheckCircle2, Snowflake, Clock3, Activity,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface OverviewStats {
  kpis: {
    total_requests: number;
    frozen: number;
    approved: number;
    awaiting_human: number;
  };
  by_status: Record<string, number>;
  by_domain: Record<string, number>;
  blocks_by_rule: Record<string, number>;
}

interface RunRow {
  run_id: string;
  status: string;
  plan: { domain?: string; summary?: string } | null;
  started_at: string;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  done:           { bg: "rgba(16,185,129,0.10)", text: "#10b981", dot: "#10b981" },
  frozen:         { bg: "rgba(239,68,68,0.10)",  text: "#ef4444", dot: "#ef4444" },
  denied:         { bg: "rgba(239,68,68,0.10)",  text: "#ef4444", dot: "#ef4444" },
  awaiting_human: { bg: "rgba(245,158,11,0.10)", text: "#f59e0b", dot: "#f59e0b" },
  running:        { bg: "rgba(140,82,255,0.12)",  text: "#a78bfa", dot: "#8C52FF" },
};

function fade(i: number) {
  return { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07, duration: 0.4 } };
}

export default function OverviewPage() {
  const { principal } = useAuth();
  const [stats, setStats]   = useState<OverviewStats | null>(null);
  const [runs, setRuns]     = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const sparkRef            = useRef<number[]>([]);

  const fetchAll = useCallback(async () => {
    setError("");
    try {
      const [s, r] = await Promise.all([
        api<OverviewStats>("/api/stats/overview"),
        api<RunRow[]>("/api/runs"),
      ]);
      setStats(s);
      setRuns(r);
      // build a tiny spark history from cumulative total
      sparkRef.current = [...sparkRef.current, s.kpis.total_requests].slice(-12);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const k            = stats?.kpis;
  const total        = k?.total_requests ?? 0;
  const approveRate  = total > 0 ? Math.round(((k?.approved ?? 0) / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* ── Page header ── */}
      <motion.header {...fade(0)} className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-1)]">
            Overview
          </h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            {principal?.scope === "ALL"
              ? "All departments · live orchestration activity."
              : `${principal?.scope?.toUpperCase() ?? ""} department · live activity.`}
          </p>
        </div>
        <button
          onClick={() => void fetchAll()}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-2)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-1)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.header>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}>
          {error}
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          idx={1}
          label="Total Requests"
          value={total}
          icon={<Activity className="h-4 w-4" />}
          hint="all-time"
          accent="#8C52FF"
          sparkData={sparkRef.current}
        />
        <KpiCard
          idx={2}
          label="Approved"
          value={`${approveRate}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
          hint={`${k?.approved ?? 0} completed`}
          accent="#10b981"
          trend={approveRate > 70 ? "up" : approveRate > 40 ? "neutral" : "down"}
        />
        <KpiCard
          idx={3}
          label="Frozen"
          value={k?.frozen ?? 0}
          icon={<Snowflake className="h-4 w-4" />}
          hint="governance vetoes"
          accent="#ef4444"
          trend={k?.frozen === 0 ? "up" : "down"}
        />
        <KpiCard
          idx={4}
          label="Awaiting Human"
          value={k?.awaiting_human ?? 0}
          icon={<Clock3 className="h-4 w-4" />}
          hint="pending approval"
          accent="#f59e0b"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassPanel idx={5} className="lg:col-span-1" title="By Domain" subtitle="Request distribution">
          <BarList data={stats?.by_domain ?? {}} total={total} accent="#8C52FF" />
        </GlassPanel>
        <GlassPanel idx={6} className="lg:col-span-2" title="Governance Blocks" subtitle="Blocks by policy rule">
          {Object.keys(stats?.blocks_by_rule ?? {}).length === 0 ? (
            <EmptyState>No governance blocks recorded.</EmptyState>
          ) : (
            <BarList data={stats?.blocks_by_rule ?? {}} total={Object.values(stats?.blocks_by_rule ?? {}).reduce((a, b) => a + b, 0)} accent="#ef4444" mono />
          )}
        </GlassPanel>
      </div>

      {/* ── Status donut + recent runs ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassPanel idx={7} className="lg:col-span-1" title="Status Breakdown" subtitle="All time">
          <DonutChart data={stats?.by_status ?? {}} />
        </GlassPanel>
        <GlassPanel idx={8} className="lg:col-span-2" title="Recent Activity" subtitle="Last 12 runs" noPad>
          <ActivityTable runs={runs} />
        </GlassPanel>
      </div>

    </div>
  );
}

/* ──────────────────────────────────────────────
   KPI Card
────────────────────────────────────────────── */
function KpiCard({
  idx, label, value, icon, hint, accent, sparkData, trend,
}: {
  idx: number;
  label: string;
  value: number | string;
  icon: React.ReactNode;
  hint: string;
  accent: string;
  sparkData?: number[];
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <motion.div {...fade(idx)} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[var(--text-3)]">{label}</span>
        <span style={{ color: accent }}>{icon}</span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <span className="font-display text-[28px] font-semibold leading-none tabular-nums text-[var(--text-1)]">
          {value}
        </span>
        {trend && (
          <span className="flex items-center gap-0.5 text-[11px] font-medium" style={{ color: trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "var(--text-4)" }}>
            {trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : trend === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px] text-[var(--text-4)]">{hint}</div>

      {/* mini spark */}
      {sparkData && sparkData.length > 2 && (
        <div className="mt-4 flex items-end gap-[2px] h-8">
          {sparkData.map((v, i) => {
            const max = Math.max(...sparkData, 1);
            const h   = Math.max(4, Math.round((v / max) * 32));
            return (
              <div
                key={i}
                className="flex-1 rounded-sm opacity-60"
                style={{ height: h, background: accent, opacity: i === sparkData.length - 1 ? 1 : 0.35 + (i / sparkData.length) * 0.4 }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Glass Panel
────────────────────────────────────────────── */
function GlassPanel({
  idx, title, subtitle, children, className = "", noPad = false,
}: {
  idx: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <motion.section
      {...fade(idx)}
      className={`rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] ${className}`}
    >
      <div className="flex items-baseline justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-vis)" }}>
        <div>
          <h2 className="text-[14px] font-semibold text-[var(--text-1)]">{title}</h2>
          {subtitle && <p className="text-[11px] text-[var(--text-4)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </motion.section>
  );
}

/* ──────────────────────────────────────────────
   Bar List (horizontal gradient bars)
────────────────────────────────────────────── */
function BarList({ data, total, accent, mono = false }: { data: Record<string, number>; total: number; accent: string; mono?: boolean }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <EmptyState>No data yet.</EmptyState>;
  return (
    <div className="space-y-3.5">
      {entries.map(([key, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5 text-[12px]">
              <span className={`text-[var(--text-2)] ${mono ? "font-mono" : "font-medium"}`}>{key}</span>
              <span className="tabular-nums text-[var(--text-4)]">{count} <span className="text-[10px]">({pct}%)</span></span>
            </div>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                className="h-full rounded-full"
                style={{ background: accent }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Donut Chart (SVG)
────────────────────────────────────────────── */
const DONUT_COLORS: Record<string, string> = {
  done:           "#10b981",
  approved:       "#10b981",
  frozen:         "#ef4444",
  denied:         "#ef4444",
  awaiting_human: "#f59e0b",
  running:        "#8C52FF",
};

function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total   = entries.reduce((s, [, v]) => s + v, 0);
  if (total === 0) return <EmptyState>No status data.</EmptyState>;

  const R  = 58;
  const cx = 80;
  const cy = 80;
  let   cumAngle = -Math.PI / 2;
  const slices   = entries.map(([k, v]) => {
    const angle = (v / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { key: k, count: v, pct: Math.round((v / total) * 100), color: DONUT_COLORS[k] ?? "#8e8e98", x1, y1, x2, y2, large };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        {/* track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--surface-3)" strokeWidth="20" />
        {slices.map((s) => {
          const path = `M ${s.x1} ${s.y1} A ${R} ${R} 0 ${s.large} 1 ${s.x2} ${s.y2}`;
          return <path key={s.key} d={path} fill="none" stroke={s.color} strokeWidth="20" strokeLinecap="round" opacity={0.9} />;
        })}
        {/* centre label */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="font-bold" fill="var(--text-1)" fontSize="22" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-4)" fontSize="10">total</text>
      </svg>
      <div className="flex flex-col gap-2">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] text-[var(--text-3)] capitalize">{s.key.replace(/_/g, " ")}</span>
            <span className="ml-auto pl-4 text-[11px] font-semibold tabular-nums text-[var(--text-2)]">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Activity Table
────────────────────────────────────────────── */
function ActivityTable({ runs }: { runs: RunRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-vis)" }}>
            {["Run ID", "Summary", "Domain", "Started", "Status", ""].map((h) => (
              <th key={h} className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-4)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-3)] text-sm">
                No runs yet. Submit a request to start a workflow.
              </td>
            </tr>
          ) : (
            runs.slice(0, 12).map((run) => {
              const s = STATUS_STYLE[run.status];
              return (
                <tr
                  key={run.run_id}
                  className="transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--text-3)]">
                    {run.run_id.slice(0, 8)}…
                  </td>
                  <td className="max-w-[240px] truncate px-5 py-3.5 text-[12px] text-[var(--text-2)]">
                    {run.plan?.summary ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    {run.plan?.domain ? (
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a78bfa]"
                        style={{ background: "rgba(140,82,255,0.12)", border: "1px solid rgba(140,82,255,0.20)" }}>
                        {run.plan.domain}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--text-4)]">
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5">
                    {s ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize"
                        style={{ background: s.bg, color: s.text }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
                        {run.status.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-[var(--text-4)] text-[11px] capitalize">{run.status}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/dashboard/graph?run=${run.run_id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a78bfa] hover:text-[#c084fc] transition-colors"
                    >
                      Graph <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-[var(--text-3)]">{children}</p>;
}
