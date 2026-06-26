"use client";

import { useState, useEffect } from "react";
import { 
  Terminal, ShieldCheck, Cpu, RefreshCw, CheckCircle2, 
  AlertTriangle, Settings, ArrowRight, Play, Eye
} from "lucide-react";

interface LLMConfig {
  provider: "claude" | "gemini" | "ollama";
  model: string;
  base_url?: string;
  api_key_ref?: string;
  temperature: number;
  max_tokens: number;
}

const agentsList = [
  { id: "planner", name: "Planner Orchestrator", desc: "Decomposes human instructions, creates graphs, and coordinates manager subtasks." },
  { id: "hr_manager", name: "HR Sub-Manager", desc: "Verifies policy constraints and delegates work to the HR execution workforce." },
  { id: "hr_worker", name: "HR Executive", desc: "Drafts contracts, registers salary details, and verifies credentials." },
  { id: "it_manager", name: "IT Sub-Manager", desc: "Monitors catalog hardware equipment requests and delegates worker tasks." },
  { id: "it_worker", name: "IT Executive", desc: "Orders provisioned laptops, sets up Okta credentials, and provisions GSuite accounts." },
  { id: "governance", name: "Sentinel Compliance Agent", desc: "Audits spend metrics and security policy vectors against corporate rules." }
];

export default function LLMConfigPage() {
  const [selectedAgent, setSelectedAgent] = useState("planner");
  const [configs, setConfigs] = useState<Record<string, LLMConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ ok: boolean; error?: string; available: string[] } | null>(null);

  // Form states matching selected agent configuration
  const [provider, setProvider] = useState<"claude" | "gemini" | "ollama">("claude");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKeyRef, setApiKeyRef] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(1024);

  // Fetch configs for all agents
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const results: Record<string, LLMConfig> = {};
      for (const agent of agentsList) {
        const res = await fetch(`/api/agents/${agent.id}/llm`);
        if (res.ok) {
          results[agent.id] = await res.json();
        }
      }
      setConfigs(results);
      loadAgentForm(selectedAgent, results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const loadAgentForm = (agentId: string, currentConfigs: Record<string, LLMConfig>) => {
    const cfg = currentConfigs[agentId];
    if (cfg) {
      setProvider(cfg.provider);
      setModel(cfg.model);
      setBaseUrl(cfg.base_url || "");
      setApiKeyRef(cfg.api_key_ref || "");
      setTemperature(cfg.temperature);
      setMaxTokens(cfg.max_tokens);
      setValidationResult(null);
    }
  };

  useEffect(() => {
    if (Object.keys(configs).length > 0) {
      loadAgentForm(selectedAgent, configs);
    }
  }, [selectedAgent]);

  // Save config
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${selectedAgent}/llm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          base_url: baseUrl,
          api_key_ref: apiKeyRef,
          temperature,
          max_tokens: maxTokens
        })
      });
      if (res.ok) {
        const fresh = await res.json();
        setConfigs(prev => ({ ...prev, [selectedAgent]: fresh.config }));
        alert(`LLM Config for ${selectedAgent.replace("_", " ")} saved successfully!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // Validate Ollama endpoint
  const handleValidateOllama = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch("/api/llm/validate-ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_url: baseUrl,
          model
        })
      });
      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

  const activeAgentInfo = agentsList.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title */}
      <div className="border-b border-brand-border/60 pb-5">
        <h1 className="font-display text-2xl font-black text-white">Agent Provider Settings</h1>
        <p className="text-xs text-gray-400 mt-1">
          Configure model parameters, select providers, and validate local inference tags per agent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left: Agent selector list */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/25 backdrop-blur-md p-5 flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-gray-500 font-mono mb-2">Agent Registry</span>
          
          {loading ? (
            <div className="py-20 text-center font-mono text-[11px] text-gray-500">
              Querying registry configurations...
            </div>
          ) : (
            agentsList.map((agent) => {
              const isSelected = selectedAgent === agent.id;
              const agentCfg = configs[agent.id];
              
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-brand-teal/15 border-brand-teal/30 shadow-[0_0_12px_rgba(58,157,143,0.06)]"
                      : "bg-brand-card/25 border-brand-border/50 hover:bg-brand-card/50 hover:border-brand-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-display">
                      {agent.name}
                    </span>
                    {agentCfg && (
                      <span className="text-[8px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--surface-soft)] text-brand-teal">
                        {agentCfg.provider}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono line-clamp-2 mt-1.5 leading-relaxed">
                    {agent.desc}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Selected Agent LLM configuration editor */}
        <div className="lg:col-span-2 rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header info */}
            <div>
              <h2 className="font-display text-sm font-semibold text-white">
                Edit configuration for {activeAgentInfo?.name}
              </h2>
              <p className="text-[10px] text-gray-400 font-mono mt-1">Registry key ID: {selectedAgent}</p>
            </div>

            {/* Config Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">LLM Provider</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const prov = e.target.value as any;
                    setProvider(prov);
                    if (prov === "claude") {
                      setModel("claude-3-5-sonnet");
                      setApiKeyRef("CLAUDE_API_KEY");
                    } else if (prov === "gemini") {
                      setModel("gemini-2.0-flash-exp");
                      setApiKeyRef("GEMINI_API_KEY");
                    } else if (prov === "ollama") {
                      setModel("llama3.1:8b");
                      setBaseUrl("http://localhost:11434");
                      setApiKeyRef("");
                    }
                  }}
                  className="w-full rounded-xl border border-brand-border bg-brand-card/75 text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60 font-mono"
                >
                  <option value="claude">Anthropic Claude</option>
                  <option value="gemini">Google Gemini API</option>
                  <option value="ollama">Ollama (Self-Hosted/Local)</option>
                </select>
              </div>

              {/* Model Tag */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">Model Tag Identifier</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ex: claude-3-5-sonnet-20241022 or llama3.1:8b"
                  className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60 font-mono"
                />
              </div>

              {/* API Key Reference (Secrets management) */}
              {provider !== "ollama" && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">API Key Store Reference</label>
                  <input
                    type="text"
                    value={apiKeyRef}
                    onChange={(e) => setApiKeyRef(e.target.value)}
                    placeholder="Ex: CLAUDE_API_KEY"
                    className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60 font-mono"
                  />
                  <span className="text-[9px] text-gray-500 font-mono block">
                    References server-side environment secrets. Actual values are never exposed to clients.
                  </span>
                </div>
              )}

              {/* Ollama endpoint validation parameters */}
              {provider === "ollama" && (
                <div className="space-y-4 md:col-span-2 border-t border-b border-brand-border/40 py-4 font-mono">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Ollama Host Address</label>
                    <input
                      type="text"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleValidateOllama}
                      disabled={validating || !baseUrl}
                      className="btn-brutal !py-1.5 !px-3.5 !text-[10px] !bg-[var(--surface-soft)] text-white hover:bg-brand-teal/10 border border-brand-border flex items-center gap-1.5"
                    >
                      <span>{validating ? "Validating Host..." : "Test Endpoint"}</span>
                    </button>
                    <span className="text-[9px] text-gray-500">
                      Query tags database list inside endpoint to confirm catalog exists.
                    </span>
                  </div>

                  {/* Validation results block */}
                  {validationResult && (
                    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      validationResult.ok 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}>
                      <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wider">
                        {validationResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        <span>{validationResult.ok ? "Endpoint Validated" : "Connection Issue"}</span>
                      </div>
                      
                      {validationResult.error && <p className="text-[10px]">{validationResult.error}</p>}
                      
                      {validationResult.available.length > 0 && (
                        <div className="pt-1.5 border-t border-brand-border/40 text-[9px]">
                          <span className="font-bold text-gray-300">Found models: </span>
                          <span className="text-gray-400">{validationResult.available.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Temperature */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">Inference Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-brand-teal h-1.5 rounded-lg bg-[var(--surface-soft)] cursor-pointer"
                />
              </div>

              {/* Max tokens */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 font-mono uppercase">Max Response Tokens</label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                  placeholder="1024"
                  className="w-full rounded-xl border border-brand-border bg-[var(--surface-soft)] text-white text-xs px-3.5 py-2.5 outline-none focus:border-brand-teal/60 font-mono"
                />
              </div>

            </div>

          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-brutal justify-center mt-8 w-full md:w-48 self-end"
          >
            <span>{saving ? "Saving configs..." : "Save Provider Configuration"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
}
