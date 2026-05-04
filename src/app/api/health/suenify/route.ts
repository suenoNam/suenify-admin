import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const start = Date.now();

    const res = await fetch("http://localhost:3000", {
      cache: "no-store",
    });

    return NextResponse.json({
      ok: res.ok,
      service: "suenify",
      responseTime: Date.now() - start,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      service: "suenify",
      message: "접속 실패",
    });
  }
}