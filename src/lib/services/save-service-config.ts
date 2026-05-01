export async function saveServiceConfigAndRefresh(
  serviceId: string,
  directUrl: string
) {
  await fetch("/api/internal/config/service", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId,
      directUrl,
    }),
  });

  await fetch(`/api/internal/summary/${serviceId}`);
}