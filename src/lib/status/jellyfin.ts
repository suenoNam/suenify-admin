export type JellyfinStatusType = "online" | "warning" | "error";

export type JellyfinStatusResult = {
  type: JellyfinStatusType;
  statusText: string;
  syncDelayMinutes: number;
  serviceHealthy: boolean;
  detail: string;
  sub: string;
};

export function getJellyfinStatus(): JellyfinStatusResult {
  const syncDelayMinutes = 1;
  const serviceHealthy = false;

  let type: JellyfinStatusType = "online";
  let statusText = "Online";

  if (!serviceHealthy) {
    type = "error";
    statusText = "Error";
  } else if (syncDelayMinutes >= 5) {
    type = "warning";
    statusText = "Warning";
  }

  return {
    type,
    statusText,
    syncDelayMinutes,
    serviceHealthy,
    detail: `Sync Delay ${syncDelayMinutes} min · Service Healthy ${serviceHealthy ? "Yes" : "No"}`,
    sub: "Media service health calculated from sync and service checks",
  };
}