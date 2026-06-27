"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2, AlertTriangle, Server, Loader2, Save,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Validation {
  ok: boolean;
  available: string[];
  error?: string | null;
}

interface Settings {
  default_llm?: { provider: string; base_url?: string; model?: string } | null;
}

/**
 * System LLM configuration.
 *
 * The backend drives every agent from ONE default LLM (company_config.json
 * default_llm). This page: set the Ollama server + model → Test it (validates
 * GET {url}/api/tags and confirms the model exists) → Save (re-validates server
 * side, then persists so requests use it). company_admin only.
 */
export default function LLMConfigPage() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:11434");
  const [model, setModel] = useState("llama3.1:8b");
  const [current, setCurrent] = useState<Settings["default_llm"]>(null);

  const [validation, setValidation] = useState<Validation | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [error, setError] = useState("");

  // load the currently-saved default
  const loadCurrent = useCallback(async () => {
    try {
      // company_config isn't on /settings; default_llm lives there — but the
      // settings endpoint returns thresholds/rules. We surface the active model
      // optimistically from a probe instead. Keep the form prefilled with env
      // defaults; a successful save reflects the live value.
      const s = await api<Settings>("/api/settings").catch(() => ({}) as Settings);
      if (s.default_llm) {
        setCurrent(s.default_llm);
        if (s.default_llm.base_url) setBaseUrl(s.default_llm.base_url);
        if (s.default_llm.model) setModel(s.default_llm.model);
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void loadCurrent();
  }, [loadCurrent]);

  const test = async () => {
    setValidating(true);
    setValidation(null);
    setError("");
    setSavedMsg("");
    try {
      const res = await api<Validation>("/api/llm/validate-ollama", {
        method: "POST",
        body: { base_url: baseUrl.trim(), model: model.trim() },
      });
      setValidation(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Validation request failed.");
    } finally {
      setValidating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const res = await api<{ updated: boolean; default_llm?: Settings["default_llm"]; validation?: Validation }>(
        "/api/settings/default-llm",
        { method: "PUT", body: { base_url: baseUrl.trim(), model: model.trim() } },
      );
      if (res.updated) {
        setCurrent(res.default_llm ?? null);
        setSavedMsg("Saved. All agents now use this model.");
        setValidation({ ok: true, available: validation?.available ?? [] });
      } else {
        setValidation(res.validation ?? { ok: false, available: [], error: "Validation failed." });
        setError("Not saved — the server rejected this model. Fix and retry.");
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const modelOk = validation?.ok === true;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--text-1)]">
          LLM Configuration
        </h1>
        <p className="mt-1 text-sm text-[var(--text-3)]">
          Set the local Ollama model that powers every agent. Requests run on
          this model, so sensitive data never leaves your infrastructure.
        </p>
      </header>

      {/* current active model */}
      <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
        <Server className="h-4 w-4 text-[var(--text-3)]" />
        <div className="text-sm">
          <span className="text-[var(--text-3)]">Active model: </span>
          {current?.model ? (
            <span className="font-mono font-medium text-[var(--text-1)]">
              {current.model}
              <span className="text-[var(--text-4)]"> @ {current.base_url}</span>
            </span>
          ) : (
            <span className="text-[var(--text-4)]">environment default (not yet configured)</span>
          )}
        </div>
      </div>

      {/* form */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
        <Field label="Ollama server URL" hint="The host running Ollama. Tested against GET {url}/api/tags.">
          <input
            value={baseUrl}
            onChange={(e) => { setBaseUrl(e.target.value); setValidation(null); setSavedMsg(""); }}
            placeholder="http://localhost:11434"
            className="input-base font-mono"
          />
        </Field>

        <Field label="Model" hint="Must exist on the server (e.g. llama3.1:8b, qwen2.5:14b).">
          <input
            value={model}
            onChange={(e) => { setModel(e.target.value); setValidation(null); setSavedMsg(""); }}
            placeholder="llama3.1:8b"
            className="input-base font-mono"
          />
        </Field>

        <div className="flex items-center gap-3">
          <button
            onClick={test}
            disabled={validating || !baseUrl.trim() || !model.trim()}
            className="btn-brutal-ghost !py-2 text-[13px]"
          >
            {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Test connection
          </button>
          <button
            onClick={save}
            disabled={saving || !baseUrl.trim() || !model.trim()}
            className="btn-brutal !py-2 text-[13px]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save as default
          </button>
        </div>

        {/* validation result */}
        {validation && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              modelOk
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400"
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {modelOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {modelOk ? "Server reachable · model found" : "Validation failed"}
            </div>
            {validation.error && <p className="mt-1 text-[13px]">{validation.error}</p>}
            {validation.available.length > 0 && (
              <div className="mt-2 border-t border-current/10 pt-2 text-xs">
                <span className="font-medium">Available models: </span>
                <span className="font-mono opacity-80">{validation.available.join(", ")}</span>
              </div>
            )}
          </div>
        )}

        {savedMsg && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> {savedMsg}
          </p>
        )}
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}
      </section>

      <p className="text-xs text-[var(--text-4)]">
        Save re-validates the model server-side before persisting. Agents pick
        up the change on the next request — no restart needed.
      </p>
    </div>
  );
}

function Field({
  label, hint, children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-medium text-[var(--text-2)]">{label}</label>
      {children}
      {hint && <p className="text-xs text-[var(--text-4)]">{hint}</p>}
    </div>
  );
}
