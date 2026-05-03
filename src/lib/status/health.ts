export type HealthResult = {
  type: "online" | "warning" | "error";
  status: string;
};

export function evaluateHealth(
  ok: boolean,
  responseTimeMs: number
): HealthResult {
  if (!ok) {
    return {
      type: "error",
      status: "offline",
    };
  }

  if (responseTimeMs > 2000) {
    return {
      type: "warning",
      status: "slow",
    };
  }

  return {
    type: "online",
    status: "online",
  };
}