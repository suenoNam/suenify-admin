import { NextResponse } from "next/server";

export async function GET() {
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

    const data = await response.json();

    return NextResponse.json({
  success: true,
  data: {
    서버상태: data.서버상태 ?? "확인 실패",
    외부주소: data.외부주소 ?? "-",
    내부주소: data.내부주소 ?? "-",
    저장소사용률: data.저장소사용률 ?? "-",
    CPU사용률: data.CPU사용률 ?? "-",
    RAM사용률: data.RAM사용률 ?? "-",
    총저장공간: data.총저장공간 ?? "-",
    현재사용량: data.현재사용량 ?? "-",
    저장공간1: data.저장공간1,
    저장공간2: data.저장공간2,
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