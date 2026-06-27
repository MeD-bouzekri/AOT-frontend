"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw, X, Lock, Snowflake,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError, gatewayWs } from "@/lib/api";
import PageHeader from "@/components/console/PageHeader";

interface VetoRow {
  id: string;
  run_id: string;
  request: string | null;
  domain: string | null;
  raised_by: string;
  rule_id: string;
  scope: "block" | "halt";
  message: string;
  explanation: string;
  required_authority: "CISO" | "CFO" | "DPO";
  status: "active" | "cleared" | "denied";
  cleared_by: string | null;
  decision: string | null;
  conditions: string | null;
  raised_at: string | null;
  resolved_at: string | null;
  can_clear: boolean;
}

export default function VetoReviewPage() {
  const { principal, token } = useAuth();
  const [vetoes, setVetoes] = useState<VetoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState<VetoRow | null>(null);

  const fetchVetoes = useCallback(async () => {
    setError("");
    try {
      setVetoes(await api<VetoRow[]>("/api/vetoes?status=all"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load freezes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVetoes();
  }, [fetchVetoes]);

  // Live: subscribe to the admin stream so a new freeze (or a clear elsewhere)
  // refreshes the list in real time, without polling.
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!token || !principal) return;
    const scope = principal.scope && principal.scope !== "ALL" ? principal.scope : null;
    const path = `/api/admin/stream${scope ? `?department=${scope}` : ""}`;
    const ws = new WebSocket(gatewayWs(path, token));
    wsRef.current = ws;
    ws.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data);
        // governance freeze/clear events change the veto set → refetch
        if (
          ev.level === "governance" ||
          ev.status === "blocked" ||
          ev.phase === "veto cleared"
        ) {
          void fetchVetoes();
        }
      } catch {
        /* ignore non-JSON frames */
      }
    };
    ws.onerror = () => { /* stream is best-effort; manual refresh still works */ };
    return () => ws.close();
  }, [token, principal, fetchVetoes]);

  const activeVetoes = vetoes.filter((v) => v.status === "active");
  const resolved = vetoes.filter((v) => v.status !== "active");

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader
        icon={<ShieldAlert className="h-[18px] w-[18px]" />}
        title="Veto Review"
        subtitle="Governance freezes awaiting an authority. Only the named authority (CISO / CFO / DPO) can release a freeze."
        actions={
          <button onClick={() => void fetchVetoes()} className="btn-brutal-ghost !py-1.5 !px-3 text-[13px]">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {/* authority chips — what this principal can clear */}
      {principal && principal.authorities.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-3)]">
          <Lock className="h-3.5 w-3.5 text-[var(--accent-token)]" />
          <span>You can clear:</span>
          {principal.authorities.map((a) => (
            <span key={a} className="rounded bg-[var(--accent-quiet)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--accent-token)]">
              {a}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* active freezes */}
      <section>
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Snowflake className="w-4 h-4 text-brand-cyan" />
          Active freezes
          {activeVetoes.length > 0 && (
            <span className="text-[10px] font-mono bg-amber-400/10 text-amber-400 border border-amber-400/20 px-1.5 py-0.5 rounded-full animate-pulse">
              {activeVetoes.length}
            </span>
          )}
        </h2>
        {loading ? (
          <p className="text-sm text-gray-400 font-mono py-8 text-center">Loading…</p>
        ) : activeVetoes.length === 0 ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card/30 p-8 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No active freezes. All clear.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeVetoes.map((v) => (
              <VetoCard key={v.id} veto={v} onReview={() => setActive(v)} />
            ))}
          </div>
        )}
      </section>

      {/* resolved history */}
      {resolved.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-white mb-3">Resolved</h2>
          <div className="rounded-2xl border border-brand-border bg-brand-card/30 p-4 space-y-2">
            {resolved.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[var(--surface-soft)]">
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    v.decision === "deny"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {v.rule_id}
                  </span>
                  <span className="text-gray-300 truncate max-w-[280px]">{v.message}</span>
                </div>
                <span className="text-gray-500 font-mono">
                  {v.decision} · {v.cleared_by}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {active && (
        <ClearVetoModal
          veto={active}
          onClose={() => setActive(null)}
          onCleared={() => {
            setActive(null);
            void fetchVetoes();
          }}
        />
      )}
    </div>
  );
}

function VetoCard({ veto, onReview }: { veto: VetoRow; onReview: () => void }) {
  const isHalt = veto.scope === "halt";
  return (
    <div className={`rounded-2xl border p-5 ${
      isHalt
        ? "border-red-500/30 bg-red-500/5"
        : "border-amber-500/30 bg-amber-500/5"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
            isHalt ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
          }`}>
            {veto.scope} · {veto.rule_id}
          </span>
          <span className="text-[10px] font-mono text-gray-400">
            raised by {veto.raised_by}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold text-brand-teal bg-brand-teal/10 border border-brand-teal/20 px-1.5 py-0.5 rounded">
          {veto.required_authority}
        </span>
      </div>

      {veto.request && (
        <p className="text-[11px] text-gray-400 font-mono mb-2 line-clamp-2">
          <span className="text-gray-500">Request:</span> {veto.request}
        </p>
      )}
      <p className="text-sm text-white font-medium mb-1.5">{veto.message}</p>
      {veto.explanation && (
        <p className="text-xs text-gray-400 leading-relaxed mb-4">{veto.explanation}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-brand-border/40">
        <span className="text-[10px] text-gray-500 font-mono">run {veto.run_id}</span>
        {veto.can_clear ? (
          <button
            onClick={onReview}
            className="btn-brutal !py-1.5 !px-3.5 !text-xs !bg-brand-teal text-white"
          >
            Review &amp; clear
          </button>
        ) : (
          <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3" /> needs {veto.required_authority}
          </span>
        )}
      </div>
    </div>
  );
}

function ClearVetoModal({
  veto,
  onClose,
  onCleared,
}: {
  veto: VetoRow;
  onClose: () => void;
  onCleared: () => void;
}) {
  const [decision, setDecision] = useState<
    "release" | "release_with_conditions" | "deny"
  >("release");
  const [conditions, setConditions] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError("");
    if (decision === "release_with_conditions" && !conditions.trim()) {
      setError("Specify the conditions for a conditional release.");
      return;
    }
    setSubmitting(true);
    try {
      await api(`/api/runs/${veto.run_id}/clear-veto`, {
        method: "POST",
        body: {
          authority: veto.required_authority,
          decision,
          conditions: conditions.trim() || null,
          note: note.trim() || null,
        },
      });
      onCleared();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to clear freeze.");
      setSubmitting(false);
    }
  };

  // static class strings (Tailwind can't see interpolated class names)
  const decisions: {
    value: typeof decision;
    label: string;
    active: string;
  }[] = [
    {
      value: "release",
      label: "Release",
      active: "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
    },
    {
      value: "release_with_conditions",
      label: "Release with conditions",
      active: "border-amber-500/50 bg-amber-500/15 text-amber-400",
    },
    {
      value: "deny",
      label: "Deny",
      active: "border-red-500/50 bg-red-500/15 text-red-400",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-brand-border bg-brand-card/95 backdrop-blur-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Clear freeze · {veto.rule_id}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl border border-brand-border bg-[var(--surface-soft)] p-4 mb-5">
          <p className="text-sm text-white font-medium">{veto.message}</p>
          {veto.explanation && (
            <p className="text-xs text-gray-400 mt-1.5">{veto.explanation}</p>
          )}
          <p className="text-[10px] text-gray-500 font-mono mt-2">
            Clearing as <span className="text-brand-teal">{veto.required_authority}</span>
          </p>
        </div>

        <label className="text-xs font-bold text-gray-300 mb-2 block">Decision</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {decisions.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDecision(d.value)}
              className={`px-2 py-2 rounded-lg border text-xs font-semibold transition-colors ${
                decision === d.value
                  ? d.active
                  : "border-brand-border bg-[var(--surface-soft)] text-gray-400 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {decision === "release_with_conditions" && (
          <div className="mb-4">
            <label className="text-xs font-bold text-gray-300 mb-1.5 block">Conditions</label>
            <textarea
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="e.g. Production access limited to read-only for 30 days, re-review required."
              className="w-full rounded-lg border border-brand-border bg-[var(--surface-soft)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-brand-teal/60 min-h-[70px] resize-none"
            />
          </div>
        )}

        <div className="mb-5">
          <label className="text-xs font-bold text-gray-300 mb-1.5 block">
            Note <span className="text-gray-500 font-normal">(optional, audit trail)</span>
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Rationale for the decision"
            className="w-full rounded-lg border border-brand-border bg-[var(--surface-soft)] px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-brand-teal/60"
          />
        </div>

        {error && <p role="alert" className="text-xs font-mono text-red-400 mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-brand-border text-xs font-bold text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className={`btn-brutal !py-2 !px-4 !text-xs text-white disabled:opacity-50 ${
              decision === "deny" ? "!bg-red-500" : "!bg-brand-teal"
            }`}
          >
            {submitting
              ? "Submitting…"
              : decision === "deny"
              ? "Deny request"
              : "Release freeze"}
          </button>
        </div>
      </div>
    </div>
  );
}
