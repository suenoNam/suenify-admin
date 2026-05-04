import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAC_MINI_HEALTH_URL =
  "http://192.168.0.218:3003/api/health/mac-mini";

export async function GET() {
  try {
    const res = await fetch(MAC_MINI_HEALTH_URL, {
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      ok: false,
      service: "Mac Mini",
      message: "맥미니 상태 API 연결 실패",
    });
  }
}