"use client";

import type { StatusCardItem } from "@/lib/status/types";

type Props = {
  card: StatusCardItem | null;
};

export default function ServiceDetailOverview({ card }: Props) {
  if (!card) return null;

  const primaryModeLabel =
    card.primaryMode === "internal"
      ? "내부 주소 기준"
      : card.primaryMode === "external"
      ? "외부 주소 기준"
      : "-";

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            현재 상태
          </p>
          <p className="mt-2 text-sm text-slate-300">{card.status || "-"}</p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            핵심 정보
          </p>
          <p className="mt-2 text-sm text-slate-300">{card.detail || "-"}</p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            상태 설명
          </p>
          <p className="mt-2 text-sm text-slate-300">{card.sub || "-"}</p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            최종 접속
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {card.checkedAt || "-"}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            내부 주소
          </p>
          <p className="mt-2 wrap-break-word text-sm text-slate-300">
            {card.internalUrl || "-"}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            외부 주소
          </p>
          <p className="mt-2 wrap-break-word text-sm text-slate-300">
            {card.externalUrl || "-"}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            현재 체크 기준
          </p>
          <p className="mt-2 text-sm text-slate-300">{primaryModeLabel}</p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            현재 체크 주소
          </p>
          <p className="mt-2 wrap-break-word text-sm text-slate-300">
            {card.directUrl || "-"}
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            메모
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
            {card.note || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}