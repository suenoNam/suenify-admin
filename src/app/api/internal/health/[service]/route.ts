import { NextRequest } from "next/server";
import { getServiceById, getPrimaryUrl } from "@/lib/services/registry";

function evaluateResponse(ok: boolean, responseMs: number | null) {
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ service: string }> }
) {
  const { service } = await context.params;
  const serviceData = getServiceById(service);

  if (!serviceData) {
    return Response.json({
      success: false,
      ok: false,
      type: "error",
      status: "Error",
      statusCode: null,
      responseTime: null,
      responseMs: null,
      checkedUrl: "",
      message: "등록되지 않은 서비스입니다.",
    });
  }

  const url =
    serviceData.metadata?.lastCheckedUrl ||
    getPrimaryUrl(serviceData);

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
    const evaluated = evaluateResponse(reachable, responseMs);

    return Response.json({
      ...evaluated,
      ok: reachable,
      service: serviceData.id,
      title: serviceData.title,
      statusCode: response.status,
      responseTime: responseMs,
      responseMs,
      checkedUrl: url,
    });
  } catch {
    return Response.json({
      success: false,
      ok: false,
      service: serviceData.id,
      title: serviceData.title,
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