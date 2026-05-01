"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RefreshCcw,
  Check,
  CircleAlert,
  LoaderCircle,
  Network,
  ShieldCheck,
} from "lucide-react";
import type { StatusHistoryItem } from "@/components/settings/StatusHistoryPanel";
import type { RecentLogItem } from "@/components/settings/RecentLogsPanel";
import { checkServiceStatus } from "@/lib/status/engine";
import { getServiceById } from "@/lib/services/registry";
import {
  HEALTH_RULES,
  type HealthRuleKey,
} from "@/lib/status/health-rules";

type CheckState = "idle" | "loading" | "success" | "error";

type NetworkItem = {
  id: "nas" | "domain" | "jellyfin" | "api";
  title: string;
  description: string;
  url: string;
  ruleKey: HealthRuleKey;
  state: CheckState;
  responseTime: number | null;
  statusCode: number | null;
  lastChecked: string;
  ruleMessage: string;
};

type NetworkCheckPanelProps = {
  nasUrl: string;
  domainUrl: string;
  jellyfinUrl: string;
  apiUrl: string;
  onAppendLog?: (item: Omit<RecentLogItem, "id">) => void;
  onAppendStatusHistory?: (item: StatusHistoryItem) => void;
};

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

function StateIcon({ state }: { state: CheckState }) {
  if (state === "loading") {
    return <LoaderCircle size={16} className="animate-spin text-slate-300" />;
  }

  if (state === "success") {
    return <Check size={16} className="text-emerald-300" />;
  }

  if (state === "error") {
    return <CircleAlert size={16} className="text-red-300" />;
  }

  return <span className="inline-block h-4 w-4 rounded-full bg-white/10" />;
}

export default function NetworkCheckPanel({
  nasUrl,
  domainUrl,
  jellyfinUrl,
  apiUrl,
  onAppendLog,
  onAppendStatusHistory,
}: NetworkCheckPanelProps) {
  const [items, setItems] = useState<NetworkItem[]>([
    {
      id: "nas",
      title: "NAS Internal Route",
      description: "Internal local network access path",
      url: nasUrl,
      ruleKey: "nas",
      state: "idle",
      responseTime: null,
      statusCode: null,
      lastChecked: "-",
      ruleMessage: HEALTH_RULES.nas.description,
    },
    {
      id: "domain",
      title: "Main Domain",
      description: "Primary public domain accessibility",
      url: domainUrl,
      ruleKey: "main-domain",
      state: "idle",
      responseTime: null,
      statusCode: null,
      lastChecked: "-",
      ruleMessage: HEALTH_RULES["main-domain"].description,
    },
    {
      id: "jellyfin",
      title: "Jellyfin Reverse Proxy",
      description: "External Jellyfin route through reverse proxy",
      url: jellyfinUrl,
      ruleKey: "jellyfin",
      state: "idle",
      responseTime: null,
      statusCode: null,
      lastChecked: "-",
      ruleMessage: HEALTH_RULES.jellyfin.description,
    },
    {
      id: "api",
      title: "API Endpoint",
      description: "Reserved backend endpoint route",
      url: apiUrl,
      ruleKey: "api",
      state: "idle",
      responseTime: null,
      statusCode: null,
      lastChecked: "-",
      ruleMessage: HEALTH_RULES.api.description,
    },
  ]);

  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === "nas") return { ...item, url: nasUrl };
        if (item.id === "domain") return { ...item, url: domainUrl };
        if (item.id === "jellyfin") return { ...item, url: jellyfinUrl };
        if (item.id === "api") return { ...item, url: apiUrl };
        return item;
      })
    );
  }, [nasUrl, domainUrl, jellyfinUrl, apiUrl]);

  const isAnyLoading = useMemo(
    () => items.some((item) => item.state === "loading"),
    [items]
  );

  function updateItem(id: NetworkItem["id"], patch: Partial<NetworkItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function runCheck(
    item: NetworkItem,
    source: "manual" | "run_all" = "manual"
  ) {
    updateItem(item.id, {
      state: "loading",
      responseTime: null,
      statusCode: null,
    });

    const checkedAt = formatCheckedAt(new Date());

    try {
      let result;

      const serviceId =
        item.id === "domain"
          ? "main-domain"
          : item.id === "api"
          ? "api-deploy"
          : item.id;

      const service = getServiceById(serviceId);
      if (!service) {
        updateItem(item.id, {
          state: "error",
          responseTime: null,
          statusCode: null,
          lastChecked: checkedAt,
          ruleMessage: "서비스 정보를 찾을 수 없습니다.",
        });
        return;
      }

      result = await checkServiceStatus(service);

      const nextState: CheckState = result.success ? "success" : "error";

      updateItem(item.id, {
        state: nextState,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        lastChecked: checkedAt,
        ruleMessage: result.message,
      });

      const message = result.success
        ? `${item.title} ${source} check success · ${result.responseTime ?? "-"}ms`
        : `${item.title} ${source} check failed · ${result.message}`;

      onAppendLog?.({
        level: result.success ? "success" : "error",
        source,
        message,
        createdAt: checkedAt,
      });

      onAppendStatusHistory?.({
        service: item.title,
        state: result.success ? "success" : "error",
        source,
        message,
        checkedAt,
      });
    } catch (error) {
      console.error(error);

      updateItem(item.id, {
        state: "error",
        responseTime: null,
        statusCode: null,
        lastChecked: checkedAt,
        ruleMessage: "Unexpected execution error.",
      });

      const message = `${item.title} ${source} check error occurred`;

      onAppendLog?.({
        level: "error",
        source,
        message,
        createdAt: checkedAt,
      });

      onAppendStatusHistory?.({
        service: item.title,
        state: "error",
        source,
        message,
        checkedAt,
      });
    }
  }

  async function handleRunAll() {
    for (const item of items) {
      await runCheck(item, "run_all");
    }
  }

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Network size={18} className="text-slate-200" />
          <div>
            <h3 className="text-xl font-semibold">Network Check</h3>
            <p className="mt-1 text-sm text-slate-400">
              Validate internal and external service routes using separated health rules.
            </p>
          </div>
        </div>

        <IconButton
          onClick={handleRunAll}
          title="Run all checks"
          disabled={isAnyLoading}
        >
          <RefreshCcw size={16} />
        </IconButton>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const stateLabel =
            item.state === "idle"
              ? "Not checked"
              : item.state === "loading"
              ? "Checking"
              : item.state === "success"
              ? "Reachable"
              : "Failed";

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.description}
                  </p>
                  <p className="mt-2 break-words text-xs text-slate-500">
                    {item.url || "-"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StateIcon state={item.state} />

                  <IconButton
                    onClick={() => runCheck(item, "manual")}
                    title={`Check ${item.title}`}
                    disabled={item.state === "loading" || !item.url}
                  >
                    <RefreshCcw size={15} />
                  </IconButton>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    State
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{stateLabel}</p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Response Time
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {item.responseTime !== null ? `${item.responseTime}ms` : "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Status Code
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {item.statusCode ?? "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Last Checked
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {item.lastChecked}
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-slate-300" />
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Rule Result
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.ruleMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}