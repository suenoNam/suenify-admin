import type { ServiceStatus } from "../types";

type CheckResult = {
  success: boolean;
  responseTime: number | null;
  status: ServiceStatus;
};

export async function checkJellyfinStatus(url: string): Promise<CheckResult> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseTime = Date.now() - start;

    if (!response.ok) {
      return {
        success: false,
        responseTime,
        status: "error",
      };
    }

    return {
      success: true,
      responseTime,
      status: "online",
    };
  } catch (error) {
    return {
      success: false,
      responseTime: null,
      status: "offline",
    };
  }
}