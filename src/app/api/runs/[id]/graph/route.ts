import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

// Build a structured graph of the orchestrator run: Planner -> Managers -> Workers -> Governance -> Result
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = readDb();
    const run = db.runs.find((r) => r.id === id);
    
    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }
    
    // We will build nodes and edges from the steps list
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // 1. Always create the User Input Node
    nodes.push({
      id: "input",
      type: "input",
      label: "Human Request",
      detail: run.request,
      status: "success",
      level: "user",
      agent: "User",
      department: "Client"
    });
    
    // 2. Always connect to Planner Node (if planning step happened or just default it)
    const plannerStep = run.steps.find((s) => s.level === "planner");
    nodes.push({
      id: "planner",
      type: "planner",
      label: "Planner Orchestrator",
      detail: plannerStep?.output || "Formulating multi-agent collaboration workflow graph.",
      status: plannerStep ? "success" : "running",
      level: "planner",
      agent: "planner",
      department: "Orchestrator"
    });
    edges.push({ id: "e-input-planner", from: "input", to: "planner" });
    
    // 3. Department Nodes (Managers and Workers)
    const departments = new Set<string>();
    run.steps.forEach((step) => {
      if (step.department && step.department !== "Orchestrator" && step.department !== "Governance") {
        departments.add(step.department);
      }
    });
    
    // If no steps recorded yet but we are running, check run.department
    if (departments.size === 0 && run.department) {
      run.department.split("/").forEach(d => {
        if (d && d !== "General") departments.add(d);
      });
    }
    
    departments.forEach((dept) => {
      const deptLower = dept.toLowerCase();
      
      // Look for manager and worker steps
      const mgrStep = run.steps.find((s) => s.department === dept && s.level === "manager");
      const workerStep = run.steps.find((s) => s.department === dept && s.level === "worker");
      
      // Manager Node
      nodes.push({
        id: `mgr-${deptLower}`,
        type: "manager",
        label: `${dept} Manager`,
        detail: mgrStep?.output || `Decomposing and verifying subtasks for ${dept} department.`,
        status: mgrStep ? "success" : (run.status === "running" ? "running" : "idle"),
        level: "manager",
        agent: `${deptLower}_manager`,
        department: dept
      });
      edges.push({ id: `e-planner-mgr-${deptLower}`, from: "planner", to: `mgr-${deptLower}` });
      
      // Worker Node
      nodes.push({
        id: `wrk-${deptLower}`,
        type: "worker",
        label: `${dept} Executor`,
        detail: workerStep?.output || `Executing department operations and catalog tasks.`,
        status: workerStep ? "success" : (run.status === "running" && mgrStep ? "running" : "idle"),
        level: "worker",
        agent: `${deptLower}_worker`,
        department: dept
      });
      edges.push({ id: `e-mgr-wrk-${deptLower}`, from: `mgr-${deptLower}`, to: `wrk-${deptLower}` });
    });
    
    // 4. Governance Node
    const govStep = run.steps.find((s) => s.level === "governance");
    let govStatus = "idle";
    if (govStep) {
      govStatus = govStep.status === "success" ? "success" : "failed";
    } else if (run.status === "running" && run.steps.length >= (departments.size * 2 + 1)) {
      govStatus = "running";
    }
    
    nodes.push({
      id: "governance",
      type: "governance",
      label: "Sentinel Compliance",
      detail: govStep?.output || "Auditing spend metrics, policy compliance, and department rule vectors.",
      status: govStatus,
      level: "governance",
      agent: "governance",
      department: "Governance",
      policy_citation: govStep?.policy_citation,
      veto_rule: govStep?.veto_rule
    });
    
    // Connect all worker nodes to Governance
    departments.forEach((dept) => {
      const deptLower = dept.toLowerCase();
      edges.push({ id: `e-wrk-${deptLower}-gov`, from: `wrk-${deptLower}`, to: "governance" });
    });
    
    // If no specific departments triggered, connect Planner to Governance directly
    if (departments.size === 0) {
      edges.push({ id: "e-planner-gov", from: "planner", to: "governance" });
    }
    
    // 5. Result Node
    let resultStatus = "idle";
    let resultDetail = "Awaiting final agent evaluation.";
    if (run.status === "completed") {
      resultStatus = "success";
      resultDetail = "Workflow executed and policy cleared. Transaction registered successfully.";
    } else if (run.status === "failed") {
      resultStatus = "failed";
      resultDetail = `Workflow blocked due to rule violation: ${govStep?.veto_rule || "Unknown Policy Check Failure"}`;
    } else if (run.status === "pending_approval") {
      resultStatus = "pending";
      resultDetail = `Workflow suspended. Under manager review due to: ${govStep?.veto_rule || "Approval thresholds exceeded"}.`;
    } else if (run.status === "running") {
      resultStatus = "running";
      resultDetail = "Processing active pipelines...";
    }
    
    nodes.push({
      id: "result",
      type: "output",
      label: "Result Status",
      detail: resultDetail,
      status: resultStatus,
      level: "result",
      agent: "System",
      department: "Result"
    });
    edges.push({ id: "e-gov-result", from: "governance", to: "result" });
    
    return NextResponse.json({ nodes, edges });
  } catch (error) {
    return NextResponse.json({ error: "Failed to construct graph" }, { status: 500 });
  }
}
