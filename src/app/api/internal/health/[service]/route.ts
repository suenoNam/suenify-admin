import { getServiceById } from "@/lib/services/registry";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ service: string }> }
) {
  const { service } = await context.params;

  const serviceData = getServiceById(service);

  if (!serviceData) {
    return Response.json({
      type: "error",
      status: "not found",
    });
  }

  const url =
    serviceData.metadata?.lastCheckedUrl ||
    serviceData.externalUrl ||
    serviceData.internalUrl;

  if (!url) {
    return Response.json({
      type: "error",
      status: "no url",
    });
  }

  const start = Date.now();

  try {
    const res = await fetch(url, { cache: "no-store" });
    const responseTime = Date.now() - start;

    if (!res.ok) {
      return Response.json({
        type: "error",
        status: "offline",
      });
    }

    if (responseTime > 2000) {
      return Response.json({
        type: "warning",
        status: "slow",
      });
    }

    return Response.json({
      type: "online",
      status: "online",
    });
  } catch {
    return Response.json({
      type: "error",
      status: "offline",
    });
  }
}