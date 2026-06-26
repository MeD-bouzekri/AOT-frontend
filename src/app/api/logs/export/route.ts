import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = readDb();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    
    // Gather all logs
    const allLogs = db.runs.flatMap((run) =>
      run.steps.map((step) => ({
        id: step.id,
        run_id: step.run_id,
        timestamp: step.ts,
        department: step.department,
        level: step.level,
        agent: step.agent,
        action: step.action,
        phase: step.phase,
        status: step.status,
        tools: step.tools_used.join(";"),
        output: step.output.replace(/\n/g, " "),
        reasoning: step.reasoning.replace(/\n/g, " "),
        policy_citation: step.policy_citation || "",
        veto_rule: step.veto_rule || "",
      }))
    );
    
    if (format === "csv") {
      const headers = ["ID", "Run ID", "Timestamp", "Department", "Level", "Agent", "Action", "Phase", "Status", "Tools Used", "Output", "Reasoning", "Policy Citation", "Veto Rule"];
      const csvRows = [headers.join(",")];
      
      allLogs.forEach((log) => {
        const values = [
          `"${log.id}"`,
          `"${log.run_id}"`,
          `"${log.timestamp}"`,
          `"${log.department}"`,
          `"${log.level}"`,
          `"${log.agent}"`,
          `"${log.action}"`,
          `"${log.phase}"`,
          `"${log.status}"`,
          `"${log.tools}"`,
          `"${log.output.replace(/"/g, '""')}"`,
          `"${log.reasoning.replace(/"/g, '""')}"`,
          `"${log.policy_citation}"`,
          `"${log.veto_rule}"`
        ];
        csvRows.push(values.join(","));
      });
      
      const csvContent = csvRows.join("\n");
      
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=agent_audit_logs.csv",
        },
      });
    }
    
    // Default to JSON
    return new Response(JSON.stringify(allLogs, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=agent_audit_logs.json",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to export logs" }, { status: 500 });
  }
}
