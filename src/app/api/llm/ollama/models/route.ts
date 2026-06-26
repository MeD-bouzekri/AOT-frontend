import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base_url = searchParams.get("base_url");
    
    if (!base_url) {
      return NextResponse.json({ models: [] });
    }
    
    const targetUrl = base_url.endsWith("/") ? `${base_url}api/tags` : `${base_url}/api/tags`;
    
    try {
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Return standard offline models
      return NextResponse.json({
        models: [
          { name: "llama3.1:8b" },
          { name: "llama3.1:70b" },
          { name: "llama3.2:3b" },
          { name: "mistral:latest" },
          { name: "gemma2:9b" },
          { name: "phi3:latest" }
        ]
      });
    }
  } catch (error) {
    return NextResponse.json({ models: [] });
  }
}
