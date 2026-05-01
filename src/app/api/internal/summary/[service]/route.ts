import { NextRequest, NextResponse } from "next/server";
import { getServiceById, getPrimaryUrl } from "@/lib/services/registry";
import { getServerServiceUrl } from "@/lib/services/server-config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;

  const serviceItem = getServiceById(service);

  if (!serviceItem) {
    return NextResponse.json(
      {
        success: false,
        responseTime: null,
        statusCode: null,
        message: "등록되지 않은 서비스입니다.",
        checkedUrl: "",
      },
      { status: 404 }
    );
  }

  const targetUrl = getServerServiceUrl(serviceItem.id) || getPrimaryUrl(serviceItem);

  if (!targetUrl) {
    return NextResponse.json(
      {
        success: false,
        responseTime: null,
        statusCode: null,
        message: "체크할 URL이 없습니다.",
        checkedUrl: "",
      },
      { status: 400 }
    );
  }

  const start = Date.now();

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    const end = Date.now();

    return NextResponse.json({
      success: response.ok,
      responseTime: end - start,
      statusCode: response.status,
      message: response.ok ? "정상 응답" : "응답 오류",
      checkedUrl: targetUrl,
    });
  } catch {
    return NextResponse.json({
      success: false,
      responseTime: null,
      statusCode: null,
      message: "연결 실패",
      checkedUrl: targetUrl,
    });
  }
}