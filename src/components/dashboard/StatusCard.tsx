"use client";

import { ExternalLink } from "lucide-react";
import type { StatusCardItem } from "@/lib/status/types";

type Props = StatusCardItem & {
  onClick?: () => void;
};

function getStatusTone(type: string) {
  if (type === "online") {
    return "bg-emerald-400/15 text-emerald-300 border-emerald-400/20";
  }

  if (type === "error" || type === "offline") {
    return "bg-red-400/15 text-red-300 border-red-400/20";
  }

  return "bg-white/10 text-slate-300 border-white/10";
}

export default function StatusCard({
  title,
  status,
  type,
  checkedAt,
  directUrl,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-slate-100">
          {title}
        </p>

        <span
          className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[11px] ${getStatusTone(
            type
          )}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-3">
        <p className="text-[11px] text-slate-500">마지막 확인 시간</p>
        <p className="mt-1 text-xs text-slate-300">{checkedAt || "-"}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
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
        ) : (
          <span className="text-xs text-slate-500">주소 없음</span>
        )}

        <span className="text-xs text-slate-400">상세페이지</span>
      </div>
    </button>
  );
}