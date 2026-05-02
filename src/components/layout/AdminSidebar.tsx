"use client";

import { useEffect, useMemo, useState } from "react";
import { getMergedServiceRegistry } from "@/lib/services/registry";
import { serviceIconMap } from "@/lib/services/iconMap";
import {
  Home,
  Server,
  FolderTree,
  Settings2,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  LayoutDashboard,
  UserCog,
  ScrollText,
  X,
  Palette,
  Circle,
  LogOut,
  Brain,
  PlugZap,
  HardDrive,
} from "lucide-react";
import type { StatusCardItem, ViewType } from "@/lib/status/types";

type AdminSidebarProps = {
  isOpen: boolean;
  activeView: ViewType;
  refreshToken: number;
  statusCards: StatusCardItem[];
  onSelectView: (view: ViewType) => void;
};

type GroupKey = "server" | "services" | "ai" | "api" | "storage";

const groupLabels: Record<GroupKey, string> = {
  server: "Server",
  services: "Services",
  ai: "AI System",
  api: "API",
  storage: "Storage",
};

const groupIcons: Record<GroupKey, React.ReactNode> = {
  server: <Server size={16} />,
  services: <FolderTree size={16} />,
  ai: <Brain size={16} />,
  api: <PlugZap size={16} />,
  storage: <HardDrive size={16} />,
};

function truncateLabel(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function SidebarButton({
  isActive,
  icon,
  label,
  onClick,
  depth = 0,
  statusPin,
}: {
  isActive: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  depth?: number;
  statusPin?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left text-sm transition ${
        isActive
          ? "bg-white/12 text-white"
          : "text-slate-300 hover:bg-white/8 hover:text-white"
      }`}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
      {statusPin ? <span className="shrink-0">{statusPin}</span> : null}
    </button>
  );
}

function GroupButton({
  label,
  icon,
  isOpen,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/8 hover:text-white"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 flex-1 truncate" title={label}>
          {label}
        </span>
      </span>

      <span className="shrink-0">
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </span>
    </button>
  );
}

function StatusPin({ status }: { status: "online" | "offline" | "unchecked" }) {
  const colorClass =
    status === "online"
      ? "text-emerald-400"
      : status === "offline"
      ? "text-red-400"
      : "text-slate-500";

  return <Circle size={10} className={colorClass} fill="currentColor" />;
}

export default function AdminSidebar({
  isOpen,
  activeView,
  refreshToken,
  statusCards,
  onSelectView,
}: AdminSidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
  server: true,
  services: false,
  ai: false,
  api: false,
  storage: false,
});

const [settingsGroupOpen, setSettingsGroupOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const services = useMemo(() => {
    if (!isMounted) return [];

    return getMergedServiceRegistry()
      .filter((service) => service.enabled)
      .sort((a, b) => {
        const groupOrder: Record<GroupKey, number> = {
          server: 1,
          services: 2,
          ai: 3,
          api: 4,
          storage: 5,
        };

        const aGroup = a.adminGroup ?? "services";
        const bGroup = b.adminGroup ?? "services";

        if (groupOrder[aGroup] !== groupOrder[bGroup]) {
          return groupOrder[aGroup] - groupOrder[bGroup];
        }

        return a.title.toLowerCase().localeCompare(b.title.toLowerCase(), "en");
      });
  }, [isMounted, refreshToken]);

  const groupedServices = useMemo(() => {
    const next: Record<GroupKey, typeof services> = {
      server: [],
      services: [],
      ai: [],
      api: [],
      storage: [],
    };

    services.forEach((service) => {
      const group = service.adminGroup ?? "services";
      next[group].push(service);
    });

    return next;
  }, [services]);

  const statusMap = useMemo(() => {
    if (!isMounted) {
      return new Map<string, "online" | "offline" | "unchecked">();
    }

    const map = new Map<string, "online" | "offline" | "unchecked">();

    statusCards.forEach((card) => {
      const service = getMergedServiceRegistry().find(
        (item) => item.title === card.title || item.id === card.id
      );

      if (!service) return;

      if (card.type === "online") {
        map.set(service.id, "online");
      } else if (card.type === "error" || card.type === "offline") {
        map.set(service.id, "offline");
      } else {
        map.set(service.id, "unchecked");
      }
    });

    return map;
  }, [isMounted, statusCards, refreshToken]);

  useEffect(() => {
    services.forEach((service) => {
      if (service.id === activeView) {
        const group = service.adminGroup ?? "services";
        setOpenGroups((prev) => ({
          ...prev,
          [group]: true,
        }));
      }
    });

    if (
      activeView === "settings-services" ||
      activeView === "settings-dashboard" ||
      activeView === "settings-account" ||
      activeView === "settings-logs" ||
      activeView === "settings-environment"
    ) {
      setSettingsGroupOpen(true);
    }
  }, [activeView, services]);

  function toggleGroup(group: GroupKey) {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-9996 h-full w-[360px] transform border-r border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur transition-transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">
            Suenify
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Admin Menu</h2>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={() => onSelectView(activeView)}
          aria-label="Close Sidebar"
          title="Close Sidebar"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-2 pb-20">
        <SidebarButton
          isActive={activeView === "dashboard"}
          icon={<Home size={16} />}
          label="홈"
          onClick={() => onSelectView("dashboard")}
        />

        {(Object.keys(groupLabels) as GroupKey[]).map((group) => (
          <div key={group} className="space-y-1">
            <GroupButton
              label={groupLabels[group]}
              icon={groupIcons[group]}
              isOpen={openGroups[group]}
              onClick={() => toggleGroup(group)}
            />

            {openGroups[group] ? (
              <div className="space-y-1">
                {groupedServices[group].length > 0 ? (
                  groupedServices[group].map((service) => {
                    const Icon = serviceIconMap[service.icon];
                    const pinStatus = statusMap.get(service.id) ?? "unchecked";

                    return (
                      <SidebarButton
                        key={service.id}
                        depth={1}
                        isActive={activeView === (service.id as ViewType)}
                        icon={
                          Icon ? (
                            <Icon size={16} />
                          ) : (
                            <FolderTree size={16} />
                          )
                        }
                        label={truncateLabel(service.title, 24)}
                        onClick={() => onSelectView(service.id as ViewType)}
                        statusPin={<StatusPin status={pinStatus} />}
                      />
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">
                    등록된 항목 없음
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}

        <GroupButton
          label="설정"
          icon={<Settings2 size={16} />}
          isOpen={settingsGroupOpen}
          onClick={() => setSettingsGroupOpen((prev) => !prev)}
        />

        {settingsGroupOpen ? (
          <div className="space-y-1">
            <SidebarButton
              depth={1}
              isActive={activeView === "settings-services"}
              icon={<SlidersHorizontal size={16} />}
              label="서비스"
              onClick={() => onSelectView("settings-services")}
            />
            <SidebarButton
              depth={1}
              isActive={activeView === "settings-dashboard"}
              icon={<LayoutDashboard size={16} />}
              label="대시보드"
              onClick={() => onSelectView("settings-dashboard")}
            />
            <SidebarButton
              depth={1}
              isActive={activeView === "settings-account"}
              icon={<UserCog size={16} />}
              label="계정"
              onClick={() => onSelectView("settings-account")}
            />
            <SidebarButton
              depth={1}
              isActive={activeView === "settings-logs"}
              icon={<ScrollText size={16} />}
              label="로그"
              onClick={() => onSelectView("settings-logs")}
            />
            <SidebarButton
              depth={1}
              isActive={activeView === "settings-environment"}
              icon={<Palette size={16} />}
              label="환경 설정"
              onClick={() => onSelectView("settings-environment")}
            />
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-6 right-6">
        <button
          type="button"
          title="로그아웃"
          aria-label="로그아웃"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", {
                method: "POST",
              });
            } catch (error) {
              console.error(error);
            }

            window.sessionStorage.removeItem("suenify-active-view");
            window.location.href = "/login";
          }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}