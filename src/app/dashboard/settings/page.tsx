"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Settings, ShieldCheck, Save, RefreshCw, AlertTriangle, CheckCircle2, Lock,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/console/PageHeader";

interface HardRule {
  id: string;
  domain: string;
  description: string;
  action: "block" | "halt";
  message: string;
  required_authority: string;
  enabled: boolean;
}
interface SettingsData {
  thresholds: Record<string, number>;
  hard_rules: HardRule[];
  authorities: Record<string, string[]>;
  company: { name?: string; industry?: string; size?: string };
  default_llm?: { provider: string; model?: string } | null;
}

const THRESHOLD_LABELS: Record<string, string> = {
  auto_approve_spend_limit: "Auto-approve limit",
  manager_spend_limit: "Manager limit",
  director_spend_limit: "Director limit",
  hard_spend_ceiling: "Hard ceiling",
  max_vendor_risk_score: "Max vendor risk",
};

export default function GovernancePage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const s = await api<SettingsData>("/api/settings");
      setData(s);
      setThresholds(s.thresholds ?? {});
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  const saveThresholds = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api("/api/settings/thresholds", { method: "PUT", body: { thresholds } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <PageHeader
        icon={<Settings className="h-[18px] w-[18px]" />}
        title="Governance"
        subtitle="Spend thresholds and the deterministic policy rules every request is evaluated against."
        actions={
          <button onClick={() => void fetchSettings()} className="btn-brutal-ghost !py-1.5 !px-3 text-[13px]">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* company strip */}
      {data?.company?.name && (
        <div className="rounded-xl border border-[var(--border)] accent-wash p-5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-4)]">Company</span>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-lg font-semibold text-[var(--text-1)]">{data.company.name}</span>
            {data.company.industry && <span className="text-sm text-[var(--text-3)]">{data.company.industry}</span>}
            {data.company.size && <span className="text-sm text-[var(--text-3)]">· {data.company.size}</span>}
          </div>
        </div>
      )}

      {/* thresholds */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-[var(--text-1)]">Spend thresholds</h2>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button onClick={saveThresholds} disabled={saving} className="btn-brutal !py-1.5 !px-3 text-[13px]">
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {Object.entries(thresholds).map(([key, val]) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[var(--text-2)]">
                {THRESHOLD_LABELS[key] ?? key.replace(/_/g, " ")}
              </label>
              <input
                type="number"
                value={val}
                onChange={(e) => setThresholds((t) => ({ ...t, [key]: Number(e.target.value) }))}
                className="input-base font-mono tabular-nums"
              />
            </div>
          ))}
          {loading && Object.keys(thresholds).length === 0 && (
            <p className="text-sm text-[var(--text-3)]">Loading…</p>
          )}
        </div>
      </section>

      {/* hard rules (read-only list) */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="border-b border-[var(--border)] px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-1)]">
            <ShieldCheck className="h-4 w-4 text-[var(--accent-token)]" />
            Hard rules
            <span className="text-xs font-normal text-[var(--text-4)]">
              · deterministic, un-bypassable
            </span>
          </h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {(data?.hard_rules ?? []).map((rule) => (
            <div key={rule.id} className="flex items-start gap-4 px-5 py-4">
              <span className={`mt-0.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
                rule.action === "halt"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}>
                {rule.id}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-1)]">{rule.description}</p>
                <p className="mt-0.5 text-xs text-[var(--text-3)]">{rule.message}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--text-3)]">
                <Lock className="h-3.5 w-3.5" />
                <span className="font-mono">{rule.required_authority}</span>
              </div>
            </div>
          ))}
          {!loading && (data?.hard_rules ?? []).length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-[var(--text-3)]">No rules configured.</p>
          )}
        </div>
      </section>
    </div>
  );
}
