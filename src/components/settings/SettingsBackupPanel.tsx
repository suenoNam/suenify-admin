"use client";

import { useRef, useState } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  Check,
  CircleAlert,
} from "lucide-react";
import {
  loadAdminConfig,
  saveAdminConfig,
  resetAdminConfig,
  defaultAdminConfig,
  NAS_CHECKLIST_STORAGE_KEY,
  DETAIL_STORAGE_PREFIX,
} from "@/lib/status/config";
import {
  getInfraSettings,
  defaultInfraSettings,
  INFRA_SETTINGS_STORAGE_KEY,
  type InfraSettings,
} from "@/components/settings/InfraSettingsPanel";

type SaveState = "idle" | "success" | "error";

type BackupBundle = {
  version: string;
  exportedAt: string;
  adminConfig: ReturnType<typeof loadAdminConfig>;
  infraSettings: InfraSettings;
  nasChecklist: Record<string, boolean>;
  detailOverrides: Record<
    string,
    {
      note?: string;
      directUrl?: string;
      accessInfo?: string;
    }
  >;
};

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

function buildBackupBundle(): BackupBundle {
  const adminConfig = loadAdminConfig();
  const infraSettings = getInfraSettings();

  let nasChecklist: Record<string, boolean> = {};
  let detailOverrides: Record<
    string,
    {
      note?: string;
      directUrl?: string;
      accessInfo?: string;
    }
  > = {};

  if (typeof window !== "undefined") {
    try {
      const checklistRaw = localStorage.getItem(NAS_CHECKLIST_STORAGE_KEY);
      if (checklistRaw) {
        nasChecklist = JSON.parse(checklistRaw) as Record<string, boolean>;
      }
    } catch {
      nasChecklist = {};
    }

    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (!key.startsWith(DETAIL_STORAGE_PREFIX)) continue;

        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const title = key.replace(DETAIL_STORAGE_PREFIX, "");
        detailOverrides[title] = JSON.parse(raw) as {
          note?: string;
          directUrl?: string;
          accessInfo?: string;
        };
      }
    } catch {
      detailOverrides = {};
    }
  }

  return {
    version: "1.1.0",
    exportedAt: new Date().toISOString(),
    adminConfig,
    infraSettings,
    nasChecklist,
    detailOverrides,
  };
}

export default function SettingsBackupPanel({
  onApplied,
}: {
  onApplied: () => void;
}) {
  const [exportState, setExportState] = useState<SaveState>("idle");
  const [importState, setImportState] = useState<SaveState>("idle");
  const [resetState, setResetState] = useState<SaveState>("idle");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function resetStateLater(
    setter: React.Dispatch<React.SetStateAction<SaveState>>
  ) {
    window.setTimeout(() => {
      setter("idle");
    }, 1500);
  }

  function handleExport() {
    try {
      const bundle = buildBackupBundle();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json;charset=utf-8",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suenify-admin-backup-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setExportState("success");
      resetStateLater(setExportState);
    } catch (error) {
      console.error(error);
      setExportState("error");
      resetStateLater(setExportState);
    }
  }

  function handleOpenImport() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<BackupBundle>;

      const importedConfig = parsed.adminConfig ?? defaultAdminConfig;

      saveAdminConfig({
        nas: {
          ...defaultAdminConfig.nas,
          ...importedConfig.nas,
        },
        jellyfin: {
          ...defaultAdminConfig.jellyfin,
          ...importedConfig.jellyfin,
        },
        mainDomain: {
          ...defaultAdminConfig.mainDomain,
          ...importedConfig.mainDomain,
        },
        apiDeploy: {
          ...defaultAdminConfig.apiDeploy,
          ...importedConfig.apiDeploy,
        },
      });

      if (typeof window !== "undefined") {
        const importedInfraSettings = parsed.infraSettings ?? defaultInfraSettings;
        localStorage.setItem(
          INFRA_SETTINGS_STORAGE_KEY,
          JSON.stringify({
            ...defaultInfraSettings,
            ...importedInfraSettings,
          })
        );

        if (parsed.nasChecklist) {
          localStorage.setItem(
            NAS_CHECKLIST_STORAGE_KEY,
            JSON.stringify(parsed.nasChecklist)
          );
        } else {
          localStorage.removeItem(NAS_CHECKLIST_STORAGE_KEY);
        }

        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (!key.startsWith(DETAIL_STORAGE_PREFIX)) continue;
          localStorage.removeItem(key);
        }

        if (parsed.detailOverrides) {
          Object.entries(parsed.detailOverrides).forEach(([title, value]) => {
            localStorage.setItem(
              `${DETAIL_STORAGE_PREFIX}${title}`,
              JSON.stringify(value)
            );
          });
        }
      }

      onApplied();
      setImportState("success");
      resetStateLater(setImportState);
    } catch (error) {
      console.error(error);
      setImportState("error");
      resetStateLater(setImportState);
    } finally {
      event.target.value = "";
    }
  }

  function handleReset() {
    try {
      resetAdminConfig();

      if (typeof window !== "undefined") {
        localStorage.setItem(
          INFRA_SETTINGS_STORAGE_KEY,
          JSON.stringify(defaultInfraSettings)
        );

        localStorage.removeItem(NAS_CHECKLIST_STORAGE_KEY);

        for (let i = localStorage.length - 1; i >= 0; i -= 1) {
          const key = localStorage.key(i);
          if (!key) continue;
          if (!key.startsWith(DETAIL_STORAGE_PREFIX)) continue;
          localStorage.removeItem(key);
        }
      }

      onApplied();
      setResetState("success");
      resetStateLater(setResetState);
    } catch (error) {
      console.error(error);
      setResetState("error");
      resetStateLater(setResetState);
    }
  }

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Settings Backup</h3>
          <p className="mt-1 text-sm text-slate-400">
            Export, import, or reset the current admin configuration set.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <StatusSlot state={exportState} />
            <IconButton onClick={handleExport} title="Export settings">
              <Download size={16} />
            </IconButton>
          </div>

          <div className="flex items-center gap-1">
            <StatusSlot state={importState} />
            <IconButton onClick={handleOpenImport} title="Import settings">
              <Upload size={16} />
            </IconButton>
          </div>

          <div className="flex items-center gap-1">
            <StatusSlot state={resetState} />
            <IconButton onClick={handleReset} title="Reset settings">
              <RotateCcw size={16} />
            </IconButton>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Export
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Download admin settings, infrastructure settings, checklist values,
            and detail overrides as a JSON backup file.
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Import
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Restore admin settings, infrastructure values, checklist values,
            and saved detail overrides.
          </p>
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Reset
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Return all admin and infrastructure settings to the default state
            and clear saved overrides.
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportFile}
      />
    </div>
  );
}