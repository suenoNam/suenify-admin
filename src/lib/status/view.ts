import { getMergedServiceRegistry } from "@/lib/services/registry";
import type { ViewType } from "@/lib/status/types";

type ViewConfig = {
  title: string;
  description?: string;
};

const STATIC_VIEW_CONFIG: Record<string, ViewConfig> = {
  dashboard: {
    title: "대시보드",
  },
  "settings-services": {
    title: "서비스 설정",
  },
  "settings-dashboard": {
    title: "대시보드 설정",
  },
  "settings-account": {
    title: "계정 설정",
  },
  "settings-logs": {
    title: "로그",
  },   
  "settings-environment": {
  title: "환경 설정",
   },
};

export function getViewConfig(view: ViewType) {
  const staticConfig = STATIC_VIEW_CONFIG[view];
  if (staticConfig) return staticConfig;

  const service = getMergedServiceRegistry().find((item) => item.id === view);

  if (service) {
    return {
      title: service.title,
      description: service.description,
    };
  }

  return {
    title: "대시보드",
  };
}