import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const configPath = path.join(process.cwd(), "src/data/services-config.json");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const serviceId = String(body.serviceId || "").trim();
    const directUrl = String(body.directUrl || "").trim();

    if (!serviceId) {
      return NextResponse.json(
        { success: false, message: "serviceId가 없습니다." },
        { status: 400 }
      );
    }

    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON.parse(raw) as Record<string, { directUrl?: string }>;

    parsed[serviceId] = {
      ...(parsed[serviceId] || {}),
      directUrl,
    };

    await fs.writeFile(configPath, JSON.stringify(parsed, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: "서비스 설정이 저장되었습니다.",
      serviceId,
      directUrl,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "서비스 설정 저장 실패" },
      { status: 500 }
    );
  }
}