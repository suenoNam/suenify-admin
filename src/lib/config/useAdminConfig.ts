export type AdminConfig = {
  nasUrl: string;
  domainUrl: string;
  jellyfinUrl: string;
  apiUrl: string;
};

const DEFAULT_CONFIG: AdminConfig = {
  nasUrl: "http://192.168.0.44",
  domainUrl: "https://sueno.myasustor.com",
  jellyfinUrl: "https://sueno.myasustor.com/jellyfin",
  apiUrl: "https://api.suenify.com",
};

export function getAdminConfig(): AdminConfig {
  try {
    const raw = localStorage.getItem("suenify-admin-config");
    if (!raw) return DEFAULT_CONFIG;

    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveAdminConfig(config: AdminConfig) {
  localStorage.setItem("suenify-admin-config", JSON.stringify(config));
}