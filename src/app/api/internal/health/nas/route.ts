import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();

  try {
    const target = "http://192.168.0.44:8000";

    const response = await fetch(target, {
      method: "GET",
      cache: "no-store",
    });

    const responseTime = Date.now() - start;

    return NextResponse.json({
      success: true,
      online: response.ok,
      status: response.status,
      responseTime,
      checkedAt: new Date().toISOString(),
      target,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      online: false,
      status: null,
      responseTime: null,
      checkedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}