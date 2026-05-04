"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  Cpu,
  ExternalLink,
  Folder,
  HardDrive,
  House,
  Menu,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Server,
  Settings,
  Trash2,
} from "lucide-react";

import EditableField from "@/app/components/common/EditableField";
import EditableSelect from "@/app/components/common/EditableSelect";
import IconActionButton from "@/app/components/common/IconActionButton";

type View =
  | "home"
  | "settings-groups"
  | "settings-services"
  | "settings-logs"
  | string;

type ServiceKind = "서버&AI" | "서비스" | "미디어" | "기타" | "API";
type StatusType = "online" | "offline" | "checking" | "unknown";

type GroupItem = {
  id: string;
  name: string;
  locked?: boolean;
  collapsed?: boolean;
  order: number;
};

type ServiceItem = {
  id: string;
  name: string;
  kind: ServiceKind;
  internalUrl: string;
  externalUrl: string;
  groupId: string;
  description: string;
  status: StatusType;
  lastCheckedAt: string;
  order: number;
  cpu?: string;
  memory?: string;
  storage?: string;
  traffic?: string;
  provider?: string;
  connectionInfo?: string;
};

type LogItem = {
  id: string;
  serviceName: string;
  status: StatusType;
  message: string;
  createdAt: string;
};

const STORAGE_KEY = "suenify-simple-admin-state-v2";

const defaultGroups: GroupItem[] = [
  {
    id: "main",
    name: "메인",
    locked: true,
    collapsed: false,
    order: 1,
  },
];

const defaultServices: ServiceItem[] = [
  {
    id: "mac-mini-server",
    name: "맥미니 서버",
    kind: "서버&AI",
    internalUrl: "",
    externalUrl: "",
    groupId: "main",
    description: "Suenify 기본 서버이자 Gemma 운영 기반 서버입니다.",
    status: "unknown",
    lastCheckedAt: "-",
    order: 1,
    cpu: "-",
    memory: "-",
    storage: "-",
  },
  {
    id: "gemma",
    name: "젬마",
    kind: "서버&AI",
    internalUrl: "",
    externalUrl: "",
    groupId: "main",
    description: "맥미니에서 운영할 로컬 AI 모델 서버입니다.",
    status: "unknown",
    lastCheckedAt: "-",
    order: 2,
    cpu: "-",
    memory: "-",
    storage: "-",
  },
  {
    id: "suenify",
    name: "suenify",
    kind: "서비스",
    internalUrl: "",
    externalUrl: "",
    groupId: "main",
    description: "Suenify 메인 서비스입니다.",
    status: "unknown",
    lastCheckedAt: "-",
    order: 3,
    traffic: "-",
  },
];

function nowText() {
  return new Date().toLocaleString("ko-KR", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function displayServiceName(name: string) {
  return name.trim() || "이름 없음";
}

function getServiceIcon(kind: ServiceKind) {
  if (kind === "서버&AI") return Server;
  if (kind === "API") return Activity;
  if (kind === "미디어") return HardDrive;
  if (kind === "서비스") return Bot;
  return Folder;
}

function statusLabel(status: StatusType) {
  if (status === "online") return "Online";
  if (status === "offline") return "Offline";
  if (status === "checking") return "Checking";
  return "Unknown";
}

function statusClass(status: StatusType) {
  if (status === "online") return "bg-emerald-100 text-emerald-700";
  if (status === "offline") return "bg-rose-100 text-rose-700";
  if (status === "checking") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-500";
}

async function checkUrl(url: string) {
  if (!url.trim()) {
    return {
      ok: false,
      message: "확인할 주소가 없습니다.",
    };
  }

  try {
    const response = await fetch("/api/internal/check-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
      cache: "no-store",
    });

    const data = await response.json();

    return {
      ok: Boolean(data.success),
      message: data.message || "상태 확인 완료",
    };
  } catch {
    return {
      ok: false,
      message: "접속 확인에 실패했습니다.",
    };
  }
}
const HEALTH_ENDPOINTS: Record<string, string> = {
  "mac-mini-server": "/api/health/mac-mini",
  gemma: "/api/health/ollama",
  suenify: "/api/health/suenify",
  nas: "/api/health/nas",
};
function getHealthEndpoint(service: ServiceItem) {
  // Mac mini
  if (
    service.id === "mac-mini-server" ||
    service.name.includes("맥미니")
  ) {
    return "/api/health/mac-mini";
  }

  // NAS 🔥 추가
  if (service.name.toLowerCase().includes("nas")) {
    return "/api/health/nas";
  }

  // Gemma
  if (service.name.toLowerCase().includes("gemma")) {
    return "/api/health/ollama";
  }

  return HEALTH_ENDPOINTS[service.id];
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<View>("home");
  const [groups, setGroups] = useState<GroupItem[]>(defaultGroups);
  const [services, setServices] = useState<ServiceItem[]>(defaultServices);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  const [newService, setNewService] = useState<
    Omit<ServiceItem, "id" | "status" | "lastCheckedAt" | "order">
  >({
    name: "",
    kind: "서비스",
    internalUrl: "",
    externalUrl: "",
    groupId: "main",
    description: "",
  });

  useEffect(() => {
    setMounted(true);

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setGroups(parsed.groups?.length ? parsed.groups : defaultGroups);
      setServices(parsed.services?.length ? parsed.services : defaultServices);
      setLogs(parsed.logs ?? []);
    } catch {
      setGroups(defaultGroups);
      setServices(defaultServices);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        groups,
        services,
        logs,
      })
    );
  }, [mounted, groups, services, logs]);

  const activeService =
    services.find((service) => service.id === activeView) ?? null;

  const activeGroup = activeService
    ? groups.find((group) => group.id === activeService.groupId)
    : null;

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.order - b.order);
  }, [groups]);

  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) =>
      displayServiceName(a.name).localeCompare(displayServiceName(b.name), "ko")
    );
  }, [services]);

  const searchResults = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return [];

    const serviceResults = services
      .filter((service) =>
        displayServiceName(service.name).toLowerCase().includes(keyword)
      )
      .map((service) => ({
        id: service.id,
        label: displayServiceName(service.name),
        sub: "서비스",
      }));

    const settingResults = [
      { id: "settings-groups", label: "그룹", sub: "설정" },
      { id: "settings-services", label: "서비스 등록", sub: "설정" },
      { id: "settings-logs", label: "로그", sub: "설정" },
    ].filter((item) => item.label.toLowerCase().includes(keyword));

    return [...serviceResults, ...settingResults].slice(0, 8);
  }, [searchText, services]);

  function addLog(serviceName: string, status: StatusType, message: string) {
    setLogs((prev) =>
      [
        {
          id: makeId("log"),
          serviceName: displayServiceName(serviceName),
          status,
          message,
          createdAt: nowText(),
        },
        ...prev,
      ].slice(0, 120)
    );
  }

  async function refreshService(serviceId: string) {
  const target = services.find((service) => service.id === serviceId);
  if (!target) return;

  // 상태: 확인중
  setServices((prev) =>
    prev.map((service) =>
      service.id === serviceId ? { ...service, status: "checking" } : service
    )
  );

  const endpoint = getHealthEndpoint(target);

const isMacMini =
  target.id === "mac-mini-server" ||
  target.id === "mac-mini" ||
  target.name.includes("맥미니");

  try {
    // ✅ API 있는 서비스
    if (endpoint) {
      const res = await fetch(endpoint, { cache: "no-store" });
      const data = await res.json();

      const nextStatus: StatusType =
  data && (data.ok === true || data.service) ? "online" : "offline";

      setServices((prev) =>
        prev.map((service) =>
          service.id === serviceId
            ? {
                ...service,
                status: nextStatus,
                lastCheckedAt: data.ok ? nowText() : service.lastCheckedAt,

                // 🔥 서비스별 데이터 연결
               cpu:
  isMacMini || target.name.toLowerCase().includes("nas")
    ? data.cpu?.usage ?? service.cpu
    : service.cpu,

memory: isMacMini
  ? `${data.memory?.usedGB ?? "-"}GB / ${data.memory?.totalGB ?? "-"}GB (${
      data.memory?.usedPercent ?? "-"
    }%)`
  : target.name.toLowerCase().includes("nas")
  ? `${data.memory?.usedMB ?? "-"}MB / ${data.memory?.totalMB ?? "-"}MB (${
      data.memory?.usedPercent ?? "-"
    }%)`
  : service.memory,

storage:
  target.name.toLowerCase().includes("nas")
    ? `${data.storage?.usedGB ?? "-"}GB / ${data.storage?.totalTB ?? "-"}TB (${
        data.storage?.usedPercent ?? "-"
      }%)`
    : service.storage,

                traffic:
                  target.id === "suenify"
                    ? `${data.responseTime ?? "-"}ms`
                    : service.traffic,

                connectionInfo:
                  target.id === "gemma"
                    ? data.models?.length
                      ? "모델 있음"
                      : "모델 없음"
                    : service.connectionInfo,
              }
            : service
        )
      );

      addLog(target.name, nextStatus, data.message || "상태 확인 완료");
      return;
    }

    // ❗ fallback (기존 방식 유지)
    const url = target.externalUrl || target.internalUrl;
    const result = await checkUrl(url);
    const nextStatus: StatusType = result.ok ? "online" : "offline";

    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              status: nextStatus,
              lastCheckedAt: result.ok ? nowText() : service.lastCheckedAt,
            }
          : service
      )
    );

    addLog(target.name, nextStatus, result.message);
  } catch {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId ? { ...service, status: "offline" } : service
      )
    );

    addLog(target.name, "offline", "상태 확인 실패");
  }
}

  useEffect(() => {
  const timer = window.setInterval(() => {
    services.forEach((service) => {
      const hasEndpoint = Boolean(getHealthEndpoint(service));
      const hasUrl = Boolean(service.internalUrl || service.externalUrl);

      if (hasEndpoint || hasUrl) {
        void refreshService(service.id);
      }
    });
  }, 30000);

  return () => window.clearInterval(timer);
}, [services]);

  function updateService(serviceId: string, patch: Partial<ServiceItem>) {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId ? { ...service, ...patch } : service
      )
    );
  }

  function addGroup() {
    const name = newGroupName.trim();
    if (!name) return;

    setGroups((prev) => [
      ...prev,
      {
        id: makeId("group"),
        name,
        collapsed: false,
        order: prev.length + 1,
      },
    ]);

    setNewGroupName("");
  }

  function deleteGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);
    if (!group || group.locked) return;

    setServices((prev) =>
      prev.map((service) =>
        service.groupId === groupId ? { ...service, groupId: "main" } : service
      )
    );

    setGroups((prev) => prev.filter((item) => item.id !== groupId));
  }

  function addService() {
    if (!newService.name.trim()) return;

    setServices((prev) => [
      ...prev,
      {
        ...newService,
        id: makeId("service"),
        name: newService.name.trim(),
        status: "unknown",
        lastCheckedAt: "-",
        order: prev.length + 1,
      },
    ]);

    setNewService({
      name: "",
      kind: "서비스",
      internalUrl: "",
      externalUrl: "",
      groupId: "main",
      description: "",
    });
  }

  function deleteService(serviceId: string) {
    setServices((prev) => prev.filter((service) => service.id !== serviceId));
    if (activeView === serviceId) setActiveView("home");
  }

  function SidebarButton({
    icon,
    label,
    active,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-base transition ${
          active
            ? "bg-white text-sky-700 shadow-sm"
            : "text-slate-700 hover:bg-white/70"
        }`}
      >
        <span className="shrink-0">{icon}</span>
        {sidebarOpen ? <span className="truncate">{label}</span> : null}
      </button>
    );
  }

  function renderHome() {
    return (
      <section>
        <HeaderTitle
          title="메인"
          description="등록된 서비스를 가나다 / ABC 순으로 표시합니다."
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedServices.map((service) => {
            const Icon = getServiceIcon(service.kind);
            const url = service.externalUrl || service.internalUrl;

            return (
              <article
                key={service.id}
                className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                      <Icon size={20} />
                    </div>
                    <p className="min-h-[28px] truncate text-lg font-semibold text-slate-800">
                      {displayServiceName(service.name)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${statusClass(
                      service.status
                    )}`}
                  >
                    {statusLabel(service.status)}
                  </span>
                </div>

                <p className="mt-5 text-base text-slate-500">
                  마지막 확인시간: {service.lastCheckedAt}
                </p>

                <div className="mt-5 flex items-center justify-between gap-2">
                  <IconActionButton
                    title="링크 바로가기"
                    disabled={!url}
                    onClick={() =>
                      url && window.open(url, "_blank", "noopener,noreferrer")
                    }
                  >
                    <ExternalLink size={19} />
                  </IconActionButton>

                  <IconActionButton
                    title="상세페이지"
                    onClick={() => setActiveView(service.id)}
                  >
                    <ChevronRight size={19} />
                  </IconActionButton>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  function renderServiceDetail(service: ServiceItem) {
    const Icon = getServiceIcon(service.kind);
    const isEditing = editingServiceId === service.id;
    const url = service.externalUrl || service.internalUrl;

    return (
      <section className="space-y-5">
        <div className="rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Icon size={23} />
              </div>
              <div className="min-w-0">
                <h2 className="min-h-[32px] truncate text-2xl font-semibold text-slate-800">
                  {displayServiceName(service.name)}
                </h2>
                <p className="text-base text-slate-500">{service.kind}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${statusClass(
                  service.status
                )}`}
              >
                {statusLabel(service.status)}
              </span>

              <IconActionButton
                title="링크 바로가기"
                disabled={!url}
                onClick={() =>
                  url && window.open(url, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink size={19} />
              </IconActionButton>

              <IconActionButton
                title="새로고침"
                onClick={() => refreshService(service.id)}
              >
                <RefreshCcw size={19} />
              </IconActionButton>

              <IconActionButton
                title={isEditing ? "수정 종료" : "수정"}
                onClick={() => setEditingServiceId(isEditing ? null : service.id)}
              >
                {isEditing ? <Save size={19} /> : <Pencil size={19} />}
              </IconActionButton>
            </div>
          </div>
        </div>

        {service.kind === "서버&AI" ? (
          <div className="grid gap-4 md:grid-cols-3">
            <SmallMetric
              icon={<Cpu size={18} />}
              label="CPU"
              value={service.cpu ?? "-"}
            />
            <SmallMetric
              icon={<Activity size={18} />}
              label="메모리"
              value={service.memory ?? "-"}
            />
            <SmallMetric
              icon={<HardDrive size={18} />}
              label="저장공간"
              value={service.storage ?? "-"}
            />
          </div>
        ) : null}

        {service.kind === "서비스" || service.kind === "미디어" ? (
          <SmallMetric
            icon={<Activity size={18} />}
            label="트래픽"
            value={service.traffic ?? "-"}
          />
        ) : null}

        {service.kind === "API" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SmallMetric
              icon={<Activity size={18} />}
              label="연결 정보"
              value={service.connectionInfo ?? "-"}
            />
            <SmallMetric
              icon={<Server size={18} />}
              label="서비스 제공자"
              value={service.provider ?? "-"}
            />
          </div>
        ) : null}

        <div className="rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <EditableField
                label="서비스 이름"
                value={service.name}
                placeholder="이름 없음"
                disabled={!isEditing}
                onChange={(value) => updateService(service.id, { name: value })}
              />
            </div>

            <EditableField
              label="마지막 접속 상태"
              value={service.lastCheckedAt}
              disabled
              onChange={() => {}}
            />

            <EditableSelect
              label="그룹"
              value={service.groupId}
              disabled={!isEditing}
              onChange={(value) => updateService(service.id, { groupId: value })}
              options={groups.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
            />

            <EditableField
              label="내부 주소"
              value={service.internalUrl}
              disabled={!isEditing}
              onChange={(value) =>
                updateService(service.id, { internalUrl: value })
              }
            />

            <EditableField
              label="외부 주소"
              value={service.externalUrl}
              disabled={!isEditing}
              onChange={(value) =>
                updateService(service.id, { externalUrl: value })
              }
            />

            <div className="md:col-span-2">
              <EditableField
                label="서비스 설명"
                value={service.description}
                disabled={!isEditing}
                onChange={(value) =>
                  updateService(service.id, { description: value })
                }
                textarea
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderGroupsSettings() {
    return (
      <section className="space-y-5">
        <HeaderTitle
          title="그룹"
          description="그룹 생성, 순서, 펼치기/접기, 서비스 이동을 관리합니다."
        />

        <div className="rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-sm">
          <div className="flex gap-3">
            <input
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="새 그룹 이름"
              className="h-12 flex-1 rounded-2xl border border-sky-200 bg-white px-4 text-base text-slate-800 outline-none"
            />
            <button
              onClick={addGroup}
              className="rounded-2xl bg-sky-500 px-5 py-2 text-base font-medium text-white hover:bg-sky-600"
            >
              생성
            </button>
          </div>
        </div>

        {sortedGroups.map((group, index) => (
          <div
            key={group.id}
            className="rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Folder size={19} className="text-sky-700" />
                <input
                  value={group.name}
                  disabled={group.locked}
                  onChange={(event) =>
                    setGroups((prev) =>
                      prev.map((item) =>
                        item.id === group.id
                          ? { ...item, name: event.target.value }
                          : item
                      )
                    )
                  }
                  className="rounded-xl bg-transparent px-2 py-1 text-lg font-medium text-slate-800 outline-none disabled:text-slate-500"
                />
                {group.locked ? (
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-sm text-sky-700">
                    기본 그룹
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={index === 0}
                  onClick={() =>
                    setGroups((prev) =>
                      prev.map((item) =>
                        item.id === group.id
                          ? { ...item, order: item.order - 1.5 }
                          : item
                      )
                    )
                  }
                  className="rounded-xl px-3 py-2 text-base text-slate-600 hover:bg-sky-50 disabled:opacity-30"
                >
                  위
                </button>
                <button
                  onClick={() =>
                    setGroups((prev) =>
                      prev.map((item) =>
                        item.id === group.id
                          ? { ...item, collapsed: !item.collapsed }
                          : item
                      )
                    )
                  }
                  className="rounded-xl px-3 py-2 text-base text-slate-600 hover:bg-sky-50"
                >
                  {group.collapsed ? "펼치기" : "접기"}
                </button>
                <button
                  disabled={group.locked}
                  onClick={() => deleteGroup(group.id)}
                  className="rounded-xl px-3 py-2 text-base text-rose-500 hover:bg-rose-50 disabled:opacity-30"
                >
                  삭제
                </button>
              </div>
            </div>

            {!group.collapsed ? (
              <div className="mt-5 space-y-2">
                {services
                  .filter((service) => service.groupId === group.id)
                  .sort((a, b) => a.order - b.order)
                  .map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3"
                    >
                      <span className="text-base text-slate-700">
                        {displayServiceName(service.name)}
                      </span>
                      <select
                        value={service.groupId}
                        onChange={(event) =>
                          updateService(service.id, {
                            groupId: event.target.value,
                          })
                        }
                        className="h-11 rounded-2xl border border-sky-200 bg-white px-3 text-base text-slate-700"
                      >
                        {groups.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        ))}
      </section>
    );
  }

  function renderServiceSettings() {
    return (
      <section className="space-y-5">
        <HeaderTitle
          title="서비스 등록"
          description="이름, 종류, 주소, 그룹, 설명만 등록합니다."
        />

        <div className="rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <EditableField
              label="이름"
              value={newService.name}
              onChange={(value) =>
                setNewService((prev) => ({ ...prev, name: value }))
              }
            />
            <EditableSelect
              label="서비스 종류"
              value={newService.kind}
              onChange={(value) =>
                setNewService((prev) => ({
                  ...prev,
                  kind: value as ServiceKind,
                }))
              }
              options={["서버&AI", "서비스", "미디어", "기타", "API"].map(
                (item) => ({
                  value: item,
                  label: item,
                })
              )}
            />
            <EditableField
              label="내부 주소"
              value={newService.internalUrl}
              onChange={(value) =>
                setNewService((prev) => ({ ...prev, internalUrl: value }))
              }
            />
            <EditableField
              label="외부 주소"
              value={newService.externalUrl}
              onChange={(value) =>
                setNewService((prev) => ({ ...prev, externalUrl: value }))
              }
            />
            <EditableSelect
              label="그룹"
              value={newService.groupId}
              onChange={(value) =>
                setNewService((prev) => ({ ...prev, groupId: value }))
              }
              options={groups.map((group) => ({
                value: group.id,
                label: group.name,
              }))}
            />
            <div className="md:col-span-2">
              <EditableField
                label="서비스 설명"
                value={newService.description}
                textarea
                onChange={(value) =>
                  setNewService((prev) => ({ ...prev, description: value }))
                }
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addService}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-base font-medium text-white hover:bg-sky-600"
          >
            <Plus size={18} />
            서비스 추가
          </button>
        </div>

        <div className="rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">
            등록된 서비스
          </h3>
          <div className="mt-4 space-y-2">
            {sortedServices.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between rounded-2xl bg-sky-50 px-4 py-3"
              >
                <button
                  onClick={() => setActiveView(service.id)}
                  className="min-h-[24px] text-base text-slate-700 hover:text-sky-700"
                >
                  {displayServiceName(service.name)}
                </button>
                <button
                  onClick={() => deleteService(service.id)}
                  title="삭제"
                  aria-label="삭제"
                  className="rounded-xl p-2 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderLogs() {
    return (
      <section className="space-y-5">
        <HeaderTitle
          title="로그"
          description="등록된 서비스와 접속 신호를 주고받은 기록만 표시합니다."
        />

        <div className="rounded-3xl border border-sky-100 bg-white/85 p-6 shadow-sm">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-base text-slate-500">아직 로그가 없습니다.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-sky-50 px-4 py-3 text-base"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-700">{log.serviceName}</span>
                    <span className="text-sm text-slate-500">
                      {log.createdAt}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-50 text-base text-slate-800">
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sky-100 bg-sky-100/75 backdrop-blur transition-all ${
          sidebarOpen ? "w-76" : "w-16"
        }`}
      >
        <div className="flex h-16 items-center gap-3 px-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 hover:bg-white/80"
          >
            <Menu size={22} />
          </button>
          {sidebarOpen ? (
            <span className="text-lg font-semibold text-slate-800">
              Suenify Admin
            </span>
          ) : null}
        </div>

        {sidebarOpen ? (
          <div className="relative px-3 pb-3">
            <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-white/85 px-4 py-3 shadow-sm">
              <Search size={18} className="text-slate-400" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="서비스 또는 설정 검색"
                className="w-full bg-transparent text-base text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="absolute left-3 right-3 top-14 z-50 rounded-2xl border border-sky-100 bg-white p-2 shadow-xl">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setSearchText("");
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-base hover:bg-sky-50"
                  >
                    <span className="text-slate-700">{item.label}</span>
                    <span className="text-sm text-slate-400">{item.sub}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-3">
          <SidebarButton
            icon={<House size={19} />}
            label="홈"
            active={activeView === "home"}
            onClick={() => setActiveView("home")}
          />

          <div className="mt-5 space-y-2">
            {sortedGroups.map((group) => {
              const groupServices = services
                .filter((service) => service.groupId === group.id)
                .sort((a, b) => a.order - b.order);

              return (
                <div key={group.id}>
                  <button
                    onClick={() =>
                      setGroups((prev) =>
                        prev.map((item) =>
                          item.id === group.id
                            ? { ...item, collapsed: !item.collapsed }
                            : item
                        )
                      )
                    }
                    className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-white/60"
                  >
                    {group.collapsed ? (
                      <ChevronRight size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    {sidebarOpen ? <span>{group.name}</span> : null}
                  </button>

                  {!group.collapsed ? (
                    <div className="mt-1 space-y-1">
                      {groupServices.map((service) => {
                        const Icon = getServiceIcon(service.kind);
                        return (
                          <SidebarButton
                            key={service.id}
                            icon={<Icon size={18} />}
                            label={displayServiceName(service.name)}
                            active={activeView === service.id}
                            onClick={() => setActiveView(service.id)}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-sky-100 p-3">
          <SidebarButton
            icon={<Settings size={19} />}
            label="설정"
            active={activeView.startsWith("settings")}
            onClick={() => {
              setSettingsOpen((prev) => !prev);
              if (!settingsOpen) {
                setActiveView("settings-groups");
              }
            }}
          />

          {sidebarOpen && settingsOpen ? (
            <div className="mt-2 space-y-1 pl-2">
              <SidebarButton
                icon={<Folder size={17} />}
                label="그룹"
                active={activeView === "settings-groups"}
                onClick={() => setActiveView("settings-groups")}
              />
              <SidebarButton
                icon={<Plus size={17} />}
                label="서비스 등록"
                active={activeView === "settings-services"}
                onClick={() => setActiveView("settings-services")}
              />
              <SidebarButton
                icon={<Activity size={17} />}
                label="로그"
                active={activeView === "settings-logs"}
                onClick={() => setActiveView("settings-logs")}
              />
            </div>
          ) : null}
        </div>
      </aside>

      <section className={`${sidebarOpen ? "pl-76" : "pl-16"} transition-all`}>
        <header className="sticky top-0 z-20 border-b border-sky-100 bg-sky-50/85 px-7 py-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="min-h-[32px] truncate text-2xl font-semibold text-slate-800">
                {activeService
                  ? displayServiceName(activeService.name)
                  : activeView.startsWith("settings")
                  ? "설정"
                  : "메인"}
              </h1>
              <p className="mt-1 text-base text-slate-500">
                {activeGroup?.name ??
                  (activeView.startsWith("settings")
                    ? "관리 설정"
                    : "서비스 목록")}
              </p>
            </div>

            <button
              onClick={() => setActiveView("home")}
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-700 hover:bg-white/80"
              title="홈"
              aria-label="홈"
            >
              <House size={20} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-7 py-7">
          {activeView === "home" ? renderHome() : null}
          {activeService ? renderServiceDetail(activeService) : null}
          {activeView === "settings-groups" ? renderGroupsSettings() : null}
          {activeView === "settings-services" ? renderServiceSettings() : null}
          {activeView === "settings-logs" ? renderLogs() : null}
        </div>
      </section>
    </main>
  );
}

function HeaderTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-3xl font-semibold text-slate-800">{title}</h2>
      <p className="mt-2 text-base text-slate-500">{description}</p>
    </div>
  );
}

function SmallMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-sky-100 bg-white/85 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-base text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

