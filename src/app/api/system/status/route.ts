import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

async function checkUrl(url: string) {
  try {
    const startedAt = Date.now();

    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    return {
      ok: response.ok,
      status: response.status,
      responseMs: Date.now() - startedAt,
      url,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      responseMs: null,
      url,
    };
  }
}

async function getPm2Status() {
  try {
    const { stdout } = await execFileAsync("pm2", ["jlist"]);
    const list = JSON.parse(stdout);

    return list.map((item: any) => ({
      name: item.name,
      status: item.pm2_env?.status ?? "unknown",
      restarts: item.pm2_env?.restart_time ?? 0,
      memory: item.monit?.memory ?? 0,
      cpu: item.monit?.cpu ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const [suenifyWeb, ollama, pm2] = await Promise.all([
    checkUrl("http://192.168.0.218:3000/api/test"),
    checkUrl("http://127.0.0.1:11434/api/tags"),
    getPm2Status(),
  ]);

  return Response.json({
    ok: true,
    server: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: os.uptime(),
    },
    memory: {
      totalGB: Number((totalMemory / 1024 / 1024 / 1024).toFixed(2)),
      usedGB: Number((usedMemory / 1024 / 1024 / 1024).toFixed(2)),
      freeGB: Number((freeMemory / 1024 / 1024 / 1024).toFixed(2)),
      usedPercent: Number(((usedMemory / totalMemory) * 100).toFixed(1)),
    },
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0]?.model ?? "unknown",
      loadAverage: os.loadavg(),
    },
    services: {
      suenifyWeb,
      ollama,
      pm2,
    },
  });
}