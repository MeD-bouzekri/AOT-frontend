"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Sparkles, Layers, RefreshCw, Search, ShieldAlert,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Employee {
  employee_code: string;
  name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  seniority: string | null;
  employment_type: string | null;
  location: string | null;
  national_id: string | null;
  salary: string | null;
  contract_type: string | null;
  start_date: string | null;
  status: string;
  onboarded: boolean;
  source_run_id: string | null;
  created_at: string;
}

const DEPT_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  hr: { text: "#a78bfa", bg: "rgba(140,82,255,0.08)", border: "rgba(140,82,255,0.2)" },
  it: { text: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
  finance: { text: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  engineering: { text: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
};

function formatEmploymentType(type: string | null) {
  if (!type) return "—";
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDept(dept: string | null) {
  if (!dept) return "—";
  if (dept.length <= 3) return dept.toUpperCase();
  return dept.charAt(0).toUpperCase() + dept.slice(1);
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<Employee[]>("/api/employees");
      setEmployees(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load employee directory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
    const interval = setInterval(fetchEmployees, 10000);
    return () => clearInterval(interval);
  }, [fetchEmployees]);

  // Derived filters
  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  ) as string[];

  const filteredEmployees = employees.filter((emp) => {
    const matchesQuery =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email?.toLowerCase() ?? "").includes(searchQuery.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.national_id?.toLowerCase() ?? "").includes(searchQuery.toLowerCase());

    const matchesDept =
      deptFilter === "all" ||
      (emp.department?.toLowerCase() === deptFilter.toLowerCase());

    return matchesQuery && matchesDept;
  });

  const totalCount = employees.length;
  const onboardedCount = employees.filter((e) => e.onboarded).length;
  const deptCount = departments.length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-1)]">
            Employees
          </h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">
            Company directory — onboarded hires are added automatically.
          </p>
        </div>
        <button
          onClick={() => void fetchEmployees()}
          className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-[12px] font-medium text-[var(--text-2)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-1)] hover:shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#f87171" }}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-4)]">Total Staff</span>
            <p className="font-display text-[26px] font-bold leading-none text-[var(--text-1)] mt-2">{totalCount}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-3)]">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-4)]">System Onboarded</span>
            <p className="font-display text-[26px] font-bold leading-none text-[var(--text-1)] mt-2">{onboardedCount}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-[var(--surface-3)] flex items-center justify-center text-[#8C52FF]">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-4)]">Departments</span>
            <p className="font-display text-[26px] font-bold leading-none text-[var(--text-1)] mt-2">{deptCount}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-3)]">
            <Layers className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* ── Search and Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-4)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, code or National ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-1)] placeholder:text-[var(--text-4)] outline-none focus:border-[#8C52FF] transition-all"
          />
        </div>

        {/* Department Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text-2)] outline-none focus:border-[#8C52FF] transition-all cursor-pointer"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {formatDept(dept)}
            </option>
          ))}
        </select>
      </div>

      {/* ── Directory Table ── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-vis)" }} className="bg-[var(--surface-2)]">
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">Code</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">Name</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">Role</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">Department</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">Type</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">National ID</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">Status</th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-4)] whitespace-nowrap">Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading && employees.length === 0 ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, cellIdx) => (
                      <td key={cellIdx} className="px-5 py-4">
                        <div className="h-3.5 w-16 bg-[var(--surface-3)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-[var(--text-3)]">
                    No employees yet.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const deptColors = emp.department ? DEPT_COLORS[emp.department.toLowerCase()] : null;
                  return (
                    <tr
                      key={emp.employee_code}
                      className={`transition-colors hover:bg-[var(--surface-2)] ${
                        emp.onboarded ? "bg-[rgba(140,82,255,0.02)]" : ""
                      }`}
                    >
                      {/* Code */}
                      <td className={`px-5 py-4 font-mono text-[11px] text-[var(--text-3)] ${
                        emp.onboarded ? "border-l-[3px] border-[#8C52FF] pl-4" : ""
                      }`}>
                        {emp.employee_code}
                      </td>

                      {/* Name & Email */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-semibold text-[var(--text-1)]">{emp.name}</div>
                        {emp.email && <div className="text-[11px] text-[var(--text-4)] mt-0.5">{emp.email}</div>}
                      </td>

                      {/* Role */}
                      <td className="px-5 py-4 text-[var(--text-2)] whitespace-nowrap">
                        {emp.role || "—"}
                      </td>

                      {/* Department badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {emp.department ? (
                          <span
                            className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{
                              color: deptColors?.text ?? "var(--text-3)",
                              backgroundColor: deptColors?.bg ?? "var(--surface-3)",
                              border: `1px solid ${deptColors?.border ?? "var(--border)"}`,
                            }}
                          >
                            {formatDept(emp.department)}
                          </span>
                        ) : (
                          <span className="text-[var(--text-4)]">—</span>
                        )}
                      </td>

                      {/* Employment Type */}
                      <td className="px-5 py-4 text-[var(--text-3)] whitespace-nowrap">
                        {formatEmploymentType(emp.employment_type)}
                      </td>

                      {/* National ID */}
                      <td className="px-5 py-4 font-mono text-[11px] text-[var(--text-3)] whitespace-nowrap">
                        {emp.national_id || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {emp.status}
                        </span>
                      </td>

                      {/* Onboarded badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {emp.onboarded ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold text-[#8C52FF] border border-[#8C52FF]/25 bg-[rgba(140,82,255,0.08)]"
                          >
                            <Sparkles className="w-3 h-3" />
                            Onboarded
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium text-[var(--text-4)] border border-[var(--border)] bg-[var(--surface-2)]">
                            Seed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
