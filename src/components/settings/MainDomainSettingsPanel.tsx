"use client";

import { useEffect, useState } from "react";
import {
  loadAdminConfig,
  saveAdminConfig,
  type AdminConfig,
} from "@/lib/status/config";
import { saveServiceConfigAndRefresh } from "../../lib/services/save-service-config";
import CommonServiceSettingsPanel from "./CommonServiceSettingsPanel";

export default function MainDomainSettingsPanel({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [config, setConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    setConfig(loadAdminConfig());
  }, []);

  if (!config) return null;

  function updateMainDomain<K extends keyof AdminConfig["mainDomain"]>(
    key: K,
    value: AdminConfig["mainDomain"][K]
  ) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mainDomain: {
          ...prev.mainDomain,
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
        "main-domain",
        config.mainDomain.publicUrl
      );
      onSaved();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <CommonServiceSettingsPanel
      title="Main Domain Settings"
      description="Edit public domain route and monitoring values."
      fields={[
        { key: "publicUrl", label: "Public URL", type: "text" },
        { key: "visitorsToday", label: "Visitors Today", type: "number" },
        { key: "sslValid", label: "SSL Valid", type: "checkbox" },
        { key: "accessInfo", label: "Access Info", type: "text" },
        { key: "ruleSummary", label: "Rule Summary", type: "text" },
      ]}
      values={
        config.mainDomain as unknown as Record<string, string | number | boolean>
      }
      onChange={(key, value) =>
        updateMainDomain(
          key as keyof AdminConfig["mainDomain"],
          value as AdminConfig["mainDomain"][keyof AdminConfig["mainDomain"]]
        )
      }
      onSave={handleSave}
    />
  );
}