import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = readDb();
    const { searchParams } = new URL(request.url);
    
    const runId = searchParams.get("run");
    const dept = searchParams.get("dept");
    const agent = searchParams.get("agent");
    const status = searchParams.get("status");
    const query = searchParams.get("q")?.toLowerCase();
    
    // Gather all logs from all runs
    let allLogs = db.runs.flatMap((run) =>
      run.steps.map((step) => ({
        ...step,
        run_request: run.request,
        run_requester: run.requester,
      }))
    );
    
    // Filter
    if (runId) {
      allLogs = allLogs.filter((l) => l.run_id === runId);
    }
    if (dept) {
      allLogs = allLogs.filter((l) => l.department.toLowerCase() === dept.toLowerCase());
    }
    if (agent) {
      allLogs = allLogs.filter((l) => l.agent.toLowerCase() === agent.toLowerCase());
    }
    if (status) {
      allLogs = allLogs.filter((l) => l.status === status);
    }
    if (query) {
      allLogs = allLogs.filter(
        (l) =>
          l.output.toLowerCase().includes(query) ||
          l.reasoning.toLowerCase().includes(query) ||
          l.agent.toLowerCase().includes(query) ||
          l.run_id.toLowerCase().includes(query)
      );
    }
    
    // Sort by timestamp desc
    allLogs.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    
    // Pagination (defaults to first 50)
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const total = allLogs.length;
    
    const paginatedLogs = allLogs.slice((page - 1) * limit, page * limit);
    
    return NextResponse.json({
      logs: paginatedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
