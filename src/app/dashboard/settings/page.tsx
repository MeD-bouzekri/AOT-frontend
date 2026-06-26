"use client";

import { useState, useEffect } from "react";
import { 
  Settings, ShieldCheck, HeartPulse, History, ArrowRight, 
  CheckCircle2, RefreshCw, HelpCircle, Activity 
} from "lucide-react";

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  authority: string;
}

interface PolicyHistoryItem {
  version: number;
  ts: string;
  changed_by: string;
  change_summary: string;
}

interface SettingsData {
  auto_approve_spend_limit: number;
  manager_spend_limit: number;
  director_spend_limit: number;
  hard_spend_ceiling: number;
  max_risk_score: number;
  mode: "DEMO" | "LIVE";
  default_llm: string;
  active_departments: string[];
  rules: Rule[];
  policy_history: PolicyHistoryItem[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");
  const [adminEmail, setAdminEmail] = useState("admin@gmail.com");

  // Form input bindings
  const [autoLimit, setAutoLimit] = useState(1000);
  const [managerLimit, setManagerLimit] = useState(5000);
  const [directorLimit, setDirectorLimit] = useState(10000);
  const [hardCeiling, setHardCeiling] = useState(20000);
  const [riskScore, setRiskScore] = useState(75);
  const [mode, setMode] = useState<"DEMO" | "LIVE">("DEMO");
  const [defaultLlm, setDefaultLlm] = useState("claude");
  const [depts, setDepts] = useState<string[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    const email = localStorage.getItem("userEmail");
    if (email) setAdminEmail(email);
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data: SettingsData = await res.json();
        setSettings(data);
        
        // Populate inputs
        setAutoLimit(data.auto_approve_spend_limit);
        setManagerLimit(data.manager_spend_limit);
        setDirectorLimit(data.director_spend_limit);
        setHardCeiling(data.hard_spend_ceiling);
        setRiskScore(data.max_risk_score);
        setMode(data.mode);
        setDefaultLlm(data.default_llm);
        setDepts(data.active_departments || []);
        setRules(data.rules || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRuleToggle = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
  };

  const handleDeptToggle = (dept: string) => {
    setDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changeSummary.trim()) {
      alert("Please provide a policy change summary comment for version auditing.");
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_approve_spend_limit: autoLimit,
          manager_spend_limit: managerLimit,
          director_spend_limit: directorLimit,
          hard_spend_ceiling: hardCeiling,
          max_risk_score: riskScore,
          mode,
          default_llm: defaultLlm,
          active_departments: depts,
          rules,
          changed_by: adminEmail,
          change_summary: changeSummary
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setChangeSummary("");
        alert("Governance parameters and policy version updated successfully!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="font-display text-2xl font-black text-white">Governance Policies</h1>
        <p className="text-xs text-gray-400 mt-1">
          Define financial thresholds, togglable validation rules, and review historical policy updates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Main Settings Form Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6">
          {loading ? (
            <div className="py-20 text-center font-mono text-[11px] text-gray-500">
              Querying corporate policy stores...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6 font-mono text-xs">
              
              {/* Financial Thresholds */}
              <div className="space-y-4">
                <h3 className="font-display text-sm font-semibold text-white border-b border-brand-border/50 pb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-brand-teal" />
                  <span>Spend Governance limits</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-gray-400 font-bold uppercase">Auto-Approve limit ($)</label>
                    <input
                      type="number"
                      value={autoLimit}
                      onChange={(e) => setAutoLimit(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 font-bold uppercase">Manager spend limit ($)</label>
                    <input
                      type="number"
                      value={managerLimit}
                      onChange={(e) => setManagerLimit(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 font-bold uppercase">Director spend limit ($)</label>
                    <input
                      type="number"
                      value={directorLimit}
                      onChange={(e) => setDirectorLimit(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-gray-400 font-bold uppercase">Hard spend ceiling ($)</label>
                    <input
                      type="number"
                      value={hardCeiling}
                      onChange={(e) => setHardCeiling(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles for Rules */}
              <div className="space-y-4 pt-4 border-t border-brand-border/40">
                <h3 className="font-display text-sm font-semibold text-white pb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 text-brand-teal" />
                  <span>Rule compliance vectors</span>
                </h3>

                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-[var(--surface-soft)]">
                      <div className="space-y-0.5 max-w-[80%]">
                        <span className="text-white font-bold">{rule.id}: {rule.name}</span>
                        <span className="text-[10px] text-gray-500 block">Required authority tier: {rule.authority}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={() => handleRuleToggle(rule.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-teal peer-checked:after:bg-white" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Checkboxes */}
              <div className="space-y-3 pt-4 border-t border-brand-border/40">
                <h3 className="font-display text-sm font-semibold text-white">Active Business departments</h3>
                <div className="flex flex-wrap gap-2">
                  {["HR", "IT", "Finance", "Procurement"].map((dept) => {
                    const isChecked = depts.includes(dept);
                    return (
                      <button
                        type="button"
                        key={dept}
                        onClick={() => handleDeptToggle(dept)}
                        className={`px-4 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          isChecked 
                            ? "bg-brand-teal/15 border-brand-teal/30 text-brand-teal" 
                            : "bg-[var(--surface-soft)] border-brand-border/50 text-gray-400"
                        }`}
                      >
                        {dept} Team
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-border/40">
                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Compliance mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full rounded-xl border border-brand-border bg-brand-card/75 text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60"
                  >
                    <option value="DEMO">DEMO - Simulator logs online</option>
                    <option value="LIVE">LIVE - Production node connections</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-gray-400 font-bold uppercase">Sentinel Max risk score: {riskScore}</label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={riskScore}
                    onChange={(e) => setRiskScore(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-teal h-1.5 rounded-lg bg-[var(--surface-soft)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Version Auditing Comment */}
              <div className="space-y-2 pt-6 border-t border-brand-border/40">
                <label className="text-white font-bold uppercase block">Policy Change Summary (Auditable audit comment)</label>
                <textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Ex: Lowered spend auto-approve bounds and tightened SEC-04 rule conditions..."
                  className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60 min-h-[60px] resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving || !changeSummary.trim()}
                  className="btn-brutal justify-center w-full md:w-56"
                >
                  <span>{saving ? "Publishing policy..." : "Publish policy v" + (settings?.policy_history?.[0]?.version ? settings.policy_history[0].version + 1 : 2)}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}
        </div>

        {/* Right Side: Version history list */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6 space-y-4">
          <h3 className="font-display text-sm font-semibold text-white border-b border-brand-border pb-3 flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-brand-teal" />
            <span>Policy Version ledger</span>
          </h3>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-20 text-center font-mono text-[11px] text-gray-500">
                Querying ledger history...
              </div>
            ) : !settings?.policy_history || settings.policy_history.length === 0 ? (
              <div className="text-center font-mono text-[10px] text-gray-500 py-10">
                No policy records in ledger.
              </div>
            ) : (
              settings.policy_history.map((history, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-brand-border bg-[var(--surface-soft)] font-mono text-[11px] space-y-1.5 relative group">
                  <div className="flex items-center justify-between border-b border-brand-border/40 pb-1.5">
                    <span className="font-bold text-white uppercase text-[9px] px-1.5 py-0.5 rounded bg-brand-teal/15 text-brand-teal border border-brand-teal/20">
                      v{history.version}
                    </span>
                    <span className="text-[9px] text-gray-500">
                      {new Date(history.ts).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 font-semibold text-[10px]">
                    "{history.change_summary}"
                  </p>
                  <div className="flex items-center justify-between text-[8px] text-gray-500 pt-1">
                    <span>Editor: {history.changed_by}</span>
                    <span>{new Date(history.ts).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
