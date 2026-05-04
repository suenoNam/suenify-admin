import { execFileSync } from "child_process";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const NAS_IP = "192.168.0.44";
const COMMUNITY = "suenify";

function snmpwalk(oid: string) {
  return execFileSync("snmpwalk", ["-v2c", "-c", COMMUNITY, NAS_IP, oid], {
    encoding: "utf-8",
  });
}

function parseIntegers(output: string) {
  return output
    .split("\n")
    .map((line) => line.match(/=\s+(?:INTEGER|Counter64):\s+(\d+)/)?.[1])
    .filter(Boolean)
    .map(Number);
}

function getStorageValue(output: string, index: number) {
  const line = output
    .split("\n")
    .find((item) => item.includes(`.${index} =`));

  return Number(line?.match(/=\s+INTEGER:\s+(\d+)/)?.[1] ?? 0);
}

export async function GET() {
  try {
    const cpuOutput = snmpwalk("1.3.6.1.2.1.25.3.3.1.2");
    const cpuValues = parseIntegers(cpuOutput);
    const cpuUsage = Math.round(
      cpuValues.reduce((sum, value) => sum + value, 0) / cpuValues.length
    );

    const memOutput = snmpwalk("1.3.6.1.4.1.2021.4");
    const memTotalKb = Number(
      memOutput.match(/memTotalReal\.0 = INTEGER:\s+(\d+)/)?.[1] ?? 0
    );
    const memAvailKb = Number(
      memOutput.match(/memAvailReal\.0 = INTEGER:\s+(\d+)/)?.[1] ?? 0
    );
    const memUsedKb = memTotalKb - memAvailKb;
    const memUsedPercent = Math.round((memUsedKb / memTotalKb) * 100);

    const storageOutput = snmpwalk("1.3.6.1.2.1.25.2.3.1");

    // /volume1 기준
    const volumeIndex = 38;
    const allocationUnit = getStorageValue(storageOutput, volumeIndex);
    const storageSize = getStorageValue(storageOutput, volumeIndex);
    const storageUsed = getStorageValue(storageOutput, volumeIndex);

    const allocationLine = storageOutput
      .split("\n")
      .find((line) =>
        line.includes(`HOST-RESOURCES-MIB::hrStorageAllocationUnits.${volumeIndex}`)
      );
    const sizeLine = storageOutput
      .split("\n")
      .find((line) =>
        line.includes(`HOST-RESOURCES-MIB::hrStorageSize.${volumeIndex}`)
      );
    const usedLine = storageOutput
      .split("\n")
      .find((line) =>
        line.includes(`HOST-RESOURCES-MIB::hrStorageUsed.${volumeIndex}`)
      );

    const unit = Number(allocationLine?.match(/INTEGER:\s+(\d+)/)?.[1] ?? 0);
    const size = Number(sizeLine?.match(/INTEGER:\s+(\d+)/)?.[1] ?? 0);
    const used = Number(usedLine?.match(/INTEGER:\s+(\d+)/)?.[1] ?? 0);

    const totalBytes = unit * size;
    const usedBytes = unit * used;

    const totalTb = Number((totalBytes / 1024 ** 4).toFixed(1));
    const usedGb = Math.round(usedBytes / 1024 ** 3);
    const usedPercent = Math.round((usedBytes / totalBytes) * 100);

    return NextResponse.json({
      ok: true,
      service: "NAS",
      cpu: {
        usage: `${cpuUsage}%`,
      },
      memory: {
  usedMB: Math.round(memUsedKb / 1024),
  totalMB: Math.round(memTotalKb / 1024),
  usedPercent: memUsedPercent,
},
      storage: {
        volume: "/volume1",
        usedGB: usedGb,
        totalTB: totalTb,
        usedPercent,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      ok: false,
      service: "NAS",
      message: "NAS SNMP 상태 확인 실패",
      checkedAt: new Date().toISOString(),
    });
  }
}