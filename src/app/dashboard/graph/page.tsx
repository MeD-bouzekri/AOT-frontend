"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Play, RefreshCw, Cpu, ShieldCheck, Terminal, FileText, 
  ArrowRight, Search, X, CheckCircle2, AlertTriangle, Clock 
} from "lucide-react";

interface Node {
  id: string;
  type: string;
  label: string;
  detail: string;
  status: "success" | "failed" | "running" | "pending" | "idle";
  level: string;
  agent: string;
  department: string;
  policy_citation?: string;
  veto_rule?: string;
}

interface Edge {
  id: string;
  from: string;
  to: string;
}

interface Run {
  id: string;
  request: string;
  status: string;
  requester: string;
  department: string;
  ts: string;
}

export default function WorkflowGraphPage() {
  return (
    <Suspense fallback={
      <div className="font-mono text-xs text-gray-500 py-20 text-center">
        Initializing workspace graph canvas...
      </div>
    }>
      <GraphContent />
    </Suspense>
  );
}

function GraphContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRunId = searchParams.get("run") || "";

  const [runs, setRuns] = useState<Run[]>([]);
  const [activeRunId, setActiveRunId] = useState(selectedRunId);
  const [graph, setGraph] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch runs list for selection dropdown
  const fetchRuns = async () => {
    try {
      const res = await fetch("/api/runs");
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
        if (data.length > 0 && !activeRunId) {
          setActiveRunId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch graph details of active run
  const fetchGraph = async (runId: string) => {
    if (!runId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/runs/${runId}/graph`);
      if (res.ok) {
        const data = await res.json();
        setGraph(data);
        
        // Update selected node if it was open to get live updates
        if (selectedNode) {
          const freshNode = data.nodes.find((n: Node) => n.id === selectedNode.id);
          if (freshNode) setSelectedNode(freshNode);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      setActiveRunId(selectedRunId);
    }
  }, [selectedRunId]);

  useEffect(() => {
    fetchGraph(activeRunId);
    
    // Poll the graph if the run is still active/running
    const checkRun = runs.find(r => r.id === activeRunId);
    if (checkRun && checkRun.status === "running") {
      const interval = setInterval(() => fetchGraph(activeRunId), 2000);
      return () => clearInterval(interval);
    }
  }, [activeRunId, runs]);

  const handleRunChange = (runId: string) => {
    setActiveRunId(runId);
    setSelectedNode(null);
    router.push(`/dashboard/graph?run=${runId}`);
  };

  // Get active run details
  const activeRun = runs.find(r => r.id === activeRunId);

  // Layout math for SVG tree rendering (Planner -> Managers -> Workers -> Governance -> Result)
  // Coordinates are generated procedurally based on level hierarchy
  const getCoordinates = (nodeId: string, level: string, index: number, total: number) => {
    const width = 800;
    const height = 450;
    
    // User Input: (100, 225)
    if (nodeId === "input") return { x: 70, y: 225 };
    
    // Planner: (220, 225)
    if (nodeId === "planner") return { x: 200, y: 225 };
    
    // Governance: (600, 225)
    if (nodeId === "governance") return { x: 620, y: 225 };
    
    // Result: (740, 225)
    if (nodeId === "result") return { x: 740, y: 225 };
    
    // Manager nodes (350, spread out vertically)
    if (level === "manager") {
      const step = height / (total + 1);
      return { x: 340, y: step * (index + 1) };
    }
    
    // Worker nodes (480, spread out vertically matching their manager)
    if (level === "worker") {
      const step = height / (total + 1);
      return { x: 480, y: step * (index + 1) };
    }

    return { x: 400, y: 200 };
  };

  // Pre-process nodes to calculate levels and vertical ordering
  const managers = graph?.nodes.filter(n => n.level === "manager") || [];
  const workers = graph?.nodes.filter(n => n.level === "worker") || [];

  const layoutNodes = graph?.nodes.map((node) => {
    let index = 0;
    let total = 1;
    
    if (node.level === "manager") {
      index = managers.findIndex(n => n.id === node.id);
      total = managers.length;
    } else if (node.level === "worker") {
      // Align worker node index with its manager index
      const deptLower = node.department.toLowerCase();
      index = managers.findIndex(n => n.id === `mgr-${deptLower}`);
      total = managers.length;
    }
    
    const coords = getCoordinates(node.id, node.level, index, total);
    return { ...node, ...coords };
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Title & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border/60 pb-5 gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-white">Workflow Graph</h1>
          <p className="text-xs text-gray-400 mt-1">
            Visual dependency tree of active planner executions and department routing constraints.
          </p>
        </div>

        {/* Dropdown Select Run */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-400 font-mono">Select Orchestration:</label>
          <select 
            value={activeRunId}
            onChange={(e) => handleRunChange(e.target.value)}
            className="rounded-xl border border-brand-border bg-brand-card/75 text-white text-xs px-4 py-2 outline-none focus:border-brand-teal/60 font-mono"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} - {r.request.substring(0, 45)}...
              </option>
            ))}
          </select>

          <button 
            onClick={() => fetchGraph(activeRunId)}
            className="p-2 rounded-xl border border-brand-border bg-[var(--surface-soft)] hover:bg-brand-card text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left: Interactive Canvas */}
        <div className="lg:col-span-3 rounded-2xl border border-brand-border bg-brand-card/25 backdrop-blur-md p-6 flex flex-col justify-center items-center relative overflow-hidden min-h-[500px]">
          
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-[var(--surface-mid)] border border-brand-border text-gray-400">
              Interactive Canvas
            </span>
            {activeRun && (
              <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded border ${
                activeRun.status === "completed"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : activeRun.status === "failed"
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : activeRun.status === "pending_approval"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-brand-teal/10 border-brand-teal/30 text-brand-teal"
              }`}>
                {activeRun.status}
              </span>
            )}
          </div>

          {!graph ? (
            <div className="text-center font-mono text-gray-500 text-xs py-20">
              No graph data compiled. Start a run in the employee portal to observe.
            </div>
          ) : (
            <svg 
              viewBox="0 0 800 450" 
              className="w-full h-full max-h-[450px]"
            >
              <defs>
                {/* Glow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                
                {/* Marker arrow definition */}
                <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.15)" />
                </marker>
                
                <marker id="arrow-active" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#3a9d8f" />
                </marker>
              </defs>

              {/* Draw Edges */}
              {graph.edges.map((edge) => {
                const fromNode = layoutNodes.find(n => n.id === edge.from);
                const toNode = layoutNodes.find(n => n.id === edge.to);
                
                if (!fromNode || !toNode) return null;
                
                const isActive = fromNode.status === "success" && (toNode.status === "success" || toNode.status === "running");
                
                // Draw curve path
                const dx = toNode.x - fromNode.x;
                const dy = toNode.y - fromNode.y;
                const pathStr = `M ${fromNode.x} ${fromNode.y} C ${fromNode.x + dx/2} ${fromNode.y}, ${fromNode.x + dx/2} ${toNode.y}, ${toNode.x} ${toNode.y}`;

                return (
                  <g key={edge.id}>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={isActive ? "#3a9d8f" : "rgba(255, 255, 255, 0.06)"}
                      strokeWidth={isActive ? "2" : "1.5"}
                      markerEnd={isActive ? "url(#arrow-active)" : "url(#arrow)"}
                      className={toNode.status === "running" && isActive ? "animate-[dash_2s_linear_infinite]" : ""}
                      style={toNode.status === "running" && isActive ? { strokeDasharray: "5, 5" } : {}}
                    />
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {layoutNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                
                // Style based on status
                let colorClass = "#141c23";
                let strokeColor = "rgba(255,255,255,0.1)";
                let iconText = "⚙️";
                
                if (node.level === "user") iconText = "👤";
                if (node.level === "planner") iconText = "🧠";
                if (node.level === "manager") iconText = "🏢";
                if (node.level === "worker") iconText = "🛠️";
                if (node.level === "governance") iconText = "🛡️";
                if (node.level === "result") iconText = "🏆";

                if (node.status === "success") {
                  strokeColor = "#10b981"; // green
                } else if (node.status === "failed") {
                  strokeColor = "#ef4444"; // red
                } else if (node.status === "pending") {
                  strokeColor = "#f59e0b"; // yellow
                } else if (node.status === "running") {
                  strokeColor = "#3a9d8f"; // teal
                }

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    {/* Glowing underlay on hover or select */}
                    {(isSelected || node.status === "running") && (
                      <circle 
                        r="25" 
                        fill={node.status === "running" ? "#3a9d8f" : strokeColor} 
                        opacity="0.15" 
                        filter="url(#glow)"
                        className={node.status === "running" ? "animate-pulse" : ""}
                      />
                    )}
                    
                    {/* Outer node circle */}
                    <circle 
                      r="18" 
                      fill="#0c1217" 
                      stroke={strokeColor} 
                      strokeWidth={isSelected ? "3" : "1.8"} 
                      className="group-hover:stroke-brand-teal transition-colors duration-200"
                    />

                    {/* Icon placeholder inside circle */}
                    <text 
                      y="4"
                      textAnchor="middle"
                      className="text-sm select-none"
                    >
                      {iconText}
                    </text>

                    {/* Label below circle */}
                    <text
                      y="32"
                      textAnchor="middle"
                      fill={isSelected ? "#white" : "#9ca3af"}
                      className="text-[10px] font-mono font-bold select-none"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Right Pane: Selected Node details drawer */}
        <div className="rounded-2xl border border-brand-border bg-brand-card/30 backdrop-blur-md p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-display text-sm font-semibold text-white border-b border-brand-border pb-3 flex items-center justify-between">
              <span>Agent Inspector</span>
              {selectedNode && (
                <span className="text-[10px] text-gray-500 font-mono font-semibold uppercase">
                  {selectedNode.agent}
                </span>
              )}
            </h3>

            {!selectedNode ? (
              <div className="py-20 text-center font-mono text-[11px] text-gray-500">
                Click any node on the graph canvas to inspect runtime outputs, reasoning paths, and tools used.
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Node Status Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase">{selectedNode.label}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                    selectedNode.status === "success" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : selectedNode.status === "failed"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : selectedNode.status === "pending"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : selectedNode.status === "running"
                      ? "bg-brand-teal/10 text-brand-teal border border-brand-teal/20 animate-pulse"
                      : "bg-gray-800 text-gray-500"
                  }`}>
                    {selectedNode.status}
                  </span>
                </div>

                {/* Node Details output */}
                <div className="bg-[var(--surface-soft)] border border-brand-border/60 rounded-xl p-3.5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-mono">Agent Output:</h4>
                  <p className="text-xs text-gray-200 leading-relaxed font-mono whitespace-pre-line">
                    {selectedNode.detail}
                  </p>
                </div>

                {/* Veto rule citation (if governance flagged) */}
                {selectedNode.level === "governance" && selectedNode.veto_rule && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-400 space-y-1 font-mono">
                    <h5 className="text-[10px] font-bold uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Safety Veto Triggered</span>
                    </h5>
                    <p className="text-[11px]">Rule: {selectedNode.veto_rule}</p>
                    <p className="text-[10px] text-gray-400">Section Citation: {selectedNode.policy_citation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedNode && (
            <button 
              onClick={() => setSelectedNode(null)}
              className="mt-6 flex items-center justify-center gap-1 text-[10px] font-bold text-gray-500 hover:text-white transition-colors py-2 border-t border-brand-border/40 w-full"
            >
              <X className="w-3 h-3" />
              <span>Clear Inspector</span>
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
