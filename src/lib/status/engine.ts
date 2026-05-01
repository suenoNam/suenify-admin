import {
  getPrimaryUrl,
  type ServiceRegistryItem,
} from "@/lib/services/registry";

export type ServiceCheckResult = {
  success: boolean;
  responseTime: number | null;
  statusCode: number | null;
  message: string;
  checkedUrl: string;
};

async function callInternalApi(serviceId: string): Promise<ServiceCheckResult> {
  try {
    const res = await fetch(`/api/internal/summary/${serviceId}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json();

    return {
      success: Boolean(data.success),
      responseTime: data.responseTime ?? null,
      statusCode: data.statusCode ?? null,
      message: data.message ?? "상태 확인 결과가 없습니다.",
      checkedUrl: data.checkedUrl ?? "",
    };
  } catch {
    return {
      success: false,
      responseTime: null,
      statusCode: null,
      message: "내부 API 호출 실패",
      checkedUrl: "",
    };
  }
}

async function callDirectUrl(url: string): Promise<ServiceCheckResult> {
  try {
    const response = await fetch("/api/internal/check-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
      }),
    });

    const data = await response.json();

    return {
      success: Boolean(data.success),
      responseTime:
        typeof data.responseTime === "number" ? data.responseTime : null,
      statusCode:
        typeof data.statusCode === "number" ? data.statusCode : null,
      message: String(data.message || "상태 확인 결과가 없습니다."),
      checkedUrl: url,
    };
  } catch {
    return {
      success: false,
      responseTime: null,
      statusCode: null,
      message: "CHECK API ERROR",
      checkedUrl: url,
    };
  }
}

export async function checkServiceStatus(
  service: ServiceRegistryItem
): Promise<ServiceCheckResult> {
  const mode = service.monitorMode ?? "direct";

  // 1. 내부 API 방식
  if (mode === "internal-api") {
    return callInternalApi(service.id);
  }

  // 2. 직접 URL 체크 방식
  const url = getPrimaryUrl(service);

  if (!url) {
    return {
      success: false,
      responseTime: null,
      statusCode: null,
      message: "체크할 URL이 없습니다.",
      checkedUrl: "",
    };
  }

  return callDirectUrl(url);
}