"use client";

import { Server, Globe, Router, Link2 } from "lucide-react";

type InfraOverviewPanelProps = {
  nasUrl: string;
  domainUrl: string;
  jellyfinUrl: string;
  apiUrl: string;
  internalIp: string;
  httpPort: string;
  httpsPort: string;
  jellyfinHttpPort: string;
  jellyfinHttpsPort: string;
  portainerPort: string;
  jellyfinProxyPath: string;
  jellyfinProxyTarget: string;
};

type InfraItem = {
  title: string;
  description: string;
  value: string;
  status: "ok" | "warn";
};

function StatusDot({ status }: { status: "ok" | "warn" }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        status === "ok" ? "bg-emerald-400" : "bg-yellow-400"
      }`}
    />
  );
}

export default function InfraOverviewPanel({
  nasUrl,
  domainUrl,
  jellyfinUrl,
  apiUrl,
  internalIp,
  httpPort,
  httpsPort,
  jellyfinHttpPort,
  jellyfinHttpsPort,
  portainerPort,
  jellyfinProxyPath,
  jellyfinProxyTarget,
}: InfraOverviewPanelProps) {
  const sections: {
    title: string;
    icon: React.ReactNode;
    items: InfraItem[];
  }[] = [
    {
      title: "Internal Network",
      icon: <Server size={16} />,
      items: [
        {
          title: "NAS Internal Route",
          description: "Local network entry point",
          value: nasUrl || "-",
          status: "ok",
        },
        {
          title: "Fixed Internal IP",
          description: "Current NAS local address",
          value: internalIp || "-",
          status: "ok",
        },
      ],
    },
    {
      title: "External Domain",
      icon: <Globe size={16} />,
      items: [
        {
          title: "Main Domain",
          description: "Primary public domain route",
          value: domainUrl || "-",
          status: "ok",
        },
        {
          title: "API Endpoint",
          description: "Backend/public API route",
          value: apiUrl || "-",
          status: "ok",
        },
      ],
    },
    {
      title: "Reverse Proxy",
      icon: <Router size={16} />,
      items: [
        {
          title: "Jellyfin Route",
          description: "External reverse proxy access",
          value: jellyfinUrl || "-",
          status: "ok",
        },
        {
          title: "Proxy Structure",
          description: "Current route mapping",
          value: `${jellyfinProxyPath || "-"} → ${jellyfinProxyTarget || "-"}`,
          status: "ok",
        },
      ],
    },
    {
      title: "Ports",
      icon: <Link2 size={16} />,
      items: [
        {
          title: "HTTP",
          description: "Default web port",
          value: httpPort || "-",
          status: "ok",
        },
        {
          title: "HTTPS",
          description: "Secure web port",
          value: httpsPort || "-",
          status: "ok",
        },
        {
          title: "Jellyfin HTTP",
          description: "Internal media route",
          value: jellyfinHttpPort || "-",
          status: "ok",
        },
        {
          title: "Jellyfin HTTPS",
          description: "Internal secure media route",
          value: jellyfinHttpsPort || "-",
          status: "ok",
        },
        {
          title: "Portainer",
          description: "Container management port",
          value: portainerPort || "-",
          status: "ok",
        },
      ],
    },
  ];

  return (
    <div className="rounded-3xl bg-white/5 p-6">
      <h3 className="text-xl font-semibold">Infrastructure Overview</h3>
      <p className="mt-1 text-sm text-slate-400">
        Current NAS network, ports, and reverse proxy structure.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            <div className="flex items-center gap-2">
              {section.icon}
              <p className="text-sm font-medium">{section.title}</p>
            </div>

            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <div key={item.title} className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <StatusDot status={item.status} />
                    <p className="max-w-[180px] break-words text-right text-xs text-slate-300">
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}