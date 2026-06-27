"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Users, UserPlus, ShieldCheck, Copy, Check, AlertTriangle, RefreshCw, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";

// Mirrors the gateway's ASSIGNABLE_ROLES / DEPT_FOR_ROLE (admin.py).
const ROLE_OPTIONS: { value: string; label: string; dept?: string }[] = [
  { value: "company_admin", label: "Company Admin" },
  { value: "hr_admin", label: "HR Admin", dept: "hr" },
  { value: "it_admin", label: "IT Admin", dept: "it" },
  { value: "finance_admin", label: "Finance Admin", dept: "finance" },
  { value: "ciso", label: "CISO (security veto)" },
  { value: "cfo", label: "CFO (spend veto)" },
  { value: "dpo", label: "DPO (privacy veto)" },
  { value: "requester", label: "Requester" },
];
const DEPARTMENTS = ["hr", "it", "finance"];

interface RealmUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  roles: string[];
  department: string | null;
}

interface CreatedUser {
  username: string;
  roles: string[];
  department: string | null;
  temporary_password: string;
}

export default function AccountsPage() {
  const { principal } = useAuth();
  const [users, setUsers] = useState<RealmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [created, setCreated] = useState<CreatedUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setUsers(await api<RealmUser[]>("/api/admin/users"));
    } catch (e) {
      setLoadError(
        e instanceof ApiError ? e.message : "Failed to load users.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Defence in depth: the gateway already enforces company_admin, but hide
  // the surface from anyone who somehow reaches the route.
  if (principal && !principal.isCompanyAdmin) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center">
        <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h1 className="font-display text-xl font-bold text-white">
          Restricted
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Only the company administrator can manage accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* header */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-5">
        <div>
          <h1 className="font-display text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-teal" />
            Accounts
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create accounts and assign roles. New users reset their password on
            first sign-in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchUsers()}
            className="btn-brutal !py-1.5 !px-3.5 !text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => { setCreated(null); setShowForm(true); }}
            className="btn-brutal !py-1.5 !px-3.5 !text-xs !bg-brand-teal text-white flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New account</span>
          </button>
        </div>
      </div>

      {/* one-time temp-password banner */}
      {created && (
        <CreatedBanner created={created} onClose={() => setCreated(null)} />
      )}

      {/* users table */}
      <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6">
        {loadError ? (
          <div className="flex items-center gap-2 text-sm text-red-400 font-mono py-6 justify-center">
            <AlertTriangle className="w-4 h-4" /> {loadError}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border text-gray-400 font-mono font-bold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 font-mono">
                      Loading…
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 font-mono">
                      No users yet.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--surface-soft)] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">{u.username}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles
                            .filter((r) => ROLE_OPTIONS.some((o) => o.value === r))
                            .map((r) => (
                              <span key={r} className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-brand-teal/15 text-brand-teal border border-brand-teal/20">
                                {r}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-400">
                        {u.department ?? "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.enabled
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                        }`}>
                          {u.enabled ? "Active" : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CreateUserModal
          onClose={() => setShowForm(false)}
          onCreated={(c) => {
            setCreated(c);
            setShowForm(false);
            void fetchUsers();
          }}
        />
      )}
    </div>
  );
}

// ── one-time password banner ──
function CreatedBanner({
  created,
  onClose,
}: {
  created: CreatedUser;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(created.temporary_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4" /> Account created — {created.username}
          </h3>
          <p className="text-xs text-emerald-200/70 mt-1">
            Share this one-time password securely. It is shown only now and the
            user must change it at first sign-in.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="font-mono text-sm bg-brand-bg/60 border border-emerald-500/30 rounded-lg px-3 py-1.5 text-white">
              {created.temporary_password}
            </code>
            <button
              onClick={copy}
              className="p-2 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15 transition-colors"
              title="Copy"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-emerald-300/60 hover:text-emerald-200">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── create-user modal ──
function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: CreatedUser) => void;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // a dept-scoped role fixes the department automatically
  const impliedDept = roles
    .map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.dept)
    .find(Boolean);
  const deptLocked = Boolean(impliedDept);
  const effectiveDept = impliedDept ?? department;

  const toggleRole = (value: string) =>
    setRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value],
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (roles.length === 0) {
      setError("Select at least one role.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<CreatedUser>("/api/admin/users", {
        method: "POST",
        body: {
          username,
          email,
          first_name: firstName,
          last_name: lastName,
          roles,
          department: effectiveDept || null,
        },
      });
      onCreated(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create account.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-card/95 backdrop-blur-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-teal" /> New account
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="First name" value={firstName} onChange={setFirstName} required />
            <ModalField label="Last name" value={lastName} onChange={setLastName} required />
          </div>
          <ModalField
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="e.g. karim.belkacem"
            required
          />
          <ModalField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="name@company.ia"
            required
          />

          {/* roles */}
          <div>
            <label className="text-xs font-bold text-gray-300 mb-2 block">Roles</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => toggleRole(opt.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    roles.includes(opt.value)
                      ? "border-brand-teal/50 bg-brand-teal/15 text-brand-teal"
                      : "border-brand-border bg-[var(--surface-soft)] text-gray-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* department */}
          <div>
            <label className="text-xs font-bold text-gray-300 mb-2 block">
              Department {deptLocked && <span className="text-gray-500 font-normal">(set by role)</span>}
            </label>
            <select
              value={effectiveDept}
              disabled={deptLocked}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-brand-border bg-[var(--surface-soft)] px-3 py-2 text-sm text-white outline-none focus:border-brand-teal/60 disabled:opacity-60"
            >
              <option value="">None</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="text-xs font-mono text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-brand-border text-xs font-bold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-brutal !py-2 !px-4 !text-xs !bg-brand-teal text-white disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-300 mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-brand-border bg-[var(--surface-soft)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-brand-teal/60"
      />
    </label>
  );
}
