"use client";

import type { ReactNode } from "react";
import {
  ExternalLink,
  RefreshCcw,
  CheckCircle2,
  Trash2,
} from "lucide-react";

type ActionState = "idle" | "success" | "error";
type StatusType = "online" | "offline" | "warning" | "error";

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

function StatusSlot({ state }: { state: ActionState }) {
  if (state === "success") {
    return <CheckCircle2 size={15} className="text-emerald-300" />;
  }

  if (state === "error") {
    return <CheckCircle2 size={15} className="text-red-300" />;
  }

  return <span className="inline-block h-[15px] w-[15px]" />;
}

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick?: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-8 w-8 items-center justify-center text-slate-200 transition hover:text-white"
    >
      {children}
    </button>
  );
}

function truncateLabel(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

type ServiceDetailHeaderProps = {
  title: string;
  icon: ReactNode;
  stateLabel: string;
  stateType: "idle" | "success" | "error" | "online" | "warning" | "offline";
  actionState: "idle" | "success" | "error";
  canDelete: boolean;
  onOpen: () => void;
  onCheck: () => void;
  onDelete: () => void;
};

export default function ServiceDetailHeader({
  title,
  icon,
  stateLabel,
  stateType,
  actionState,
  canDelete,
  onOpen,
  onCheck,
  onDelete,
}: ServiceDetailHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/5 px-5 py-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {icon}

        <h2 className="truncate text-2xl font-semibold" title={title}>
          {truncateLabel(title, 25)}
        </h2>

        <StatusBadge label={stateLabel} type={stateType} />

        <IconButton onClick={onOpen} title="열기">
          <ExternalLink size={15} />
        </IconButton>

        <IconButton onClick={onCheck} title="상태 확인">
          <RefreshCcw size={15} />
        </IconButton>

        <StatusSlot state={actionState} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-500/15 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
          >
            <Trash2 size={14} />
            삭제
          </button>
        ) : null}
      </div>
    </div>
  );
}