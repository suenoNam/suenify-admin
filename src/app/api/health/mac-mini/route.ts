import { NextResponse } from "next/server";
import os from "os";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const cpuUsage = Math.round(
      (1 -
        cpus.reduce((acc, cpu) => {
          const total =
            cpu.times.user +
            cpu.times.nice +
            cpu.times.sys +
            cpu.times.idle +
            cpu.times.irq;

          return acc + cpu.times.idle / total;
        }, 0) /
          cpus.length) *
        100
    );

    return NextResponse.json({
      ok: true,
      service: "Mac Mini",
      cpu: {
        cores: cpus.length,
        usage: `${cpuUsage}%`,
      },
      memory: {
        totalGB: Math.round(totalMem / 1024 / 1024 / 1024),
        usedGB: Math.round(usedMem / 1024 / 1024 / 1024),
        freeGB: Math.round(freeMem / 1024 / 1024 / 1024),
        usedPercent: Math.round((usedMem / totalMem) * 100),
      },
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      service: "Mac Mini",
      message: "Mac Mini 상태 확인 실패",
      checkedAt: new Date().toISOString(),
    });
  }
}