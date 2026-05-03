"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  House,
  ExternalLink,
  Check,
  CircleAlert,
  FolderTree,
  Cpu,
  MemoryStick,
  Activity,
  Server,
} from "lucide-react";

import StatusCard from "@/components/dashboard/StatusCard";
import FloatingPath from "@/components/common/FloatingPath";
import StatusModal from "@/components/dashboard/StatusModal";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopbar from "@/components/layout/AdminTopbar";
import NasChecklistPanel from "@/components/settings/NasChecklistPanel";
import SettingsBackupPanel from "@/components/settings/SettingsBackupPanel";
import NetworkCheckPanel from "@/components/settings/NetworkCheckPanel";
import ServiceAddPanel from "@/components/settings/ServiceAddPanel";
import ServiceDetailHeader from "@/components/service/ServiceDetailHeader";
import DeleteServiceDialog from "@/components/service/DeleteServiceDialog";
import ServiceSettingsRenderer from "@/components/settings/ServiceSettingsRenderer";
import EnvironmentSettingsPanel from "@/components/settings/EnvironmentSettingsPanel";

import {
  getMergedServiceRegistry,
  getServiceByTitle,
  canDeleteService,
  deleteUserService,

} from "@/lib/services/registry";
import InfraSettingsPanel, {
  getInfraSettings,
} from "@/components/settings/InfraSettingsPanel";
import StatusHistoryPanel, {
  type StatusHistoryItem,
  loadStatusHistory,
  saveStatusHistory,
} from "@/components/settings/StatusHistoryPanel";
import RecentLogsPanel, {
  type RecentLogItem,
  loadRecentLogs,
  saveRecentLogs,
} from "@/components/settings/RecentLogsPanel";
import DashboardSettingsPanel, {
  getDashboardSectionSettings,
  type DashboardSectionSettings,
} from "@/components/settings/DashboardSettingsPanel";
import AccountSettingsPanel from "@/components/settings/AccountSettingsPanel";
import { getStatusCards, getRecentLogs } from "@/lib/status/cards";
import { checkServiceStatus } from "@/lib/status/engine";
import { getViewConfig } from "@/lib/status/view";
import { serviceIconMap } from "@/lib/services/iconMap";

import type {
  StatusCardItem,
  ViewType,
  StatusType,
} from "@/lib/status/types";

type ActionState = "idle" | "success" | "error";

type LiveCheckResult = {
  state: ActionState;
  responseTime: number | null;
  checkedAt: string;
};

type ServiceCheckOutput = {
  key: string;
  title: string;
  success: boolean;
  responseTime: number | null;
  statusCode: number | null;
  message: string;
  checkedUrl: string;
};

type SystemStatusResponse = {
  ok: boolean;
  server: {
    hostname: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
  };
  memory: {
    totalGB: number;
    usedGB: number;
    freeGB: number;
    usedPercent: number;
  };
  cpu: {
    cores: number;
    model: string;
    loadAverage: number[];
  };
  services: {
    suenifyWeb: {
      ok: boolean;
      status: number;
      responseMs: number | null;
      url: string;
    };
    ollama: {
      ok: boolean;
      status: number;
      responseMs: number | null;
      url: string;
    };
    pm2: {
      name: string;
      status: string;
      restarts: number;
      memory: number;
      cpu: number;
    }[];
  };
};
type DeployHealthResponse = {
  ok: boolean;
  service: string;
  uptimeSeconds: number;
  lastDeploy: {
    service: string | null;
    status: "none" | "running" | "success" | "failed";
    message: string;
    startedAt: string | null;
    finishedAt: string | null;
  };
};
const MAX_DYNAMIC_LOGS = 120;

function StatusSlot({ state }: { state: ActionState }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center">
      {state === "success" ? (
        <Check size={16} className="text-emerald-300" />
      ) : state === "error" ? (
        <CircleAlert size={16} className="text-red-300" />
      ) : null}
    </span>
  );
}

function StatusBadge({
  label,
  type,
}: {
  label: string;
  type: ActionState | StatusType;
}) {
  const tone =
    type === "success" || type === "online"
      ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/20"
      : type === "error" || type === "offline"
      ? "bg-red-400/15 text-red-300 border-red-400/20"
      : "bg-white/10 text-slate-300 border-white/10";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${tone}`}
    >
      {label}
    </span>
  );
}

function IconButton({
  onClick,
  title,
  children,
  disabled = false,
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center text-slate-200 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function formatCheckedAt(date: Date) {
  return date
    .toLocaleString("ko-KR", {
      hour12: false,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\./g, "")
    .replace(",", "");
}
function formatStoredDate(value?: string) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("ko-KR", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getCheckedCardPatch(
  original: StatusCardItem,
  liveCheck: LiveCheckResult
): Partial<StatusCardItem> {
  if (liveCheck.state === "idle") return {};

  if (liveCheck.state === "error") {
    return {
      status: "Error",
      type: "error" as StatusType,
      detail: `${original.detail} · 체크 실패`,
      sub: "실시간 연결 확인 중 오류 발생",
    };
  }

  return {
    status: "Online",
    type: "online" as StatusType,
    detail:
      liveCheck.responseTime !== null
        ? `${original.detail} · ${liveCheck.responseTime}ms`
        : original.detail,
    sub: "실시간 연결 확인 정상",
  };
}

function mapTitleToView(title: string): ViewType {
  const service = getServiceByTitle(title);
  return (service?.id as ViewType) ?? "dashboard";
}

function isServiceView(view: ViewType) {
  return view !== "dashboard" && !view.startsWith("settings");
}

function buildCardPatch(
  original: StatusCardItem,
  result: ServiceCheckOutput
): StatusCardItem {
  const checkedAt = formatCheckedAt(new Date());
  const statusCodeText =
    result.statusCode !== null ? `HTTP ${result.statusCode}` : "상태코드 없음";
  const responseText =
    result.responseTime !== null ? `${result.responseTime}ms` : "시간 측정 없음";
  const checkedUrl = result.checkedUrl || original.directUrl || "-";

  const serviceMeta = getServiceByTitle(result.title);

  if (!serviceMeta) {
    return {
      ...original,
      status: result.success ? "Online" : "Error",
      type: result.success ? "online" : "error",
      detail: result.success ? "상태 확인 완료" : "상태 확인 실패",
      sub: result.message || "응답 결과 없음",
      checkedAt,
      metricA: statusCodeText,
      metricB: responseText,
      directUrl: checkedUrl,
    };
  }

  if (!serviceMeta.monitoringEnabled) {
    return {
      ...original,
      status: "Ready",
      type: "warning",
      detail: serviceMeta.pendingDetail,
      sub: "아직 실제 체크 미사용",
      checkedAt,
      directUrl: checkedUrl,
    };
  }

  if (serviceMeta.serviceKind === "nas") {
    if (result.success) {
      return {
        ...original,
        status: "Online",
        type: "online",
        detail: serviceMeta.note || serviceMeta.description,
        sub: result.message || `${statusCodeText} · ${responseText}`,
        checkedAt,
        metricA: statusCodeText,
        metricB: responseText,
        directUrl: checkedUrl,
        accessInfo: "NAS summary API 기준",
        note: `마지막 확인 주소: ${checkedUrl}`,
      };
    }

    return {
      ...original,
      status: "Error",
      type: "error",
      detail: serviceMeta.note || serviceMeta.description,
      sub: result.message || "NAS 연결 실패",
      checkedAt,
      metricA: statusCodeText,
      metricB: responseText,
      directUrl: checkedUrl,
      accessInfo: "NAS summary API 기준",
      note: `마지막 확인 주소: ${checkedUrl}`,
    };
  }

  if (serviceMeta.serviceKind === "media") {
    return {
      ...original,
      status: result.success ? "Online" : "Error",
      type: result.success ? "online" : "error",
      detail: result.success ? "미디어 서비스 연결 정상" : "미디어 서비스 연결 실패",
      sub: result.success
        ? `${statusCodeText} · ${responseText}`
        : result.message || "응답 실패",
      checkedAt,
      metricA: statusCodeText,
      metricB: responseText,
      directUrl: checkedUrl,
    };
  }

  if (serviceMeta.serviceKind === "domain") {
    return {
      ...original,
      status: result.success ? "Online" : "Error",
      type: result.success ? "online" : "error",
      detail: result.success ? "도메인 연결 정상" : "도메인 연결 실패",
      sub: result.success
        ? `${statusCodeText} · ${responseText}`
        : result.message || "응답 실패",
      checkedAt,
      metricA: statusCodeText,
      metricB: responseText,
      directUrl: checkedUrl,
    };
  }

  if (serviceMeta.serviceKind === "api") {
    return {
      ...original,
      status: result.success ? "Online" : "Error",
      type: result.success ? "online" : "error",
      detail: result.success ? "API 연결 정상" : "API 연결 실패",
      sub: result.success
        ? `${statusCodeText} · ${responseText}`
        : result.message || "응답 실패",
      checkedAt,
      metricA: statusCodeText,
      metricB: responseText,
      directUrl: checkedUrl,
    };
  }

  return {
    ...original,
    status: result.success ? "Online" : "Error",
    type: result.success ? "online" : "error",
    detail: result.success ? "서비스 연결 정상" : "서비스 연결 실패",
    sub: result.success
      ? `${statusCodeText} · ${responseText}`
      : result.message || "응답 실패",
    checkedAt,
    metricA: statusCodeText,
    metricB: responseText,
    directUrl: checkedUrl,
  };
}

function SimpleRecentLogStream({ items }: { items: RecentLogItem[] }) {
  const visibleItems = items.slice(0, 20);

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <h3 className="text-lg font-semibold">로그</h3>

      <div className="mt-4 max-h-60 space-y-2 overflow-y-auto text-sm text-slate-300">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <p key={item.id} className="leading-6">
              [{item.createdAt}] {item.message}
            </p>
          ))
        ) : (
          <p className="text-slate-500">아직 로그가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function SystemStatusPanel() {
  const [systemStatus, setSystemStatus] =
    useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadSystemStatus() {
    try {
      setLoading(true);
      const response = await fetch("/api/system/status", {
        cache: "no-store",
      });
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error(error);
      setSystemStatus(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSystemStatus();

    const interval = window.setInterval(() => {
      void loadSystemStatus();
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  const pm2OnlineCount =
    systemStatus?.services.pm2.filter((item) => item.status === "online")
      .length ?? 0;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Mac mini System Status
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            서버, 메모리, CPU, PM2, Ollama 상태를 확인합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSystemStatus}
          disabled={loading}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "확인 중" : "새로고침"}
        </button>
      </div>

      {!systemStatus ? (
        <p className="text-sm text-slate-500">
          시스템 상태를 불러오지 못했습니다.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-300">
              <Activity size={16} />
              <span className="text-sm font-medium">Server</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {systemStatus.server.hostname}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {systemStatus.server.platform} · {systemStatus.server.arch}
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-300">
              <MemoryStick size={16} />
              <span className="text-sm font-medium">Memory</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {systemStatus.memory.usedPercent}%
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {systemStatus.memory.usedGB}GB / {systemStatus.memory.totalGB}GB
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-300">
              <Cpu size={16} />
              <span className="text-sm font-medium">CPU</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {systemStatus.cpu.cores} cores
            </p>
            <p className="mt-2 line-clamp-1 text-sm text-slate-400">
              {systemStatus.cpu.model}
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-300">
              <Server size={16} />
              <span className="text-sm font-medium">Services</span>
            </div>
            <p className="text-lg font-semibold text-white">
              PM2 {pm2OnlineCount} online
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Ollama: {systemStatus.services.ollama.ok ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function DeployHealthPanel() {
  const [deployHealth, setDeployHealth] =
    useState<DeployHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadDeployHealth() {
    try {
      setLoading(true);

      const response = await fetch("https://deploy.suenify.com/health", {
        cache: "no-store",
      });

      const data = await response.json();
      setDeployHealth(data);
    } catch (error) {
      console.error(error);
      setDeployHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDeployHealth();

    const interval = window.setInterval(() => {
      void loadDeployHealth();
    }, 15000);

    return () => window.clearInterval(interval);
  }, []);

  const lastDeploy = deployHealth?.lastDeploy;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Deploy Server Health
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            자동 배포 서버의 상태와 최근 배포 결과를 확인합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDeployHealth}
          disabled={loading}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "확인 중" : "새로고침"}
        </button>
      </div>

      {!deployHealth ? (
        <p className="text-sm text-slate-500">
          배포 서버 상태를 불러오지 못했습니다.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Server
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {deployHealth.service}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              uptime {deployHealth.uptimeSeconds}s
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Last Deploy Service
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {lastDeploy?.service ?? "-"}
            </p>
            <p className="mt-2 text-sm text-slate-400">최근 배포 대상</p>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Last Deploy Status
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {lastDeploy?.status ?? "-"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {lastDeploy?.message ?? "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Finished At
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {lastDeploy?.finishedAt
                ? formatStoredDate(lastDeploy.finishedAt)
                : "-"}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              마지막 배포 완료 시간
            </p>
          </div>
        </div>
      )}
    </section>
  );
}


export default function Home() {
  const [allCards, setAllCards] = useState<StatusCardItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLogItem[]>([]);
  const [selectedCard, setSelectedCard] = useState<StatusCardItem | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("dashboard");
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [isMounted, setIsMounted] = useState(false);
  const [dashboardSections, setDashboardSections] =
  useState<DashboardSectionSettings | null>(null);
  const [infraSettings, setInfraSettings] =
  useState<ReturnType<typeof getInfraSettings> | null>(null);

  const [urlActionState, setUrlActionState] = useState<ActionState>("idle");
  const [checkState, setCheckState] = useState<ActionState>("idle");
  const [isLogPaused, setIsLogPaused] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [liveCheck, setLiveCheck] = useState<LiveCheckResult>({
    state: "idle",
    responseTime: null,
    checkedAt: "",
  });

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  

  const lastAutoStateRef = useRef<Record<string, ActionState>>({});
  const lastDashboardStateRef = useRef<Record<string, ActionState>>({});
  const didInitialDashboardCheckRef = useRef(false);

  function refreshDashboardData() {
  setAllCards(getStatusCards());
  setDashboardSections(getDashboardSectionSettings());
  setRefreshToken((prev) => prev + 1);
}

  useEffect(() => {
  setIsMounted(true);
  setDashboardSections(getDashboardSectionSettings());
  setInfraSettings(getInfraSettings());

  const savedView = window.sessionStorage.getItem("suenify-active-view");
  const savedTheme = window.localStorage.getItem("suenify-theme-mode");

  if (savedView) {
    setActiveView(savedView as ViewType);
  }

  if (savedTheme === "light" || savedTheme === "dark") {
    setThemeMode(savedTheme);
  }
}, []);

useEffect(() => {
  if (!isMounted) return;
  window.sessionStorage.setItem("suenify-active-view", activeView);
}, [activeView, isMounted]);

useEffect(() => {
  if (!isMounted) return;
  window.localStorage.setItem("suenify-theme-mode", themeMode);
}, [themeMode, isMounted]);

  useEffect(() => {
    refreshDashboardData();
    setStatusHistory(loadStatusHistory());

    const savedLogs = loadRecentLogs();
    if (savedLogs.length > 0) {
      setRecentLogs(savedLogs);
    } else {
      const seeded = getRecentLogs().map((message, index) => ({
        id: `seed-${index}-${Date.now()}`,
        level: "info" as const,
        source: "system" as const,
        message,
        createdAt: formatCheckedAt(new Date()),
      }));
      setRecentLogs(seeded);
      saveRecentLogs(seeded);
    }
  }, []);

  const viewConfig = getViewConfig(activeView);

  function resetStateLater(
    setter: React.Dispatch<React.SetStateAction<ActionState>>
  ) {
    window.setTimeout(() => {
      setter("idle");
    }, 1500);
  }

  function handleGoHome() {
    setActiveView("dashboard");
    setIsSidebarOpen(false);
    setSelectedCard(null);
  }

  function handleOpenDetailView(title: string) {
    setActiveView(mapTitleToView(title));
    setSelectedCard(null);
    setIsSidebarOpen(false);
    setUrlActionState("idle");
    setCheckState("idle");
    setLiveCheck({
      state: "idle",
      responseTime: null,
      checkedAt: "",
    });
  }

  const visibleCardsBase = useMemo(() => {
    if (activeView === "dashboard") return allCards;

    return allCards.filter((card) => {
      const service = getServiceByTitle(card.title);
      return service?.id === activeView;
    });
  }, [activeView, allCards, refreshToken]);

  const visibleCards = useMemo(() => {
    if (activeView === "dashboard") return allCards;
    if (!isServiceView(activeView)) return [];
    if (visibleCardsBase.length !== 1) return visibleCardsBase;

    return visibleCardsBase.map((card) => ({
      ...card,
      ...getCheckedCardPatch(card, liveCheck),
    }));
  }, [activeView, visibleCardsBase, liveCheck, allCards]);
  
  const sortedDashboardCards = useMemo(() => {
  return [...allCards].sort((a, b) => {
    const aOnline = a.type === "online" ? 0 : 1;
    const bOnline = b.type === "online" ? 0 : 1;

    if (aOnline !== bOnline) {
      return aOnline - bOnline;
    }

    return a.title.localeCompare(b.title, "ko");
  });
}, [allCards]);

  const nasUrl =
    allCards.find((card) => card.title === "NAS Status")?.directUrl ??
    "http://192.168.0.44";

  const domainUrl =
    allCards.find((card) => card.title === "Main Domain")?.directUrl ??
    "https://sueno.myasustor.com";

  const jellyfinUrl =
    allCards.find((card) => card.title === "Jellyfin")?.directUrl ??
    "https://sueno.myasustor.com/jellyfin";

  const apiUrl =
    allCards.find((card) => card.title === "API & Deploy")?.directUrl ??
    "https://api.suenify.com";

  const currentServiceMeta = useMemo(() => {
    if (!isServiceView(activeView)) return null;
    const currentCard = visibleCards[0];
    if (!currentCard) return null;
    return getServiceByTitle(currentCard.title);
  }, [activeView, visibleCards, refreshToken]);

  const settingsServices = useMemo(() => {
  const filtered = getMergedServiceRegistry().filter(
    (service) =>
      service.enabled &&
      !["nas", "main-domain", "api-deploy"].includes(service.id)
  );

  return Array.from(
    new Map(
      filtered.map((service) => [service.title.trim().toLowerCase(), service])
    ).values()
  );
}, [refreshToken]);

   const genericServiceDetailItems = useMemo(() => {
  if (!isServiceView(activeView) || activeView === "nas") return [];

  const currentCard = visibleCards[0];

  return [
    {
      label: "외부 주소",
      value: currentServiceMeta?.externalUrl?.trim() || "-",
    },
    {
      label: "내부 주소",
      value: currentServiceMeta?.internalUrl?.trim() || "-",
    },
    {
  label: "마지막 확인 시간",
  value: currentServiceMeta?.metadata?.lastCheckedAt
    ? formatStoredDate(currentServiceMeta.metadata.lastCheckedAt)
    : currentCard?.checkedAt || liveCheck.checkedAt || "-",
},
    {
      label: "주소",
      value: currentServiceMeta?.accessInfo?.trim() || "-",
    },
    {
      label: "메모",
      value: currentServiceMeta?.note?.trim() || "-",
    },
  ];
}, [activeView, currentServiceMeta, liveCheck, visibleCards]);

  function appendLogEntry(item: Omit<RecentLogItem, "id">) {
    if (isLogPaused) return;

    setRecentLogs((prev) => {
      const next = [
        {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
        ...prev,
      ].slice(0, MAX_DYNAMIC_LOGS);

      saveRecentLogs(next);
      return next;
    });
  }

  function appendStatusHistory(item: StatusHistoryItem) {
    setStatusHistory((prev) => {
      const next = [item, ...prev].slice(0, 30);
      saveStatusHistory(next);
      return next;
    });
  }

  function clearStatusHistory() {
    setStatusHistory([]);
    saveStatusHistory([]);
  }

  function clearRecentLogs() {
    setRecentLogs([]);
    saveRecentLogs([]);
  }

  async function runServiceCheck(
    source: "auto" | "manual" = "auto"
  ): Promise<void> {
    if (!isServiceView(activeView)) return;
    if (visibleCardsBase.length !== 1) return;

    const currentCard = visibleCardsBase[0];
    const serviceMeta = getServiceByTitle(currentCard.title);

    if (!serviceMeta?.monitoringEnabled) {
      const checkedAt = formatCheckedAt(new Date());

      setCheckState("idle");
      setLiveCheck({
        state: "idle",
        responseTime: null,
        checkedAt,
      });

      if (source === "manual") {
        appendLogEntry({
          level: "info",
          source: "manual",
          message: `${currentCard.title} 서비스는 아직 체크 대상이 아닙니다.`,
          createdAt: checkedAt,
        });
      }

      return;
    }

    const url = currentCard?.directUrl?.trim();
    const checkedAt = formatCheckedAt(new Date());
    const serviceName = currentCard.title;

    if (!url) {
      setCheckState("error");
      setLiveCheck({
        state: "error",
        responseTime: null,
        checkedAt,
      });

      if (source === "manual") {
        appendLogEntry({
          level: "error",
          source: "manual",
          message: `${serviceName} manual check failed: URL missing`,
          createdAt: checkedAt,
        });
      }

      return;
    }

    try {
      const service = getServiceByTitle(currentCard.title);
      if (!service) return;

      const result = await checkServiceStatus(service);
      const nextState: ActionState = result.success ? "success" : "error";

      setCheckState(nextState);
      setLiveCheck({
        state: nextState,
        responseTime: result.success ? result.responseTime : null,
        checkedAt,
      });
      resetStateLater(setCheckState);

      if (source === "manual") {
        appendLogEntry({
          level: result.success ? "success" : "error",
          source: "manual",
          message: result.success
            ? `${serviceName} manual check success · ${result.responseTime}ms`
            : `${serviceName} manual check failed · ${result.message}`,
          createdAt: checkedAt,
        });
      } else {
        const previousState = lastAutoStateRef.current[serviceName];

        if (previousState !== nextState) {
          if (nextState === "success") {
            const message = `${serviceName} auto recovery detected · ${result.responseTime}ms`;

            appendLogEntry({
              level: "success",
              source: "auto",
              message,
              createdAt: checkedAt,
            });

            appendStatusHistory({
              service: serviceName,
              state: "success",
              source: "auto",
              message,
              checkedAt,
            });
          } else {
            const message = `${serviceName} auto failure detected`;

            appendLogEntry({
              level: "error",
              source: "auto",
              message,
              createdAt: checkedAt,
            });

            appendStatusHistory({
              service: serviceName,
              state: "error",
              source: "auto",
              message,
              checkedAt,
            });
          }
        }

        lastAutoStateRef.current[serviceName] = nextState;
      }
    } catch (error) {
      console.error(error);
      setCheckState("error");
      setLiveCheck({
        state: "error",
        responseTime: null,
        checkedAt,
      });
      resetStateLater(setCheckState);

      if (source === "manual") {
        appendLogEntry({
          level: "error",
          source: "manual",
          message: `${serviceName} manual check error occurred`,
          createdAt: checkedAt,
        });
      } else {
        const previousState = lastAutoStateRef.current[serviceName];
        if (previousState !== "error") {
          const message = `${serviceName} auto error occurred`;

          appendLogEntry({
            level: "error",
            source: "auto",
            message,
            createdAt: checkedAt,
          });

          appendStatusHistory({
            service: serviceName,
            state: "error",
            source: "auto",
            message,
            checkedAt,
          });
        }
        lastAutoStateRef.current[serviceName] = "error";
      }
    }
  }

  async function refreshDashboardCards() {
    if (allCards.length === 0) return;

    const checkedAt = formatCheckedAt(new Date());

    const serviceTargets = getMergedServiceRegistry()
      .filter((service) => service.enabled && service.monitoringEnabled)
      .map((service) => ({
        key: service.id,
        title: service.title,
        run: () => checkServiceStatus(service),
      }));

    const results = await Promise.all(
      serviceTargets.map(async (target) => {
        try {
          const result = await target.run();
          return {
            key: target.key,
            title: target.title,
            success: result.success,
            responseTime: result.responseTime,
            statusCode: result.statusCode ?? null,
            message: result.message,
            checkedUrl: result.checkedUrl ?? "",
          } satisfies ServiceCheckOutput;
        } catch (error) {
          console.error(error);
          return {
            key: target.key,
            title: target.title,
            success: false,
            responseTime: null,
            statusCode: null,
            message: "실제 연결 확인 중 오류가 발생했습니다.",
            checkedUrl: "",
          } satisfies ServiceCheckOutput;
        }
      })
    );

    setAllCards((prev) =>
      prev.map((card) => {
        const matched = results.find((result) => result.title === card.title);
        if (!matched) return card;
        return buildCardPatch(card, matched);
      })
    );

    for (const result of results) {
      const nextState: ActionState = result.success ? "success" : "error";
      const previousState = lastDashboardStateRef.current[result.title];

      if (!didInitialDashboardCheckRef.current || previousState !== nextState) {
        if (result.success) {
          appendLogEntry({
            level: "success",
            source: "auto",
            message: `${result.title} 홈 카드 상태 확인 성공${
              result.responseTime !== null ? ` · ${result.responseTime}ms` : ""
            }`,
            createdAt: checkedAt,
          });

          appendStatusHistory({
            service: result.title,
            state: "success",
            source: "auto",
            message: `${result.title} 홈 카드 상태가 정상으로 확인되었습니다.`,
            checkedAt,
          });
        } else {
          appendLogEntry({
            level: "error",
            source: "auto",
            message: `${result.title} 홈 카드 상태 확인 실패 · ${result.message}`,
            createdAt: checkedAt,
          });

          appendStatusHistory({
            service: result.title,
            state: "error",
            source: "auto",
            message: `${result.title} 홈 카드 상태가 오류로 감지되었습니다.`,
            checkedAt,
          });
        }
      }

      lastDashboardStateRef.current[result.title] = nextState;
    }

    didInitialDashboardCheckRef.current = true;
  }

  useEffect(() => {
    setLiveCheck({
      state: "idle",
      responseTime: null,
      checkedAt: "",
    });

    if (!isServiceView(activeView)) return;
    if (visibleCardsBase.length !== 1) return;

    void runServiceCheck("auto");

    const interval = window.setInterval(() => {
      void runServiceCheck("auto");
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeView, visibleCardsBase]);

  useEffect(() => {
    if (allCards.length === 0) return;
    if (activeView !== "dashboard") return;

    void refreshDashboardCards();

    const interval = window.setInterval(() => {
      void refreshDashboardCards();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [allCards.length, activeView]);


  function handleOpenUrl() {
  if (visibleCards.length !== 1) {
    setUrlActionState("error");
    resetStateLater(setUrlActionState);
    return;
  }

  const currentCard = visibleCards[0];
  const currentService = getServiceByTitle(currentCard.title);

  const targetUrl =
    activeView === "nas"
      ? currentService?.externalUrl?.trim() || ""
      : currentCard?.directUrl?.trim() || "";

  if (!targetUrl) {
    setUrlActionState("error");
    resetStateLater(setUrlActionState);
    return;
  }

  try {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    setUrlActionState("success");
    resetStateLater(setUrlActionState);
  } catch (error) {
    console.error(error);
    setUrlActionState("error");
    resetStateLater(setUrlActionState);
  }
}

  async function handleManualCheck() {
    await runServiceCheck("manual");
  }

  function handleRefreshLogs() {
    appendLogEntry({
      level: "info",
      source: "system",
      message: "Log panel refreshed manually",
      createdAt: formatCheckedAt(new Date()),
    });
  }

  function getViewIcon(view: ViewType) {
    const title =
      view === "nas"
        ? "NAS Status"
        : view === "jellyfin"
        ? "Jellyfin"
        : view === "main-domain"
        ? "Main Domain"
        : view === "api-deploy"
        ? "API & Deploy"
        : "";

    const serviceMeta = getServiceByTitle(title);

    if (serviceMeta) {
      const Icon = serviceIconMap[serviceMeta.icon];
      if (Icon) {
        return <Icon size={18} />;
      }
    }

    return <House size={18} />;
  }

  function getCurrentStateLabel() {
    if (liveCheck.state === "success") return "Online";
    if (liveCheck.state === "error") return "Error";
    return visibleCards[0]?.status ?? "Unknown";
  }

  function getCurrentStateType(): ActionState | StatusType {
    if (liveCheck.state !== "idle") return liveCheck.state;
    return visibleCards[0]?.type ?? "warning";
  }

  function handleDeleteCustomService() {
    if (!currentServiceMeta) return;
    if (!canDeleteService(currentServiceMeta.id)) return;

    try {
      deleteUserService(currentServiceMeta.id);
      refreshDashboardData();
      setIsDeleteConfirmOpen(false);
      setActiveView("dashboard");
    } catch (error) {
      console.error(error);
      setIsDeleteConfirmOpen(false);
    }
  }

  return (
    <>
      <main
  className={`min-h-screen ${
    themeMode === "dark" ? "dark bg-slate-950" : "bg-slate-100"
  }`}
>
        <div className="px-6 py-3">
          <div className="mx-auto max-w-7xl">
            <div className="flex h-10 items-center justify-between">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                style={{
                  visibility: isSidebarOpen ? "hidden" : "visible",
                }}
              >
                Menu
              </button>

              <button
                type="button"
                onClick={handleGoHome}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 hover:bg-white/10"
                title="Home"
                aria-label="Home"
              >
                <House size={16} />
              </button>
            </div>
          </div>
        </div>

        {isSidebarOpen ? (
          <div
            className="fixed inset-0 z-9995 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <AdminSidebar

  isOpen={isSidebarOpen}
  activeView={activeView}
  refreshToken={refreshToken}
  statusCards={allCards}
  onSelectView={(view: ViewType) => {
            setActiveView(view);
            setIsSidebarOpen(false);
            setUrlActionState("idle");
            setCheckState("idle");
            setLiveCheck({
              state: "idle",
              responseTime: null,
              checkedAt: "",
            });
          }}
        />

        <section className="px-6 pb-6">
          <div className="mx-auto max-w-7xl">
            {activeView === "dashboard" ? <AdminTopbar /> : null}

            {activeView === "dashboard" ? (
  <>


    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {sortedDashboardCards.map((card) => (
        <StatusCard
  id={card.id}
  key={card.title}
  title={card.title}
  status={card.status}
  detail={card.detail}
  sub={card.sub}
  type={card.type}
  note={card.note}
  checkedAt={card.checkedAt}
  directUrl={card.directUrl}
  onClick={() => setSelectedCard(card)}
/>
      ))}
    </section>

    {isMounted && dashboardSections && infraSettings ? (
      <section className="mt-6 space-y-6">

        {dashboardSections.statusHistory ? (
          <StatusHistoryPanel
            items={statusHistory}
            onClear={clearStatusHistory}
          />
        ) : null}

        {dashboardSections.recentLogs ? (
          <RecentLogsPanel
            items={recentLogs}
            isPaused={isLogPaused}
            onTogglePause={() => setIsLogPaused((prev) => !prev)}
            onRefresh={handleRefreshLogs}
            onClear={clearRecentLogs}
          />
        ) : null}

        {dashboardSections.settingsBackup ? (
          <SettingsBackupPanel onApplied={refreshDashboardData} />
        ) : null}
      </section>
    ) : null}
  </>
) : null}

{isServiceView(activeView) ? (
  <section className="space-y-6">
    <ServiceDetailHeader
      title={viewConfig.title}
      icon={getViewIcon(activeView)}
      stateLabel={getCurrentStateLabel()}
      stateType={getCurrentStateType()}
      actionState={checkState !== "idle" ? checkState : urlActionState}
      canDelete={canDeleteService(currentServiceMeta?.id ?? "")}
      onOpen={handleOpenUrl}
      onCheck={handleManualCheck}
      onDelete={() => setIsDeleteConfirmOpen(true)}
    />
    {activeView === "mac-mini" ? <SystemStatusPanel /> : null}

    {activeView === "deploy-server" ? <DeployHealthPanel /> : null}

    {activeView === "nas" ? (
      <>
        <NasChecklistPanel
          recentLogs={recentLogs}
          onOpenService={(serviceId) => {
            setActiveView(serviceId as ViewType);
            setUrlActionState("idle");
            setCheckState("idle");
            setLiveCheck({
              state: "idle",
              responseTime: null,
              checkedAt: "",
            });
          }}
        />

        <ServiceSettingsRenderer
  serviceId={activeView}
  onSaved={refreshDashboardData}
  titleOverride="수정 정보"
  descriptionOverride="외부 주소, 내부 주소, 메모를 수정합니다."
/>
      </>
    ) : (
      <>
        <div className="rounded-3xl bg-white/5 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {genericServiceDetailItems.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-black/20 p-4"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 break-words text-sm text-slate-300">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <ServiceSettingsRenderer
          serviceId={activeView}
          onSaved={refreshDashboardData}
        />

        <SimpleRecentLogStream items={recentLogs} />
      </>
    )}
  </section>
) : null}

{activeView === "settings-services" ? (
  <section className="space-y-6">
    <div className="rounded-3xl bg-white/5 px-5 py-4">
      <h2 className="text-2xl font-semibold">서비스</h2>
      <p className="mt-2 text-sm text-slate-400">
        새 서비스를 등록하고, 현재 등록된 서브서비스를 관리합니다.
      </p>
    </div>

    <div className="rounded-3xl bg-white/5 p-6">
      <h3 className="text-xl font-semibold">서비스 생성</h3>
      <p className="mt-1 text-sm text-slate-400">
        표시명, URL, 체크 우선순위, 종류 등 서비스 구동에 필요한 최소 항목만 등록합니다.
      </p>

      <div className="mt-5">
        <ServiceAddPanel onAdded={refreshDashboardData} />
      </div>
    </div>

    <div className="rounded-3xl bg-white/5 p-6">
      <h3 className="text-xl font-semibold">서비스 목록</h3>
<p className="mt-1 text-sm text-slate-400">
  등록된 서비스는 상세페이지에서 직접 수정할 수 있습니다.
</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
  {settingsServices.map((service) => {
    const Icon = serviceIconMap[service.icon];

    return (
      <button
        key={service.id}
        type="button"
        onClick={() => {
          setActiveView(service.id as ViewType);
          setIsSidebarOpen(false);
          setUrlActionState("idle");
          setCheckState("idle");
          setLiveCheck({
            state: "idle",
            responseTime: null,
            checkedAt: "",
          });
        }}
        className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:bg-white/5"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-slate-300">
            {Icon ? <Icon size={18} /> : <FolderTree size={18} />}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-100">
                {service.title}
              </p>
              <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                {service.placement === "main" ? "메인" : "서브"}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              마지막 확인 시간: {formatStoredDate(service.metadata?.lastCheckedAt)}
            </p>

            <p className="mt-2 truncate text-xs text-slate-500">
              {service.externalUrl || service.internalUrl || "-"}
            </p>
          </div>
        </div>
      </button>
    );
  })}

  {settingsServices.length === 0 ? (
    <p className="text-sm text-slate-500">
      아직 등록된 서브서비스가 없습니다.
    </p>
  ) : null}
</div>
    </div>
  </section>
) : null}

{activeView === "settings-dashboard" ? (
  <section className="space-y-6">
    <div className="rounded-3xl bg-white/5 px-5 py-4">
      <h2 className="text-2xl font-semibold">{viewConfig.title}</h2>
    </div>

    <DashboardSettingsPanel onSaved={refreshDashboardData} />
  </section>
) : null}

{activeView === "settings-account" ? (
  <section className="space-y-6">
    <div className="rounded-3xl bg-white/5 px-5 py-4">
      <h2 className="text-2xl font-semibold">{viewConfig.title}</h2>
    </div>

    <AccountSettingsPanel />
  </section>
) : null}

{activeView === "settings-logs" ? (
  <section className="space-y-6">
    <div className="rounded-3xl bg-white/5 px-5 py-4">
      <h2 className="text-2xl font-semibold">{viewConfig.title}</h2>
    </div>

    {isMounted ? (
      <RecentLogsPanel
        items={recentLogs}
        isPaused={isLogPaused}
        onTogglePause={() => setIsLogPaused((prev) => !prev)}
        onRefresh={handleRefreshLogs}
        onClear={clearRecentLogs}
      />
    ) : null}

    <StatusHistoryPanel
      items={statusHistory}
      onClear={clearStatusHistory}
    />
  </section>
) : null}

{activeView === "settings-environment" ? (
  <section className="space-y-6">
    <div className="rounded-3xl bg-white/10 px-5 py-4">
      <h2 className="text-2xl font-semibold">{viewConfig.title}</h2>
    </div>

    <EnvironmentSettingsPanel
      themeMode={themeMode}
      onChangeTheme={setThemeMode}
    />
  </section>
) : null}
          </div>
        </section>
      </main>
      

      <StatusModal
        isOpen={selectedCard !== null}
        onClose={() => setSelectedCard(null)}
        onOpenDetailView={handleOpenDetailView}
        title={selectedCard?.title ?? ""}
        status={selectedCard?.status ?? ""}
        detail={selectedCard?.detail ?? ""}
        sub={selectedCard?.sub ?? ""}
        type={selectedCard?.type ?? "online"}
        metricA={selectedCard?.metricA ?? ""}
        metricB={selectedCard?.metricB ?? ""}
        checkedAt={selectedCard?.checkedAt ?? ""}
        ruleSummary={selectedCard?.ruleSummary ?? ""}
        note={selectedCard?.note ?? ""}
        directUrl={selectedCard?.directUrl ?? ""}
        accessInfo={selectedCard?.accessInfo ?? ""}
      />

      <DeleteServiceDialog
        isOpen={isDeleteConfirmOpen}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteCustomService}
      />

      <FloatingPath activeView={activeView} />
    </>
  );
}