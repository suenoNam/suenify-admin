"use client";

import { useEffect, useState } from "react";
import { Save, Check, CircleAlert } from "lucide-react";

type SaveState = "idle" | "success" | "error";

export type InfraSettings = {
  internalIp: string;
  httpPort: string;
  httpsPort: string;
  jellyfinHttpPort: string;
  jellyfinHttpsPort: string;
  portainerPort: string;
  jellyfinProxyPath: string;
  jellyfinProxyTarget: string;
};

export const INFRA_SETTINGS_STORAGE_KEY = "suenify-infra-settings";

export const defaultInfraSettings: InfraSettings = {
  internalIp: "192.168.0.44",
  httpPort: "80",
  httpsPort: "443",
  jellyfinHttpPort: "28096",
  jellyfinHttpsPort: "28920",
  portainerPort: "19943",
  jellyfinProxyPath: "/jellyfin",
  jellyfinProxyTarget: "28920",
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

export function getInfraSettings(): InfraSettings {
  if (typeof window === "undefined") return defaultInfraSettings;

  try {
    const raw = localStorage.getItem(INFRA_SETTINGS_STORAGE_KEY);
    if (!raw) return defaultInfraSettings;

    return {
      ...defaultInfraSettings,
      ...(JSON.parse(raw) as Partial<InfraSettings>),
    };
  } catch {
    return defaultInfraSettings;
  }
}

export default function InfraSettingsPanel({
  onSaved,
}: {
  onSaved?: () => void;
}) {
  const [values, setValues] = useState<InfraSettings>(defaultInfraSettings);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    setValues(getInfraSettings());
  }, []);

  function resetStateLater() {
    window.setTimeout(() => {
      setSaveState("idle");
    }, 1500);
  }

  function updateField<K extends keyof InfraSettings>(
    key: K,
    value: InfraSettings[K]
  ) {
    setValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleSave() {
    try {
      localStorage.setItem(INFRA_SETTINGS_STORAGE_KEY, JSON.stringify(values));
      setSaveState("success");
      onSaved?.();
    } catch (error) {
      console.error(error);
      setSaveState("error");
    } finally {
      resetStateLater();
    }
  }

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Infrastructure Settings</h3>
          <p className="mt-1 text-sm text-slate-400">
            Manage internal IP, ports, and reverse proxy path values.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusSlot state={saveState} />
          <IconButton onClick={handleSave} title="Save infrastructure settings">
            <Save size={16} />
          </IconButton>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Internal IP
          </label>
          <input
            value={values.internalIp}
            onChange={(e) => updateField("internalIp", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            HTTP Port
          </label>
          <input
            value={values.httpPort}
            onChange={(e) => updateField("httpPort", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            HTTPS Port
          </label>
          <input
            value={values.httpsPort}
            onChange={(e) => updateField("httpsPort", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Portainer Port
          </label>
          <input
            value={values.portainerPort}
            onChange={(e) => updateField("portainerPort", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Jellyfin HTTP Port
          </label>
          <input
            value={values.jellyfinHttpPort}
            onChange={(e) => updateField("jellyfinHttpPort", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Jellyfin HTTPS Port
          </label>
          <input
            value={values.jellyfinHttpsPort}
            onChange={(e) => updateField("jellyfinHttpsPort", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Jellyfin Proxy Path
          </label>
          <input
            value={values.jellyfinProxyPath}
            onChange={(e) => updateField("jellyfinProxyPath", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-black/20 p-4">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Jellyfin Proxy Target
          </label>
          <input
            value={values.jellyfinProxyTarget}
            onChange={(e) => updateField("jellyfinProxyTarget", e.target.value)}
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 outline-none"
          />
        </div>
      </div>
    </div>
  );
}