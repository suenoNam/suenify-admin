import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // 1. deploy 요청
    await fetch("https://deploy.suenify.com/trigger/web", {
      method: "POST",
      headers: {
        "x-suenify-admin-secret": "suenify-admin-trigger-secret-2026",
      },
    });

    // 2. 잠깐 대기 (빌드 시간)
    await new Promise((r) => setTimeout(r, 3000));

    // 3. health 체크
    const health = await fetch(
      "http://localhost:3001/api/internal/health/suenify-web"
    );

    const result = await health.json();

    return Response.json({
      success: true,
      health: result,
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: "deploy failed",
    });
  }
}