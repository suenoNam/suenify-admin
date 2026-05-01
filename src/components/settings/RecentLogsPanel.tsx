"use client";

import { useMemo, useState } from "react";
import {
  Pause,
  Play,
  RefreshCcw,
  Download,
  RotateCcw,
} from "lucide-react";

export type RecentLogItem = {
  id: string;
  level: "info" | "success" | "error";
  source: "system" | "auto" | "manual" | "run_all" | "settings" | "network";
  message: string;
  createdAt: string;
};

export const RECENT_LOGS_STORAGE_KEY = "suenify-recent-logs";

export function loadRecentLogs(): RecentLogItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(RECENT_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentLogItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentLogs(items: RecentLogItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_LOGS_STORAGE_KEY, JSON.stringify(items));
}

type FilterType = "all" | RecentLogItem["source"];

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

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-1.5 text-xs transition ${
        active
          ? "bg-white/15 text-slate-100"
          : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function getLevelColor(level: RecentLogItem["level"]) {
  if (level === "success") return "text-emerald-300";
  if (level === "error") return "text-red-300";
  return "text-slate-300";
}

export default function RecentLogsPanel({
  items,
  isPaused,
  onTogglePause,
  onRefresh,
  onClear,
}: {
  items: RecentLogItem[];
  isPaused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
  onClear: () => void;
}) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.source === filter);
  }, [items, filter]);

  function handleDownloadLogs() {
    const content = filteredItems
      .map(
        (item) =>
          `[${item.createdAt}] [${item.source}] [${item.level}] ${item.message}`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `suenify-logs-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.txt`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Recent Logs</h3>
          <p className="mt-1 text-sm text-slate-400">
            Scroll to view older logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <FilterButton
            active={filter === "all"}
            label="All"
            onClick={() => setFilter("all")}
          />
          <FilterButton
            active={filter === "auto"}
            label="Auto"
            onClick={() => setFilter("auto")}
          />
          <FilterButton
            active={filter === "manual"}
            label="Manual"
            onClick={() => setFilter("manual")}
          />
          <FilterButton
            active={filter === "run_all"}
            label="Run All"
            onClick={() => setFilter("run_all")}
          />
          <FilterButton
            active={filter === "settings"}
            label="Settings"
            onClick={() => setFilter("settings")}
          />

          <IconButton
            onClick={onTogglePause}
            title={isPaused ? "Resume logs" : "Pause logs"}
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </IconButton>

          <IconButton onClick={onRefresh} title="Refresh logs">
            <RefreshCcw size={15} />
          </IconButton>

          <IconButton onClick={handleDownloadLogs} title="Download logs">
            <Download size={15} />
          </IconButton>

          <IconButton onClick={onClear} title="Clear logs" disabled={items.length === 0}>
            <RotateCcw size={15} />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
        <div className="max-h-[220px] space-y-3 overflow-y-auto">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/5 bg-white/5 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm ${getLevelColor(item.level)}`}>
                      {item.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.source}
                    </p>
                  </div>

                  <p className="shrink-0 text-xs text-slate-500">
                    {item.createdAt}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-400">No logs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}