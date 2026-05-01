import type { AdminGroup, ServiceRegistryItem } from "./registry";

const USER_SERVICES_KEY = "suenify-user-services";
const SERVICE_DETAIL_OVERRIDES_KEY = "suenify-service-detail-overrides";
const SERVICE_OVERRIDES_KEY = "suenify-service-overrides";

type ServiceKind =
  | "server"
  | "nas"
  | "web"
  | "admin"
  | "media"
  | "domain"
  | "api"
  | "ai"
  | "storage"
  | "other";

export type ServiceDetailOverride = {
  note?: string;
  directUrl?: string;
  accessInfo?: string;
};

export type ServiceOverrideItem = Partial<{
  title: string;
  description: string;
  internalUrl: string;
  externalUrl: string;
  primary: "internal" | "external";
  placement: "main" | "sub";
  adminGroup: AdminGroup;
  serviceKind: ServiceKind;
  icon: string;
  note: string;
  accessInfo: string;
  ruleSummary: string;
  metadata: Record<string, string | number | boolean>;
}>;

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function loadUserServices(): ServiceRegistryItem[] {
  return loadJson<ServiceRegistryItem[]>(USER_SERVICES_KEY, []);
}

export function saveUserServices(services: ServiceRegistryItem[]) {
  saveJson(USER_SERVICES_KEY, services);
}

export function loadServiceDetailOverrides(): Record<string, ServiceDetailOverride> {
  return loadJson<Record<string, ServiceDetailOverride>>(
    SERVICE_DETAIL_OVERRIDES_KEY,
    {}
  );
}

export function loadServiceDetailOverride(
  id: string
): ServiceDetailOverride | null {
  const overrides = loadServiceDetailOverrides();
  return overrides[id] ?? null;
}

export function saveServiceDetailOverride(
  id: string,
  values: ServiceDetailOverride
) {
  const overrides = loadServiceDetailOverrides();

  overrides[id] = {
    ...(overrides[id] ?? {}),
    ...values,
  };

  saveJson(SERVICE_DETAIL_OVERRIDES_KEY, overrides);
}

export function loadServiceOverrides(): Record<string, ServiceOverrideItem> {
  return loadJson<Record<string, ServiceOverrideItem>>(SERVICE_OVERRIDES_KEY, {});
}

export function saveServiceOverrides(
  overrides: Record<string, ServiceOverrideItem>
) {
  saveJson(SERVICE_OVERRIDES_KEY, overrides);
}

export function loadServiceOverride(id: string): ServiceOverrideItem | null {
  const overrides = loadServiceOverrides();
  return overrides[id] ?? null;
}

export function saveServiceOverride(id: string, patch: ServiceOverrideItem) {
  const overrides = loadServiceOverrides();

  overrides[id] = {
    ...(overrides[id] ?? {}),
    ...patch,
  };

  saveServiceOverrides(overrides);
}