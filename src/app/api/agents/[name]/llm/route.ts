import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const db = readDb();
    const agentConfig = db.agents[name];
    
    if (!agentConfig) {
      return NextResponse.json({ error: `Agent ${name} not found` }, { status: 404 });
    }
    
    return NextResponse.json(agentConfig);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch LLM config" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    const body = await request.json();
    const db = readDb();
    
    if (!db.agents[name]) {
      return NextResponse.json({ error: `Agent ${name} not found` }, { status: 404 });
    }
    
    db.agents[name] = {
      provider: body.provider,
      model: body.model,
      base_url: body.base_url || "",
      api_key_ref: body.api_key_ref || "",
      temperature: body.temperature ?? 0.2,
      max_tokens: body.max_tokens ?? 1024
    };
    
    writeDb(db);
    return NextResponse.json({ success: true, config: db.agents[name] });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update LLM config" }, { status: 500 });
  }
}
