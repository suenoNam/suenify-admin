"use client";

import { useEffect, useState } from "react";
import {
  loadAdminConfig,
  saveAdminConfig,
  type AdminConfig,
} from "@/lib/status/config";
import { saveServiceConfigAndRefresh } from "../../lib/services/save-service-config";
import CommonServiceSettingsPanel from "./CommonServiceSettingsPanel";

export default function NasSettingsPanel({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [config, setConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    setConfig(loadAdminConfig());
  }, []);

  if (!config) return null;

  function updateNas<K extends keyof AdminConfig["nas"]>(
    key: K,
    value: AdminConfig["nas"][K]
  ) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        nas: {
          ...prev.nas,
          [key]: value,
        },
      };
    });
  }

  async function handleSave() {
    if (!config) return;

    try {
      saveAdminConfig(config);
      await saveServiceConfigAndRefresh("nas", config.nas.internalUrl);
      onSaved();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <CommonServiceSettingsPanel
      title="NAS Settings"
      description="Edit core NAS values used by the admin dashboard."
      fields={[
        { key: "internalIp", label: "Internal IP", type: "text" },
        { key: "internalUrl", label: "Internal URL", type: "text" },
        { key: "storageUsedPercent", label: "Storage Used Percent", type: "number" },
        { key: "responseMs", label: "Response Ms", type: "number" },
        { key: "accessInfo", label: "Access Info", type: "text" },
        { key: "ruleSummary", label: "Rule Summary", type: "text" },
      ]}
      values={
        config.nas as unknown as Record<string, string | number | boolean>
      }
      onChange={(key, value) =>
        updateNas(
          key as keyof AdminConfig["nas"],
          value as AdminConfig["nas"][keyof AdminConfig["nas"]]
        )
      }
      onSave={handleSave}
    />
  );
}