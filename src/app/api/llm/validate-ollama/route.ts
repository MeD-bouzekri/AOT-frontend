import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { base_url, model } = await request.json();
    
    if (!base_url) {
      return NextResponse.json({ ok: false, error: "Ollama base URL is required", available: [] });
    }
    
    const targetUrl = base_url.endsWith("/") ? `${base_url}api/tags` : `${base_url}/api/tags`;
    
    try {
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        const names = data.models?.map((m: any) => m.name) || [];
        
        if (names.includes(model)) {
          return NextResponse.json({ ok: true, available: names });
        } else {
          return NextResponse.json({
            ok: false,
            available: names,
            error: `Model '${model}' not found on this server.`,
          });
        }
      } else {
        throw new Error("Server returned non-200 status");
      }
    } catch (e) {
      // Re-route to simulator demo models when local Ollama is offline
      return NextResponse.json({
        ok: false,
        available: ["llama3.1:8b", "llama3.1:70b", "llama3.2:3b", "mistral:latest", "gemma2:9b", "phi3:latest"],
        error: `Ollama server not reachable at '${base_url}'. Falling back to available demo list.`,
      });
    }
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Validation error occurred", available: [] }, { status: 500 });
  }
}
