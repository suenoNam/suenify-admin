"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Save } from "lucide-react";

type SaveState = "idle" | "success" | "error";

type AccessRouteState = {
  externalUrlChecked: boolean;
  internalUrlChecked: boolean;
  reverseProxyChecked: boolean;
  basePathChecked: boolean;
  sslChecked: boolean;
  portChecked: boolean;
};

const STORAGE_KEY = "suenify-access-route-checklist";

const defaultRouteState: AccessRouteState = {
  externalUrlChecked: false,
  internalUrlChecked: false,
  reverseProxyChecked: false,
  basePathChecked: false,
  sslChecked: false,
  portChecked: false,
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

export default function AccessRoutePanel({
  title,
  items,
}: {
  title: string;
  items: Array<{
    key: keyof AccessRouteState;
    label: string;
    description: string;
  }>;
}) {
  const [routeState, setRouteState] =
    useState<AccessRouteState>(defaultRouteState);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as Partial<AccessRouteState>;
      setRouteState({
        ...defaultRouteState,
        ...parsed,
      });
    } catch {
      setRouteState(defaultRouteState);
    }
  }, []);

  function updateItem<K extends keyof AccessRouteState>(
    key: K,
    value: AccessRouteState[K]
  ) {
    setRouteState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetStateLater() {
    window.setTimeout(() => {
      setSaveState("idle");
    }, 1500);
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routeState));
      setSaveState("success");
      resetStateLater();
    } catch (error) {
      console.error(error);
      setSaveState("error");
      resetStateLater();
    }
  }

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">
            Track access route validation for external and internal service flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusSlot state={saveState} />
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-8 w-8 items-center justify-center text-slate-200 transition hover:text-white"
            title="Save route checklist"
            aria-label="Save route checklist"
          >
            <Save size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <label
            key={item.key}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <input
              type="checkbox"
              checked={routeState[item.key]}
              onChange={(e) => updateItem(item.key, e.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-slate-100">{item.label}</p>
              <p className="mt-1 text-sm text-slate-400">{item.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}