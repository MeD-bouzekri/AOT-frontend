"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RefreshCw, ArrowUpRight, CheckCircle2, Snowflake, Clock3, Activity,
  TrendingUp, TrendingDown, Minus, FileText, ShieldCheck, Layers,
  BarChart2, AlertCircle,
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

const STATUS_META: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  done:           { bg: "rgba(16,185,129,0.10)",  text: "#10b981", dot: "#10b981", label: "Done" },
  frozen:         { bg: "rgba(239,68,68,0.10)",   text: "#ef4444", dot: "#ef4444", label: "Frozen" },
  denied:         { bg: "rgba(239,68,68,0.10)",   text: "#ef4444", dot: "#ef4444", label: "Denied" },
  awaiting_human: { bg: "rgba(245,158,11,0.10)",  text: "#f59e0b", dot: "#f59e0b", label: "Awaiting Review" },
  running:        { bg: "rgba(140,82,255,0.12)",   text: "#a78bfa", dot: "#8C52FF", label: "Running" },
};

function stagger(i: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.065, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] },
  };
}

export default function RequestsPage() {
  const { principal } = useAuth();
  const [stats, setStats]     = useState<OverviewStats | null>(null);
  const [runs, setRuns]       = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const sparkRef              = useRef<number[]>([]);

  const fetchAll = useCallback(async () => {
    setError("");
    try {
      const [s, r] = await Promise.all([
        api<OverviewStats>("/api/stats/overview"),
        api<RunRow[]>("/api/runs"),
      ]);
      setStats(s);
      setRuns(r);
      sparkRef.current = [...sparkRef.current, s.kpis.total_requests].slice(-12);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
    const id = setInterval(fetchAll, 5000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const k           = stats?.kpis;
  const total       = k?.total_requests ?? 0;
  const approveRate = total > 0 ? Math.round(((k?.approved ?? 0) / total) * 100) : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-1)]">
            Requests
          </h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            {principal?.scope === "ALL"
              ? `All departments · ${today}`
              : `${principal?.scope?.toUpperCase() ?? ""} department · ${today}`}
          </p>
        </div>
        <button
          onClick={() => void fetchAll()}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-2)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-1)] hover:shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.div>

      {/* ── Error banner ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

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
          label="Approval Rate"
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
          trend={(k?.frozen ?? 0) === 0 ? "up" : "down"}
        />
        <KpiCard
          idx={4}
          label="Awaiting Review"
          value={k?.awaiting_human ?? 0}
          icon={<Clock3 className="h-4 w-4" />}
          hint="pending human approval"
          accent="#f59e0b"
        />
      </div>

      {/* ── Middle Row: Domain dist + Governance blocks ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel idx={5} title="By Domain" subtitle="Request distribution" icon={<Layers className="h-4 w-4" />} className="lg:col-span-1">
          <BarList data={stats?.by_domain ?? {}} total={total} accent="#8C52FF" />
        </Panel>
        <Panel idx={6} title="Governance Blocks" subtitle="Blocks by policy rule" icon={<ShieldCheck className="h-4 w-4" />} className="lg:col-span-2">
          {Object.keys(stats?.blocks_by_rule ?? {}).length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-5 w-5" />}>No governance blocks recorded.</EmptyState>
          ) : (
            <BarList data={stats?.blocks_by_rule ?? {}} total={Object.values(stats?.blocks_by_rule ?? {}).reduce((a, b) => a + b, 0)} accent="#ef4444" mono />
          )}
        </Panel>
      </div>

      {/* ── Bottom Row: Status donut + Recent runs ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel idx={7} title="Status Breakdown" subtitle="All time" icon={<BarChart2 className="h-4 w-4" />} className="lg:col-span-1">
          <DonutChart data={stats?.by_status ?? {}} />
        </Panel>
        <Panel idx={8} title="Recent Activity" subtitle="Last 12 runs" icon={<FileText className="h-4 w-4" />} className="lg:col-span-2" noPad>
          <ActivityTable runs={runs} />
        </Panel>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────
   KPI Card
───────────────────────────────────────── */
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.065, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="group relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 overflow-hidden transition-all duration-300 hover:border-[var(--border-strong)] hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* subtle accent gradient on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{ background: `radial-gradient(180px circle at 50% -20%, ${accent}11, transparent 70%)` }}
      />

      <div className="relative z-10">
        {/* Top row: label + icon */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-4)]">{label}</span>
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200"
            style={{ background: `${accent}18`, color: accent }}
          >
            {icon}
          </span>
        </div>

        {/* Value + trend */}
        <div className="flex items-end justify-between">
          <span className="font-display text-[30px] font-bold leading-none tabular-nums text-[var(--text-1)]">
            {value}
          </span>
          {trend && (
            <span
              className="flex items-center gap-0.5 text-[11px] font-semibold pb-1"
              style={{ color: trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "var(--text-4)" }}
            >
              {trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : trend === "down" ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
            </span>
          )}
        </div>

        {/* Hint */}
        <div className="mt-1 text-[11px] text-[var(--text-4)]">{hint}</div>

        {/* Spark bars */}
        {sparkData && sparkData.length > 2 && (
          <div className="mt-4 flex items-end gap-[2px] h-7">
            {sparkData.map((v, i) => {
              const max = Math.max(...sparkData, 1);
              const h   = Math.max(3, Math.round((v / max) * 28));
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{
                    height: h,
                    background: accent,
                    opacity: i === sparkData.length - 1 ? 1 : 0.25 + (i / sparkData.length) * 0.55,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Panel (card wrapper)
───────────────────────────────────────── */
function Panel({
  idx, title, subtitle, children, className = "", noPad = false, icon,
}: {
  idx: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.065, duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={`rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] transition-all duration-300 hover:border-[var(--border-strong)] ${className}`}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-vis)" }}
      >
        {icon && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-4)]"
            style={{ background: "var(--surface-3)" }}>
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] font-semibold text-[var(--text-1)]">{title}</h2>
          {subtitle && <p className="text-[11px] text-[var(--text-4)] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </motion.section>
  );
}

/* ─────────────────────────────────────────
   Bar List
───────────────────────────────────────── */
function BarList({ data, total, accent, mono = false }: {
  data: Record<string, number>;
  total: number;
  accent: string;
  mono?: boolean;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <EmptyState icon={<BarChart2 className="h-5 w-5" />}>No data yet.</EmptyState>;
  return (
    <div className="space-y-3">
      {entries.map(([key, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5 text-[12px]">
              <span className={`text-[var(--text-2)] ${mono ? "font-mono text-[11px]" : "font-medium"}`}>{key}</span>
              <span className="tabular-nums text-[var(--text-4)] font-mono text-[11px]">
                {count} <span className="opacity-60">({pct}%)</span>
              </span>
            </div>
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${accent}cc, ${accent})` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   Donut Chart
───────────────────────────────────────── */
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
  if (total === 0) return <EmptyState icon={<BarChart2 className="h-5 w-5" />}>No status data yet.</EmptyState>;

  const R  = 52;
  const cx = 72;
  const cy = 72;
  let   cumAngle = -Math.PI / 2;

  const slices = entries.map(([k, v]) => {
    const angle = (v / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return {
      key: k,
      count: v,
      pct: Math.round((v / total) * 100),
      color: DONUT_COLORS[k] ?? "#6b6b7a",
      x1, y1, x2, y2, large,
      label: STATUS_META[k]?.label ?? k.replace(/_/g, " "),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <svg width="144" height="144" viewBox="0 0 144 144">
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--surface-3)" strokeWidth="18" />
          {slices.map((s) => {
            const path = `M ${s.x1} ${s.y1} A ${R} ${R} 0 ${s.large} 1 ${s.x2} ${s.y2}`;
            return (
              <path
                key={s.key}
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth="18"
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}
          <text x={cx} y={cy - 7} textAnchor="middle" fill="var(--text-1)" fontSize="22" fontWeight="700">{total}</text>
          <text x={cx} y={cy + 11} textAnchor="middle" fill="var(--text-4)" fontSize="10">total</text>
        </svg>
      </div>
      <div className="space-y-2">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="text-[11px] text-[var(--text-3)] flex-1 capitalize">{s.label}</span>
            <span className="text-[11px] font-semibold tabular-nums text-[var(--text-2)]">{s.count}</span>
            <span className="text-[10px] text-[var(--text-4)] w-8 text-right">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Activity Table
───────────────────────────────────────── */
function ActivityTable({ runs }: { runs: RunRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-vis)" }}>
            {["Run ID", "Summary", "Domain", "Started", "Status", ""].map((h) => (
              <th
                key={h}
                className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap"
              >
                {h}
              </th>
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
            runs.slice(0, 12).map((run, idx) => {
              const s = STATUS_META[run.status];
              return (
                <motion.tr
                  key={run.run_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group transition-colors"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--text-3)]">
                    <span className="bg-[var(--surface-3)] rounded px-1.5 py-0.5 border border-[var(--border)]">
                      {run.run_id.slice(0, 8)}…
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3.5 text-[12px] text-[var(--text-2)]">
                    {run.plan?.summary ?? <span className="text-[var(--text-4)]">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {run.plan?.domain ? (
                      <span
                        className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a78bfa]"
                        style={{ background: "rgba(140,82,255,0.12)", border: "1px solid rgba(140,82,255,0.20)" }}
                      >
                        {run.plan.domain}
                      </span>
                    ) : <span className="text-[var(--text-4)]">—</span>}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--text-4)] whitespace-nowrap">
                    {new Date(run.started_at).toLocaleString(undefined, {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    {s ? (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                        style={{ background: s.bg, color: s.text }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
                        {s.label}
                      </span>
                    ) : (
                      <span className="text-[var(--text-4)] text-[11px] capitalize">{run.status}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/dashboard/graph?run=${run.run_id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#a78bfa] opacity-0 group-hover:opacity-100 hover:text-[#c084fc] transition-all"
                    >
                      View <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </motion.tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {icon && <span className="text-[var(--text-4)] opacity-40">{icon}</span>}
      <p className="text-sm text-[var(--text-3)]">{children}</p>
    </div>
  );
}
