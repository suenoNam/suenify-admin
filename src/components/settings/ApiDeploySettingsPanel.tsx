"use client";

import { useEffect, useState } from "react";
import {
  loadAdminConfig,
  saveAdminConfig,
  type AdminConfig,
} from "@/lib/status/config";
import { saveServiceConfigAndRefresh } from "../../lib/services/save-service-config";
import CommonServiceSettingsPanel from "./CommonServiceSettingsPanel";

export default function ApiDeploySettingsPanel({
  onSaved,
}: {
  onSaved: () => void;
}) {
  const [config, setConfig] = useState<AdminConfig | null>(null);

  useEffect(() => {
    setConfig(loadAdminConfig());
  }, []);

  if (!config) return null;

  function updateApi<K extends keyof AdminConfig["apiDeploy"]>(
    key: K,
    value: AdminConfig["apiDeploy"][K]
  ) {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        apiDeploy: {
          ...prev.apiDeploy,
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
        "api-deploy",
        config.apiDeploy.endpointUrl
      );
      onSaved();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <CommonServiceSettingsPanel
      title="API & Deploy Settings"
      description="Edit endpoint, deploy state, and response monitoring values."
      fields={[
        { key: "endpointUrl", label: "Endpoint URL", type: "text" },
        { key: "deploySuccess", label: "Deploy Success", type: "checkbox" },
        { key: "responseMs", label: "Response Ms", type: "number" },
        { key: "accessInfo", label: "Access Info", type: "text" },
        { key: "ruleSummary", label: "Rule Summary", type: "text" },
      ]}
      values={
        config.apiDeploy as unknown as Record<string, string | number | boolean>
      }
      onChange={(key, value) =>
        updateApi(
          key as keyof AdminConfig["apiDeploy"],
          value as AdminConfig["apiDeploy"][keyof AdminConfig["apiDeploy"]]
        )
      }
      onSave={handleSave}
    />
  );
}