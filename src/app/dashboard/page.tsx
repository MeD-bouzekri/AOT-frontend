"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle2, AlertTriangle, Clock, Play, RefreshCw, 
  Activity, ArrowUpRight, ShieldCheck, HeartPulse
} from "lucide-react";

interface Step {
  id: string;
  department: string;
  level: string;
  agent: string;
  action: string;
  phase: string;
  status: string;
  output: string;
  ts: string;
}

interface Run {
  id: string;
  request: string;
  status: "completed" | "failed" | "running" | "pending_approval";
  requester: string;
  department: string;
  ts: string;
  duration_ms: number;
  steps: Step[];
}

export default function OverviewPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    running: 0,
    avgDuration: 0,
    autoApprovedRate: 100
  });

  const fetchRuns = async () => {
    try {
      const res = await fetch("/api/runs");
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
        calculateStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    // Poll for changes when a simulation is running
    const interval = setInterval(fetchRuns, 3000);
    return () => clearInterval(interval);
  }, []);

  const calculateStats = (runsList: Run[]) => {
    const total = runsList.length;
    const completed = runsList.filter(r => r.status === "completed").length;
    const failed = runsList.filter(r => r.status === "failed").length;
    const pending = runsList.filter(r => r.status === "pending_approval").length;
    const running = runsList.filter(r => r.status === "running").length;
    
    // Average duration for completed runs
    const completedRuns = runsList.filter(r => r.status === "completed" && r.duration_ms > 0);
    const avgDuration = completedRuns.length > 0 
      ? Math.round(completedRuns.reduce((sum, r) => sum + r.duration_ms, 0) / completedRuns.length) 
      : 0;

    // Auto approved = runs completed that did NOT trigger any manual intervention blocks
    const blockedCount = runsList.filter(r => 
      r.steps.some(s => s.action === "BLOCK" || s.action === "veto cleared")
    ).length;
    const autoApprovedRate = total > 0 
      ? Math.round(((total - blockedCount) / total) * 100) 
      : 100;

    setStats({
      total,
      completed,
      failed,
      pending,
      running,
      avgDuration,
      autoApprovedRate
    });
  };

  // Aggregate departmental stats
  const deptCounts: Record<string, number> = {};
  runs.forEach((r) => {
    const parts = r.department.split("/");
    parts.forEach((p) => {
      if (p) {
        deptCounts[p] = (deptCounts[p] || 0) + 1;
      }
    });
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Page Title & Refresh */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-5">
        <div>
          <h1 className="font-display text-2xl font-black text-white">System Operations</h1>
          <p className="text-xs text-gray-400 mt-1">
            Real-time telemetry, agent metrics, governance gate status, and multi-orchestrator activity.
          </p>
        </div>
        <button 
          onClick={() => { setLoading(true); fetchRuns(); }}
          className="btn-brutal !py-1.5 !px-3.5 !text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/35 backdrop-blur-md p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-full blur-2xl group-hover:bg-brand-teal/10 transition-all" />
          <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Total Workflows</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white font-display">{stats.total}</span>
            <span className="text-[10px] text-brand-teal font-semibold font-mono flex items-center gap-0.5">
              Active runs: {stats.running}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
            <Activity className="w-3.5 h-3.5 text-brand-teal" />
            <span>Telemetry running online</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/35 backdrop-blur-md p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Auto-Approve Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white font-display">{stats.autoApprovedRate}%</span>
            <span className="text-[10px] text-emerald-400 font-semibold font-mono">
              Target: &gt;80%
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Passed compliance policies</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/35 backdrop-blur-md p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Governance Blocks</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white font-display">{stats.failed + stats.pending}</span>
            <span className="text-[10px] text-amber-400 font-semibold font-mono flex items-center gap-0.5">
              Pending review: {stats.pending}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Veto constraints active</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/35 backdrop-blur-md p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-blue/5 rounded-full blur-2xl" />
          <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wider">Avg Resolution Time</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white font-display">{(stats.avgDuration / 1000).toFixed(1)}s</span>
            <span className="text-[10px] text-brand-blue font-semibold font-mono">
              -12% vs last week
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-brand-blue" />
            <span>Sub-second planner execution</span>
          </div>
        </div>

      </div>

      {/* Graphs & Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Widget: Department Volume Chart */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6 lg:col-span-2">
          <h3 className="font-display text-sm font-semibold text-white mb-4">Request Distribution by Department</h3>
          <div className="space-y-4">
            {["HR", "IT", "Procurement", "Finance"].map((dept) => {
              const count = deptCounts[dept] || 0;
              const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-bold">{dept} Team</span>
                    <span className="text-gray-400">{count} runs ({percent}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-brand-teal shadow-[0_0_8px_rgba(58,157,143,0.4)] transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Widget: Department Health status */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6">
          <h3 className="font-display text-sm font-semibold text-white mb-4">Department System Health</h3>
          <div className="grid grid-cols-2 gap-3">
            {["HR", "IT", "Procurement", "Finance"].map((dept) => (
              <div key={dept} className="p-3.5 rounded-xl border border-brand-border/60 bg-[var(--surface-soft)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{dept}</span>
                  <HeartPulse className="w-3.5 h-3.5 text-brand-teal" />
                </div>
                <div className="mt-4">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded">
                    Operational
                  </span>
                  <p className="text-[9px] text-gray-500 font-mono mt-1.5">SLA response: 100%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Live Runs Telemetry Table */}
      <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-sm font-semibold text-white">Live Workflow Activity</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Logs pipeline for current and past business orchestrations</p>
          </div>
          {stats.running > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-brand-teal font-mono bg-brand-teal/10 border border-brand-teal/20 px-2 py-0.5 rounded animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
              <span>{stats.running} running</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-brand-border text-gray-400 font-mono font-bold">
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Requested Action</th>
                <th className="py-3 px-4">Departments</th>
                <th className="py-3 px-4">Requester</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">View Graph</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400 font-mono">
                    No runs active. Send a request from the employee portal to kick off a pipeline.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="hover:bg-[var(--surface-soft)] transition-colors group">
                    <td className="py-4 px-4 font-mono font-semibold text-white">{run.id}</td>
                    <td className="py-4 px-4 font-medium max-w-[220px] truncate text-gray-300">{run.request}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1">
                        {run.department.split("/").map((d) => (
                          <span key={d} className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-brand-teal/15 text-brand-teal border border-brand-teal/20">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-gray-400">{run.requester}</td>
                    <td className="py-4 px-4 font-mono text-gray-400">
                      {new Date(run.ts).toLocaleTimeString()} ({new Date(run.ts).toLocaleDateString()})
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        run.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : run.status === "failed"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : run.status === "pending_approval"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-brand-teal/10 text-brand-teal border border-brand-teal/20 animate-pulse"
                      }`}>
                        <span className={`w-1.2 h-1.2 rounded-full ${
                          run.status === "completed"
                            ? "bg-emerald-400"
                            : run.status === "failed"
                            ? "bg-red-400"
                            : run.status === "pending_approval"
                            ? "bg-amber-400"
                            : "bg-brand-teal"
                        }`} />
                        {run.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link 
                        href={`/dashboard/graph?run=${run.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-teal hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Graph View</span>
                        <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
