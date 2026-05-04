import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OLLAMA_URL = "http://192.168.0.218:11434/api/tags";

export async function GET() {
  try {
    const res = await fetch(OLLAMA_URL, {
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json({
      ok: true,
      service: "Gemma",
      baseUrl: OLLAMA_URL,
      models: data.models ?? [],
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      service: "Gemma",
      baseUrl: OLLAMA_URL,
      message: "맥미니 Gemma 연결 실패",
      checkedAt: new Date().toISOString(),
    });
  }
}