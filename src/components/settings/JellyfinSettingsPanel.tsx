"use client";

import { useEffect, useState } from "react";
import {
  loadAdminConfig,
  saveAdminConfig,
  type AdminConfig,
} from "@/lib/status/config";
import { saveServiceConfigAndRefresh } from "../../lib/services/save-service-config";
import CommonServiceSettingsPanel from "./CommonServiceSettingsPanel";

export default function JellyfinSettingsPanel({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [config, setConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    setConfig(loadAdminConfig());
  }, []);

  if (!config) return null;

  function updateJellyfin<K extends keyof AdminConfig["jellyfin"]>(
    key: K,
    value: AdminConfig["jellyfin"][K]
  ) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        jellyfin: {
          ...prev.jellyfin,
          [key]: value,
        },
      };
    });
  }

  async function handleSave() {
    if (!config) return;

    try {
      saveAdminConfig(config);
      await saveServiceConfigAndRefresh(
        "jellyfin",
        config.jellyfin.externalUrl
      );
      onSaved();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <CommonServiceSettingsPanel
      title="Jellyfin Settings"
      description="Edit Jellyfin route, ports, and monitoring values."
      fields={[
        { key: "externalUrl", label: "External URL", type: "text" },
        { key: "basePath", label: "Base Path", type: "text" },
        { key: "internalHttpPort", label: "Internal HTTP Port", type: "number" },
        { key: "internalHttpsPort", label: "Internal HTTPS Port", type: "number" },
        { key: "syncDelayMinutes", label: "Sync Delay Minutes", type: "number" },
        { key: "serviceHealthy", label: "Service Healthy", type: "checkbox" },
        { key: "accessInfo", label: "Access Info", type: "text" },
        { key: "ruleSummary", label: "Rule Summary", type: "text" },
      ]}
      values={
        config.jellyfin as unknown as Record<string, string | number | boolean>
      }
      onChange={(key, value) =>
        updateJellyfin(
          key as keyof AdminConfig["jellyfin"],
          value as AdminConfig["jellyfin"][keyof AdminConfig["jellyfin"]]
        )
      }
      onSave={handleSave}
    />
  );
}