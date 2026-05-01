"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadAdminConfig,
  saveAdminConfig,
  type AdminConfig,
} from "@/lib/status/config";
import { saveServiceConfigAndRefresh } from "@/lib/services/save-service-config";
import {
  getServiceById,
  updateService,
  type ServiceRegistryItem,
} from "@/lib/services/registry";
import CommonServiceSettingsPanel from "./CommonServiceSettingsPanel";

type Props = {
  serviceId: string;
  onSaved: () => void;
  titleOverride?: string;
  descriptionOverride?: string;
  hiddenFieldKeys?: string[];
};

type ConfigSectionKey = "nas" | "jellyfin" | "mainDomain" | "apiDeploy";
type SaveState = "idle" | "success" | "error";

const BASE_SERVICE_FIELDS = [
  { key: "title", label: "서비스 이름", type: "text" as const },
  { key: "description", label: "설명", type: "text" as const },
  { key: "internalIp", label: "내부 IP", type: "text" as const },
  { key: "internalUrl", label: "내부 주소", type: "text" as const },
  { key: "externalUrl", label: "외부 주소", type: "text" as const },
  { key: "primary", label: "기본 체크 기준", type: "select" as const },
  { key: "placement", label: "구분", type: "select" as const },
  { key: "serviceKind", label: "서비스 종류", type: "select" as const },
  { key: "icon", label: "아이콘", type: "select" as const },
  { key: "note", label: "메모", type: "text" as const },
  { key: "accessInfo", label: "접속 정보", type: "text" as const },
  { key: "ruleSummary", label: "체크 기준", type: "text" as const },
];

function getConfigSectionKey(serviceId: string): ConfigSectionKey | null {
  if (serviceId === "nas") return "nas";
  if (serviceId === "jellyfin") return "jellyfin";
  if (serviceId === "main-domain") return "mainDomain";
  if (serviceId === "api-deploy") return "apiDeploy";
  return null;
}

function isValidIpv4(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;

  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

  return ipv4Regex.test(trimmed);
}

function getBaseValues(service: ServiceRegistryItem) {
  return {
    title: service.title || "",
    description: service.description || "",
    internalIp: service.metadata?.internalIp || "",
    internalUrl: service.internalUrl || "",
    externalUrl: service.externalUrl || "",
    primary: service.primary || "external",
    placement: service.placement || "sub",
    serviceKind: service.serviceKind || "other",
    icon: service.icon || "server",
    note: service.note || "",
    accessInfo: service.accessInfo || "",
    ruleSummary: service.ruleSummary || "",
  };
}

export default function ServiceSettingsRenderer({
  serviceId,
  onSaved,
  titleOverride,
  descriptionOverride,
  hiddenFieldKeys = [],
}: Props) {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [customValues, setCustomValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [customLoaded, setCustomLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    setConfig(loadAdminConfig());
  }, []);

  const service = getServiceById(serviceId);
  const sectionKey = getConfigSectionKey(serviceId);

  useEffect(() => {
    setCustomLoaded(false);
    setSaveState("idle");
  }, [serviceId]);

  useEffect(() => {
    if (!service || sectionKey || customLoaded) return;

    setCustomValues({
      title: service.title || "",
      description: service.description || "",
      internalIp: service.metadata?.internalIp || "",
      internalUrl: service.internalUrl || "",
      externalUrl: service.externalUrl || "",
      primary: service.primary || "external",
      placement: service.placement || "sub",
      serviceKind: service.serviceKind || "other",
      icon: service.icon || "server",
      note: service.note || "",
      accessInfo: service.accessInfo || "",
      ruleSummary: service.ruleSummary || "",
    });
    setCustomLoaded(true);
  }, [service, sectionKey, customLoaded]);

  if (!service) return null;

  const safeConfig = config ?? loadAdminConfig();

  const values: Record<string, string | number | boolean> =
    sectionKey === "nas"
      ? { ...getBaseValues(service), ...safeConfig.nas }
      : sectionKey === "jellyfin"
      ? { ...getBaseValues(service), ...safeConfig.jellyfin }
      : sectionKey === "mainDomain"
      ? { ...getBaseValues(service), ...safeConfig.mainDomain }
      : sectionKey === "apiDeploy"
      ? { ...getBaseValues(service), ...safeConfig.apiDeploy }
      : customValues;

  function updateValue(key: string, value: string | number | boolean) {
    if (!sectionKey) {
      setCustomValues((prev) => ({
        ...prev,
        [key]: value,
      }));
      return;
    }

    setConfig((prev) => {
      const current = prev ?? loadAdminConfig();

      return {
        ...current,
        [sectionKey]: {
          ...current[sectionKey],
          [key]: value,
        },
      };
    });
  }

  async function handleSave() {
    const currentService = service;
    if (!currentService) return;

    const nextInternalIp = String(values["internalIp"] || "").trim();

    if (!isValidIpv4(nextInternalIp)) {
      alert("내부 IP는 IPv4 형식으로 입력해. 예: 192.168.0.44");
      return;
    }

    try {
      if (sectionKey) {
        const currentConfig = config ?? loadAdminConfig();

        const nextInternalUrl = String(values["internalUrl"] || "").trim();
        const nextExternalUrl = String(values["externalUrl"] || "").trim();

        const nextPrimary =
          String(values["primary"] || "").trim() === "internal" &&
          nextInternalUrl
            ? "internal"
            : "external";

        const updatedService: ServiceRegistryItem = {
          ...currentService,
          title: String(values["title"] || "").trim() || currentService.title,
          description:
            String(values["description"] || "").trim() ||
            currentService.description,
          internalUrl: nextInternalUrl,
          externalUrl: nextExternalUrl,
          primary: nextPrimary,
          placement:
            String(values["placement"] || "").trim() === "main"
              ? "main"
              : "sub",
          serviceKind:
            (String(values["serviceKind"] || "").trim() as ServiceRegistryItem["serviceKind"]) ||
            currentService.serviceKind,
          icon: String(values["icon"] || "").trim() || currentService.icon,
          note: String(values["note"] || "").trim(),
          accessInfo: String(values["accessInfo"] || "").trim(),
          ruleSummary: String(values["ruleSummary"] || "").trim(),
          metadata: {
  ...(currentService.metadata || {}),
  internalIp: nextInternalIp,
  lastCheckedUrl:
    nextPrimary === "internal" ? nextInternalUrl : nextExternalUrl,
  lastCheckedAt: new Date().toISOString(),
},
        };

        updateService(updatedService);
        saveAdminConfig(currentConfig);

        await saveServiceConfigAndRefresh(
          serviceId,
          nextPrimary === "internal" ? nextInternalUrl : nextExternalUrl
        );

        setSaveState("success");
        onSaved();
        return;
      }

      const nextInternalUrl = String(customValues["internalUrl"] || "").trim();
      const nextExternalUrl = String(customValues["externalUrl"] || "").trim();

      const nextPrimary =
        String(customValues["primary"] || "").trim() === "internal" &&
        nextInternalUrl
          ? "internal"
          : "external";

      const updatedService: ServiceRegistryItem = {
        ...currentService,
        title:
          String(customValues["title"] || "").trim() || currentService.title,
        description:
          String(customValues["description"] || "").trim() ||
          currentService.description,
        internalUrl: nextInternalUrl,
        externalUrl: nextExternalUrl,
        primary: nextPrimary,
        placement:
          String(customValues["placement"] || "").trim() === "main"
            ? "main"
            : "sub",
        serviceKind:
          (String(
            customValues["serviceKind"] || ""
          ).trim() as ServiceRegistryItem["serviceKind"]) ||
          currentService.serviceKind,
        icon:
          String(customValues["icon"] || "").trim() || currentService.icon,
        note: String(customValues["note"] || "").trim(),
        accessInfo: String(customValues["accessInfo"] || "").trim(),
        ruleSummary: String(customValues["ruleSummary"] || "").trim(),
        metadata: {
  ...(currentService.metadata || {}),
  internalIp: nextInternalIp,
  lastCheckedUrl:
    nextPrimary === "internal" ? nextInternalUrl : nextExternalUrl,
  lastCheckedAt: new Date().toISOString(),
},
      };

      updateService(updatedService);
      setSaveState("success");
      onSaved();
    } catch (error) {
      console.error(error);
      setSaveState("error");
    }
  }

  const nasEditableFieldKeys = ["externalUrl", "internalUrl", "note"];

  const genericEditableFieldOrder = [
    "title",
    "description",
    "externalUrl",
    "internalUrl",
    "primary",
    "placement",
    "serviceKind",
    "icon",
    "note",
  ];

  function sortFieldsByKeyOrder(
    fields: Array<{
      key: string;
      label: string;
      type: "text" | "number" | "checkbox" | "select";
    }>,
    orderedKeys: string[]
  ) {
    return [...fields].sort(
      (a, b) => orderedKeys.indexOf(a.key) - orderedKeys.indexOf(b.key)
    );
  }

  const mergedFields = useMemo(() => {
    return [
      ...BASE_SERVICE_FIELDS,
      ...(service.settingsFields || []).filter(
        (field) =>
          !BASE_SERVICE_FIELDS.some(
            (baseField) => baseField.key === field.key
          )
      ),
    ];
  }, [service.settingsFields]);

  const fields = useMemo(() => {
    return serviceId === "nas"
      ? sortFieldsByKeyOrder(
          mergedFields.filter((field) =>
            nasEditableFieldKeys.includes(field.key)
          ),
          nasEditableFieldKeys
        )
      : sortFieldsByKeyOrder(
          mergedFields.filter(
            (field) =>
              !hiddenFieldKeys.includes(field.key) &&
              !["internalIp", "accessInfo", "ruleSummary"].includes(field.key)
          ),
          genericEditableFieldOrder
        );
  }, [mergedFields, serviceId, hiddenFieldKeys]);

  return (
    <CommonServiceSettingsPanel
      title={titleOverride ?? service.title}
      description={descriptionOverride ?? service.description}
      fields={fields}
      values={values}
      onChange={updateValue}
      onSave={handleSave}
      saveStateLabel={
        saveState === "success"
          ? "저장 완료"
          : saveState === "error"
          ? "저장 실패"
          : ""
      }
      saveStateType={saveState}
    />
  );
}