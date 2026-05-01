"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Save } from "lucide-react";

export type DashboardSectionKey =
  | "infraOverview"
  | "networkCheck"
  | "statusHistory"
  | "recentLogs"
  | "settingsBackup";

export type DashboardSectionSettings = Record<DashboardSectionKey, boolean>;

export const DASHBOARD_SECTION_SETTINGS_KEY =
  "suenify-dashboard-section-settings";

export const defaultDashboardSectionSettings: DashboardSectionSettings = {
  infraOverview: true,
  networkCheck: true,
  statusHistory: true,
  recentLogs: true,
  settingsBackup: true,
};

type SaveState = "idle" | "success" | "error";

function StatusSlot({ state }: { state: SaveState }) {
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

function IconButton({
  onClick,
  title,
  children,
}: {
  onClick?: () => void;
  title: string;
  children: React.ReactNode;
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

export function getDashboardSectionSettings(): DashboardSectionSettings {
  if (typeof window === "undefined") return defaultDashboardSectionSettings;

  try {
    const raw = localStorage.getItem(DASHBOARD_SECTION_SETTINGS_KEY);
    if (!raw) return defaultDashboardSectionSettings;

    return {
      ...defaultDashboardSectionSettings,
      ...(JSON.parse(raw) as Partial<DashboardSectionSettings>),
    };
  } catch {
    return defaultDashboardSectionSettings;
  }
}

export default function DashboardSettingsPanel({
  onSaved,
}: {
  onSaved?: () => void;
}) {
  const [settings, setSettings] = useState<DashboardSectionSettings>(
    defaultDashboardSectionSettings
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    setSettings(getDashboardSectionSettings());
  }, []);

  function toggle(key: DashboardSectionKey) {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function resetStateLater() {
    window.setTimeout(() => {
      setSaveState("idle");
    }, 1500);
  }

  function handleSave() {
    try {
      localStorage.setItem(
        DASHBOARD_SECTION_SETTINGS_KEY,
        JSON.stringify(settings)
      );
      setSaveState("success");
      onSaved?.();
    } catch (error) {
      console.error(error);
      setSaveState("error");
    } finally {
      resetStateLater();
    }
  }

  const items: Array<{ key: DashboardSectionKey; label: string }> = [
    { key: "infraOverview", label: "인프라 오버뷰" },
    { key: "networkCheck", label: "네트워크 체크" },
    { key: "statusHistory", label: "상태 이력" },
    { key: "recentLogs", label: "최근 로그" },
    { key: "settingsBackup", label: "설정 백업" },
  ];

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">대시보드 설정</h3>
          <p className="mt-1 text-sm text-slate-400">
            홈 화면에서 어떤 패널을 보여줄지 선택합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusSlot state={saveState} />
          <IconButton onClick={handleSave} title="Save dashboard settings">
            <Save size={16} />
          </IconButton>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3"
          >
            <span className="text-sm text-slate-200">{item.label}</span>
            <input
              type="checkbox"
              checked={settings[item.key]}
              onChange={() => toggle(item.key)}
              className="h-4 w-4 accent-emerald-400"
            />
          </label>
        ))}
      </div>
    </div>
  );
}