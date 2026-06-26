import { NextResponse } from "next/server";
import { readDb, writeDb, runSimulation, Run } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const db = readDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    let filteredRuns = [...db.runs];
    if (status) {
      filteredRuns = filteredRuns.filter((r) => r.status === status);
    }
    
    // Sort by timestamp desc
    filteredRuns.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    
    return NextResponse.json(filteredRuns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { request: requestText, requester } = body;
    
    if (!requestText) {
      return NextResponse.json({ error: "Request prompt is required" }, { status: 400 });
    }
    
    const db = readDb();
    const runId = `run-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Calculate department from text
    const textLower = requestText.toLowerCase();
    const depts: string[] = [];
    if (textLower.includes("hr") || textLower.includes("onboard") || textLower.includes("contract") || textLower.includes("hire")) depts.push("HR");
    if (textLower.includes("it") || textLower.includes("email") || textLower.includes("laptop") || textLower.includes("macbook")) depts.push("IT");
    if (textLower.includes("procure") || textLower.includes("license") || textLower.includes("purchase") || textLower.includes("order")) depts.push("Procurement");
    if (textLower.includes("wire") || textLower.includes("transfer") || textLower.includes("finance") || textLower.includes("payment")) depts.push("Finance");
    if (depts.length === 0) depts.push("General");

    const newRun: Run = {
      id: runId,
      request: requestText,
      status: "running",
      requester: requester || "employee@gmail.com",
      department: depts.join("/"),
      ts: new Date().toISOString(),
      duration_ms: 0,
      steps: [],
    };
    
    db.runs.push(newRun);
    writeDb(db);
    
    // Kick off the simulation asynchronously
    runSimulation(runId, requestText, requester || "employee@gmail.com");
    
    return NextResponse.json(newRun);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
  }
}
