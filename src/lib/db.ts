import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "src", "data", "db.json");

export interface LLMConfig {
  provider: "claude" | "gemini" | "ollama";
  model: string;
  base_url?: string;
  api_key_ref?: string;
  temperature: number;
  max_tokens: number;
}

export interface StepEvent {
  id: string;
  run_id: string;
  ts: string;
  department: string;
  level: "planner" | "manager" | "worker" | "governance";
  agent: string;
  assigned_by: string | null;
  action: "assigned task" | "called tool" | "produced result" | "BLOCK" | "veto cleared";
  phase: string;
  status: "success" | "failed";
  tools_used: string[];
  output: string;
  reasoning: string;
  policy_citation?: string | null;
  veto_rule?: string | null;
}

export interface Run {
  id: string;
  request: string;
  status: "completed" | "failed" | "running" | "pending_approval";
  requester: string;
  department: string;
  ts: string;
  duration_ms: number;
  steps: StepEvent[];
}

export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  authority: string;
}

export interface PolicyHistoryItem {
  version: number;
  ts: string;
  changed_by: string;
  change_summary: string;
}

export interface Settings {
  auto_approve_spend_limit: number;
  manager_spend_limit: number;
  director_spend_limit: number;
  hard_spend_ceiling: number;
  max_risk_score: number;
  mode: "DEMO" | "LIVE";
  default_llm: string;
  active_departments: string[];
  active_workers: string[];
  rules: Rule[];
  policy_history: PolicyHistoryItem[];
}

export interface DbSchema {
  settings: Settings;
  agents: Record<string, LLMConfig>;
  runs: Run[];
}

// Ensure database path directory exists
function ensureDir() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function readDb(): DbSchema {
  ensureDir();
  try {
    if (!fs.existsSync(dbPath)) {
      return { settings: {} as any, agents: {}, runs: [] };
    }
    const raw = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Error reading database:", error);
    return { settings: {} as any, agents: {}, runs: [] };
  }
}

export function writeDb(data: DbSchema) {
  ensureDir();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Step-by-step Simulation Runner
// This simulates the workflow steps asynchronously when a new run is created
export function runSimulation(runId: string, requestText: string, requester: string) {
  const db = readDb();
  const settings = db.settings;
  
  // Decide which departments are triggered based on the request text
  const textLower = requestText.toLowerCase();
  const triggersHR = textLower.includes("hr") || textLower.includes("onboard") || textLower.includes("contract") || textLower.includes("hire") || textLower.includes("employee");
  const triggersIT = textLower.includes("it") || textLower.includes("email") || textLower.includes("laptop") || textLower.includes("macbook") || textLower.includes("credential") || textLower.includes("software");
  const triggersProcurement = textLower.includes("procure") || textLower.includes("license") || textLower.includes("purchase") || textLower.includes("order") || textLower.includes("buy");
  const triggersFinance = textLower.includes("wire") || textLower.includes("transfer") || textLower.includes("finance") || textLower.includes("payment") || textLower.includes("budget") || textLower.includes("renewal") || textLower.includes("cost") || textLower.includes("spend");

  // Determine spend amount if mentioned
  let detectedSpend = 0;
  const matchMoney = requestText.match(/\$?([0-9,]+)/);
  if (matchMoney) {
    detectedSpend = parseInt(matchMoney[1].replace(/,/g, ""), 10);
  }

  // Deconstruction and planning
  const targetDepts: string[] = [];
  if (triggersHR) targetDepts.push("HR");
  if (triggersIT) targetDepts.push("IT");
  if (triggersProcurement) targetDepts.push("Procurement");
  if (triggersFinance) targetDepts.push("Finance");
  if (targetDepts.length === 0) {
    targetDepts.push("General");
  }

  const stepsList: Omit<StepEvent, "ts">[] = [];

  // Step 1: Planner
  stepsList.push({
    id: `log-${runId}-1`,
    run_id: runId,
    department: "Orchestrator",
    level: "planner",
    agent: "planner",
    assigned_by: null,
    action: "assigned task",
    phase: "Planning",
    status: "success",
    tools_used: ["analyze_request_intent"],
    output: `Decomposed request into department tasks for: ${targetDepts.join(", ")}. Detectable spend budget checked: $${detectedSpend}.`,
    reasoning: `User requested actions affecting: ${targetDepts.join(" and ")}. Spawning manager agents to assign worker tasks.`,
  });

  // Step 2-4: Sub-management and Workers execution
  let logCounter = 2;
  targetDepts.forEach((dept) => {
    const deptLower = dept.toLowerCase();
    
    // Manager assigning
    stepsList.push({
      id: `log-${runId}-${logCounter++}`,
      run_id: runId,
      department: dept,
      level: "manager",
      agent: `${deptLower}_manager`,
      assigned_by: "planner",
      action: "assigned task",
      phase: "Sub-management",
      status: "success",
      tools_used: [`get_${deptLower}_guidelines`],
      output: `Instructed ${dept} Worker to execute subtask relating to: ${requestText.substring(0, 40)}...`,
      reasoning: `Routing specialized subtask to ${dept} department worker for execution under standard SLAs.`,
    });

    // Worker executing
    let workerOutput = `Completed execution of ${dept} task successfully.`;
    let tools = [`execute_${deptLower}_api`];
    if (dept === "HR") {
      workerOutput = `Drafted onboarding contract and employment agreement for ${requestText.match(/[A-Z][a-z]+ [A-Z][a-z]+/)?.[0] || "New Hire"}. Registering files.`;
      tools = ["generate_pdf_contract", "docusign_draft"];
    } else if (dept === "IT") {
      workerOutput = `Provisioned enterprise Okta credentials and GSuite account. Laptop purchase of $${detectedSpend || 1500} dispatched.`;
      tools = ["okta_create_user", "catalog_order_device"];
    } else if (dept === "Procurement") {
      workerOutput = `Generated vendor quote for items requested. Total transaction charge: $${detectedSpend || 800}.`;
      tools = ["vendor_quote_lookup", "catalog_add"];
    } else if (dept === "Finance") {
      workerOutput = `Validated department cost center budget. Wire queue registered for $${detectedSpend || 5000}.`;
      tools = ["ledger_balance_check", "stripe_wire_prepare"];
    }

    stepsList.push({
      id: `log-${runId}-${logCounter++}`,
      run_id: runId,
      department: dept,
      level: "worker",
      agent: `${deptLower}_worker`,
      assigned_by: `${deptLower}_manager`,
      action: "produced result",
      phase: "Execution",
      status: "success",
      tools_used: tools,
      output: workerOutput,
      reasoning: `Executing targeted department functions utilizing authorized external tools and local registries.`,
    });
  });

  // Step 5: Governance checking
  let governanceStatus: "success" | "failed" = "success";
  let finalStatus: Run["status"] = "completed";
  let vetoRule: string | null = null;
  let policyCitation: string | null = null;
  let govOutput = `Passed all active compliance rules. Spend limit of $${detectedSpend} is within auto-approve bounds.`;
  let govReasoning = `Risk scoring calculated at 15/100. No security rule vetoes triggered. Auto-approving workflow completion.`;

  // Governance check logic based on database thresholds
  const isRuleEnabled = (id: string) => settings.rules.find(r => r.id === id)?.enabled ?? false;

  if (detectedSpend > settings.hard_spend_ceiling) {
    governanceStatus = "failed";
    finalStatus = "failed";
    vetoRule = "HARD-SPEND-LIMIT";
    policyCitation = "HARD-SPEND-LIMIT";
    govOutput = `CRITICAL BLOCK: Requested spend volume $${detectedSpend} exceeds hard corporate ceiling of $${settings.hard_spend_ceiling}. Transaction rejected unconditionally.`;
    govReasoning = `Severe security policy violation. Risk score evaluated at 92/100. Aborting running workflow.`;
  } else if (detectedSpend > settings.auto_approve_spend_limit) {
    // Requires approval
    governanceStatus = "failed";
    finalStatus = "pending_approval";
    
    if (detectedSpend > settings.manager_spend_limit && isRuleEnabled("SEC-04")) {
      vetoRule = "SEC-04";
      policyCitation = "SEC-04";
      govOutput = `BLOCKED: Remote onboarding spend of $${detectedSpend} exceeds auto-approval limits. Triggered Rule SEC-04: Multi-department validation for remote onboarding. Director approval required.`;
      govReasoning = `Requires manual validation from Director authority due to SEC-04 rule trigger.`;
    } else {
      vetoRule = "PROC-07";
      policyCitation = "PROC-07";
      govOutput = `BLOCKED: Spend volume $${detectedSpend} exceeds auto-approve threshold ($${settings.auto_approve_spend_limit}). Triggered Rule PROC-07: High-value spend request double verification. Manager approval required.`;
      govReasoning = `Requires human clearing from Department Manager to authorize the expense record.`;
    }
  }

  stepsList.push({
    id: `log-${runId}-${logCounter++}`,
    run_id: runId,
    department: "Governance",
    level: "governance",
    agent: "governance",
    assigned_by: null,
    action: governanceStatus === "success" ? "produced result" : "BLOCK",
    phase: "Governance Check",
    status: governanceStatus,
    tools_used: ["audit_policy_rules"],
    output: govOutput,
    reasoning: govReasoning,
    policy_citation: policyCitation,
    veto_rule: vetoRule
  });

  // Start background process loop
  // Append steps one by one over a simulated timeline
  let stepIndex = 0;
  
  const interval = setInterval(() => {
    const freshDb = readDb();
    const run = freshDb.runs.find(r => r.id === runId);
    if (!run) {
      clearInterval(interval);
      return;
    }

    if (stepIndex < stepsList.length) {
      const nextStep = stepsList[stepIndex];
      // Append current timestamp
      const timestampedStep: StepEvent = {
        ...nextStep,
        ts: new Date().toISOString()
      };
      
      run.steps.push(timestampedStep);
      
      // Update overall run status to reflect if block happened
      if (timestampedStep.level === "governance") {
        run.status = finalStatus;
      } else if (run.status === "running" && stepIndex === 0) {
        // Keeps it running
      }
      
      writeDb(freshDb);
      stepIndex++;
    } else {
      // Finished all initial steps
      clearInterval(interval);
      
      // If completed successfully, update status
      if (finalStatus === "completed") {
        const finalDb = readDb();
        const finalRun = finalDb.runs.find(r => r.id === runId);
        if (finalRun) {
          finalRun.status = "completed";
          finalRun.duration_ms = Date.now() - new Date(finalRun.ts).getTime();
          writeDb(finalDb);
        }
      }
    }
  }, 1000);
}
