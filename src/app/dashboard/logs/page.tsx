"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ListCollapse, Search, RefreshCw, X, ChevronLeft, ChevronRight, ShieldAlert,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/console/PageHeader";

interface LogRow {
  id: string;
  ts: string;
  run_id: string;
  department: string;
  agent: string;
  action: string;
  status: string;
  tools_used: string[];
  output: string | null;
  reasoning: string | null;
  policy_citation: string | null;
}

const LIMIT = 15;

const STATUS_TONE: Record<string, string> = {
  done: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  blocked: "text-red-600 dark:text-red-400 bg-red-500/10",
  running: "text-[var(--accent-token)] bg-[var(--accent-quiet)]",
  awaiting_human: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
};

export default function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<LogRow | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(offset) });
      if (appliedSearch) params.set("q", appliedSearch);
      if (statusFilter) params.set("status", statusFilter);
      const data = await api<{ total: number; items: LogRow[] }>(`/api/logs?${params}`);
      setRows(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, [offset, appliedSearch, statusFilter]);

  useEffect(() => { void fetchLogs(); }, [fetchLogs]);

  const page = Math.floor(offset / LIMIT) + 1;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        icon={<ListCollapse className="h-[18px] w-[18px]" />}
        title="Audit Logs"
        subtitle="Immutable ledger of every agent step — inputs, outputs, reasoning, and governance citations."
        actions={
          <button
            onClick={() => void fetchLogs()}
            className="btn-brutal-ghost !py-1.5 !px-3 text-[13px]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <form
          onSubmit={(e) => { e.preventDefault(); setOffset(0); setAppliedSearch(search); }}
          className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3"
        >
          <Search className="h-4 w-4 text-[var(--text-4)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search output or reasoning…"
            className="w-full bg-transparent py-2.5 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--text-4)]"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setAppliedSearch(""); setOffset(0); }} aria-label="Clear">
              <X className="h-3.5 w-3.5 text-[var(--text-4)] hover:text-[var(--text-1)]" />
            </button>
          )}
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setOffset(0); }}
          className="input-base sm:w-44 text-[13px]"
        >
          <option value="">All statuses</option>
          <option value="done">Done</option>
          <option value="running">Running</option>
          <option value="blocked">Blocked</option>
          <option value="awaiting_human">Awaiting human</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-wide text-[var(--text-4)]">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Dept</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : rows.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-[var(--text-3)]">No log entries.</td></tr>
                ) : (
                  rows.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelected(log)}
                      className={`cursor-pointer border-b border-[var(--border)] last:border-0 transition-colors ${
                        selected?.id === log.id ? "bg-[var(--accent-quiet)]" : "hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--text-3)]">
                        {new Date(log.ts).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-1)]">{log.agent.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[11px] text-[var(--text-3)]">
                          {log.department}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusTag status={log.status} citation={log.policy_citation} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-xs text-[var(--text-3)]">
            <span className="tabular-nums">
              {total === 0 ? "0" : offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--surface-3)]"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 tabular-nums">{page} / {pages}</span>
              <button
                disabled={page >= pages}
                onClick={() => setOffset((o) => o + LIMIT)}
                className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--surface-3)]"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* inspector */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
            <span className="text-[13px] font-semibold text-[var(--text-1)]">Log Inspector</span>
            {selected && (
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-[var(--text-4)] hover:text-[var(--text-1)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="p-5">
            {!selected ? (
              <p className="py-12 text-center text-sm text-[var(--text-3)]">
                Select a log entry to inspect its output, reasoning, and tools.
              </p>
            ) : (
              <div className="space-y-4 text-sm">
                <Meta label="Run" value={selected.run_id} mono />
                <Meta label="Agent" value={selected.agent.replace(/_/g, " ")} />
                <Meta label="Action" value={selected.action || "—"} />

                {selected.output && (
                  <Block label="Output">{selected.output}</Block>
                )}
                {selected.reasoning && (
                  <Block label="Reasoning" muted>{selected.reasoning}</Block>
                )}
                {selected.tools_used?.length > 0 && (
                  <div>
                    <Label>Tools used</Label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {selected.tools_used.map((t) => (
                        <span key={t} className="rounded bg-[var(--accent-quiet)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--accent-token)]">
                          {t}()
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.policy_citation && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-red-600 dark:text-red-400">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide">Governance citation</p>
                      <p className="mt-0.5 font-mono text-sm">{selected.policy_citation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTag({ status, citation }: { status: string; citation: string | null }) {
  const tone = STATUS_TONE[status] ?? "text-[var(--text-3)] bg-[var(--surface-3)]";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${tone}`}>
        {status.replace(/_/g, " ")}
      </span>
      {citation && (
        <span className="rounded bg-red-500/10 px-1 py-0.5 font-mono text-[10px] font-semibold text-red-600 dark:text-red-400">
          {citation}
        </span>
      )}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-[var(--border)] last:border-0">
          {Array.from({ length: 4 }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <div className="h-3 w-full max-w-[90px] animate-pulse rounded bg-[var(--surface-3)]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-4)]">{children}</span>;
}
function Meta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[var(--text-3)]">{label}</span>
      <span className={`text-right text-[var(--text-1)] ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
function Block({ label, children, muted = false }: { label: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className={`mt-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 font-mono text-[12px] leading-relaxed whitespace-pre-line ${muted ? "text-[var(--text-3)]" : "text-[var(--text-2)]"}`}>
        {children}
      </div>
    </div>
  );
}
