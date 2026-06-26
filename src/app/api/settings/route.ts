import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET() {
  try {
    const db = readDb();
    return NextResponse.json(db.settings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const db = readDb();
    
    const {
      auto_approve_spend_limit,
      manager_spend_limit,
      director_spend_limit,
      hard_spend_ceiling,
      max_risk_score,
      mode,
      default_llm,
      active_departments,
      rules,
      changed_by,
      change_summary
    } = body;
    
    // Increment version
    const lastVersion = db.settings.policy_history?.[0]?.version || 1;
    const newVersion = lastVersion + 1;
    
    const newHistoryItem = {
      version: newVersion,
      ts: new Date().toISOString(),
      changed_by: changed_by || "admin@gmail.com",
      change_summary: change_summary || "Updated governance rules and spend thresholds."
    };
    
    db.settings = {
      auto_approve_spend_limit: auto_approve_spend_limit ?? db.settings.auto_approve_spend_limit,
      manager_spend_limit: manager_spend_limit ?? db.settings.manager_spend_limit,
      director_spend_limit: director_spend_limit ?? db.settings.director_spend_limit,
      hard_spend_ceiling: hard_spend_ceiling ?? db.settings.hard_spend_ceiling,
      max_risk_score: max_risk_score ?? db.settings.max_risk_score,
      mode: mode ?? db.settings.mode,
      default_llm: default_llm ?? db.settings.default_llm,
      active_departments: active_departments ?? db.settings.active_departments,
      active_workers: db.settings.active_workers, // Keep existing
      rules: rules ?? db.settings.rules,
      policy_history: [newHistoryItem, ...(db.settings.policy_history || [])]
    };
    
    writeDb(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
