export type AdminConfig = {
  nas: {
    title: string;
    internalUrl: string;
    internalIp: string;
    storageUsedPercent: number;
    responseMs: number;
    accessInfo: string;
    note: string;
    checkedAt: string;
    ruleSummary: string;
  };
  jellyfin: {
    title: string;
    externalUrl: string;
    basePath: string;
    internalHttpPort: number;
    internalHttpsPort: number;
    syncDelayMinutes: number;
    serviceHealthy: boolean;
    accessInfo: string;
    note: string;
    checkedAt: string;
    ruleSummary: string;
  };
  mainDomain: {
    title: string;
    publicUrl: string;
    visitorsToday: number;
    sslValid: boolean;
    accessInfo: string;
    note: string;
    checkedAt: string;
    ruleSummary: string;
  };
  apiDeploy: {
    title: string;
    endpointUrl: string;
    deploySuccess: boolean;
    responseMs: number;
    accessInfo: string;
    note: string;
    checkedAt: string;
    ruleSummary: string;
  };
};

export const ADMIN_CONFIG_STORAGE_KEY = "suenify-admin-config";
export const NAS_CHECKLIST_STORAGE_KEY = "suenify-nas-checklist";
export const DETAIL_STORAGE_PREFIX = "suenify-details-";

export const defaultAdminConfig: AdminConfig = {
  nas: {
    title: "NAS Status",
    internalUrl: "http://192.168.0.44",
    internalIp: "192.168.0.44",
    storageUsedPercent: 58,
    responseMs: 22,
    accessInfo: "Internal NAS address for local network access",
    note: "Primary NAS monitoring target for storage and internal network health.",
    checkedAt: "2026-04-12 22:10",
    ruleSummary: "Warning at 80%+, Error at 90%+ or 1000ms+",
  },
  jellyfin: {
    title: "Jellyfin",
    externalUrl: "https://sueno.myasustor.com/jellyfin",
    basePath: "/jellyfin",
    internalHttpPort: 28096,
    internalHttpsPort: 28920,
    syncDelayMinutes: 2,
    serviceHealthy: true,
    accessInfo: "External reverse proxy route with Base URL /jellyfin",
    note: "Jellyfin will later serve as the media server monitoring target.",
    checkedAt: "2026-04-12 22:12",
    ruleSummary: "Warning at 5 min+ delay, Error when service health fails",
  },
  mainDomain: {
    title: "Main Domain",
    publicUrl: "https://suenify.com",
    visitorsToday: 128,
    sslValid: true,
    accessInfo: "Primary public domain access route",
    note: "Main domain health should reflect public accessibility and certificate status.",
    checkedAt: "2026-04-12 22:13",
    ruleSummary: "Error when SSL is invalid, Warning when visitor count is too low",
  },
  apiDeploy: {
    title: "API & Deploy",
    endpointUrl: "https://api.suenify.com",
    deploySuccess: true,
    responseMs: 120,
    accessInfo: "Reserved API endpoint route for future backend integration",
    note: "API health will later reflect real deployment and endpoint monitoring.",
    checkedAt: "2026-04-12 22:15",
    ruleSummary: "Error when deploy fails, Warning when response is 500ms+",
  },
};

export function loadAdminConfig(): AdminConfig {
  if (typeof window === "undefined") return defaultAdminConfig;

  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_STORAGE_KEY);
    if (!raw) return defaultAdminConfig;

    const parsed = JSON.parse(raw) as Partial<AdminConfig>;

    return {
      nas: {
        ...defaultAdminConfig.nas,
        ...parsed.nas,
      },
      jellyfin: {
        ...defaultAdminConfig.jellyfin,
        ...parsed.jellyfin,
      },
      mainDomain: {
        ...defaultAdminConfig.mainDomain,
        ...parsed.mainDomain,
      },
      apiDeploy: {
        ...defaultAdminConfig.apiDeploy,
        ...parsed.apiDeploy,
      },
    };
  } catch {
    return defaultAdminConfig;
  }
}

export function saveAdminConfig(config: AdminConfig) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function resetAdminConfig() {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ADMIN_CONFIG_STORAGE_KEY,
    JSON.stringify(defaultAdminConfig)
  );
}