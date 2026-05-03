import { NextRequest } from "next/server";

function evaluateResponse(ok: boolean, statusCode: number | null, responseMs: number | null) {
  if (!ok) {
    return {
      success: false,
      type: "error",
      status: "Error",
      message: "응답 실패",
    };
  }

  if (responseMs !== null && responseMs > 2000) {
    return {
      success: true,
      type: "warning",
      status: "Slow",
      message: "응답은 있지만 느립니다.",
    };
  }

  return {
    success: true,
    type: "online",
    status: "Online",
    message: "응답 정상",
  };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return Response.json({
      success: false,
      ok: false,
      type: "error",
      status: "Error",
      statusCode: null,
      responseTime: null,
      responseMs: null,
      checkedUrl: "",
      message: "체크할 URL이 없습니다.",
    });
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    const responseMs = Date.now() - startedAt;

    // 500번대만 장애로 판단. 401/403/404도 “서버 응답 있음”으로 본다.
    const reachable = response.status < 500;
    const evaluated = evaluateResponse(reachable, response.status, responseMs);

    return Response.json({
      ...evaluated,
      ok: reachable,
      statusCode: response.status,
      responseTime: responseMs,
      responseMs,
      checkedUrl: url,
    });
  } catch {
    return Response.json({
      success: false,
      ok: false,
      type: "error",
      status: "Error",
      statusCode: null,
      responseTime: null,
      responseMs: null,
      checkedUrl: url,
      message: "요청 자체가 실패했습니다.",
    });
  }
}