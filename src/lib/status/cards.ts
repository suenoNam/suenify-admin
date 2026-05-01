import type { StatusCardItem, StatusType } from "@/lib/status/types";
import {
  getMergedServiceRegistry,
  getPrimaryUrl,
} from "@/lib/services/registry";
import { loadServiceDetailOverride } from "@/lib/services/storage";

function getInitialStatusType(monitoringEnabled: boolean): StatusType {
  return monitoringEnabled ? "warning" : "offline";
}

function getInitialStatusText(monitoringEnabled: boolean) {
  return monitoringEnabled ? "준비중" : "비활성";
}

function getInitialSubText(monitoringEnabled: boolean) {
  return monitoringEnabled ? "첫 상태 확인 전" : "모니터링 꺼짐";
}

function getDefaultAccessInfo(
  primaryMode: "internal" | "external",
  accessInfo?: string
) {
  if (accessInfo?.trim()) return accessInfo;

  return primaryMode === "internal"
    ? "기본 체크: 내부 주소"
    : "기본 체크: 외부 주소";
}

function getCardSubText(service: ReturnType<typeof getMergedServiceRegistry>[number]) {
  const storageUsedPercent = service.metadata?.storageUsedPercent;
  const proxyPath = service.metadata?.proxyPath ?? "";
  const proxyTarget = service.metadata?.proxyTarget ?? "";

  if (service.serviceKind === "nas") {
    return storageUsedPercent !== undefined
      ? `Storage ${storageUsedPercent}%`
      : service.pendingDetail;
  }

  if (proxyPath && proxyTarget) {
    return `${proxyPath} → ${proxyTarget}`;
  }

  return getInitialSubText(service.monitoringEnabled);
}

function getCardMetricA(service: ReturnType<typeof getMergedServiceRegistry>[number]) {
  const internalIp = service.metadata?.internalIp ?? "";
  const proxyPath = service.metadata?.proxyPath ?? "";

  if (service.serviceKind === "nas") {
    return internalIp || service.metricA || "";
  }

  return proxyPath || service.metricA || "";
}

function getCardMetricB(service: ReturnType<typeof getMergedServiceRegistry>[number]) {
  const responseMs = service.metadata?.responseMs;
  const proxyTarget = service.metadata?.proxyTarget ?? "";

  if (service.serviceKind === "nas") {
    return responseMs !== undefined ? `${responseMs}ms` : service.metricB || "";
  }

  return proxyTarget || service.metricB || "";
}

function getCardDetail(
  service: ReturnType<typeof getMergedServiceRegistry>[number]
) {
  return service.description || service.pendingDetail || "설명 없음";
}

function getCardNote(
  service: ReturnType<typeof getMergedServiceRegistry>[number],
  directUrl: string
) {
  const lastCheckedUrl = service.metadata?.lastCheckedUrl ?? directUrl;

  if (lastCheckedUrl) {
    return `마지막 확인 주소: ${lastCheckedUrl}`;
  }

  return service.note || "-";
}

export function getStatusCards(): StatusCardItem[] {
  const services = getMergedServiceRegistry().filter((service) => service.enabled);

  const baseCards = services.map<StatusCardItem>((service) => {
    const directUrl = getPrimaryUrl(service);

    return {
      id: service.id,
      title: service.title,
      status: getInitialStatusText(service.monitoringEnabled),
      type: getInitialStatusType(service.monitoringEnabled),
      detail: getCardDetail(service),
      sub: getCardSubText(service),
      note: getCardNote(service, directUrl),
      directUrl,
      internalUrl: service.internalUrl?.trim() || "",
      externalUrl: service.externalUrl?.trim() || "",
      primaryMode: service.primary,
      accessInfo: getDefaultAccessInfo(service.primary, service.accessInfo),
      metricA: getCardMetricA(service),
      metricB: getCardMetricB(service),
      checkedAt: "-",
      ruleSummary: service.ruleSummary ?? "",
    };
  });

  if (typeof window === "undefined") {
    return baseCards;
  }

  return baseCards.map((card) => {
    const parsed = loadServiceDetailOverride(card.id);
    if (!parsed) return card;

    return {
      ...card,
      note: parsed.note ?? card.note,
      directUrl: parsed.directUrl ?? card.directUrl,
      accessInfo: parsed.accessInfo ?? card.accessInfo,
    };
  });
}

export function getRecentLogs(): string[] {
  return [
    "대시보드가 초기화되었습니다.",
    "서비스 상태 카드가 로드되었습니다.",
    "최근 로그 패널이 준비되었습니다.",
  ];
}