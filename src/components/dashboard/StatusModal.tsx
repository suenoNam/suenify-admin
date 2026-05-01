"use client";

import { ExternalLink, Settings, X } from "lucide-react";
import type { StatusType } from "@/lib/status/types";

type StatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenDetailView?: (title: string) => void;
  title: string;
  status: string;
  detail: string;
  sub: string;
  type: StatusType;
  metricA?: string;
  metricB?: string;
  checkedAt?: string;
  ruleSummary?: string;
  note?: string;
  directUrl?: string;
  accessInfo?: string;
};

function getStatusLabel(type: StatusType, status: string) {
  if (type === "online") return "온라인";
  if (type === "warning") return status || "준비중";
  return "실패";
}

export default function StatusModal({
  isOpen,
  onClose,
  onOpenDetailView,
  title,
  status,
  detail,
  sub,
  type,
  metricA = "",
  metricB = "",
  checkedAt = "",
  note = "",
  directUrl = "",
  accessInfo = "",
}: StatusModalProps) {
  if (!isOpen) return null;

  const currentStateLabel = getStatusLabel(type, status);
  const stateMessage = detail || sub || "-";

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-100">
              {title}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2 py-1 text-[11px] ${
                type === "online"
                  ? "border-emerald-400/20 bg-emerald-400/15 text-emerald-300"
                  : type === "warning"
                  ? "border-amber-400/20 bg-amber-400/15 text-amber-300"
                  : "border-red-400/20 bg-red-400/15 text-red-300"
              }`}
            >
              {status}
            </span>

            {directUrl ? (
              <a
                href={directUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition hover:bg-white/20"
                title="주소 바로가기"
                aria-label="주소 바로가기"
              >
                <ExternalLink size={16} />
              </a>
            ) : null}

            {onOpenDetailView ? (
              <button
                type="button"
                onClick={() => onOpenDetailView(title)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition hover:bg-white/20"
                title="상세페이지 이동"
                aria-label="상세페이지 이동"
              >
                <Settings size={16} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-200 transition hover:bg-white/20"
              title="닫기"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-300">{stateMessage}</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              마지막 확인 시간
            </p>
            <p className="mt-2 break-words text-sm text-slate-300">
              {checkedAt || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              접속 정보
            </p>
            <p className="mt-2 break-words text-sm text-slate-300">
              {accessInfo || metricA || currentStateLabel || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              주소
            </p>
            <p className="mt-2 break-words text-sm text-slate-300">
              {directUrl || metricB || "-"}
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              메모
            </p>
            <p className="mt-2 break-words text-sm text-slate-300">
              {note || "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}