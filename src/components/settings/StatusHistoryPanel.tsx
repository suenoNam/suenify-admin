"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

export type StatusHistoryItem = {
  service: string;
  state: "success" | "error";
  source?: "auto" | "manual" | "run_all";
  message: string;
  checkedAt: string;
};

export const STATUS_HISTORY_STORAGE_KEY = "suenify-status-history";

export function loadStatusHistory(): StatusHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STATUS_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StatusHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStatusHistory(items: StatusHistoryItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STATUS_HISTORY_STORAGE_KEY, JSON.stringify(items));
}

type StateFilter = "all" | "success" | "error";
type SourceFilter = "all" | "auto" | "manual" | "run_all";

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

function getStateLabel(state: "success" | "error") {
  return state === "success" ? "정상" : "오류";
}

function getSourceLabel(source?: "auto" | "manual" | "run_all") {
  if (source === "manual") return "수동";
  if (source === "run_all") return "전체 실행";
  return "자동";
}

export default function StatusHistoryPanel({
  items,
  onClear,
}: {
  items: StatusHistoryItem[];
  onClear: () => void;
}) {
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  const services = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.service)));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchState =
        stateFilter === "all" ? true : item.state === stateFilter;

      const matchSource =
        sourceFilter === "all" ? true : item.source === sourceFilter;

      const matchService =
        serviceFilter === "all" ? true : item.service === serviceFilter;

      return matchState && matchSource && matchService;
    });
  }, [items, stateFilter, sourceFilter, serviceFilter]);

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-slate-200" />
          <div>
            <h3 className="text-xl font-semibold">상태 기록</h3>
            <p className="mt-1 text-sm text-slate-400">
              자동 점검과 수동 점검으로 감지된 상태 변화를 보여줍니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            onClick={onClear}
            title="기록 비우기"
            disabled={items.length === 0}
          >
            <RotateCcw size={16} />
          </IconButton>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterButton
          active={stateFilter === "all"}
          label="전체 상태"
          onClick={() => setStateFilter("all")}
        />
        <FilterButton
          active={stateFilter === "success"}
          label="정상"
          onClick={() => setStateFilter("success")}
        />
        <FilterButton
          active={stateFilter === "error"}
          label="오류"
          onClick={() => setStateFilter("error")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterButton
          active={sourceFilter === "all"}
          label="전체 방식"
          onClick={() => setSourceFilter("all")}
        />
        <FilterButton
          active={sourceFilter === "auto"}
          label="자동"
          onClick={() => setSourceFilter("auto")}
        />
        <FilterButton
          active={sourceFilter === "manual"}
          label="수동"
          onClick={() => setSourceFilter("manual")}
        />
        <FilterButton
          active={sourceFilter === "run_all"}
          label="전체 실행"
          onClick={() => setSourceFilter("run_all")}
        />
      </div>

      <div className="mt-3">
        <select
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
        >
          <option value="all">전체 서비스</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <div
              key={`${item.service}-${item.checkedAt}-${index}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.state === "success" ? (
                      <CheckCircle2 size={16} className="text-emerald-300" />
                    ) : (
                      <AlertTriangle size={16} className="text-red-300" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-100">
                        {item.service}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] ${
                          item.state === "success"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-red-400/15 text-red-300"
                        }`}
                      >
                        {getStateLabel(item.state)}
                      </span>
                      <span className="inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
                        {getSourceLabel(item.source)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-300">
                      {item.message}
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-xs text-slate-500">
                  {item.checkedAt}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
            조건에 맞는 상태 기록이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}