"use client";

import { useState, useEffect } from "react";
import { 
  Search, RefreshCw, Download, FileJson, FileSpreadsheet, 
  Terminal, ShieldCheck, Cpu, FileText, ChevronLeft, ChevronRight, X
} from "lucide-react";

interface Log {
  id: string;
  run_id: string;
  ts: string;
  department: string;
  level: string;
  agent: string;
  action: string;
  phase: string;
  status: string;
  tools_used: string[];
  output: string;
  reasoning: string;
  policy_citation?: string | null;
  veto_rule?: string | null;
  run_request: string;
  run_requester: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15"
      });
      if (search) params.append("q", search);
      if (statusFilter) params.append("status", statusFilter);
      if (deptFilter) params.append("dept", deptFilter);
      if (agentFilter) params.append("agent", agentFilter);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, deptFilter, agentFilter]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title & Exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border/60 pb-5 gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white">System Audit Trails</h1>
          <p className="text-xs text-gray-400 mt-1">
            Persisted ledger database of all agent inputs, generated code artifacts, and governance vetoes.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/logs/export?format=csv`}
            download
            className="btn-brutal !py-1.5 !px-3.5 !text-xs !bg-[var(--surface-soft)] text-white hover:bg-brand-teal/10 flex items-center gap-1.5 border border-brand-border"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </a>
          <a
            href={`/api/logs/export?format=json`}
            download
            className="btn-brutal !py-1.5 !px-3.5 !text-xs !bg-[var(--surface-soft)] text-white hover:bg-brand-teal/10 flex items-center gap-1.5 border border-brand-border"
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>JSON Export</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          
          {/* Search box */}
          <div className="flex-1 w-full relative flex items-center rounded-xl border border-brand-border bg-[var(--surface-soft)] px-3 focus-within:border-brand-teal/50">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search output text, reasoning, run ids..."
              className="w-full bg-transparent py-2.5 text-xs text-white placeholder-gray-500 outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="text-gray-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full md:w-36 rounded-xl border border-brand-border bg-brand-card/75 text-white text-xs px-3 py-2.5 outline-none focus:border-brand-teal/50 font-mono"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="w-full md:w-40 rounded-xl border border-brand-border bg-brand-card/75 text-white text-xs px-3 py-2.5 outline-none focus:border-brand-teal/50 font-mono"
          >
            <option value="">All Departments</option>
            <option value="Orchestrator">Orchestrator</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Procurement">Procurement</option>
            <option value="Finance">Finance</option>
            <option value="Governance">Governance</option>
          </select>

          {/* Refresh button */}
          <button
            type="submit"
            className="btn-brutal !py-2.5 !px-4 !text-xs text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

        </form>
      </div>

      {/* Logs Table Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Side: Logs Table */}
        <div className="lg:col-span-3 rounded-2xl border border-brand-border bg-brand-card/25 backdrop-blur-md p-6 flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border text-gray-400 font-mono font-bold">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">Run ID</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Agent</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center font-mono text-gray-500">
                      Querying agent ledgers...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center font-mono text-gray-500">
                      No logs found matching query vector.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className={`hover:bg-[var(--surface-soft)] transition-colors cursor-pointer ${
                          isSelected ? "bg-brand-teal/10" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 font-mono text-gray-400">
                          {new Date(log.ts).toLocaleTimeString()}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-white">{log.run_id}</td>
                        <td className="py-3.5 px-3">
                          <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[var(--surface-soft)] text-gray-400 border border-brand-border">
                            {log.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-white">{log.agent.replace("_", " ")}</td>
                        <td className="py-3.5 px-3 font-medium text-gray-300 max-w-[150px] truncate">
                          {log.action}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono ${
                            log.status === "success"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="flex items-center justify-between border-t border-brand-border/60 pt-4 mt-6">
            <span className="text-[10px] text-gray-500 font-mono">
              Showing {logs.length} of {totalItems} entries
            </span>
            
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-brand-border text-white bg-[var(--surface-soft)] hover:bg-brand-card disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-white font-bold">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-brand-border text-white bg-[var(--surface-soft)] hover:bg-brand-card disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Log Drawer Detail Panel */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-white border-b border-brand-border pb-3 flex items-center justify-between">
              <span>Log Inspector</span>
              {selectedLog && (
                <span className="text-[10px] text-gray-500 font-mono font-semibold uppercase">
                  {selectedLog.run_id}
                </span>
              )}
            </h3>

            {!selectedLog ? (
              <div className="py-20 text-center font-mono text-[11px] text-gray-500">
                Select a log row from the audit ledger table on the left to inspect variables, reasoning vectors, and executed actions.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
                
                {/* Request Context */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Original User Request</span>
                  <p className="text-xs text-white leading-relaxed font-mono bg-[var(--surface-soft)] p-2.5 rounded-xl border border-brand-border/60">
                    "{selectedLog.run_request}"
                  </p>
                  <span className="text-[8px] text-gray-500 font-mono block text-right">By {selectedLog.run_requester}</span>
                </div>

                {/* Level / Agent details */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 rounded-lg bg-[var(--surface-soft)] border border-brand-border/40">
                    <span className="text-gray-500 block">Agent Agent:</span>
                    <span className="text-white font-bold">{selectedLog.agent.replace("_", " ")}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--surface-soft)] border border-brand-border/40">
                    <span className="text-gray-500 block">Orchestrator Level:</span>
                    <span className="text-white font-bold">{selectedLog.level}</span>
                  </div>
                </div>

                {/* Agent output content */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Resulting Action Detail</span>
                  <div className="bg-[var(--surface-soft)] border border-brand-border/60 rounded-xl p-3.5">
                    <p className="text-xs text-gray-200 leading-relaxed font-mono whitespace-pre-line">
                      {selectedLog.output}
                    </p>
                  </div>
                </div>

                {/* Reasoning path */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Agent Reasoning Path</span>
                  <div className="bg-[var(--surface-soft)] border border-brand-border/40 rounded-xl p-3.5 text-gray-400">
                    <p className="text-[11px] leading-relaxed font-mono">
                      {selectedLog.reasoning}
                    </p>
                  </div>
                </div>

                {/* Tools used list */}
                {selectedLog.tools_used.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-500 font-mono">Executed Catalog Tools</span>
                    <div className="flex flex-wrap gap-1 font-mono">
                      {selectedLog.tools_used.map((tool) => (
                        <span key={tool} className="text-[9px] bg-brand-teal/10 border border-brand-teal/20 text-brand-teal px-2 py-0.5 rounded">
                          {tool}()
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Veto safety rules */}
                {selectedLog.veto_rule && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3.5 space-y-1 font-mono">
                    <span className="text-[9px] font-bold uppercase block">Governance Compliance Veto</span>
                    <p className="text-xs font-bold">{selectedLog.veto_rule}</p>
                    <p className="text-[10px] text-gray-400">Section: {selectedLog.policy_citation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedLog && (
            <button 
              onClick={() => setSelectedLog(null)}
              className="mt-6 flex items-center justify-center gap-1 text-[10px] font-bold text-gray-500 hover:text-white transition-colors py-2 border-t border-brand-border/40 w-full"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Inspector</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
