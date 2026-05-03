import { NextRequest, NextResponse } from "next/server";

type NasStatusResponse = {
  서버상태?: string;
  외부주소?: string;
  내부주소?: string;
  저장소사용률?: string;
  CPU사용률?: string;
  RAM사용률?: string;
  총저장공간?: string;
  현재사용량?: string;
  업데이트시간?: string;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ service: string }> }
) {
  const { service } = await context.params;

  if (service === "nas") {
    try {
      const response = await fetch("http://192.168.0.44:5050/nas/status", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            success: false,
            message: "NAS 상태 조회 실패",
          },
          { status: 500 }
        );
      }

      const data = (await response.json()) as NasStatusResponse;

      return NextResponse.json({
        success: true,
        service: "nas",
        data: {
          서버상태: data.서버상태 ?? "확인 실패",
          외부주소: data.외부주소 ?? "-",
          내부주소: data.내부주소 ?? "-",
          저장소사용률: data.저장소사용률 ?? "-",
          CPU사용률: data.CPU사용률 ?? "-",
          RAM사용률: data.RAM사용률 ?? "-",
          총저장공간: data.총저장공간 ?? "-",
          현재사용량: data.현재사용량 ?? "-",
          업데이트시간: data.업데이트시간 ?? "-",
        },
      });
    } catch (error) {
      console.error("NAS API 연결 실패", error);

      return NextResponse.json(
        {
          success: false,
          message: "NAS API 연결 실패",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    service,
    message: "라우트 연결 확인",
  });
}